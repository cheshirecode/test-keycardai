/**
 * MCP (Model Context Protocol) Types for API and Server-Side Operations
 * 
 * These types are used primarily by:
 * - API routes (/app/api/*)
 * - Server-side operations
 * - MCP protocol implementations
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

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

// Project template types for server-side operations
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  files: Record<string, string>
  dependencies: string[]
  devDependencies: string[]
}

// Project information for API responses
export interface ProjectInfo {
  name: string
  path: string
  template: string
  status: 'creating' | 'completed' | 'error'
  repositoryUrl?: string  // Actual GitHub repository URL from creation
}
