import * as fs from 'fs'
import * as path from 'path'
import { GitHubService, GitHubRepoConfig } from '../../../../src/lib/github-service'

export interface CheckOwnerTypeParams {
  owner: string
}

export interface CreateGitHubBranchParams {
  projectPath: string
  projectName?: string
  branchPrefix?: string
}

export interface GitHubUserResult {
  success: boolean
  user?: {
    login: string
    [key: string]: unknown
  }
  message?: string
}

export interface GitHubOwnerResult {
  success: boolean
  type?: string
  message?: string
  owner: string
}

export interface GitHubBranchResult {
  success: boolean
  message: string
  repositoryName?: string
  repositoryUrl?: string
  fileCount?: number
  owner?: string
  error?: string
}

/**
 * GitHub Operations Module
 * Handles GitHub-specific operations like user authentication, owner type checking, and repository creation
 */
export const githubOperations = {
  /**
   * Gets the authenticated GitHub user information
   */
  get_github_user: async (): Promise<GitHubUserResult> => {
    try {
      const githubService = new GitHubService()
      const result = await githubService.getAuthenticatedUser()

      return {
        success: result.success,
        user: result.user,
        message: result.message
      }
    } catch (error) {
      throw new Error(`Failed to get GitHub user: ${error}`)
    }
  },

  /**
   * Checks the type of a GitHub owner (user or organization)
   */
  check_github_owner_type: async (params: CheckOwnerTypeParams): Promise<GitHubOwnerResult> => {
    try {
      const githubService = new GitHubService()
      const result = await githubService.checkOwnerType(params.owner)

      return {
        success: result.success,
        type: result.type,
        message: result.message,
        owner: params.owner
      }
    } catch (error) {
      throw new Error(`Failed to check GitHub owner type: ${error}`)
    }
  },

  /**
   * Creates a GitHub repository from a project directory
   */
  create_github_branch: async (params: CreateGitHubBranchParams): Promise<GitHubBranchResult> => {
    try {
      console.log('[GitHub Branch] Starting GitHub branch creation process...')

      const githubService = new GitHubService()
      if (!githubService.isGitHubAvailable()) {
        console.log('[GitHub Branch] GitHub token not available')
        return {
          success: false,
          message: 'GitHub token not available. Please set GITHUB_TOKEN environment variable to create branches.'
        }
      }

      console.log('[GitHub Branch] Authenticating with GitHub...')
      const user = await githubService.getAuthenticatedUser()
      if (!user.success || !user.user) {
        console.error('[GitHub Branch] Authentication failed:', user.message)
        return {
          success: false,
          message: user.message || 'Failed to authenticate with GitHub. Please check your GITHUB_TOKEN.'
        }
      }

      console.log(`[GitHub Branch] Authenticated as: ${user.user.login}`)

      const projectName = params.projectName || path.basename(params.projectPath)
      const branchPrefix = params.branchPrefix || 'temp'
      const timestamp = Date.now()
      const tempRepoName = `${branchPrefix}-${projectName}-${timestamp}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-')

      // Check if project directory exists
      if (!fs.existsSync(params.projectPath)) {
        const errorMsg = `Project directory not found: ${params.projectPath}`
        console.error('[GitHub Branch]', errorMsg)
        throw new Error(errorMsg)
      }

      console.log(`[GitHub Branch] Collecting files from: ${params.projectPath}`)
      // Collect all files from the project
      const files = GitHubService.collectFilesFromDirectory(params.projectPath)
      console.log(`[GitHub Branch] Collected ${files.length} files`)

      if (files.length === 0) {
        return {
          success: false,
          message: 'No files found in project directory to upload to GitHub.'
        }
      }

      // Create repository
      console.log(`[GitHub Branch] Creating repository: ${tempRepoName}`)
      const createRepoResult = await githubService.createRepository({
        owner: user.user.login,
        repo: tempRepoName,
        description: `Generated project: ${projectName}`,
        private: false
      })

      if (!createRepoResult.success) {
        console.error('[GitHub Branch] Repository creation failed:', createRepoResult.message)
        return {
          success: false,
          message: `Failed to create repository: ${createRepoResult.message}`
        }
      }

      console.log(`[GitHub Branch] Repository created: ${createRepoResult.url}`)

      // Configure repository for commits
      const repoConfig: GitHubRepoConfig = {
        owner: user.user.login,
        repo: tempRepoName
      }

      // Commit all files to the repository
      console.log('[GitHub Branch] Committing files to repository...')
      const commitResult = await githubService.commitFiles(
        repoConfig,
        files,
        `Generated project: ${projectName}`
      )

      if (!commitResult.success) {
        console.error('[GitHub Branch] Commit failed:', commitResult.message)
        return {
          success: false,
          message: `Repository created but file upload failed: ${commitResult.message}`
        }
      }

      console.log('[GitHub Branch] Files committed successfully')

      return {
        success: true,
        message: `GitHub repository '${tempRepoName}' created successfully with ${files.length} files`,
        repositoryName: tempRepoName,
        repositoryUrl: createRepoResult.url,
        fileCount: files.length,
        owner: user.user.login
      }
    } catch (error) {
      console.error('[GitHub Branch] Error:', error)
      return {
        success: false,
        message: `Failed to create GitHub repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
