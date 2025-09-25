import * as fs from 'fs'
import * as path from 'path'

/**
 * Path Utilities
 * Handles safe path operations and validation to prevent folder path errors
 */

export interface PathValidationResult {
  isValid: boolean
  normalizedPath: string
  error?: string
  exists?: boolean
  isDirectory?: boolean
  isWritable?: boolean
}

/**
 * Safely normalize and validate a path
 */
export function validatePath(inputPath: string, options: {
  mustExist?: boolean
  mustBeDirectory?: boolean
  mustBeWritable?: boolean
  createIfMissing?: boolean
} = {}): PathValidationResult {
  try {
    // Normalize the path to handle different separators and resolve relative paths
    const normalizedPath = path.resolve(inputPath)
    
    // Check if path exists
    const exists = fs.existsSync(normalizedPath)
    
    if (options.mustExist && !exists) {
      return {
        isValid: false,
        normalizedPath,
        error: `Path does not exist: ${normalizedPath}`,
        exists: false
      }
    }
    
    let isDirectory = false
    let isWritable = false
    
    if (exists) {
      const stats = fs.statSync(normalizedPath)
      isDirectory = stats.isDirectory()
      
      if (options.mustBeDirectory && !isDirectory) {
        return {
          isValid: false,
          normalizedPath,
          error: `Path is not a directory: ${normalizedPath}`,
          exists: true,
          isDirectory: false
        }
      }
      
      // Check if writable
      try {
        fs.accessSync(normalizedPath, fs.constants.W_OK)
        isWritable = true
      } catch {
        isWritable = false
      }
      
      if (options.mustBeWritable && !isWritable) {
        return {
          isValid: false,
          normalizedPath,
          error: `Path is not writable: ${normalizedPath}`,
          exists: true,
          isDirectory,
          isWritable: false
        }
      }
    } else if (options.createIfMissing) {
      try {
        fs.mkdirSync(normalizedPath, { recursive: true })
        isDirectory = true
        isWritable = true
      } catch (error) {
        return {
          isValid: false,
          normalizedPath,
          error: `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          exists: false
        }
      }
    }
    
    return {
      isValid: true,
      normalizedPath,
      exists,
      isDirectory,
      isWritable
    }
  } catch (error) {
    return {
      isValid: false,
      normalizedPath: inputPath,
      error: `Path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Safely join paths and validate the result
 */
export function safePathJoin(...segments: string[]): PathValidationResult {
  try {
    const joinedPath = path.join(...segments)
    return validatePath(joinedPath)
  } catch (error) {
    return {
      isValid: false,
      normalizedPath: segments.join('/'),
      error: `Failed to join paths: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Ensure a directory exists and is writable
 */
export function ensureDirectory(dirPath: string): PathValidationResult {
  return validatePath(dirPath, {
    mustBeDirectory: true,
    mustBeWritable: true,
    createIfMissing: true
  })
}

/**
 * Get a safe temporary directory for project operations
 */
export function getSafeTempDir(projectName?: string): PathValidationResult {
  const tempBase = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.temp')
  const tempDir = projectName 
    ? path.join(tempBase, 'projects', sanitizeFileName(projectName))
    : path.join(tempBase, 'projects')
  
  return ensureDirectory(tempDir)
}

/**
 * Sanitize a filename to be safe for filesystem operations
 */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) // Limit length
}

/**
 * Check if a path is within allowed boundaries (security check)
 */
export function isPathSafe(targetPath: string, allowedBasePaths: string[]): boolean {
  try {
    const normalizedTarget = path.resolve(targetPath)
    
    return allowedBasePaths.some(basePath => {
      const normalizedBase = path.resolve(basePath)
      return normalizedTarget.startsWith(normalizedBase)
    })
  } catch {
    return false
  }
}

/**
 * Clean up old temporary directories
 */
export function cleanupOldTempDirs(maxAgeHours: number = 24): { cleaned: string[], errors: string[] } {
  const cleaned: string[] = []
  const errors: string[] = []
  
  try {
    const tempBase = process.env.VERCEL ? '/tmp/projects' : path.join(process.cwd(), '.temp/projects')
    
    if (!fs.existsSync(tempBase)) {
      return { cleaned, errors }
    }
    
    const items = fs.readdirSync(tempBase, { withFileTypes: true })
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000)
    
    for (const item of items) {
      if (item.isDirectory()) {
        const itemPath = path.join(tempBase, item.name)
        try {
          const stats = fs.statSync(itemPath)
          if (stats.mtime.getTime() < cutoffTime) {
            fs.rmSync(itemPath, { recursive: true, force: true })
            cleaned.push(itemPath)
          }
        } catch (error) {
          errors.push(`Failed to clean ${itemPath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to cleanup temp dirs: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return { cleaned, errors }
}

/**
 * Resolve project path with fallback options
 */
export function resolveProjectPath(inputPath?: string, projectName?: string): PathValidationResult {
  // If explicit path provided, validate it
  if (inputPath) {
    const result = validatePath(inputPath, { mustBeDirectory: true })
    if (result.isValid) {
      return result
    }
  }
  
  // Fallback to temp directory
  return getSafeTempDir(projectName)
}
