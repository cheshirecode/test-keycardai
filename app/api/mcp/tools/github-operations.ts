import * as fs from 'fs'
import * as path from 'path'
import { GitHubService, GitHubRepoConfig } from '@/lib/github-service'
import type { Repository } from '@/types'

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
   * Download repository contents for local modification using GitHub API
   */
  clone_repository: async (params: { repository: Repository }): Promise<{ success: boolean; message: string; localPath?: string }> => {
    try {
      const githubService = new GitHubService()
      if (!githubService.isGitHubAvailable()) {
        return {
          success: false,
          message: 'GitHub token not available. Please set GITHUB_TOKEN environment variable.'
        }
      }

      const [owner, repo] = params.repository.fullName.split('/')
      const repoName = params.repository.name
      const localPath = `/tmp/repositories/${repoName}-${Date.now()}`
      
      // Ensure the repositories directory exists
      const repositoriesDir = '/tmp/repositories'
      if (!fs.existsSync(repositoriesDir)) {
        fs.mkdirSync(repositoriesDir, { recursive: true })
      }
      
      // Get repository info and default branch
      const repoInfo = await githubService.getRepositoryInfo({ owner, repo })
      if (!repoInfo.success || !repoInfo.info) {
        return {
          success: false,
          message: `Failed to get repository info: ${repoInfo.message}`
        }
      }

      // Download repository as zip archive using GitHub API
      const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${repoInfo.info.defaultBranch || 'main'}`
      
      // Use GitHub service to download the repository
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Project-Scaffolder'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      // Extract the zip file to local path
      const buffer = await response.arrayBuffer()
      const AdmZip = await import('adm-zip')
      const zip = new AdmZip.default(Buffer.from(buffer))
      
      // Create the local directory
      fs.mkdirSync(localPath, { recursive: true })
      
      // Extract to temporary location first
      const tempExtractPath = `${localPath}-temp`
      zip.extractAllTo(tempExtractPath, true)
      
      // Find the extracted folder (GitHub creates a folder with commit hash)
      const extractedFolders = fs.readdirSync(tempExtractPath)
      if (extractedFolders.length === 0) {
        throw new Error('No content extracted from repository')
      }
      
      // Move contents from the extracted folder to our target path
      const extractedFolder = path.join(tempExtractPath, extractedFolders[0])
      const items = fs.readdirSync(extractedFolder)
      
      for (const item of items) {
        const sourcePath = path.join(extractedFolder, item)
        const destPath = path.join(localPath, item)
        fs.renameSync(sourcePath, destPath)
      }
      
      // Clean up temp directory
      fs.rmSync(tempExtractPath, { recursive: true, force: true })
      
      return {
        success: true,
        message: `Repository contents downloaded successfully to ${localPath}`,
        localPath
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to download repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

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
  },

  /**
   * Get commits from GitHub repository via API
   */
  github_get_commits: async (params: {
    owner: string
    repo: string
    limit?: number
  }): Promise<{
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
      const { owner, repo, limit = 10 } = params

      if (!owner || !repo) {
        return {
          success: false,
          message: 'Owner and repository name are required'
        }
      }

      const githubService = new GitHubService()
      
      if (!githubService.isGitHubAvailable()) {
        return {
          success: false,
          message: 'GitHub token not available'
        }
      }

      console.log(`[GitHub API] Fetching commits for ${owner}/${repo} (limit: ${limit})`)

      // Get commits from GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Project-Scaffolder'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: `Repository ${owner}/${repo} not found or not accessible`
          }
        }
        if (response.status === 403) {
          return {
            success: false,
            message: `Access denied to repository ${owner}/${repo}. Check GitHub token permissions.`
          }
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const githubCommits = await response.json()

      if (!Array.isArray(githubCommits) || githubCommits.length === 0) {
        return {
          success: true,
          message: 'No commits found in repository',
          commits: []
        }
      }

      // Convert GitHub API format to our standard format
      const commits = githubCommits.map((commit: {
        sha: string
        commit: {
          author: { name: string; email: string; date: string }
          message: string
        }
      }) => {
        const commitDate = new Date(commit.commit.author.date)
        return {
          hash: commit.sha,
          author: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
          timestamp: commitDate.getTime(),
          message: commit.commit.message,
          subject: commit.commit.message.split('\n')[0],
          body: commit.commit.message.split('\n').slice(1).join('\n').trim()
        }
      })

      console.log(`[GitHub API] Successfully fetched ${commits.length} commits for ${owner}/${repo}`)

      return {
        success: true,
        message: `Found ${commits.length} commits`,
        commits
      }

    } catch (error) {
      console.error('GitHub get commits error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch commits from GitHub API'
      }
    }
  }
}
