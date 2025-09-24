/**
 * Project-related Types
 * 
 * Types for project templates, project information, and project management
 */

// Project information for both frontend and backend
export interface ProjectInfo {
  name: string
  path: string
  template: string
  status: 'creating' | 'completed' | 'error'
  repositoryUrl?: string  // Actual GitHub repository URL from creation
}

// Project template for both frontend and backend
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  files: Record<string, string>
  dependencies: string[]
  devDependencies: string[]
}
