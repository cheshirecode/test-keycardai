/**
 * Service Types
 * Type definitions for GitHub service interfaces and configurations
 */

import type { 
  APIResponse, 
  AuthResult, 
  OwnerTypeResult, 
  AccessResult,
  RepositoryResult,
  RepositoryInfoResult,
  RepositoryListResult,
  CreateRepositoryResult,
  DeleteResult,
  BulkDeleteResult,
  CommitResult,
  ContentResult,
  GitHubRepoConfig,
  CommitFile,
  ListRepositoryOptions,
  RepoIdentifier,
  ErrorContext,
  RequestOptions
} from './GitHubAPITypes'

// Service Configuration
export interface GitHubServiceConfig {
  token?: string
  baseURL?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

// API Client Interface
export interface IGitHubAPIClient {
  isClientAvailable(): boolean
  request<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>>
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<APIResponse<T>>
  post<T>(endpoint: string, data?: unknown): Promise<APIResponse<T>>
  put<T>(endpoint: string, data?: unknown): Promise<APIResponse<T>>
  delete<T>(endpoint: string): Promise<APIResponse<T>>
}

// Authentication Service Interface
export interface IGitHubAuthService {
  validateToken(): Promise<AuthResult>
  getAuthenticatedUser(): Promise<AuthResult>
  checkOwnerType(owner: string): Promise<OwnerTypeResult>
  validateRepositoryAccess(owner: string, repo: string): Promise<AccessResult>
}

// Repository Service Interface
export interface IRepositoryService {
  createRepository(config: GitHubRepoConfig): Promise<CreateRepositoryResult>
  deleteRepository(owner: string, repo: string): Promise<DeleteResult>
  bulkDeleteRepositories(
    repositories: RepoIdentifier[], 
    options?: { dryRun?: boolean; onProgress?: (progress: BulkDeleteProgress) => void }
  ): Promise<BulkDeleteResult>
  getRepository(owner: string, repo: string): Promise<RepositoryResult>
  getRepositoryInfo(config: GitHubRepoConfig): Promise<RepositoryInfoResult>
  listRepositories(options?: ListRepositoryOptions): Promise<RepositoryListResult>
}

// User Service Interface
export interface IUserService {
  getCurrentUser(): Promise<AuthResult>
  getUser(username: string): Promise<AuthResult>
  checkUserExists(username: string): Promise<APIResponse<boolean>>
  getOrganization(orgName: string): Promise<AuthResult>
  checkOrganizationExists(orgName: string): Promise<APIResponse<boolean>>
}

// Content Service Interface
export interface IContentService {
  commitFiles(
    config: GitHubRepoConfig, 
    files: CommitFile[], 
    commitMessage: string
  ): Promise<CommitResult>
  getRepositoryLanguages(owner: string, repo: string): Promise<ContentResult<Record<string, number>>>
  getRepositoryReadme(owner: string, repo: string): Promise<ContentResult<string>>
  getRepositoryTopics(owner: string, repo: string): Promise<ContentResult<string[]>>
}

// File Service Interface
export interface IFileService {
  collectFilesFromDirectory(projectPath: string): Promise<CommitFile[]>
  validatePath(path: string): boolean
  getFileExtension(filename: string): string
  shouldIncludeFile(filename: string, relativePath: string): boolean
}

// Error Handler Interface
export interface IGitHubErrorHandler {
  handleAPIError(error: unknown, operation: string): APIResponse
  isRetryableError(error: unknown): boolean
  formatErrorMessage(error: unknown): string
  logError(error: unknown, context: ErrorContext): void
}

// Progress Tracking
export interface BulkDeleteProgress {
  total: number
  completed: number
  successful: number
  failed: number
  current?: {
    owner: string
    repo: string
  }
}

// Request Options (re-export from GitHubAPITypes)
export type { RequestOptions } from './GitHubAPITypes'

// Service Dependencies
export interface ServiceDependencies {
  apiClient: IGitHubAPIClient
  authService?: IGitHubAuthService
  errorHandler?: IGitHubErrorHandler
}

// Main GitHub Service Interface
export interface IGitHubService extends IRepositoryService, IUserService, IContentService {
  // Core availability check
  isGitHubAvailable(): boolean
  
  // File operations
  collectFilesFromDirectory(projectPath: string): Promise<CommitFile[]>
  
  // Legacy method compatibility
  getAuthenticatedUser(): Promise<AuthResult>
  checkOwnerType(owner: string): Promise<OwnerTypeResult>
}
