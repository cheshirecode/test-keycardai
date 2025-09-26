/**
 * GitHub API Types
 * Type definitions for GitHub API responses and requests
 */

// Base API Response Structure
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message: string
}

// Authentication Types
export interface AuthResult extends APIResponse<UserData> {
  user?: UserData
}

export interface UserData {
  login: string
  name: string | null
  email: string | null
  id: number
  avatar_url: string
  type: 'User' | 'Organization'
}

// Owner Type Detection
export interface OwnerTypeResult extends APIResponse {
  type?: 'user' | 'organization'
}

// Repository Types
export interface GitHubRepoConfig {
  owner: string
  repo: string
  description?: string
  private?: boolean
}

export interface RepositoryData {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  default_branch: string
  language: string | null
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
}

export interface RepositoryResult extends APIResponse<RepositoryData> {
  repository?: RepositoryData
}

export interface RepositoryInfoResult extends APIResponse {
  info?: {
    name: string
    url: string
    description: string | null
    private: boolean
    defaultBranch: string
  }
}

export interface RepositoryListResult extends APIResponse<RepositoryData[]> {
  repositories?: RepositoryData[]
  totalCount?: number
}

// Repository Operations
export interface CreateRepositoryResult extends APIResponse {
  url?: string
}

export interface DeleteResult extends APIResponse {
  deletedAt?: string
}

export interface BulkDeleteResult extends APIResponse {
  results?: Array<{
    owner: string
    repo: string
    success: boolean
    message: string
  }>
  summary?: {
    total: number
    successful: number
    failed: number
  }
}

// Content Types
export interface CommitFile {
  path: string
  content: string
}

export interface CommitResult extends APIResponse {
  commitSha?: string
  commitUrl?: string
}

export interface ContentResult<T = unknown> extends APIResponse<T> {
  content?: T
}

// List Options
export interface ListRepositoryOptions {
  owner?: string
  type?: 'all' | 'owner' | 'public' | 'private' | 'member'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
  nameFilter?: string
}

// Access Validation
export interface AccessResult extends APIResponse {
  hasAccess?: boolean
  permission?: 'read' | 'write' | 'admin'
}

// Error Context
export interface ErrorContext {
  operation: string
  endpoint?: string
  parameters?: Record<string, unknown>
  timestamp: string
  retryCount?: number
}

// Request Options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
}

// Repository Identifier
export interface RepoIdentifier {
  owner: string
  repo: string
}
