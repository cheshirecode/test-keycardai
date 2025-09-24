import { fileOperations } from './file-operations'
import { gitOperations } from './git-operations'
import { githubOperations } from './github-operations'
import { aiOperations } from './ai-operations'
import { projectOperations } from './project-operations'
import { projectManagement } from './project-management'
import { fileManagement } from './file-management'
import { packageManagement } from './package-management'
import { developmentTools } from './development-tools'

/**
 * Modular MCP Tools
 *
 * This is the main export that combines all modular tool operations into a single interface.
 * Tools are organized by functional area:
 *
 * - File Operations: Basic file system operations (create_directory, write_file)
 * - Git Operations: Git repository management
 * - GitHub Operations: GitHub API integration
 * - AI Operations: AI-powered project analysis and creation
 * - Project Operations: Project-level tasks like dependencies and templates
 * - Project Management: Ongoing project context and analysis
 * - File Management: Advanced file operations (read, update, delete, search)
 * - Package Management: Package installation and management
 * - Development Tools: Script execution and code generation
 */
export const mcpTools = {
  // File Operations
  ...fileOperations,

  // Git Operations
  ...gitOperations,

  // GitHub Operations
  ...githubOperations,

  // AI Operations - need to pass mcpTools reference for recursive calls
  analyze_project_request: aiOperations.analyze_project_request,
  generate_project_plan: aiOperations.generate_project_plan,
  analyze_and_optimize: aiOperations.analyze_and_optimize,
  intelligent_project_setup: async (params: Parameters<typeof aiOperations.intelligent_project_setup>[0]) => {
    return aiOperations.intelligent_project_setup(params, mcpTools as Record<string, (...args: unknown[]) => Promise<unknown>>)
  },
  create_project_with_ai: async (params: Parameters<typeof aiOperations.create_project_with_ai>[0]) => {
    return aiOperations.create_project_with_ai(params, mcpTools as Record<string, (...args: unknown[]) => Promise<unknown>>)
  },

  // Project Operations
  ...projectOperations,

  // Project Management - Ongoing project development
  ...projectManagement,

  // File Management - Advanced file operations
  ...fileManagement,

  // Package Management - Package installation and management
  ...packageManagement,

  // Development Tools - Script execution and code generation
  ...developmentTools
}
