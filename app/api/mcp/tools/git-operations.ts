import { RepositoryTools } from '@/lib/repository-tools'

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
   * Pushes changes to remote repository
   */
  git_push: async (params: { path: string; repository?: { url: string; name: string } }): Promise<GitOperationResult> => {
    try {
      const result = await RepositoryTools.pushToRemote(params.path, params.repository)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository push failed: ${error}`)
    }
  },

  /**
   * Clones a repository from a remote URL
   */
  clone_repository: async (params: { url: string; path: string }): Promise<GitOperationResult> => {
    try {
      const result = await RepositoryTools.cloneRepository(params.url, params.path)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository clone failed: ${error}`)
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
  },

  /**
   * Gets detailed commit logs for a repository path
   */
  git_log: async (params: { path: string; limit?: number }): Promise<{
    success: boolean
    message: string
    commits?: Array<{
      hash: string
      author: string
      email: string
      date: string
      timestamp: number
      message: string
      subject: string
      body: string
    }>
  }> => {
    try {
      const limit = params.limit || 20
      const fs = await import('fs')
      const path = await import('path')
      const { execSync } = await import('child_process')

      // Check if path exists and is a git repository
      if (!fs.existsSync(params.path)) {
        return {
          success: false,
          message: 'Repository path does not exist'
        }
      }

      const gitDir = path.join(params.path, '.git')
      if (!fs.existsSync(gitDir)) {
        return {
          success: false,
          message: 'Not a git repository'
        }
      }

      // Get detailed commit information using git log with custom format
      const gitLogOutput = execSync(
        `git log --pretty=format:"%H|%an|%ae|%ad|%at|%s|%b" --date=iso -${limit}`,
        {
          cwd: params.path,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      )

      if (!gitLogOutput.trim()) {
        return {
          success: true,
          message: 'No commits found',
          commits: []
        }
      }

      const commits = gitLogOutput
        .trim()
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const parts = line.split('|')
          if (parts.length < 6) return null

          const [hash, author, email, date, timestamp, subject, ...bodyParts] = parts
          const body = bodyParts.join('|').trim()

          return {
            hash: hash.trim(),
            author: author.trim(),
            email: email.trim(),
            date: date.trim(),
            timestamp: parseInt(timestamp.trim()) * 1000, // Convert to milliseconds
            message: subject.trim() + (body ? '\n\n' + body : ''),
            subject: subject.trim(),
            body: body
          }
        })
        .filter((commit: {
          hash: string
          author: string
          email: string
          date: string
          timestamp: number
          message: string
          subject: string
          body: string
        } | null): commit is {
          hash: string
          author: string
          email: string
          date: string
          timestamp: number
          message: string
          subject: string
          body: string
        } => commit !== null)

      return {
        success: true,
        message: `Found ${commits.length} commits`,
        commits
      }

    } catch (error) {
      console.error('Git log error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get git log'
      }
    }
  }
}
