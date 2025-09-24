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

// Project-specific types
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  files: Record<string, string>
  dependencies: string[]
  devDependencies: string[]
}

export interface ProjectInfo {
  name: string
  path: string
  template: string
  status: 'creating' | 'completed' | 'error'
  repositoryUrl?: string  // Actual GitHub repository URL from creation
}

export interface MCPLogEntry {
  timestamp: string
  type: 'request' | 'response' | 'error' | 'info'
  tool?: string
  message: string
  data?: unknown
  duration?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chainOfThought?: string  // AI reasoning/chain of thought
  mcpLogs?: MCPLogEntry[]  // MCP server logs for debugging
}
