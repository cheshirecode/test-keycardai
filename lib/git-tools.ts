import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export class GitTools {
  static async initRepository(projectPath: string): Promise<void> {
    try {
      // Ensure the directory exists
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true })
      }

      // Check if git is available
      try {
        execSync('git --version', { stdio: 'ignore' })
      } catch {
        throw new Error('Git is not installed or not available in PATH')
      }

      execSync('git init', { cwd: projectPath, stdio: 'pipe' })

      // Create .gitignore
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
    } catch (error) {
      throw new Error(`Git init failed: ${error}`)
    }
  }

  static async addAndCommit(projectPath: string, message: string): Promise<void> {
    try {
      // Check if directory exists and is a git repository
      if (!fs.existsSync(projectPath)) {
        throw new Error(`Directory does not exist: ${projectPath}`)
      }

      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        throw new Error(`Not a git repository: ${projectPath}`)
      }

      execSync('git add .', { cwd: projectPath, stdio: 'pipe' })
      execSync(`git commit -m "${message}"`, { cwd: projectPath, stdio: 'pipe' })
    } catch (error) {
      throw new Error(`Git commit failed: ${error}`)
    }
  }

  static async getStatus(projectPath: string): Promise<string> {
    try {
      return execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf8' })
    } catch {
      return 'Not a git repository'
    }
  }

  static async createBranch(projectPath: string, branchName: string): Promise<void> {
    try {
      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        throw new Error(`Not a git repository: ${projectPath}`)
      }

      execSync(`git checkout -b ${branchName}`, { cwd: projectPath, stdio: 'pipe' })
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`)
    }
  }

  static async setRemoteOrigin(projectPath: string, remoteUrl: string): Promise<void> {
    try {
      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        throw new Error(`Not a git repository: ${projectPath}`)
      }

      // Check if remote already exists
      try {
        execSync('git remote get-url origin', { cwd: projectPath, stdio: 'pipe' })
        // Remote exists, update it
        execSync(`git remote set-url origin ${remoteUrl}`, { cwd: projectPath, stdio: 'pipe' })
      } catch {
        // Remote doesn't exist, add it
        execSync(`git remote add origin ${remoteUrl}`, { cwd: projectPath, stdio: 'pipe' })
      }
    } catch (error) {
      throw new Error(`Failed to set remote origin: ${error}`)
    }
  }

  static async configureUser(projectPath: string, name: string, email: string): Promise<void> {
    try {
      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        throw new Error(`Not a git repository: ${projectPath}`)
      }

      execSync(`git config user.name "${name}"`, { cwd: projectPath, stdio: 'pipe' })
      execSync(`git config user.email "${email}"`, { cwd: projectPath, stdio: 'pipe' })
    } catch (error) {
      throw new Error(`Failed to configure git user: ${error}`)
    }
  }

  static async getCommitHistory(projectPath: string, limit: number = 10): Promise<string> {
    try {
      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        return 'Not a git repository'
      }

      return execSync(`git log --oneline -${limit}`, {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: 'pipe'
      })
    } catch {
      return 'No commits found'
    }
  }
}
