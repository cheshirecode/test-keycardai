/**
 * GitHub Services - Main Export
 * Service composition and unified GitHub service interface
 */

// Core services
import { GitHubAPIClient } from './core/GitHubAPIClient'
import { GitHubAuthService } from './core/GitHubAuthService'
import { GitHubErrorHandler } from './core/GitHubErrorHandler'

// Domain services
import { RepositoryService } from './services/RepositoryService'
import { UserService } from './services/UserService'
import { ContentService } from './services/ContentService'
import { FileService } from './services/FileService'

// Types
import type {
  IGitHubService,
  GitHubServiceConfig,
  GitHubRepoConfig,
  CommitFile,
  CreateRepositoryResult,
  DeleteResult,
  BulkDeleteResult,
  RepositoryResult,
  RepositoryInfoResult,
  RepositoryListResult,
  AuthResult,
  OwnerTypeResult,
  CommitResult,
  ContentResult,
  ListRepositoryOptions,
  RepoIdentifier,
  BulkDeleteProgress
} from '@/types/github'

/**
 * Main GitHub Service - Orchestrates all GitHub operations
 * This replaces the original 777-line GitHubService class
 */
export class GitHubService implements IGitHubService {
  private apiClient: GitHubAPIClient
  private authService: GitHubAuthService
  private errorHandler: GitHubErrorHandler
  private repositoryService: RepositoryService
  private userService: UserService
  private contentService: ContentService
  private fileService: FileService

  constructor(config: GitHubServiceConfig = {}) {
    // Initialize core services
    this.apiClient = new GitHubAPIClient(config)
    this.authService = new GitHubAuthService(this.apiClient)
    this.errorHandler = new GitHubErrorHandler()

    // Initialize domain services
    this.repositoryService = new RepositoryService(this.apiClient, this.authService, this.errorHandler)
    this.userService = new UserService(this.apiClient, this.authService, this.errorHandler)
    this.contentService = new ContentService(this.apiClient, this.authService, this.errorHandler)
    this.fileService = new FileService()
  }

  // ============================================================================
  // Core Availability & Authentication
  // ============================================================================

  /**
   * Check if GitHub API is available (has valid token)
   */
  isGitHubAvailable(): boolean {
    return this.apiClient.isClientAvailable()
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser(): Promise<AuthResult> {
    return this.authService.getAuthenticatedUser()
  }

  /**
   * Check if owner is a user or organization
   */
  async checkOwnerType(owner: string): Promise<OwnerTypeResult> {
    return this.authService.checkOwnerType(owner)
  }

  // ============================================================================
  // Repository Operations (Delegated to RepositoryService)
  // ============================================================================

  /**
   * Create a new GitHub repository
   */
  async createRepository(config: GitHubRepoConfig): Promise<CreateRepositoryResult> {
    return this.repositoryService.createRepository(config)
  }

  /**
   * Delete a GitHub repository
   */
  async deleteRepository(owner: string, repo: string): Promise<DeleteResult> {
    return this.repositoryService.deleteRepository(owner, repo)
  }

  /**
   * Bulk delete multiple repositories
   */
  async bulkDeleteRepositories(
    repositories: RepoIdentifier[],
    options?: {
      dryRun?: boolean
      onProgress?: (progress: BulkDeleteProgress) => void
    }
  ): Promise<BulkDeleteResult> {
    return this.repositoryService.bulkDeleteRepositories(repositories, options)
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryResult> {
    return this.repositoryService.getRepository(owner, repo)
  }

  /**
   * Get basic repository information
   */
  async getRepositoryInfo(config: GitHubRepoConfig): Promise<RepositoryInfoResult> {
    return this.repositoryService.getRepositoryInfo(config)
  }

  /**
   * List repositories with filtering options
   */
  async listRepositories(options?: ListRepositoryOptions): Promise<RepositoryListResult> {
    return this.repositoryService.listRepositories(options)
  }

  // ============================================================================
  // User Operations (Delegated to UserService)
  // ============================================================================

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResult> {
    return this.userService.getCurrentUser()
  }

  /**
   * Get user information by username
   */
  async getUser(username: string): Promise<AuthResult> {
    return this.userService.getUser(username)
  }

  /**
   * Check if a user exists
   */
  async checkUserExists(username: string): Promise<{ success: boolean; data?: boolean; message: string }> {
    return this.userService.checkUserExists(username)
  }

  /**
   * Get organization information
   */
  async getOrganization(orgName: string): Promise<AuthResult> {
    return this.userService.getOrganization(orgName)
  }

  /**
   * Check if an organization exists
   */
  async checkOrganizationExists(orgName: string): Promise<{ success: boolean; data?: boolean; message: string }> {
    return this.userService.checkOrganizationExists(orgName)
  }

  // ============================================================================
  // Content Operations (Delegated to ContentService)
  // ============================================================================

  /**
   * Commit files to a repository
   */
  async commitFiles(
    config: GitHubRepoConfig,
    files: CommitFile[],
    commitMessage: string
  ): Promise<CommitResult> {
    return this.contentService.commitFiles(config, files, commitMessage)
  }

  /**
   * Get repository programming languages
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<ContentResult<Record<string, number>>> {
    return this.contentService.getRepositoryLanguages(owner, repo)
  }

  /**
   * Get repository README content
   */
  async getRepositoryReadme(owner: string, repo: string): Promise<ContentResult<string>> {
    return this.contentService.getRepositoryReadme(owner, repo)
  }

  /**
   * Get repository topics
   */
  async getRepositoryTopics(owner: string, repo: string): Promise<ContentResult<string[]>> {
    return this.contentService.getRepositoryTopics(owner, repo)
  }

  // ============================================================================
  // File Operations (Delegated to FileService)
  // ============================================================================

  /**
   * Collect files from a directory for committing to GitHub
   */
  async collectFilesFromDirectory(projectPath: string): Promise<CommitFile[]> {
    return this.fileService.collectFilesFromDirectory(projectPath)
  }

  // ============================================================================
  // Service Management
  // ============================================================================

  /**
   * Clear all service caches
   */
  clearCaches(): void {
    this.authService.clearCache()
  }

  /**
   * Get service health status
   */
  getServiceStatus(): {
    apiClient: boolean
    authService: boolean
    repositoryService: boolean
    userService: boolean
    contentService: boolean
    fileService: boolean
  } {
    return {
      apiClient: this.apiClient.isClientAvailable(),
      authService: true, // AuthService doesn't have a separate health check
      repositoryService: true,
      userService: true,
      contentService: true,
      fileService: true
    }
  }
}

// Export individual services for advanced usage
export {
  GitHubAPIClient,
  GitHubAuthService,
  GitHubErrorHandler,
  RepositoryService,
  UserService,
  ContentService,
  FileService
}

// Export types
export * from '@/types/github'

// Default export is the main service
export default GitHubService
