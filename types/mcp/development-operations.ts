/**
 * Development Operations Types
 * Type definitions for development tools and process management
 */

import { MCPBaseResult, MCPProjectPathParams } from './base-types'

// Development Operation Parameters
export interface RunScriptParams extends MCPProjectPathParams {
  script: string
  args?: string[]
}

export interface GenerateCodeParams extends MCPProjectPathParams {
  type: 'component' | 'page' | 'hook' | 'utility' | 'test' | 'config'
  name: string
  template?: string
  props?: Record<string, unknown>
}

export interface CleanupProcessesParams {
  projectPath?: string
  ports?: number[]
  killNodeProcesses?: boolean
  cleanBuildArtifacts?: boolean
}

// Development Operation Results
export interface DevelopmentResult extends MCPBaseResult {
  output?: string
  error?: string
}

export interface ProcessCleanupResult extends MCPBaseResult {
  killedProcesses?: Array<{
    pid: number
    command: string
    port: number
  }>
  clearedPaths?: string[]
  error?: string
}

// Development Operations Interface
export interface DevelopmentOperations {
  run_script: (params: RunScriptParams) => Promise<DevelopmentResult>
  cleanup_processes: (params: CleanupProcessesParams) => Promise<ProcessCleanupResult>
  safe_cleanup: (params?: { projectPath?: string }) => Promise<ProcessCleanupResult>
  generate_code: (params: GenerateCodeParams) => Promise<DevelopmentResult>
}
