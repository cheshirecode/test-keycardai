/**
 * Repository Operations Types
 * Type definitions for GitHub repository management
 */

import { MCPBaseResult } from './base-types'

// Repository Operation Parameters
export interface ListRepositoriesParams {
  owner?: string
  nameFilter?: string
  type?: 'all' | 'public' | 'private'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
}

export interface DeleteRepositoryParams {
  owner: string
  repo: string
}

export interface GetRepositoryParams {
  owner: string
  repo: string
}

export interface CheckOwnerTypeParams {
  owner: string
}

export interface CreateGitHubBranchParams {
  projectPath: string
  projectName?: string
  repositoryUrl?: string
}

// Repository Data Types
export interface RepositoryData {
  id: string
  name: string
  fullName: string
  url: string
  description: string | null
  private: boolean
  createdAt: string
  updatedAt: string
  isScaffoldedProject: boolean
}

export interface GitHubUser {
  login: string
  id: number
  type: string
  name?: string
  email?: string
}

// Repository Operation Results
export interface MCPRepositoryResult extends MCPBaseResult {
  repositories?: RepositoryData[]
  owner?: string
  total?: number
}

export type DeleteRepositoryResult = MCPBaseResult

export interface GetRepositoryResult extends MCPBaseResult {
  repository?: RepositoryData
}

export interface GitHubUserResult extends MCPBaseResult {
  user?: GitHubUser
}

export interface GitHubOwnerResult extends MCPBaseResult {
  type?: string
  owner?: string
}

export interface GitHubBranchResult extends MCPBaseResult {
  branchUrl?: string
  repositoryUrl?: string
}

export interface GitHubCommitsResult extends MCPBaseResult {
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
}

// Repository Operations Interface
export interface RepositoryOperations {
  list_repositories: (params: ListRepositoriesParams) => Promise<MCPRepositoryResult>
  delete_repository: (params: DeleteRepositoryParams) => Promise<DeleteRepositoryResult>
  get_repository: (params: GetRepositoryParams) => Promise<GetRepositoryResult>
  validate_repository_permissions: (params: { owner: string }) => Promise<{
    success: boolean
    message: string
    canDelete: boolean
    githubOwner?: string
    authenticatedUser?: string
  }>
  github_get_commits: (params: { owner: string; repo: string; limit?: number }) => Promise<GitHubCommitsResult>
}
