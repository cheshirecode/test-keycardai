import { fileOperations } from './file-operations'
import { gitOperations } from './git-operations'
import { githubOperations } from './github-operations'
import { aiOperations } from './ai-operations'
import { projectOperations } from './project-operations'

/**
 * Modular MCP Tools
 *
 * This is the main export that combines all modular tool operations into a single interface.
 * Tools are organized by functional area:
 *
 * - File Operations: Basic file system operations
 * - Git Operations: Git repository management
 * - GitHub Operations: GitHub API integration
 * - AI Operations: AI-powered project analysis and creation
 * - Project Operations: Project-level tasks like dependencies and templates
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
  ...projectOperations
}
