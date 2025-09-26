/**
 * Repository Service
 * Handles GitHub repository CRUD operations
 */

import type {
  IRepositoryService,
  IGitHubAPIClient,
  IGitHubAuthService,
  IGitHubErrorHandler,
  GitHubRepoConfig,
  CreateRepositoryResult,
  DeleteResult,
  BulkDeleteResult,
  RepositoryResult,
  RepositoryInfoResult,
  RepositoryListResult,
  ListRepositoryOptions,
  RepoIdentifier,
  BulkDeleteProgress,
  RepositoryData
} from '@/types/github'

export class RepositoryService implements IRepositoryService {
  constructor(
    private apiClient: IGitHubAPIClient,
    private authService: IGitHubAuthService,
    private errorHandler: IGitHubErrorHandler
  ) {}

  /**
   * Create a new GitHub repository
   */
  async createRepository(config: GitHubRepoConfig): Promise<CreateRepositoryResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available - repository creation skipped'
      }
    }

    try {
      // Check owner type and permissions
      const ownerTypeResult = await this.authService.checkOwnerType(config.owner)
      if (!ownerTypeResult.success) {
        return {
          success: false,
          message: `Failed to verify owner '${config.owner}': ${ownerTypeResult.message}`
        }
      }

      const isUserAccount = ownerTypeResult.type === 'user'
      const isOrganization = ownerTypeResult.type === 'organization'

      console.log(`[Repository Creation] Creating ${config.repo} under ${ownerTypeResult.type} '${config.owner}'`)

      let response
      const repoData = {
        name: config.repo,
        description: config.description || `Generated project: ${config.repo}`,
        private: config.private || false,
        auto_init: true // Initialize with README
      }

      if (isUserAccount) {
        // Verify it's the authenticated user
        const authUser = await this.authService.getAuthenticatedUser()
        if (!authUser.success || !authUser.user || config.owner !== authUser.user.login) {
          return {
            success: false,
            message: `Cannot create repository under user '${config.owner}' - you can only create repositories under your own user account`
          }
        }

        response = await this.apiClient.post('/user/repos', repoData)
      } else if (isOrganization) {
        response = await this.apiClient.post(`/orgs/${config.owner}/repos`, repoData)
      } else {
        return {
          success: false,
          message: `Unknown owner type for '${config.owner}'`
        }
      }

      if (response.success && response.data) {
        const repoInfo = response.data as { html_url: string }
        return {
          success: true,
          message: `Repository '${config.owner}/${config.repo}' created successfully`,
          url: repoInfo.html_url
        }
      }

      return {
        success: false,
        message: response.message || 'Repository creation failed'
      }
    } catch (error) {
      return this.errorHandler.handleAPIError(error, 'Repository creation')
    }
  }

  /**
   * Delete a GitHub repository
   */
  async deleteRepository(owner: string, repo: string): Promise<DeleteResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available - repository deletion skipped'
      }
    }

    try {
      // Verify repository exists and we have access
      const repoInfo = await this.getRepositoryInfo({ owner, repo })
      if (!repoInfo.success) {
        return {
          success: false,
          message: `Cannot delete repository: ${repoInfo.message}`
        }
      }

      console.log(`[Repository Deletion] Deleting ${owner}/${repo}`)

      const response = await this.apiClient.delete(`/repos/${owner}/${repo}`)

      if (response.success) {
        return {
          success: true,
          message: `Repository '${owner}/${repo}' deleted successfully`
        }
      }

      return {
        success: false,
        message: response.message || 'Repository deletion failed'
      }
    } catch (error) {
      return this.errorHandler.handleAPIError(error, 'Repository deletion')
    }
  }

  /**
   * Bulk delete multiple repositories
   */
  async bulkDeleteRepositories(
    repositories: RepoIdentifier[],
    options: { 
      dryRun?: boolean
      onProgress?: (progress: BulkDeleteProgress) => void 
    } = {}
  ): Promise<BulkDeleteResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available - bulk deletion skipped'
      }
    }

    const { dryRun = false, onProgress } = options
    const results: Array<{
      owner: string
      repo: string
      success: boolean
      message: string
    }> = []

    let successCount = 0
    let failureCount = 0

    console.log(`[Bulk Repository ${dryRun ? 'Check' : 'Deletion'}] Processing ${repositories.length} repositories`)

    for (let i = 0; i < repositories.length; i++) {
      const { owner, repo } = repositories[i]
      const repoName = `${owner}/${repo}`

      // Update progress
      onProgress?.({
        total: repositories.length,
        completed: i,
        successful: successCount,
        failed: failureCount,
        current: { owner, repo }
      })

      try {
        if (dryRun) {
          // Dry run - just check if repository exists and we have access
          const repoInfo = await this.getRepositoryInfo({ owner, repo })
          
          results.push({
            owner,
            repo,
            success: repoInfo.success,
            message: repoInfo.success 
              ? `Repository ${repoName} exists and is accessible`
              : `Repository ${repoName} check failed: ${repoInfo.message}`
          })

          if (repoInfo.success) successCount++
          else failureCount++
        } else {
          // Actual deletion
          const deleteResult = await this.deleteRepository(owner, repo)
          
          results.push({
            owner,
            repo,
            success: deleteResult.success,
            message: deleteResult.message
          })

          if (deleteResult.success) successCount++
          else failureCount++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          owner,
          repo,
          success: false,
          message: `Error processing ${repoName}: ${errorMessage}`
        })
        failureCount++
      }
    }

    // Final progress update
    onProgress?.({
      total: repositories.length,
      completed: repositories.length,
      successful: successCount,
      failed: failureCount
    })

    const operation = dryRun ? 'Bulk repository check' : 'Bulk repository deletion'
    const message = `${operation} completed: ${successCount} successful, ${failureCount} failed`

    return {
      success: failureCount === 0,
      message,
      results,
      summary: {
        total: repositories.length,
        successful: successCount,
        failed: failureCount
      }
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<RepositoryData>(`/repos/${owner}/${repo}`)

      if (response.success && response.data) {
        return {
          success: true,
          message: `Repository information retrieved for ${owner}/${repo}`,
          repository: response.data,
          data: response.data
        }
      }

      return {
        success: false,
        message: response.message || `Repository ${owner}/${repo} not found`,
        repository: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get repository')
      return {
        success: false,
        message: errorResponse.message,
        repository: undefined,
        data: undefined
      }
    }
  }

  /**
   * Get basic repository information
   */
  async getRepositoryInfo(config: GitHubRepoConfig): Promise<RepositoryInfoResult> {
    const repoResult = await this.getRepository(config.owner, config.repo)

    if (repoResult.success && repoResult.repository) {
      const repo = repoResult.repository
      return {
        success: true,
        message: `Repository info retrieved for ${config.owner}/${config.repo}`,
        info: {
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          private: repo.private,
          defaultBranch: repo.default_branch
        }
      }
    }

    return {
      success: false,
      message: repoResult.message || `Repository ${config.owner}/${config.repo} not found`
    }
  }

  /**
   * List repositories with filtering options
   */
  async listRepositories(options: ListRepositoryOptions = {}): Promise<RepositoryListResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      let endpoint = '/user/repos'
      const params: Record<string, unknown> = {
        type: options.type || 'all',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: Math.min(options.per_page || 30, 100),
        page: options.page || 1
      }

      if (options.owner) {
        // List repositories for a specific user/organization
        const ownerTypeResult = await this.authService.checkOwnerType(options.owner)
        if (!ownerTypeResult.success) {
          return {
            success: false,
            message: `Failed to verify owner '${options.owner}': ${ownerTypeResult.message}`
          }
        }

        if (ownerTypeResult.type === 'user') {
          endpoint = `/users/${options.owner}/repos`
        } else if (ownerTypeResult.type === 'organization') {
          endpoint = `/orgs/${options.owner}/repos`
        }
      }

      const response = await this.apiClient.get<RepositoryData[]>(endpoint, params)

      if (response.success && response.data) {
        let repositories = response.data

        // Apply name filter if provided
        if (options.nameFilter) {
          const filterLower = options.nameFilter.toLowerCase()
          repositories = repositories.filter(repo => 
            repo.name.toLowerCase().includes(filterLower) ||
            repo.full_name.toLowerCase().includes(filterLower) ||
            (repo.description && repo.description.toLowerCase().includes(filterLower))
          )
        }

        return {
          success: true,
          message: `Retrieved ${repositories.length} repositories`,
          repositories,
          data: repositories,
          totalCount: repositories.length
        }
      }

      return {
        success: false,
        message: response.message || 'Failed to retrieve repositories',
        repositories: undefined,
        data: undefined,
        totalCount: 0
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'List repositories')
      return {
        success: false,
        message: errorResponse.message,
        repositories: undefined,
        data: undefined,
        totalCount: 0
      }
    }
  }
}
