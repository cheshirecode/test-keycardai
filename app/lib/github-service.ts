import { Octokit } from '@octokit/rest'
// Import fs and path conditionally for server-side only
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = typeof window === 'undefined' ? require('fs') : null
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = typeof window === 'undefined' ? require('path') : null

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
      // Check what type of owner we're dealing with (user or organization)
      const ownerTypeResult = await this.checkOwnerType(config.owner)
      if (!ownerTypeResult.success) {
        return {
          success: false,
          message: `Failed to verify owner '${config.owner}': ${ownerTypeResult.message}`
        }
      }

      const isUserAccount = ownerTypeResult.type === 'user'
      const isOrganization = ownerTypeResult.type === 'organization'

      // Debug logging (can be removed in production)
      console.log('🔍 Repository creation debug:')
      console.log('  - Target owner:', config.owner)
      console.log('  - Owner type:', ownerTypeResult.type)
      console.log('  - Is user account:', isUserAccount)
      console.log('  - Is organization:', isOrganization)
      console.log('  - Repository name:', config.repo)

      let response

      if (isUserAccount) {
        // Check if it's the authenticated user
        const userResult = await this.getAuthenticatedUser()
        if (userResult.success && userResult.user && config.owner === userResult.user.login) {
          // Create repository under authenticated user (personal repo)
          console.log('  - Creating under authenticated user account')
          response = await this.octokit.repos.createForAuthenticatedUser({
            name: config.repo,
            description: config.description || `Generated project: ${config.repo}`,
            private: config.private || false,
            auto_init: true, // Initialize with README
          })
        } else {
          return {
            success: false,
            message: `Cannot create repository under user '${config.owner}' - you can only create repositories under your own user account or organizations you have access to`
          }
        }
      } else if (isOrganization) {
        // Create repository under organization
        console.log('  - Creating under organization')
        response = await this.octokit.repos.createInOrg({
          org: config.owner,
          name: config.repo,
          description: config.description || `Generated project: ${config.repo}`,
          private: config.private || false,
          auto_init: true, // Initialize with README
        })
      } else {
        return {
          success: false,
          message: `Unknown owner type for '${config.owner}'`
        }
      }

      console.log('✅ Repository created successfully:', response.data.html_url)

      return {
        success: true,
        url: response.data.html_url,
        message: `Repository created successfully: ${response.data.html_url}`
      }
    } catch (error: unknown) {
      // Handle case where repo already exists
      const err = error as { status?: number; message?: string }
      console.error('❌ Repository creation failed:', err)

      if (err.status === 422) {
        return {
          success: false,
          message: `Repository '${config.repo}' already exists or organization access denied`
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
        message: commitMessage.replace(/\n/g, ' ').trim(),
        tree: newTree.sha,
        parents: [latestCommitSha],
        author: {
          name: (process.env.GIT_USER_NAME || 'Project Scaffolder').replace(/\n/g, ' ').trim(),
          email: (process.env.GIT_USER_EMAIL || 'scaffolder@example.com').replace(/\n/g, ' ').trim(),
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

  async getRepository(owner: string, repo: string): Promise<{ success: boolean; repository?: Record<string, unknown>; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const { data: repository } = await this.octokit.repos.get({
        owner,
        repo
      })

      return {
        success: true,
        repository,
        message: 'Repository retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get repository: ${err.message || 'Unknown error'}`
      }
    }
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<{ success: boolean; languages?: Record<string, number>; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const { data: languages } = await this.octokit.repos.listLanguages({
        owner,
        repo
      })

      return {
        success: true,
        languages,
        message: 'Languages retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get repository languages: ${err.message || 'Unknown error'}`
      }
    }
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<{ success: boolean; readme?: string; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const { data: readmeData } = await this.octokit.repos.getReadme({
        owner,
        repo
      })

      // Decode base64 content
      const readme = Buffer.from(readmeData.content, 'base64').toString('utf8')

      return {
        success: true,
        readme,
        message: 'README retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get repository README: ${err.message || 'Unknown error'}`
      }
    }
  }

  async getRepositoryTopics(owner: string, repo: string): Promise<{ success: boolean; topics?: string[]; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const { data: topicsData } = await this.octokit.repos.getAllTopics({
        owner,
        repo
      })

      return {
        success: true,
        topics: topicsData.names,
        message: 'Topics retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get repository topics: ${err.message || 'Unknown error'}`
      }
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; user?: { login: string; name?: string; email?: string }; message: string }> {
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
          name: user.name || undefined,
          email: user.email || undefined
        },
        message: 'User retrieved successfully'
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to get current user: ${err.message || 'Unknown error'}`
      }
    }
  }

  // Helper method to collect files from a directory (server-side only)
  static collectFilesFromDirectory(projectPath: string): CommitFile[] {
    // Check if we're running on the server side
    if (!fs || !path) {
      console.warn('collectFilesFromDirectory called on client side - returning empty array')
      return []
    }

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

  async checkOwnerType(owner: string): Promise<{ success: boolean; type?: 'user' | 'organization'; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      // Try to get organization info first
      try {
        await this.octokit.orgs.get({ org: owner })
        return {
          success: true,
          type: 'organization',
          message: `${owner} is a GitHub organization`
        }
      } catch (orgError: unknown) {
        const orgErr = orgError as { status?: number }

        // If org doesn't exist (404), check if it's a user
        if (orgErr.status === 404) {
          try {
            await this.octokit.users.getByUsername({ username: owner })
            return {
              success: true,
              type: 'user',
              message: `${owner} is a GitHub user account`
            }
          } catch (userError: unknown) {
            const userErr = userError as { status?: number }
            if (userErr.status === 404) {
              return {
                success: false,
                message: `GitHub account '${owner}' not found`
              }
            }
            throw userError
          }
        }
        throw orgError
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to check owner type: ${err.message || 'Unknown error'}`
      }
    }
  }

  async listRepositories(options?: {
    owner?: string;
    nameFilter?: string;
    type?: 'all' | 'public' | 'private';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
  }): Promise<{
    success: boolean;
    repositories?: Array<{
      name: string;
      full_name: string;
      url: string;
      private: boolean;
      created_at: string;
      updated_at: string;
      description: string | null;
    }>;
    message: string
  }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      let repositories: unknown[] = []

      if (options?.owner) {
        // List repositories for a specific user/organization
        const ownerTypeResult = await this.checkOwnerType(options.owner)
        if (!ownerTypeResult.success) {
          return {
            success: false,
            message: `Failed to verify owner '${options.owner}': ${ownerTypeResult.message}`
          }
        }

        if (ownerTypeResult.type === 'user') {
          const { data: repos } = await this.octokit.repos.listForUser({
            username: options.owner,
            type: (options?.type as 'all' | 'owner' | 'member') || 'all',
            sort: options?.sort || 'updated',
            direction: options?.direction || 'desc',
            per_page: 100
          })
          repositories = repos
        } else if (ownerTypeResult.type === 'organization') {
          const { data: repos } = await this.octokit.repos.listForOrg({
            org: options.owner,
            type: (options?.type as 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member') || 'all',
            sort: options?.sort || 'updated',
            direction: options?.direction || 'desc',
            per_page: 100
          })
          repositories = repos
        }
      } else {
        // List repositories for authenticated user
        const { data: repos } = await this.octokit.repos.listForAuthenticatedUser({
          type: options?.type || 'all',
          sort: options?.sort || 'updated',
          direction: options?.direction || 'desc',
          per_page: 100
        })
        repositories = repos
      }

      // Apply name filter if provided
      if (options?.nameFilter) {
        repositories = repositories.filter((repo: unknown) => {
          const r = repo as { name: string; full_name: string }
          return r.name.includes(options.nameFilter!) ||
                 r.full_name.includes(options.nameFilter!)
        })
      }

      const formattedRepos = repositories.map((repo: unknown) => {
        const r = repo as {
          name: string;
          full_name: string;
          html_url: string;
          private: boolean;
          created_at?: string | null;
          updated_at?: string | null;
          description?: string | null;
        }
        return {
          name: r.name,
          full_name: r.full_name,
          url: r.html_url,
          private: r.private,
          created_at: r.created_at || '',
          updated_at: r.updated_at || '',
          description: r.description || null
        }
      })

      return {
        success: true,
        repositories: formattedRepos,
        message: `Found ${formattedRepos.length} repositories`
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      return {
        success: false,
        message: `Failed to list repositories: ${err.message || 'Unknown error'}`
      }
    }
  }

  async deleteRepository(owner: string, repo: string): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      // Verify the repository exists and we have access to it
      const repoInfo = await this.getRepositoryInfo({ owner, repo })
      if (!repoInfo.success) {
        return {
          success: false,
          message: `Repository ${owner}/${repo} not found or access denied`
        }
      }

      // Delete the repository
      await this.octokit.repos.delete({
        owner,
        repo
      })

      return {
        success: true,
        message: `Repository ${owner}/${repo} deleted successfully`
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number }

      if (err.status === 403) {
        return {
          success: false,
          message: `Insufficient permissions to delete repository ${owner}/${repo}`
        }
      }

      if (err.status === 404) {
        return {
          success: false,
          message: `Repository ${owner}/${repo} not found`
        }
      }

      return {
        success: false,
        message: `Failed to delete repository ${owner}/${repo}: ${err.message || 'Unknown error'}`
      }
    }
  }

  async bulkDeleteRepositories(
    repositories: Array<{ owner: string; repo: string }>,
    dryRun: boolean = true
  ): Promise<{
    success: boolean;
    results: Array<{
      repository: string;
      success: boolean;
      message: string;
    }>;
    message: string
  }> {
    if (!this.isAvailable) {
      return {
        success: false,
        results: [],
        message: 'GitHub token not available'
      }
    }

    const results: Array<{
      repository: string;
      success: boolean;
      message: string;
    }> = []

    let successCount = 0
    let failureCount = 0

    for (const { owner, repo } of repositories) {
      const repoName = `${owner}/${repo}`

      if (dryRun) {
        // Dry run - just check if repository exists and we have access
        const repoInfo = await this.getRepositoryInfo({ owner, repo })
        results.push({
          repository: repoName,
          success: repoInfo.success,
          message: dryRun ? `[DRY RUN] Would delete: ${repoName}` : repoInfo.message
        })

        if (repoInfo.success) successCount++
        else failureCount++
      } else {
        // Actually delete the repository
        const deleteResult = await this.deleteRepository(owner, repo)
        results.push({
          repository: repoName,
          success: deleteResult.success,
          message: deleteResult.message
        })

        if (deleteResult.success) successCount++
        else failureCount++

        // Add a small delay between deletions to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const actionText = dryRun ? 'checked' : 'processed'
    return {
      success: failureCount === 0,
      results,
      message: `${actionText} ${repositories.length} repositories: ${successCount} successful, ${failureCount} failed`
    }
  }
}
