/**
 * Git Operations Types
 * Type definitions for Git repository management
 */

import { MCPBaseResult } from './base-types'

// Git Operation Parameters
export interface GitPathParams {
  path: string
}

export interface GitCommitParams {
  path: string
  message: string
}

export interface GitConfigureUserParams {
  path: string
  name?: string
  email?: string
}

export interface GitLogParams {
  path: string
  limit?: number
}

// Git Operation Results
export interface GitOperationResult extends MCPBaseResult {
  output?: string
  error?: string
}

export interface GitCommitsResult extends MCPBaseResult {
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

// Git Operations Interface
export interface GitOperations {
  git_log: (params: GitLogParams) => Promise<GitCommitsResult>
}
