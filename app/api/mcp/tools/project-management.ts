import * as fs from 'fs'
import * as path from 'path'
// Types imported for future use
// import { ProjectInfo, ProjectTemplate } from '../../../typings'

export interface ProjectContextParams {
  projectPath: string
  projectName?: string
}

export interface AnalyzeProjectParams {
  projectPath: string
  includeFileStructure?: boolean
  includePackageInfo?: boolean
}

export interface ProjectAnalysisResult {
  success: boolean
  message: string
  project?: {
    name: string
    path: string
    type: string
    framework?: string
    packageManager: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    scripts: Record<string, string>
    fileStructure?: string[]
    lastModified: string
    size: number
  }
}

export interface ProjectContextResult {
  success: boolean
  message: string
  context?: {
    projectPath: string
    projectName: string
    isActive: boolean
  }
}

/**
 * Project Management Module
 * Handles project context, analysis, and ongoing management operations
 */
export const projectManagement = {
  /**
   * Set the current project context for subsequent operations
   */
  set_project_context: async (params: ProjectContextParams): Promise<ProjectContextResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      const projectName = params.projectName || path.basename(params.projectPath)
      
      // Store project context (in a real app, this would be persisted)
      // For now, we'll just validate and return the context
      return {
        success: true,
        message: `Project context set: ${projectName}`,
        context: {
          projectPath: params.projectPath,
          projectName,
          isActive: true
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to set project context: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Analyze an existing project structure and dependencies
   */
  analyze_project_structure: async (params: AnalyzeProjectParams): Promise<ProjectAnalysisResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      const packageJsonPath = path.join(params.projectPath, 'package.json')
      let packageInfo: Record<string, unknown> = {}
      let projectType = 'unknown'
      let framework = 'unknown'

      // Read package.json if it exists
      if (fs.existsSync(packageJsonPath)) {
        const packageContent = fs.readFileSync(packageJsonPath, 'utf8')
        packageInfo = JSON.parse(packageContent)
        
        // Detect project type and framework
        const deps = { 
          ...(packageInfo.dependencies as Record<string, string> || {}), 
          ...(packageInfo.devDependencies as Record<string, string> || {})
        }
        if (deps.next) {
          projectType = 'Next.js'
          framework = 'React'
        } else if (deps.react) {
          projectType = 'React'
          framework = 'React'
        } else if (deps.vue) {
          projectType = 'Vue'
          framework = 'Vue'
        } else if (deps.express) {
          projectType = 'Express'
          framework = 'Node.js'
        } else if (deps.typescript) {
          projectType = 'TypeScript'
          framework = 'Node.js'
        }
      }

      // Get file structure if requested
      let fileStructure: string[] = []
      if (params.includeFileStructure) {
        fileStructure = getProjectFileStructure(params.projectPath)
      }

      // Get directory stats
      const stats = fs.statSync(params.projectPath)
      const projectName = packageInfo.name || path.basename(params.projectPath)

      // Determine package manager
      let packageManager = 'npm'
      if (fs.existsSync(path.join(params.projectPath, 'yarn.lock'))) {
        packageManager = 'yarn'
      } else if (fs.existsSync(path.join(params.projectPath, 'pnpm-lock.yaml'))) {
        packageManager = 'pnpm'
      } else if (fs.existsSync(path.join(params.projectPath, 'bun.lockb'))) {
        packageManager = 'bun'
      }

      return {
        success: true,
        message: `Project analyzed: ${projectName}`,
        project: {
          name: (typeof packageInfo.name === 'string' ? packageInfo.name : projectName),
          path: params.projectPath,
          type: projectType,
          framework,
          packageManager,
          dependencies: (packageInfo.dependencies as Record<string, string>) || {},
          devDependencies: (packageInfo.devDependencies as Record<string, string>) || {},
          scripts: (packageInfo.scripts as Record<string, string>) || {},
          fileStructure: params.includeFileStructure ? fileStructure : undefined,
          lastModified: stats.mtime.toISOString(),
          size: getDirectorySize(params.projectPath)
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to analyze project: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Get basic project information
   */
  get_project_info: async (params: { projectPath: string }): Promise<ProjectAnalysisResult> => {
    return projectManagement.analyze_project_structure({
      projectPath: params.projectPath,
      includeFileStructure: false,
      includePackageInfo: true
    })
  },

  /**
   * List directory contents for project browsing
   */
  list_project_directory: async (params: { projectPath: string; relativePath?: string }): Promise<{
    success: boolean
    message: string
    contents?: Array<{
      name: string
      type: 'file' | 'directory'
      size?: number
      modified: string
    }>
  }> => {
    try {
      const targetPath = params.relativePath 
        ? path.join(params.projectPath, params.relativePath)
        : params.projectPath

      if (!fs.existsSync(targetPath)) {
        return {
          success: false,
          message: `Directory not found: ${targetPath}`
        }
      }

      const items = fs.readdirSync(targetPath, { withFileTypes: true })
      const contents = items
        .filter(item => !item.name.startsWith('.') && item.name !== 'node_modules')
        .map(item => {
          const itemPath = path.join(targetPath, item.name)
          const stats = fs.statSync(itemPath)
          
          return {
            name: item.name,
            type: item.isDirectory() ? 'directory' as const : 'file' as const,
            size: item.isFile() ? stats.size : undefined,
            modified: stats.mtime.toISOString()
          }
        })
        .sort((a, b) => {
          // Directories first, then files, alphabetically
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })

      return {
        success: true,
        message: `Listed directory: ${params.relativePath || '/'}`,
        contents
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Helper function to get project file structure
 */
function getProjectFileStructure(projectPath: string, relativePath = '', maxDepth = 3, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth) return []

  const files: string[] = []
  
  try {
    const items = fs.readdirSync(path.join(projectPath, relativePath), { withFileTypes: true })
    
    for (const item of items) {
      // Skip hidden files, node_modules, and build directories
      if (item.name.startsWith('.') || 
          item.name === 'node_modules' || 
          item.name === 'dist' || 
          item.name === 'build' ||
          item.name === '.next') {
        continue
      }

      const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name
      
      if (item.isDirectory()) {
        files.push(`${itemPath}/`)
        files.push(...getProjectFileStructure(projectPath, itemPath, maxDepth, currentDepth + 1))
      } else {
        files.push(itemPath)
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return files
}

/**
 * Helper function to get directory size
 */
function getDirectorySize(dirPath: string): number {
  let size = 0
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      if (item.name === 'node_modules' || item.name.startsWith('.')) continue
      
      const itemPath = path.join(dirPath, item.name)
      const stats = fs.statSync(itemPath)
      
      if (item.isDirectory()) {
        size += getDirectorySize(itemPath)
      } else {
        size += stats.size
      }
    }
  } catch {
    // Skip directories we can't read
  }
  
  return size
}
