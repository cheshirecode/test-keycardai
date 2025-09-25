import * as fs from 'fs'
import * as path from 'path'
import { CONFIG } from '@/lib/config'

export interface ReadFileParams {
  projectPath: string
  filePath: string
}

export interface UpdateFileParams {
  projectPath: string
  filePath: string
  content: string
  createBackup?: boolean
}

export interface DeleteFileParams {
  projectPath: string
  filePath: string
  recursive?: boolean
}

export interface SearchFilesParams {
  projectPath: string
  pattern: string
  searchContent?: boolean
  includePattern?: string
  excludePattern?: string
}

export interface FileOperationResult {
  success: boolean
  message: string
  content?: string
  backup?: string
  matches?: Array<{
    filePath: string
    lineNumber?: number
    line?: string
  }>
}

/**
 * File Management Module
 * Handles reading, updating, deleting, and searching files in projects
 */
export const fileManagement = {
  /**
   * Read a file from the project
   */
  read_file: async (params: ReadFileParams): Promise<FileOperationResult> => {
    try {
      const fullPath = path.join(params.projectPath, params.filePath)
      
      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File not found: ${params.filePath}`
        }
      }

      const stats = fs.statSync(fullPath)
      if (stats.isDirectory()) {
        return {
          success: false,
          message: `Path is a directory, not a file: ${params.filePath}`
        }
      }

      // Check file size (limit to reasonable size for editing)
      if (stats.size > CONFIG.LIMITS.MAX_FILE_SIZE) {
        return {
          success: false,
          message: `File too large to read (${Math.round(stats.size / CONFIG.LIMITS.FILE_SIZE_DISPLAY_UNIT)}KB). Maximum size is ${CONFIG.LIMITS.MAX_FILE_SIZE / CONFIG.LIMITS.FILE_SIZE_DISPLAY_UNIT}KB.`
        }
      }

      const content = fs.readFileSync(fullPath, 'utf8')
      
      return {
        success: true,
        message: `File read successfully: ${params.filePath}`,
        content
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Update an existing file with new content
   */
  update_file: async (params: UpdateFileParams): Promise<FileOperationResult> => {
    try {
      const fullPath = path.join(params.projectPath, params.filePath)
      
      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File not found: ${params.filePath}`
        }
      }

      let backupPath: string | undefined

      // Create backup if requested
      if (params.createBackup) {
        const timestamp = Date.now()
        backupPath = `${fullPath}.backup.${timestamp}`
        fs.copyFileSync(fullPath, backupPath)
      }

      // Write new content
      fs.writeFileSync(fullPath, params.content, 'utf8')

      return {
        success: true,
        message: `File updated successfully: ${params.filePath}`,
        backup: backupPath
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Delete a file or directory
   */
  delete_file: async (params: DeleteFileParams): Promise<FileOperationResult> => {
    try {
      const fullPath = path.join(params.projectPath, params.filePath)
      
      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File or directory not found: ${params.filePath}`
        }
      }

      const stats = fs.statSync(fullPath)
      
      if (stats.isDirectory()) {
        if (params.recursive) {
          fs.rmSync(fullPath, { recursive: true, force: true })
        } else {
          fs.rmdirSync(fullPath)
        }
      } else {
        fs.unlinkSync(fullPath)
      }

      return {
        success: true,
        message: `${stats.isDirectory() ? 'Directory' : 'File'} deleted successfully: ${params.filePath}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Search for files by name or content
   */
  search_files: async (params: SearchFilesParams): Promise<FileOperationResult> => {
    try {
      const matches: Array<{
        filePath: string
        lineNumber?: number
        line?: string
      }> = []

      const searchInDirectory = (dirPath: string, relativePath = '') => {
        const items = fs.readdirSync(dirPath, { withFileTypes: true })
        
        for (const item of items) {
          // Skip hidden files, node_modules, and build directories
          if (item.name.startsWith('.') || 
              item.name === 'node_modules' || 
              item.name === 'dist' || 
              item.name === 'build' ||
              item.name === '.next') {
            continue
          }

          const itemPath = path.join(dirPath, item.name)
          const relativeItemPath = relativePath ? `${relativePath}/${item.name}` : item.name

          if (item.isDirectory()) {
            searchInDirectory(itemPath, relativeItemPath)
          } else {
            // Check include/exclude patterns
            if (params.includePattern && !new RegExp(params.includePattern).test(item.name)) {
              continue
            }
            if (params.excludePattern && new RegExp(params.excludePattern).test(item.name)) {
              continue
            }

            // Search by filename
            if (new RegExp(params.pattern, 'i').test(item.name)) {
              matches.push({ filePath: relativeItemPath })
            }

            // Search by content if requested
            if (params.searchContent) {
              try {
                const stats = fs.statSync(itemPath)
                // Only search text files under 1MB
                if (stats.size < CONFIG.LIMITS.MAX_FILE_SIZE && isTextFile(item.name)) {
                  const content = fs.readFileSync(itemPath, 'utf8')
                  const lines = content.split('\n')
                  const regex = new RegExp(params.pattern, 'gi')
                  
                  lines.forEach((line, index) => {
                    if (regex.test(line)) {
                      matches.push({
                        filePath: relativeItemPath,
                        lineNumber: index + 1,
                        line: line.trim()
                      })
                    }
                  })
                }
      } catch {
        // Skip files we can't read
      }
            }
          }
        }
      }

      searchInDirectory(params.projectPath)

      return {
        success: true,
        message: `Search completed. Found ${matches.length} matches for "${params.pattern}"`,
        matches
      }
    } catch (error) {
      return {
        success: false,
        message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Create a new file with content
   */
  create_file: async (params: { projectPath: string; filePath: string; content: string }): Promise<FileOperationResult> => {
    try {
      const fullPath = path.join(params.projectPath, params.filePath)
      
      // Create directory if it doesn't exist
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Check if file already exists
      if (fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File already exists: ${params.filePath}`
        }
      }

      fs.writeFileSync(fullPath, params.content, 'utf8')

      return {
        success: true,
        message: `File created successfully: ${params.filePath}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Helper function to determine if a file is likely a text file
 */
function isTextFile(filename: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.yml', '.yaml',
    '.css', '.scss', '.sass', '.html', '.htm', '.xml', '.svg', '.vue',
    '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.cs', '.go',
    '.rs', '.sh', '.bat', '.ps1', '.sql', '.env', '.gitignore',
    '.dockerfile', '.config', '.conf', '.ini', '.toml'
  ]
  
  const ext = path.extname(filename).toLowerCase()
  return textExtensions.includes(ext) || !ext
}
