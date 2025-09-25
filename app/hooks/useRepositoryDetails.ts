import useSWR from 'swr'
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

interface GitHubUserResponse {
  success: boolean
  user?: {
    login: string
    name?: string
    email?: string
  }
  message?: string
}

/**
 * Fetcher function that gets repository details from server-side API
 */
const fetchRepositoryDetails = async (owner: string, repo: string): Promise<RepositoryDetailsResponse> => {
  if (!owner || !repo) {
    return {
      success: false,
      message: 'Owner and repository name are required'
    }
  }

  try {
    const response = await fetch(`/api/repositories/${owner}/${repo}/details`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch repository details: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Fetcher function that gets GitHub user details from server-side API
 */
const fetchGitHubUser = async (): Promise<GitHubUserResponse> => {
  try {
    const response = await fetch('/api/github/user')
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch GitHub user: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    isGitHubAvailable: data?.success !== false, // If we get a successful response, GitHub is available
  }
}

/**
 * Hook to get current GitHub user information
 */
export function useGitHubUser(enabled: boolean = true) {
  const cacheKey = enabled ? ['github-user'] : null

  const { data, error, isLoading, mutate } = useSWR<GitHubUserResponse>(
    cacheKey,
    fetchGitHubUser,
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
    isGitHubAvailable: data?.success !== false, // If we get a successful response, GitHub is available
  }
}