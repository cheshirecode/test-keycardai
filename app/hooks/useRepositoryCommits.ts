import useSWR from 'swr'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { Repository } from '@/types'

interface Commit {
  hash: string
  author: string
  email: string
  date: string
  timestamp: number
  message: string
  subject: string
  body: string
}

interface CommitsResponse {
  success: boolean
  commits: Commit[]
  source: 'github' | 'local' | 'synthetic'
  message?: string
}

const typedMcpClient = new TypedMCPClient()

/**
 * Fetcher function that tries multiple strategies to get commits:
 * 1. GitHub API (if repository has GitHub URL)
 * 2. Local git repositories
 * 3. Synthetic commits as fallback
 */
const fetchCommits = async (
  repository: Repository | { name: string; fullName?: string; repositoryUrl?: string; description?: string; url?: string },
  limit: number = 10
): Promise<CommitsResponse> => {
  const repoName = repository.name
  const repoFullName = 'fullName' in repository ? repository.fullName : undefined
  const repoUrl = 'repositoryUrl' in repository ? repository.repositoryUrl : 
                  'url' in repository ? repository.url : undefined
  const repoDescription = 'description' in repository ? repository.description : undefined

  // Try GitHub API first if this looks like a GitHub repository
  if (repoFullName && repoFullName.includes('/')) {
    console.log(`🔍 [useRepositoryCommits] Attempting to fetch commits from GitHub API for: ${repoFullName}`)
    try {
      const [owner, repo] = repoFullName.split('/')
      const result = await typedMcpClient.call('github_get_commits', {
        owner,
        repo,
        limit
      })

      if (result.success) {
        if (result.commits && result.commits.length > 0) {
          console.log(`✅ [useRepositoryCommits] Found ${result.commits.length} commits from GitHub API`)
          return {
            success: true,
            commits: result.commits,
            source: 'github'
          }
        } else {
          // GitHub API succeeded but repository is empty
          console.log(`ℹ️ [useRepositoryCommits] GitHub API succeeded but repository is empty`)
          const githubCommit: Commit = {
            hash: 'github-empty-' + Date.now(),
            author: 'GitHub Repository',
            email: 'github@repository',
            date: new Date(0).toISOString(),
            timestamp: 0,
            message: `GitHub Repository: ${repoFullName}

This repository exists on GitHub but appears to be empty.

Repository: ${repoFullName}
Description: ${repoDescription || 'No description available'}
URL: ${repoUrl || 'Not available'}

This is a valid GitHub repository with no commits yet.`,
            subject: `docs: empty GitHub repository ${repoFullName}`,
            body: `Repository exists but has no commits yet.`
          }
          return {
            success: true,
            commits: [githubCommit],
            source: 'synthetic'
          }
        }
      } else {
        console.log(`⚠️ [useRepositoryCommits] GitHub API failed: ${result.message || 'Unknown error'} - will try local paths`)
      }
    } catch (error) {
      console.log(`❌ [useRepositoryCommits] GitHub API commit fetch failed:`, error)
    }
  } else if (repoUrl && repoUrl.includes('github.com')) {
    // Handle case where repository has GitHub URL but no fullName
    const githubMatch = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
    if (githubMatch) {
      const [, owner, repo] = githubMatch
      console.log(`🔍 [useRepositoryCommits] Attempting to fetch commits from GitHub URL: ${owner}/${repo}`)
      try {
        const result = await typedMcpClient.call('github_get_commits', {
          owner,
          repo,
          limit
        })

        if (result.success && result.commits && result.commits.length > 0) {
          console.log(`✅ [useRepositoryCommits] Found ${result.commits.length} commits from GitHub API via URL`)
          return {
            success: true,
            commits: result.commits,
            source: 'github'
          }
        }
      } catch (error) {
        console.log(`❌ [useRepositoryCommits] GitHub API via URL failed:`, error)
      }
    }
  }

  // Fallback to local file system search
  const sanitizedName = repoName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const isGitHubRepoForPaths = (repoFullName && repoFullName.includes('/')) || 
                               (repoUrl && repoUrl.includes('github.com'))

  // For GitHub repos, only check common clone locations
  // For non-GitHub repos, check all possible paths including scaffolded project paths
  const possiblePaths = isGitHubRepoForPaths ? [
    `/tmp/repositories/${repoName}`, // Standard repository clone path
    `/tmp/repositories/${sanitizedName}`, // Sanitized repository clone path
    `./projects/${repoName}`, // Local development clone
    `./${repoName}` // Current directory clone
  ] : [
    // For non-GitHub repos, check all scaffolded project paths
    `/tmp/projects/${repoName}`, // Original name in temp directory (Vercel/production)
    `/tmp/projects/${sanitizedName}`, // Sanitized name in temp directory
    `${process.cwd()}/.temp/projects/${repoName}`, // Original name in local temp
    `${process.cwd()}/.temp/projects/${sanitizedName}`, // Sanitized name in local temp
    `/tmp/repositories/${repoName}`, // Repository path with original name
    `/tmp/repositories/${sanitizedName}`, // Repository path with sanitized name
    `./projects/${repoName}`, // Original name in relative projects
    `./projects/${sanitizedName}`, // Sanitized name in relative projects
    `./${repoName}`, // Current directory with original name
    repoName // Just the repository name
  ]

  console.log(`🔍 [useRepositoryCommits] GitHub API failed, trying local paths for: ${repoName}`)
  console.log(`🔍 [useRepositoryCommits] Checking ${possiblePaths.length} ${isGitHubRepoForPaths ? 'clone' : 'project'} paths:`, possiblePaths)

  for (const projectPath of possiblePaths) {
    try {
      console.log(`🔍 [useRepositoryCommits] Trying path: ${projectPath}`)
      const result = await typedMcpClient.call('git_log', { path: projectPath, limit })
      console.log(`🔍 [useRepositoryCommits] Git log result for ${projectPath}:`, result)

      if (result.success && result.commits && result.commits.length > 0) {
        console.log(`✅ [useRepositoryCommits] Found ${result.commits.length} commits in ${projectPath}`)
        return {
          success: true,
          commits: result.commits,
          source: 'local'
        }
      } else {
        console.log(`⚠️ [useRepositoryCommits] No commits found in ${projectPath}`)
      }
    } catch (error) {
      console.log(`❌ [useRepositoryCommits] Git log failed for path ${projectPath}:`, error)
    }
  }

  // If all methods failed, create synthetic commit as last resort
  console.log(`❌ [useRepositoryCommits] No git repository found for ${repoName} via GitHub API or local paths`)

  // Create a synthetic commit for display with context about the repository type
  const isGitHubRepo = (repoFullName && repoFullName.includes('/')) || 
                       (repoUrl && repoUrl.includes('github.com'))
  const isScaffoldedProject = repoName.includes('-') && /\d{13}/.test(repoName) && !isGitHubRepo

  let syntheticCommit: Commit

  if (isGitHubRepo) {
    console.log(`ℹ️ [useRepositoryCommits] This is a GitHub repository but no commits were found - repository might be empty`)
    syntheticCommit = {
      hash: 'github-empty-' + Date.now(),
      author: 'GitHub Repository',
      email: 'github@repository',
      date: new Date(0).toISOString(),
      timestamp: 0,
      message: `GitHub Repository: ${repoFullName || repoName}

This repository exists on GitHub but appears to be empty or you may not have access to view its commits.

Repository: ${repoFullName || repoName}
Description: ${repoDescription || 'No description available'}
URL: ${repoUrl || 'Not available'}

Possible reasons for no commits:
- Repository is newly created and empty
- Repository is private and requires different permissions
- GitHub token lacks necessary permissions
- Network connectivity issues`,
      subject: `docs: empty GitHub repository ${repoFullName || repoName}`,
      body: `Repository exists but no commit history available.

Check GitHub token permissions or repository status.`
    }
  } else if (isScaffoldedProject) {
    console.log(`ℹ️ [useRepositoryCommits] This appears to be a scaffolded project - showing scaffolding info`)
    syntheticCommit = {
      hash: 'scaffold-synthetic',
      author: 'Project Scaffolder',
      email: 'scaffolder@system',
      date: new Date(0).toISOString(),
      timestamp: 0,
      message: `This project was created using the Project Scaffolder tool.

Repository: ${repoName}
Created: Project Scaffolder
Type: Scaffolded Project

The actual git history will be available once the repository is cloned locally or after manual git operations.`,
      subject: 'feat: initial project scaffolding',
      body: `Project scaffolded using MCP tools.

Once you start modifying this project, real git commits will appear here.`
    }
  } else {
    console.log(`ℹ️ [useRepositoryCommits] Creating generic synthetic commit for local project`)
    syntheticCommit = {
      hash: 'local-synthetic',
      author: 'Local Project',
      email: 'local@project',
      date: new Date(0).toISOString(),
      timestamp: 0,
      message: `Local project: ${repoName}

This appears to be a local project without git history available through the current methods.

Project: ${repoName}
Type: Local Project

Git history will appear here once commits are made to this project.`,
      subject: 'docs: local project',
      body: `Local project without accessible git history.`
    }
  }

  return {
    success: true,
    commits: [syntheticCommit],
    source: 'synthetic'
  }
}

/**
 * Hook to fetch commits for a repository with SWR caching
 * Supports both Repository objects and project objects
 */
export function useRepositoryCommits(
  repository: Repository | { name: string; fullName?: string; repositoryUrl?: string; description?: string; url?: string } | null,
  limit: number = 10,
  enabled: boolean = true
) {
  // Create cache key based on repository identity and limit
  const cacheKey = enabled && repository ? [
    'repository-commits',
    repository.name,
    'fullName' in repository ? repository.fullName : undefined,
    'repositoryUrl' in repository ? repository.repositoryUrl : 
    'url' in repository ? repository.url : undefined,
    limit
  ] : null

  const { data, error, isLoading, mutate } = useSWR<CommitsResponse>(
    cacheKey,
    () => fetchCommits(repository!, limit),
    {
      // Cache for 3 minutes for commits (balance between freshness and performance)
      dedupingInterval: 3 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  return {
    commits: data?.commits || [],
    source: data?.source,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

/**
 * Hook to fetch the latest commit for a repository
 */
export function useLatestCommit(
  repository: Repository | { name: string; fullName?: string; repositoryUrl?: string; description?: string; url?: string } | null,
  enabled: boolean = true
) {
  const { commits, isLoading, error, refresh } = useRepositoryCommits(repository, 1, enabled)
  
  return {
    latestCommit: commits.length > 0 ? commits[0] : null,
    isLoading,
    error,
    refresh,
  }
}
