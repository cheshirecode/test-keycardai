/**
 * UI and Frontend Types for Client-Side Operations
 * 
 * These types are used primarily by:
 * - React components (/src/components/*)
 * - Client-side hooks and utilities
 * - Frontend state management
 */

// Chat and messaging types for frontend
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chainOfThought?: string  // AI reasoning/chain of thought
  mcpLogs?: MCPLogEntry[]  // MCP server logs for debugging
}

export interface MCPLogEntry {
  timestamp: string
  type: 'request' | 'response' | 'error' | 'info'
  tool?: string
  message: string
  data?: unknown
  duration?: number
}

// Project information for frontend display
export interface ProjectInfo {
  name: string
  path: string
  template: string
  status: 'creating' | 'completed' | 'error'
  repositoryUrl?: string  // Actual GitHub repository URL from creation
}

// Project template for frontend selection
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  files: Record<string, string>
  dependencies: string[]
  devDependencies: string[]
}
