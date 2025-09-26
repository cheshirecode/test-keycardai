/**
 * File Service
 * Handles file system operations for GitHub repository content
 */

import type {
  IFileService,
  CommitFile
} from '@/types/github'

// Import fs and path conditionally for server-side only
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = typeof window === 'undefined' ? require('fs') : null
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = typeof window === 'undefined' ? require('path') : null

export class FileService implements IFileService {
  /**
   * Collect files from a directory for committing to GitHub
   */
  async collectFilesFromDirectory(projectPath: string): Promise<CommitFile[]> {
    const files: CommitFile[] = []

    // Check if we're running on the server side
    if (!fs || !path) {
      console.warn('[File Service] collectFilesFromDirectory called on client side - returning empty array')
      return files
    }

    if (!this.validatePath(projectPath)) {
      console.warn(`[File Service] Invalid project path: ${projectPath}`)
      return files
    }

    const walkDirectory = (dir: string, relativePath = '') => {
      try {
        const items = fs.readdirSync(dir)

        for (const item of items) {
          const fullPath = path.join(dir, item)
          const itemRelativePath = relativePath ? path.join(relativePath, item) : item

          if (!this.shouldIncludeFile(item, itemRelativePath)) {
            continue
          }

          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            walkDirectory(fullPath, itemRelativePath)
          } else if (stat.isFile()) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8')
              files.push({
                path: itemRelativePath.replace(/\\/g, '/'), // Normalize path separators
                content
              })
            } catch (readError) {
              console.warn(`[File Service] Failed to read file ${fullPath}:`, readError)
            }
          }
        }
      } catch (error) {
        console.warn(`[File Service] Failed to read directory ${dir}:`, error)
      }
    }

    if (fs.existsSync(projectPath)) {
      walkDirectory(projectPath)
      console.log(`[File Service] Collected ${files.length} files from ${projectPath}`)
    } else {
      console.warn(`[File Service] Project path does not exist: ${projectPath}`)
    }

    return files
  }

  /**
   * Validate if a path is safe to access
   */
  validatePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') {
      return false
    }

    // Basic path validation
    const normalizedPath = filePath.replace(/\\/g, '/')
    
    // Reject paths with dangerous patterns
    const dangerousPatterns = [
      '../',
      '..\\',
      '/etc/',
      '/proc/',
      '/sys/',
      'C:\\Windows\\',
      'C:\\System32\\'
    ]

    return !dangerousPatterns.some(pattern => 
      normalizedPath.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1).toLowerCase() : ''
  }

  /**
   * Determine if a file should be included in the collection
   */
  shouldIncludeFile(filename: string, relativePath: string): boolean {
    // Skip hidden files and directories (starting with .)
    if (filename.startsWith('.')) {
      return false
    }

    // Skip common directories that shouldn't be committed
    const skipDirectories = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      'coverage',
      '.turbo',
      '.cache',
      'tmp',
      'temp'
    ]

    if (skipDirectories.includes(filename)) {
      return false
    }

    // Skip files in skip directories (check the full relative path)
    const pathParts = relativePath.split(/[/\\]/)
    if (pathParts.some(part => skipDirectories.includes(part))) {
      return false
    }

    // Skip common files that shouldn't be committed
    const skipFiles = [
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '*.tmp',
      '*.temp',
      '*.swp',
      '*.swo',
      '*~'
    ]

    // Check exact matches and pattern matches
    for (const skipPattern of skipFiles) {
      if (skipPattern.includes('*')) {
        // Simple wildcard matching
        const regex = new RegExp('^' + skipPattern.replace(/\*/g, '.*') + '$', 'i')
        if (regex.test(filename)) {
          return false
        }
      } else if (filename.toLowerCase() === skipPattern.toLowerCase()) {
        return false
      }
    }

    // Skip files that are too large (> 1MB)
    if (fs && path) {
      try {
        const fullPath = path.resolve(relativePath)
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath)
          if (stat.size > 1024 * 1024) { // 1MB limit
            console.warn(`[File Service] Skipping large file: ${relativePath} (${stat.size} bytes)`)
            return false
          }
        }
      } catch (error) {
        // If we can't stat the file, include it anyway
        console.warn(`[File Service] Could not stat file ${relativePath}:`, error)
      }
    }

    return true
  }

  /**
   * Check if a file is a text file based on extension
   */
  isTextFile(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    
    const textExtensions = [
      // Code files
      'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
      'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
      'cs', 'go', 'rs', 'swift', 'kt', 'scala',
      
      // Web files
      'html', 'htm', 'css', 'scss', 'sass', 'less',
      'xml', 'svg', 'json', 'yaml', 'yml', 'toml',
      
      // Config files
      'config', 'conf', 'ini', 'env', 'properties',
      'gitignore', 'gitattributes', 'editorconfig',
      
      // Documentation
      'md', 'txt', 'rst', 'adoc', 'tex',
      
      // Shell scripts
      'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
      
      // Data files
      'csv', 'tsv', 'sql', 'graphql', 'gql'
    ]

    return textExtensions.includes(extension)
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath: string): number {
    if (!fs || !path) {
      return 0
    }

    try {
      const stat = fs.statSync(filePath)
      return stat.size
    } catch (error) {
      console.warn(`[File Service] Could not get file size for ${filePath}:`, error)
      return 0
    }
  }

  /**
   * Check if path exists
   */
  pathExists(filePath: string): boolean {
    if (!fs) {
      return false
    }

    try {
      return fs.existsSync(filePath)
    } catch {
      return false
    }
  }

  /**
   * Get directory listing
   */
  listDirectory(dirPath: string): string[] {
    if (!fs || !this.validatePath(dirPath)) {
      return []
    }

    try {
      return fs.readdirSync(dirPath)
    } catch (error) {
      console.warn(`[File Service] Could not list directory ${dirPath}:`, error)
      return []
    }
  }
}
