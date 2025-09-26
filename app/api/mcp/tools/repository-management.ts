/**
 * Repository Management MCP Tools
 * Handles GitHub repository operations with enhanced permission validation
 */

import { GitHubService } from '@/lib/github-service'
import { EnvConfig } from '@/lib/config'
import { Result, ResultUtils, ValidationError, ConfigurationError } from '@/lib/result'

export interface ListRepositoriesParams {
  owner?: string
  nameFilter?: string
  type?: 'all' | 'public' | 'private'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
}

export interface DeleteRepositoryParams {
  owner: string
  repo: string
}

export interface GetRepositoryParams {
  owner: string
  repo: string
}

export interface RepositoryResult {
  success: boolean
  message: string
  repositories?: Array<{
    id: string
    name: string
    fullName: string
    url: string
    description: string | null
    private: boolean
    createdAt: string
    updatedAt: string
    isScaffoldedProject: boolean
  }>
  owner?: string
  total?: number
}

export interface DeleteRepositoryResult {
  success: boolean
  message: string
}

export interface GetRepositoryResult {
  success: boolean
  message: string
  repository?: {
    id: string
    name: string
    fullName: string
    url: string
    description: string | null
    private: boolean
    createdAt: string
    updatedAt: string
    isScaffoldedProject: boolean
  }
}

/**
 * Determines if a repository is likely a scaffolded project
 * Based on naming patterns and description content
 */
function isScaffoldedProject(name: string, description: string | null): boolean {
  // Check for common project prefixes/patterns
  const projectPatterns = [
    /^project-/i,
    /^my-project-/i,      // Match "my-project-..." pattern
    /^scaffolded-/i,
    /^generated-/i,
    /-project$/i,
    /-app$/i,
    /-demo$/i,
    /project.*\d{13}/i    // Match project names with timestamps
  ]

  const nameMatches = projectPatterns.some(pattern => pattern.test(name))

  // Check description for scaffolding indicators
  const descriptionMatches = description ?
    /generated project|scaffolded|auto-generated|created by/i.test(description) :
    false

  return nameMatches || descriptionMatches
}

/**
 * Validates repository deletion permissions
 */
async function validateRepositoryDeletionPermissions(
  owner: string,
  githubService: GitHubService
): Promise<Result<void, ValidationError | ConfigurationError>> {
  // Check if GITHUB_OWNER is specified
  const githubOwner = EnvConfig.get('GITHUB_OWNER')
  if (!githubOwner) {
    return ResultUtils.failure(
      new ConfigurationError(
        'GITHUB_OWNER environment variable must be specified for repository operations'
      )
    )
  }

  // Get the authenticated user from the PAT
  const userResult = await githubService.getAuthenticatedUser()
  if (!userResult.success || !userResult.user) {
    return ResultUtils.failure(
      new ValidationError(
        'Unable to validate GitHub token permissions',
        'authentication'
      )
    )
  }

  const authenticatedUsername = userResult.user.login

  // GITHUB_OWNER must be different from the authenticated user
  if (githubOwner === authenticatedUsername) {
    return ResultUtils.failure(
      new ValidationError(
        `Repository deletion not allowed: GITHUB_OWNER (${githubOwner}) cannot be the same as the authenticated user. This prevents accidental deletion of personal repositories.`,
        'permission'
      )
    )
  }

  // Owner must match GITHUB_OWNER for deletion to proceed
  if (owner !== githubOwner) {
    return ResultUtils.failure(
      new ValidationError(
        `Not enough permission to delete repositories under '${owner}'. Only repositories under '${githubOwner}' can be deleted.`,
        'permission'
      )
    )
  }

  return ResultUtils.success(undefined)
}

/**
 * Repository Management Module
 * Provides secure repository operations with enhanced permission validation
 */
export const repositoryManagement = {
  /**
   * List repositories with scaffolding detection
   */
  list_repositories: async (params: ListRepositoriesParams): Promise<RepositoryResult> => {
    try {
      // Validate environment configuration
      const envValidation = EnvConfig.validateRequired()
      if (!envValidation.isValid) {
        return {
          success: false,
          message: `Missing required environment variables: ${envValidation.missing.join(', ')}`
        }
      }

      const githubService = new GitHubService()

      // Determine the effective owner (GITHUB_OWNER env var or authenticated user)
      let effectiveOwner: string | null = params.owner || null
      if (!effectiveOwner) {
        effectiveOwner = EnvConfig.get('GITHUB_OWNER') || null

        // If no GITHUB_OWNER is set, fall back to authenticated user
        if (!effectiveOwner) {
          const userResult = await githubService.getAuthenticatedUser()
          if (userResult.success && userResult.user) {
            effectiveOwner = userResult.user.login
          } else {
            return {
              success: false,
              message: 'Unable to determine GitHub owner. Set GITHUB_OWNER environment variable or ensure GitHub token is valid.'
            }
          }
        }
      }

      const result = await githubService.listRepositories({
        owner: effectiveOwner || undefined,
        nameFilter: params.nameFilter || undefined,
        type: params.type,
        sort: params.sort || 'updated',
        direction: params.direction || 'desc'
      })

      if (!result.success) {
        return {
          success: false,
          message: result.message
        }
      }

      // Transform and filter for repositories that might be scaffolded projects
      const scaffoldedProjects = result.repositories?.map(repo => {
        // Type assertion for repository data
        const repoData = repo as {
          full_name: string
          name: string
          url: string
          description: string | null
          private: boolean
          created_at: string
          updated_at: string
        }
        
        return {
          id: repoData.full_name,
          name: repoData.name,
          fullName: repoData.full_name,
          url: repoData.url,
          description: repoData.description,
          private: repoData.private,
          createdAt: repoData.created_at,
          updatedAt: repoData.updated_at,
          isScaffoldedProject: isScaffoldedProject(repoData.name, repoData.description)
        }
      }) || []

      return {
        success: true,
        message: `Found ${scaffoldedProjects.length} repositories`,
        repositories: scaffoldedProjects,
        owner: effectiveOwner,
        total: scaffoldedProjects.length
      }

    } catch (error) {
      console.error('Failed to list repositories:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred while listing repositories'
      }
    }
  },

  /**
   * Delete repository with enhanced permission validation
   */
  delete_repository: async (params: DeleteRepositoryParams): Promise<DeleteRepositoryResult> => {
    try {
      // Validate required parameters
      if (!params.owner || !params.repo) {
        return {
          success: false,
          message: 'Owner and repository name are required'
        }
      }

      // Validate environment configuration
      const envValidation = EnvConfig.validateRequired()
      if (!envValidation.isValid) {
        return {
          success: false,
          message: `Missing required environment variables: ${envValidation.missing.join(', ')}`
        }
      }

      const githubService = new GitHubService()

      // Validate repository deletion permissions
      const permissionValidation = await validateRepositoryDeletionPermissions(
        params.owner,
        githubService
      )

      if (ResultUtils.isFailure(permissionValidation)) {
        return {
          success: false,
          message: permissionValidation.error.message
        }
      }

      // Proceed with deletion
      const result = await githubService.deleteRepository(params.owner, params.repo)

      if (!result.success) {
        return {
          success: false,
          message: result.message
        }
      }

      return {
        success: true,
        message: `Repository '${params.owner}/${params.repo}' deleted successfully`
      }

    } catch (error) {
      console.error('Failed to delete repository:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred while deleting repository'
      }
    }
  },

  /**
   * Get a single repository directly
   */
  get_repository: async (params: GetRepositoryParams): Promise<GetRepositoryResult> => {
    try {
      // Validate required parameters
      if (!params.owner || !params.repo) {
        return {
          success: false,
          message: 'Owner and repository name are required'
        }
      }

      // Validate environment configuration
      const envValidation = EnvConfig.validateRequired()
      if (!envValidation.isValid) {
        return {
          success: false,
          message: `Missing required environment variables: ${envValidation.missing.join(', ')}`
        }
      }

      const githubService = new GitHubService()

      // Get the repository directly from GitHub API
      const result = await githubService.getRepository(params.owner, params.repo)

      if (!result.success || !result.repository) {
        return {
          success: false,
          message: result.message || `Repository ${params.owner}/${params.repo} not found`
        }
      }

      // Transform the GitHub repository data to our Repository type
      const repository = {
        id: result.repository.full_name as string,
        name: result.repository.name as string,
        fullName: result.repository.full_name as string,
        url: result.repository.url as string,
        description: result.repository.description as string | null,
        private: result.repository.private as boolean,
        createdAt: result.repository.created_at as string,
        updatedAt: result.repository.updated_at as string,
        isScaffoldedProject: isScaffoldedProject(result.repository.name as string, result.repository.description as string | null)
      }

      return {
        success: true,
        message: `Repository ${params.owner}/${params.repo} retrieved successfully`,
        repository
      }

    } catch (error) {
      console.error('Failed to get repository:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred while retrieving repository'
      }
    }
  },

  /**
   * Validate repository permissions without performing operations
   */
  validate_repository_permissions: async (params: { owner: string }): Promise<{
    success: boolean
    message: string
    canDelete: boolean
    githubOwner?: string
    authenticatedUser?: string
  }> => {
    try {
      const githubOwner = EnvConfig.get('GITHUB_OWNER')
      if (!githubOwner) {
        return {
          success: false,
          message: 'GITHUB_OWNER environment variable must be specified',
          canDelete: false
        }
      }

      const githubService = new GitHubService()
      const userResult = await githubService.getAuthenticatedUser()

      if (!userResult.success || !userResult.user) {
        return {
          success: false,
          message: 'Unable to validate GitHub token permissions',
          canDelete: false
        }
      }

      const authenticatedUsername = userResult.user.login
      const canDelete = githubOwner !== authenticatedUsername && params.owner === githubOwner

      return {
        success: true,
        message: canDelete
          ? `Repository deletion allowed for owner '${params.owner}'`
          : `Repository deletion not allowed for owner '${params.owner}'. Only repositories under '${githubOwner}' can be deleted.`,
        canDelete,
        githubOwner,
        authenticatedUser: authenticatedUsername
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        canDelete: false
      }
    }
  }
}
