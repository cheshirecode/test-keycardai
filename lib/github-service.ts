import { Octokit } from '@octokit/rest'
import * as fs from 'fs'
import * as path from 'path'

export interface GitHubRepoConfig {
  owner: string
  repo: string
  description?: string
  private?: boolean
}

export interface CommitFile {
  path: string
  content: string
}

export class GitHubService {
  private octokit: Octokit
  private isAvailable: boolean

  constructor() {
    const token = process.env.GITHUB_TOKEN
    this.isAvailable = !!token

    if (token) {
      this.octokit = new Octokit({
        auth: token,
      })
    } else {
      // Create a dummy octokit instance to prevent errors
      this.octokit = new Octokit()
    }
  }

  isGitHubAvailable(): boolean {
    return this.isAvailable
  }

  async createRepository(config: GitHubRepoConfig): Promise<{ success: boolean; url?: string; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available - repository creation skipped'
      }
    }

    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: config.repo,
        description: config.description || `Generated project: ${config.repo}`,
        private: config.private || false,
        auto_init: true, // Initialize with README
      })

      return {
        success: true,
        url: response.data.html_url,
        message: `Repository created successfully: ${response.data.html_url}`
      }
    } catch (error: unknown) {
      // Handle case where repo already exists
      const err = error as { status?: number; message?: string }
      if (err.status === 422) {
        return {
          success: false,
          message: `Repository '${config.repo}' already exists`
        }
      }

      return {
        success: false,
        message: `Failed to create repository: ${err.message || 'Unknown error'}`
      }
    }
  }

  async commitFiles(
    config: GitHubRepoConfig,
    files: CommitFile[],
    commitMessage: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available - commit skipped'
      }
    }

    try {
      // Get the default branch (usually 'main' or 'master')
      const { data: repo } = await this.octokit.repos.get({
        owner: config.owner,
        repo: config.repo,
      })

      const defaultBranch = repo.default_branch

      // Get the latest commit SHA
      const { data: ref } = await this.octokit.git.getRef({
        owner: config.owner,
        repo: config.repo,
        ref: `heads/${defaultBranch}`,
      })

      const latestCommitSha = ref.object.sha

      // Get the tree of the latest commit
      const { data: latestCommit } = await this.octokit.git.getCommit({
        owner: config.owner,
        repo: config.repo,
        commit_sha: latestCommitSha,
      })

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: config.owner,
            repo: config.repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          })
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          }
        })
      )

      // Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: config.owner,
        repo: config.repo,
        base_tree: latestCommit.tree.sha,
        tree: blobs,
      })

      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: config.owner,
        repo: config.repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
        author: {
          name: process.env.GIT_USER_NAME || 'Project Scaffolder',
          email: process.env.GIT_USER_EMAIL || 'scaffolder@example.com',
        },
      })

      // Update the reference
      await this.octokit.git.updateRef({
        owner: config.owner,
        repo: config.repo,
        ref: `heads/${defaultBranch}`,
        sha: newCommit.sha,
      })

      return {
        success: true,
        message: `Files committed successfully: ${commitMessage}`
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to commit files: ${err.message || 'Unknown error'}`
      }
    }
  }

  async getRepositoryInfo(config: GitHubRepoConfig): Promise<{ success: boolean; info?: { name: string; url: string; description: string | null; private: boolean; defaultBranch: string }; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const { data: repo } = await this.octokit.repos.get({
        owner: config.owner,
        repo: config.repo,
      })

      return {
        success: true,
        info: {
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          private: repo.private,
          defaultBranch: repo.default_branch,
        },
        message: 'Repository info retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get repository info: ${err.message || 'Unknown error'}`
      }
    }
  }

  // Helper method to collect files from a directory
  static collectFilesFromDirectory(projectPath: string): CommitFile[] {
    const files: CommitFile[] = []

    function walkDirectory(dir: string, basePath: string = '') {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const relativePath = path.join(basePath, item)

        // Skip certain directories and files
        if (item === 'node_modules' || item === '.git' || item === '.next' || item.startsWith('.')) {
          continue
        }

        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          walkDirectory(fullPath, relativePath)
        } else if (stat.isFile()) {
          const content = fs.readFileSync(fullPath, 'utf8')
          files.push({
            path: relativePath.replace(/\\/g, '/'), // Normalize path separators
            content
          })
        }
      }
    }

    if (fs.existsSync(projectPath)) {
      walkDirectory(projectPath)
    }

    return files
  }

  // Helper method to generate a unique repository name
  static generateRepoName(baseName: string): string {
    const timestamp = Date.now()
    const cleanName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    return `${cleanName}-${timestamp}`
  }

  // Helper method to get authenticated user info
  async getAuthenticatedUser(): Promise<{ success: boolean; user?: { login: string; name: string | null; email: string | null }; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const { data: user } = await this.octokit.users.getAuthenticated()

      return {
        success: true,
        user: {
          login: user.login,
          name: user.name,
          email: user.email,
        },
        message: 'User info retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get user info: ${err.message || 'Unknown error'}`
      }
    }
  }
}
