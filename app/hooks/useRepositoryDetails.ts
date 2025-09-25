import useSWR from 'swr'
import { GitHubService } from '@/lib/github-service'
import type { Repository } from '@/types'

interface RepositoryDetailsData {
  languages?: Record<string, number>
  languagesPercentages?: Record<string, number>
  topics?: string[]
  readme?: string
  stars?: number
  forks?: number
  openIssues?: number
  size?: number
  license?: string
  defaultBranch?: string
}

interface RepositoryDetailsResponse {
  success: boolean
  data?: RepositoryDetailsData
  message?: string
}

const githubService = new GitHubService()

/**
 * Fetcher function that gets comprehensive repository details from GitHub API
 */
const fetchRepositoryDetails = async (owner: string, repo: string): Promise<RepositoryDetailsResponse> => {
  if (!owner || !repo) {
    return {
      success: false,
      message: 'Owner and repository name are required'
    }
  }

  if (!githubService.isGitHubAvailable()) {
    return {
      success: false,
      message: 'GitHub API not available - missing token'
    }
  }

  try {
    // Fetch all repository data in parallel
    const [repoResult, languagesResult, topicsResult, readmeResult] = await Promise.allSettled([
      githubService.getRepository(owner, repo),
      githubService.getRepositoryLanguages(owner, repo),
      githubService.getRepositoryTopics(owner, repo),
      githubService.getRepositoryReadme(owner, repo)
    ])

    const data: RepositoryDetailsData = {}

    // Process repository basic info
    if (repoResult.status === 'fulfilled' && repoResult.value.success && repoResult.value.repository) {
      const repo = repoResult.value.repository as Record<string, unknown>
      data.stars = repo.stargazers_count as number
      data.forks = repo.forks_count as number
      data.openIssues = repo.open_issues_count as number
      data.size = repo.size as number // Size in KB
      const license = repo.license as Record<string, unknown> | null
      data.license = license?.name as string || license?.spdx_id as string
      data.defaultBranch = repo.default_branch as string
    }

    // Process languages
    if (languagesResult.status === 'fulfilled' && languagesResult.value.success && languagesResult.value.languages) {
      data.languages = languagesResult.value.languages
      
      // Calculate percentages
      const totalBytes = Object.values(languagesResult.value.languages).reduce((sum, bytes) => sum + bytes, 0)
      if (totalBytes > 0) {
        data.languagesPercentages = Object.entries(languagesResult.value.languages).reduce((acc, [lang, bytes]) => {
          acc[lang] = Math.round((bytes / totalBytes) * 100)
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Process topics
    if (topicsResult.status === 'fulfilled' && topicsResult.value.success && topicsResult.value.topics) {
      data.topics = topicsResult.value.topics
    }

    // Process README
    if (readmeResult.status === 'fulfilled' && readmeResult.value.success && readmeResult.value.readme) {
      data.readme = readmeResult.value.readme
    }

    return {
      success: true,
      data,
      message: 'Repository details retrieved successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch repository details: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Hook to fetch comprehensive repository details with SWR caching
 */
export function useRepositoryDetails(repository: Repository | null, enabled: boolean = true) {
  // Extract owner/repo from repository
  const { owner, repo } = repository?.fullName ? 
    (() => {
      const parts = repository.fullName.split('/')
      return { owner: parts[0], repo: parts[1] }
    })() : 
    { owner: null, repo: null }

  // Create cache key
  const cacheKey = enabled && owner && repo ? ['repository-details', owner, repo] : null

  const { data, error, isLoading, mutate } = useSWR<RepositoryDetailsResponse>(
    cacheKey,
    () => fetchRepositoryDetails(owner!, repo!),
    {
      // Cache for 5 minutes since repository details don't change often
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  return {
    details: data?.success ? data.data : null,
    isLoading,
    error: error?.message || (data?.success === false ? data.message : null),
    refresh: mutate,
    isGitHubAvailable: githubService.isGitHubAvailable(),
  }
}

/**
 * Hook to get current GitHub user information
 */
export function useGitHubUser(enabled: boolean = true) {
  const cacheKey = enabled ? ['github-user'] : null

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    async () => {
      const result = await githubService.getCurrentUser()
      return result
    },
    {
      // Cache for 10 minutes since user info rarely changes
      dedupingInterval: 10 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  return {
    user: data?.success ? data.user : null,
    isLoading,
    error: error?.message || (data?.success === false ? data.message : null),
    refresh: mutate,
    isGitHubAvailable: githubService.isGitHubAvailable(),
  }
}
