/**
 * Service Types
 * Centralized type definitions for external services and APIs
 */

// Re-export GitHub types from centralized location
export type { GitHubRepoConfig, CommitFile } from './github'

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

// Re-export ErrorContext from GitHub types (more comprehensive)
export type { ErrorContext } from './github'

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
