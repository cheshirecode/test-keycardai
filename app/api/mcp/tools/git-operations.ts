import { RepositoryTools } from '../../../../src/lib/repository-tools'

export interface GitPathParams {
  path: string
}

export interface GitCommitParams {
  path: string
  message: string
}

export interface GitConfigureUserParams {
  path: string
  name?: string
  email?: string
}

export interface GitOperationResult {
  success: boolean
  message: string
  githubAvailable: boolean
  method: string
  repoUrl?: string
  status?: unknown
  history?: unknown
  source?: string
}

/**
 * Git Operations Module
 * Handles all Git-related operations including repository initialization, commits, and configuration
 */
export const gitOperations = {
  /**
   * Initializes a Git repository at the specified path
   */
  git_init: async (params: GitPathParams): Promise<GitOperationResult> => {
    try {
      const result = await RepositoryTools.initRepository(params.path)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        repoUrl: result.repoUrl,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository initialization failed: ${error}`)
    }
  },

  /**
   * Adds and commits changes to the repository
   */
  git_add_commit: async (params: GitCommitParams): Promise<GitOperationResult> => {
    try {
      const result = await RepositoryTools.addAndCommit(params.path, params.message)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository commit failed: ${error}`)
    }
  },

  /**
   * Gets the status of the Git repository
   */
  git_status: async (params: GitPathParams): Promise<GitOperationResult> => {
    try {
      const status = await RepositoryTools.getStatus(params.path)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: true,
        status,
        githubAvailable,
        method: 'github_api',
        message: 'Status retrieved successfully'
      }
    } catch (error) {
      throw new Error(`Repository status failed: ${error}`)
    }
  },

  /**
   * Creates a new branch in the repository
   */
  git_create_branch: async (): Promise<GitOperationResult> => {
    try {
      const result = await RepositoryTools.createBranch()
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository branch creation failed: ${error}`)
    }
  },

  /**
   * Sets the remote origin for the repository
   */
  git_set_remote: async (): Promise<GitOperationResult> => {
    try {
      const result = await RepositoryTools.setRemoteOrigin()
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository remote setup failed: ${error}`)
    }
  },

  /**
   * Configures Git user settings
   */
  git_configure_user: async (params: GitConfigureUserParams): Promise<GitOperationResult> => {
    try {
      // Use provided parameters or fall back to environment variables
      const name = params.name || process.env.GIT_USER_NAME
      const email = params.email || process.env.GIT_USER_EMAIL

      if (!name || !email) {
        throw new Error('Git user name and email are required. Provide them as parameters or set GIT_USER_NAME and GIT_USER_EMAIL environment variables.')
      }

      const result = await RepositoryTools.configureUser(name, email)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository user configuration failed: ${error}`)
    }
  },

  /**
   * Configures Git user settings from environment variables
   */
  git_configure_user_from_env: async (): Promise<GitOperationResult> => {
    try {
      const name = process.env.GIT_USER_NAME
      const email = process.env.GIT_USER_EMAIL

      if (!name || !email) {
        throw new Error('GIT_USER_NAME and GIT_USER_EMAIL environment variables are required but not set.')
      }

      const result = await RepositoryTools.configureUser(name, email)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        source: 'environment_variables',
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository user configuration from environment failed: ${error}`)
    }
  },

  /**
   * Gets the commit history of the repository
   */
  git_history: async (): Promise<GitOperationResult> => {
    try {
      const history = await RepositoryTools.getCommitHistory()
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: true,
        history,
        githubAvailable,
        method: 'github_api',
        message: 'History retrieved successfully'
      }
    } catch (error) {
      throw new Error(`Repository history failed: ${error}`)
    }
  }
}
