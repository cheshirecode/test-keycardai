/**
 * Content Service
 * Handles GitHub repository content operations
 */

import type {
  IContentService,
  IGitHubAPIClient,
  IGitHubAuthService,
  IGitHubErrorHandler,
  GitHubRepoConfig,
  CommitFile,
  CommitResult,
  ContentResult
} from '@/types/github'

export class ContentService implements IContentService {
  constructor(
    private apiClient: IGitHubAPIClient,
    private authService: IGitHubAuthService,
    private errorHandler: IGitHubErrorHandler
  ) {}

  /**
   * Commit files to a repository
   */
  async commitFiles(
    config: GitHubRepoConfig,
    files: CommitFile[],
    commitMessage: string
  ): Promise<CommitResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available - commit skipped'
      }
    }

    if (!files || files.length === 0) {
      return {
        success: false,
        message: 'No files provided for commit'
      }
    }

    try {
      console.log(`[Content Service] Committing ${files.length} files to ${config.owner}/${config.repo}`)

      // Get repository information to find default branch
      const repoResponse = await this.apiClient.get(`/repos/${config.owner}/${config.repo}`)
      if (!repoResponse.success || !repoResponse.data) {
        return {
          success: false,
          message: `Repository ${config.owner}/${config.repo} not found`
        }
      }

      const repoData = repoResponse.data as { default_branch: string }
      const defaultBranch = repoData.default_branch

      // Get the latest commit SHA
      const refResponse = await this.apiClient.get(`/repos/${config.owner}/${config.repo}/git/refs/heads/${defaultBranch}`)
      if (!refResponse.success || !refResponse.data) {
        return {
          success: false,
          message: `Failed to get branch reference for ${defaultBranch}`
        }
      }

      const refData = refResponse.data as { object: { sha: string } }
      const latestCommitSha = refData.object.sha

      // Get the tree of the latest commit
      const commitResponse = await this.apiClient.get(`/repos/${config.owner}/${config.repo}/git/commits/${latestCommitSha}`)
      if (!commitResponse.success || !commitResponse.data) {
        return {
          success: false,
          message: 'Failed to get latest commit information'
        }
      }

      const commitData = commitResponse.data as { tree: { sha: string } }

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const blobResponse = await this.apiClient.post(`/repos/${config.owner}/${config.repo}/git/blobs`, {
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64'
          })

          if (!blobResponse.success || !blobResponse.data) {
            throw new Error(`Failed to create blob for ${file.path}`)
          }

          const blobData = blobResponse.data as { sha: string }
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blobData.sha
          }
        })
      )

      // Create a new tree
      const treeResponse = await this.apiClient.post(`/repos/${config.owner}/${config.repo}/git/trees`, {
        base_tree: commitData.tree.sha,
        tree: blobs
      })

      if (!treeResponse.success || !treeResponse.data) {
        return {
          success: false,
          message: 'Failed to create new tree'
        }
      }

      const treeData = treeResponse.data as { sha: string }

      // Create a new commit
      const newCommitResponse = await this.apiClient.post(`/repos/${config.owner}/${config.repo}/git/commits`, {
        message: commitMessage,
        tree: treeData.sha,
        parents: [latestCommitSha]
      })

      if (!newCommitResponse.success || !newCommitResponse.data) {
        return {
          success: false,
          message: 'Failed to create new commit'
        }
      }

      const newCommitData = newCommitResponse.data as { sha: string; html_url: string }

      // Update the branch reference
      const updateRefResponse = await this.apiClient.post(`/repos/${config.owner}/${config.repo}/git/refs/heads/${defaultBranch}`, {
        sha: newCommitData.sha
      })

      if (!updateRefResponse.success) {
        return {
          success: false,
          message: 'Failed to update branch reference'
        }
      }

      return {
        success: true,
        message: `Successfully committed ${files.length} files to ${config.owner}/${config.repo}`,
        commitSha: newCommitData.sha,
        commitUrl: newCommitData.html_url
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Commit files')
      return {
        success: false,
        message: errorResponse.message
      }
    }
  }

  /**
   * Get repository programming languages
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<ContentResult<Record<string, number>>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<Record<string, number>>(`/repos/${owner}/${repo}/languages`)

      if (response.success && response.data) {
        return {
          success: true,
          message: `Languages retrieved for ${owner}/${repo}`,
          content: response.data,
          data: response.data
        }
      }

      return {
        success: false,
        message: response.message || `Failed to get languages for ${owner}/${repo}`,
        content: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get repository languages')
      return {
        success: false,
        message: errorResponse.message,
        content: undefined,
        data: undefined
      }
    }
  }

  /**
   * Get repository README content
   */
  async getRepositoryReadme(owner: string, repo: string): Promise<ContentResult<string>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<{ content: string; encoding: string }>(`/repos/${owner}/${repo}/readme`)

      if (response.success && response.data) {
        const { content, encoding } = response.data
        
        // Decode base64 content
        let decodedContent = content
        if (encoding === 'base64') {
          try {
            decodedContent = Buffer.from(content, 'base64').toString('utf8')
          } catch (decodeError) {
            console.warn(`[Content Service] Failed to decode README content: ${decodeError}`)
          }
        }

        return {
          success: true,
          message: `README retrieved for ${owner}/${repo}`,
          content: decodedContent,
          data: decodedContent
        }
      }

      return {
        success: false,
        message: response.message || `README not found for ${owner}/${repo}`,
        content: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get repository README')
      return {
        success: false,
        message: errorResponse.message,
        content: undefined,
        data: undefined
      }
    }
  }

  /**
   * Get repository topics
   */
  async getRepositoryTopics(owner: string, repo: string): Promise<ContentResult<string[]>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<{ names: string[] }>(`/repos/${owner}/${repo}/topics`, {
        headers: {
          'Accept': 'application/vnd.github.mercy-preview+json'
        }
      })

      if (response.success && response.data) {
        return {
          success: true,
          message: `Topics retrieved for ${owner}/${repo}`,
          content: response.data.names,
          data: response.data.names
        }
      }

      return {
        success: false,
        message: response.message || `Failed to get topics for ${owner}/${repo}`,
        content: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get repository topics')
      return {
        success: false,
        message: errorResponse.message,
        content: undefined,
        data: undefined
      }
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    owner: string, 
    repo: string, 
    path: string, 
    ref?: string
  ): Promise<ContentResult<string>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const params: Record<string, unknown> = {}
      if (ref) {
        params.ref = ref
      }

      const response = await this.apiClient.get<{ 
        content: string
        encoding: string
        type: string
      }>(`/repos/${owner}/${repo}/contents/${path}`, params)

      if (response.success && response.data) {
        const { content, encoding, type } = response.data

        if (type !== 'file') {
          return {
            success: false,
            message: `Path ${path} is not a file`
          }
        }

        // Decode content
        let decodedContent = content
        if (encoding === 'base64') {
          try {
            decodedContent = Buffer.from(content, 'base64').toString('utf8')
          } catch (decodeError) {
            return {
              success: false,
              message: `Failed to decode file content: ${decodeError}`
            }
          }
        }

        return {
          success: true,
          message: `File content retrieved for ${owner}/${repo}/${path}`,
          content: decodedContent,
          data: decodedContent
        }
      }

      return {
        success: false,
        message: response.message || `File ${path} not found in ${owner}/${repo}`,
        content: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get file content')
      return {
        success: false,
        message: errorResponse.message,
        content: undefined,
        data: undefined
      }
    }
  }

  /**
   * Update repository topics
   */
  async updateRepositoryTopics(owner: string, repo: string, topics: string[]): Promise<ContentResult<string[]>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.request<{ names: string[] }>(`/repos/${owner}/${repo}/topics`, {
        method: 'PUT',
        body: { names: topics },
        headers: {
          'Accept': 'application/vnd.github.mercy-preview+json'
        }
      })

      if (response.success && response.data) {
        return {
          success: true,
          message: `Topics updated for ${owner}/${repo}`,
          content: response.data.names,
          data: response.data.names
        }
      }

      return {
        success: false,
        message: response.message || `Failed to update topics for ${owner}/${repo}`,
        content: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Update repository topics')
      return {
        success: false,
        message: errorResponse.message,
        content: undefined,
        data: undefined
      }
    }
  }
}
