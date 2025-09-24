/**
 * MCP (Model Context Protocol) Types for Server-Side Operations
 * 
 * These types are used primarily by:
 * - API routes
 * - Server-side operations
 * - MCP protocol implementations
 */

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

// Server-side MCP types (may overlap with api.ts but used in different contexts)
export interface MCPServerRequest {
  method: string
  params: Record<string, unknown>
  id: string | number
}

export interface MCPServerResponse {
  result?: unknown
  error?: MCPServerError
  id: string | number
}

export interface MCPServerError {
  code: number
  message: string
  data?: unknown
}
