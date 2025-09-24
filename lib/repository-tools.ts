import { GitHubService, GitHubRepoConfig } from './github-service'
import * as fs from 'fs'
import * as path from 'path'

export class RepositoryTools {
  private githubService: GitHubService

  constructor() {
    this.githubService = new GitHubService()
  }

  static async initRepository(projectPath: string): Promise<{ success: boolean; message: string; repoUrl?: string }> {
    const tools = new RepositoryTools()

    try {
      // Ensure the directory exists
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true })
      }

      // Create .gitignore regardless of GitHub availability
      const gitignore = `
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/

# Logs
logs
*.log
`.trim()

      fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore)

      // If GitHub is available, create a repository
      if (tools.githubService.isGitHubAvailable()) {
        // Get authenticated user to use as owner
        const userResult = await tools.githubService.getAuthenticatedUser()

        if (userResult.success && userResult.user) {
          const projectName = path.basename(projectPath)
          const repoName = GitHubService.generateRepoName(projectName)

          const repoConfig: GitHubRepoConfig = {
            owner: userResult.user.login,
            repo: repoName,
            description: `Generated project: ${projectName}`,
            private: false
          }

          const createResult = await tools.githubService.createRepository(repoConfig)

          if (createResult.success) {
            return {
              success: true,
              message: `Repository initialized and created on GitHub: ${createResult.url}`,
              repoUrl: createResult.url
            }
          } else {
            return {
              success: true,
              message: `Project created locally (GitHub repo creation failed: ${createResult.message})`
            }
          }
        } else {
          return {
            success: true,
            message: `Project created locally (GitHub user authentication failed: ${userResult.message})`
          }
        }
      } else {
        return {
          success: true,
          message: 'Project created locally (GitHub token not available)'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Repository initialization failed: ${error}`
      }
    }
  }

  static async addAndCommit(
    projectPath: string,
    message: string,
    repoConfig?: GitHubRepoConfig
  ): Promise<{ success: boolean; message: string }> {
    const tools = new RepositoryTools()

    try {
      // Check if directory exists
      if (!fs.existsSync(projectPath)) {
        return {
          success: false,
          message: `Directory does not exist: ${projectPath}`
        }
      }

      // Skip GitHub operations if not available
      if (!tools.githubService.isGitHubAvailable()) {
        return {
          success: true,
          message: 'Commit skipped (GitHub token not available)'
        }
      }

      // If no repo config provided, try to infer from project
      if (!repoConfig) {
        const userResult = await tools.githubService.getAuthenticatedUser()
        if (!userResult.success || !userResult.user) {
          return {
            success: false,
            message: 'Cannot commit: GitHub user authentication failed'
          }
        }

        const projectName = path.basename(projectPath)
        repoConfig = {
          owner: userResult.user.login,
          repo: GitHubService.generateRepoName(projectName)
        }
      }

      // Collect all files from the project directory
      const files = GitHubService.collectFilesFromDirectory(projectPath)

      if (files.length === 0) {
        return {
          success: false,
          message: 'No files to commit'
        }
      }

      // Commit files to GitHub
      const commitResult = await tools.githubService.commitFiles(repoConfig, files, message)

      return commitResult
    } catch (error) {
      return {
        success: false,
        message: `Commit failed: ${error}`
      }
    }
  }

  static async getStatus(projectPath: string): Promise<string> {
    const tools = new RepositoryTools()

    try {
      if (!tools.githubService.isGitHubAvailable()) {
        return 'GitHub not available in this environment'
      }

      if (!fs.existsSync(projectPath)) {
        return 'Project directory does not exist'
      }

      const files = GitHubService.collectFilesFromDirectory(projectPath)
      return `Project has ${files.length} files ready for GitHub operations`
    } catch {
      return 'Unable to determine project status'
    }
  }

  static async createBranch(): Promise<{ success: boolean; message: string }> {
    // For GitHub API, branch creation would require more complex logic
    // For now, we'll return a placeholder response
    return {
      success: true,
      message: 'Branch operations not yet implemented with GitHub API'
    }
  }

  static async setRemoteOrigin(): Promise<{ success: boolean; message: string }> {
    // With GitHub API, the remote is automatically set when creating the repo
    return {
      success: true,
      message: 'Remote origin is automatically configured with GitHub API'
    }
  }

  static async configureUser(
    name: string,
    email: string
  ): Promise<{ success: boolean; message: string }> {
    // With GitHub API, user info comes from the authenticated user and environment variables
    return {
      success: true,
      message: `User configuration: ${name} <${email}> (used for GitHub API commits)`
    }
  }

  static async getCommitHistory(): Promise<string> {
    const tools = new RepositoryTools()

    if (!tools.githubService.isGitHubAvailable()) {
      return 'GitHub not available in this environment'
    }

    // For now, return a placeholder. Full implementation would require
    // knowing the repository config and fetching commits via GitHub API
    return 'Commit history via GitHub API not yet implemented'
  }

  // Helper method to check if GitHub is available
  static isGitHubAvailable(): boolean {
    const tools = new RepositoryTools()
    return tools.githubService.isGitHubAvailable()
  }

  // Helper method to get repository URL from project path and config
  static async getRepositoryUrl(
    projectPath: string,
    repoConfig?: GitHubRepoConfig
  ): Promise<string | null> {
    const tools = new RepositoryTools()

    if (!tools.githubService.isGitHubAvailable()) {
      return null
    }

    if (!repoConfig) {
      const userResult = await tools.githubService.getAuthenticatedUser()
      if (!userResult.success || !userResult.user) {
        return null
      }

      const projectName = path.basename(projectPath)
      repoConfig = {
        owner: userResult.user.login,
        repo: GitHubService.generateRepoName(projectName)
      }
    }

    const repoInfo = await tools.githubService.getRepositoryInfo(repoConfig)
    return repoInfo.success && repoInfo.info ? repoInfo.info.url : null
  }
}
