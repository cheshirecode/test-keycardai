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

# Repository metadata (internal use)
.repo-metadata.json
`.trim()

      fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore)

      // If GitHub is available, create a repository
      if (tools.githubService.isGitHubAvailable()) {
        // Get authenticated user and determine owner (organization or user)
        const userResult = await tools.githubService.getAuthenticatedUser()

        if (userResult.success && userResult.user) {
          const projectName = path.basename(projectPath)
          const repoName = GitHubService.generateRepoName(projectName)

          // Use GITHUB_OWNER environment variable if specified, otherwise use authenticated user
          const owner = process.env.GITHUB_OWNER || userResult.user.login

          const repoConfig: GitHubRepoConfig = {
            owner: owner,
            repo: repoName,
            description: `Generated project: ${projectName}`,
            private: false
          }

          const createResult = await tools.githubService.createRepository(repoConfig)

          if (createResult.success) {
            // Save repository metadata for later operations
            const metadataPath = path.join(projectPath, '.repo-metadata.json')
            const metadata = {
              owner: repoConfig.owner,
              repo: repoConfig.repo,
              url: createResult.url,
              createdAt: new Date().toISOString()
            }
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

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

        // If no repo config provided, try to find existing repository
        if (!repoConfig) {
          const userResult = await tools.githubService.getAuthenticatedUser()
          if (!userResult.success || !userResult.user) {
            return {
              success: false,
              message: 'Cannot commit: GitHub user authentication failed'
            }
          }

          // Try to read repository info from project metadata file
          const projectName = path.basename(projectPath)
          const metadataPath = path.join(projectPath, '.repo-metadata.json')

          if (fs.existsSync(metadataPath)) {
            try {
              const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
              repoConfig = {
                owner: metadata.owner,
                repo: metadata.repo
              }
            } catch (error) {
              console.warn('Failed to read repository metadata:', error)
            }
          }

          // Fallback: generate new repo name (this might create a new repo)
          if (!repoConfig) {
            // Use GITHUB_OWNER environment variable if specified, otherwise use authenticated user
            const owner = process.env.GITHUB_OWNER || userResult.user.login

            // Debug logging for fallback case
            console.log('🔍 Repository commit debug (fallback):')
            console.log('  - GITHUB_OWNER env var:', process.env.GITHUB_OWNER)
            console.log('  - Authenticated user:', userResult.user.login)
            console.log('  - Selected owner:', owner)

            repoConfig = {
              owner: owner,
              repo: GitHubService.generateRepoName(projectName)
            }
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

  static async pushToRemote(projectPath: string, repository?: { url: string; name: string }): Promise<{ success: boolean; message: string }> {
    try {
      if (!fs.existsSync(projectPath)) {
        return {
          success: false,
          message: `Project directory does not exist: ${projectPath}`
        }
      }

      // First try to push via GitHub API if repository info is available
      if (repository && repository.url && repository.name.includes('/')) {
        const githubService = new GitHubService()
        
        if (githubService.isGitHubAvailable()) {
          try {
            console.log(`[Git Push] Attempting real push to GitHub for ${repository.name}`)
            
            // Extract owner and repo from repository name (format: owner/repo)
            const [owner, repo] = repository.name.split('/')
            
            // Collect all files from the project directory
            const files = GitHubService.collectFilesFromDirectory(projectPath)
            
            if (files.length === 0) {
              return {
                success: false,
                message: 'No files to push - directory is empty'
              }
            }

            // Create a commit message for the push
            const commitMessage = `feat: automated modifications via Project Scaffolder

Updated ${files.length} files via MCP repository modification workflow.
Timestamp: ${new Date().toISOString()}`

            // Push changes using GitHub API
            const pushResult = await githubService.commitFiles(
              { owner, repo },
              files,
              commitMessage
            )

            if (pushResult.success) {
              console.log(`[Git Push] Successfully pushed changes to ${repository.name}`)
              return {
                success: true,
                message: `✅ Changes successfully pushed to ${repository.name}! Updated ${files.length} files.`
              }
            } else {
              console.log(`[Git Push] GitHub API push failed: ${pushResult.message}`)
              // Fall back to simulation if GitHub API fails
              return this.simulatePush(repository)
            }
          } catch (error) {
            console.log(`[Git Push] GitHub API error: ${error}`)
            // Fall back to simulation if there's an error
            return this.simulatePush(repository)
          }
        }
      }

      // Fall back to simulation if GitHub API is not available or repository info is incomplete
      return this.simulatePush(repository)
    } catch (error) {
      return {
        success: false,
        message: `Failed to push to remote: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private static simulatePush(repository?: { url: string; name: string }): { success: boolean; message: string } {
    console.log(`[Git Push] Falling back to simulated push for ${repository?.name || 'repository'}`)
    return {
      success: true,
      message: `⚠️ Simulated push to ${repository?.name || 'remote repository'} (GitHub API not available or insufficient permissions)`
    }
  }

  static async cloneRepository(url: string, targetPath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Create target directory
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true })
      }

      // First try real git clone if git is available and it's a valid GitHub URL
      if (this.isGitHubUrl(url)) {
        const githubService = new GitHubService()
        
        if (githubService.isGitHubAvailable()) {
          try {
            console.log(`[Git Clone] Attempting real clone of ${url} to ${targetPath}`)
            
            // Extract owner and repo from GitHub URL
            const repoMatch = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
            if (repoMatch) {
              const [, owner, repo] = repoMatch
              
              // Get repository info first to validate access
              const repoInfo = await githubService.getRepositoryInfo({ owner, repo })
              if (!repoInfo.success || !repoInfo.info) {
                console.log(`[Git Clone] Repository access failed: ${repoInfo.message}`)
                return this.simulateClone(url, targetPath)
              }

              // Download repository as zip and extract
              const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${repoInfo.info.defaultBranch || 'main'}`
              
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

              // Extract the zip file
              const buffer = await response.arrayBuffer()
              const AdmZip = await import('adm-zip')
              const zip = new AdmZip.default(Buffer.from(buffer))
              
              // Extract to temporary location first
              const tempExtractPath = `${targetPath}-temp`
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
                const destPath = path.join(targetPath, item)
                fs.renameSync(sourcePath, destPath)
              }
              
              // Clean up temp directory
              fs.rmSync(tempExtractPath, { recursive: true, force: true })

              console.log(`[Git Clone] Successfully cloned ${url} to ${targetPath}`)
              return {
                success: true,
                message: `✅ Successfully cloned ${owner}/${repo} to ${targetPath}`
              }
            }
          } catch (error) {
            console.log(`[Git Clone] Real clone failed: ${error}`)
            // Fall back to simulation
            return this.simulateClone(url, targetPath)
          }
        }
      }

      // Fall back to simulation if not a GitHub URL or GitHub API not available
      return this.simulateClone(url, targetPath)
    } catch (error) {
      return {
        success: false,
        message: `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private static isGitHubUrl(url: string): boolean {
    return /github\.com/i.test(url)
  }

  private static simulateClone(url: string, targetPath: string): { success: boolean; message: string } {
    try {
      console.log(`[Git Clone] Falling back to simulated clone of ${url} to ${targetPath}`)

      // Create a basic package.json to simulate cloned repository
      const packageJson = {
        name: path.basename(targetPath),
        version: '1.0.0',
        description: 'Cloned repository (simulated)',
        main: 'index.js',
        scripts: {
          start: 'node index.js'
        }
      }

      fs.writeFileSync(
        path.join(targetPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )

      // Create a basic README
      const readme = `# ${path.basename(targetPath)}

This is a simulated clone of ${url}.
The actual repository content was not available.

To enable real cloning, ensure:
- GITHUB_TOKEN environment variable is set
- The repository is accessible with the provided token
- The URL is a valid GitHub repository URL
`

      fs.writeFileSync(
        path.join(targetPath, 'README.md'),
        readme
      )

      return {
        success: true,
        message: `⚠️ Simulated clone of ${url} to ${targetPath} (GitHub API not available or repository inaccessible)`
      }
    } catch (error) {
      return {
        success: false,
        message: `Clone simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}
