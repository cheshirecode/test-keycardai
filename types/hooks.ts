/**
 * Hook Types
 * Centralized type definitions for custom React hooks
 */

import { Repository, ProjectInfo, MCPLogEntry } from './index'

// Chat Hook Types
export interface UseChatMessagesProps {
  isRepositoryMode: boolean
  rawCommits: Array<{
    hash: string
    author: string
    timestamp: number
    subject: string
    body?: string
    message?: string
  }>
}

// Repository Hook Types
export interface RepositoryDetailsData {
  languages?: Record<string, number>
  languagesPercentages?: Record<string, number>
  size?: number
  stargazersCount?: number
  forksCount?: number
  openIssuesCount?: number
  defaultBranch?: string
  pushedAt?: string
  topics?: string[]
}

export interface RepositoryDetailsResponse {
  success: boolean
  data?: RepositoryDetailsData
  message?: string
}

export interface GitHubUserResponse {
  success: boolean
  user?: {
    login: string
    name: string
    email: string
    type: string
  }
  message?: string
}

export interface Commit {
  hash: string
  author: string
  email: string
  timestamp: number
  message: string
  subject: string
  body: string
}

export interface CommitsResponse {
  success: boolean
  commits: Commit[]
  message?: string
}

export interface RepositoryResponse {
  success: boolean
  repository?: Repository
  message?: string
}

export interface RepositoriesResponse {
  success: boolean
  repositories: Repository[]
  message?: string
}

// Health Hook Types
export interface HealthResponse {
  status: string
  services?: {
    database: 'healthy' | 'unhealthy'
    redis: 'healthy' | 'unhealthy'
    external_api: 'healthy' | 'unhealthy'
  }
  timestamp: string
  uptime: number
}

// Command Hook Types
export interface CommandResult {
  success: boolean
  message: string
  chainOfThought?: string
  mcpLogs?: MCPLogEntry[]
}

export interface CommandContext {
  addMessage: (role: 'user' | 'assistant', content: string, chainOfThought?: string, mcpLogs?: MCPLogEntry[]) => void
  isMounted: { current: boolean }
}

export interface CreateProjectParams {
  content: string
  setCurrentProject: (project: ProjectInfo | null) => void
  setNewlyCreatedRepository: (repoName: string) => void
  refreshRepositories: () => void
  navigateToRepository: (repo: Repository) => void
  invalidateRepositoriesCache: () => void
  isCreatingNewProject: boolean
  setIsCreatingNewProject: (creating: boolean) => void
  fastMode?: boolean
}

export interface ModifyProjectParams {
  content: string
  project: ProjectInfo
}

export interface ModifyRepositoryParams {
  content: string
  repository: Repository
  refreshRepositories: () => void
  invalidateRepositoriesCache: () => void
}

// Request Classification Types
export type RequestType = 'new_project' | 'repository_modification' | 'project_modification'

export interface ClassificationResult {
  type: RequestType
  confidence: number
  reasoning?: string
}

// Path Utilities Types
export interface PathValidationResult {
  isValid: boolean
  normalizedPath: string
  error?: string
}
