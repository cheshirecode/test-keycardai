/**
 * Base MCP Types
 * Shared/common types used across multiple MCP domains
 */

/**
 * Base result interface for all MCP operations
 */
export interface MCPBaseResult {
  success: boolean
  message: string
}

/**
 * Validation result for MCP operations
 */
export interface MCPValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Base parameters that include project path
 */
export interface MCPProjectPathParams {
  projectPath: string
}

/**
 * Enhanced MCP Request with type safety
 */
export interface TypedMCPRequest<K extends string = string> {
  method: K
  params: unknown
  id: string | number
}

/**
 * Enhanced MCP Response with type safety
 */
export interface TypedMCPResponse<T = unknown> {
  result?: T
  error?: {
    code: number
    message: string
    data?: unknown
  }
  id: string | number
}
