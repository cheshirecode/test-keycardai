/**
 * Service Types
 * Centralized type definitions for external services and APIs
 */

// GitHub Service Types
export interface GitHubRepoConfig {
  owner: string
  repo: string
  branch?: string
}

export interface CommitFile {
  path: string
  content: string
}

// Logger Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix?: string
}

export interface LogData {
  message: string
  level: LogLevel
  timestamp?: string
  context?: Record<string, unknown>
}

export interface LogResponse {
  status: 'success' | 'error'
  message: string
}

// Error Handler Types
export enum ErrorLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  sessionId?: string
  userAgent?: string
  path?: string
  method?: string
  timestamp?: string
  additionalData?: Record<string, unknown>
}

// Result Types
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// AI Request Store Types
export interface PendingAIRequest {
  projectId: string
  projectName: string
  requestDescription: string
  timestamp: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
