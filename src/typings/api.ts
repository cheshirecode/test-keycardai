/**
 * API Client Types for Frontend API Communication
 * 
 * These types are used by frontend components when communicating with APIs
 */

export interface MCPRequest {
  method: string
  params: Record<string, unknown>
  id: string | number
}

export interface MCPResponse {
  result?: unknown
  error?: MCPError
  id: string | number
}

export interface MCPError {
  code: number
  message: string
  data?: unknown
}
