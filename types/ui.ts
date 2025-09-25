/**
 * UI and Frontend Types for Client-Side Operations
 *
 * These types are used primarily by:
 * - React components
 * - Client-side hooks and utilities
 * - Frontend state management
 */

// Import MCPLogEntry from mcp types to avoid duplication
import type { MCPLogEntry } from './mcp'

// Chat and messaging types for frontend
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chainOfThought?: string  // AI reasoning/chain of thought
  mcpLogs?: MCPLogEntry[]  // MCP server logs for debugging
}
