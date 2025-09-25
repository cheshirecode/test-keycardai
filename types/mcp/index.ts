/**
 * MCP Types - Unified Export
 * Centralized exports for all MCP-related types
 */

// Base types
export * from './base-types'

// Domain-specific operations
export * from './ai-operations'
export * from './file-operations'
export * from './package-operations'
export * from './git-operations'
export * from './repository-operations'
export * from './development-operations'

// Import individual operation interfaces
import { AIOperations } from './ai-operations'
import { FileOperations } from './file-operations'
import { PackageOperations } from './package-operations'
import { GitOperations } from './git-operations'
import { RepositoryOperations } from './repository-operations'
import { DevelopmentOperations } from './development-operations'

/**
 * Complete typed interface for all MCP tools
 * Combines all domain-specific operations into a single interface
 */
export interface MCPTools extends 
  AIOperations,
  FileOperations,
  PackageOperations,
  GitOperations,
  RepositoryOperations,
  DevelopmentOperations {}

/**
 * Type-safe parameter extraction for MCP tools
 */
export type MCPToolParams<K extends keyof MCPTools> = Parameters<MCPTools[K]>[0]

/**
 * Type-safe return type extraction for MCP tools
 */
export type MCPToolResult<K extends keyof MCPTools> = Awaited<ReturnType<MCPTools[K]>>

/**
 * Union type of all valid MCP tool names
 */
export type MCPToolName = keyof MCPTools

/**
 * Type guard to check if a string is a valid MCP tool name
 */
export function isValidMCPTool(tool: string): tool is Extract<MCPToolName, string> {
  const validTools: string[] = [
    // AI Operations
    'analyze_project_request',
    'generate_project_plan',
    'intelligent_project_setup',
    'create_project_with_ai',
    'analyze_and_optimize',
    'analyze_existing_project',
    'generate_modification_plan',
    
    // File Operations
    'read_file',
    'update_file',
    'delete_file',
    'search_files',
    
    // Package Operations
    'add_packages',
    'remove_packages',
    'update_packages',
    
    // Git Operations
    'git_log',
    
    // Repository Operations
    'list_repositories',
    'delete_repository',
    'get_repository',
    'validate_repository_permissions',
    'github_get_commits',
    
    // Development Operations
    'run_script',
    'cleanup_processes',
    'safe_cleanup',
    'generate_code'
  ]

  return validTools.includes(tool)
}
