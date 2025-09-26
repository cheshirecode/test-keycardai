/**
 * Validation Utils
 * Utilities for parameter validation and environment checks
 */

import * as fs from 'fs'
import * as path from 'path'

export class ValidationUtils {
  /**
   * Validate required parameters
   */
  static validateRequiredParams<T extends Record<string, unknown>>(
    params: T,
    requiredFields: (keyof T)[]
  ): { valid: true } | { valid: false; missing: string[] } {
    const missing = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    )

    if (missing.length > 0) {
      return { valid: false, missing: missing as string[] }
    }

    return { valid: true }
  }

  /**
   * Validate project path exists
   */
  static validateProjectPath(projectPath: string): { valid: true } | { valid: false; error: string } {
    try {
      if (!fs.existsSync(projectPath)) {
        return { valid: false, error: `Project directory not found: ${projectPath}` }
      }

      const stats = fs.statSync(projectPath)
      if (!stats.isDirectory()) {
        return { valid: false, error: `Path is not a directory: ${projectPath}` }
      }

      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: `Error accessing project path: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Validate and read package.json
   */
  static validateAndReadPackageJson(projectPath: string): {
    valid: true
    packageInfo: Record<string, unknown>
  } | {
    valid: false
    error: string
  } {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json')
      
      if (!fs.existsSync(packageJsonPath)) {
        return {
          valid: true,
          packageInfo: { name: 'unknown', dependencies: {}, devDependencies: {} }
        }
      }

      const packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return { valid: true, packageInfo }
    } catch (error) {
      return {
        valid: false,
        error: `Error reading package.json: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Validate environment variables
   */
  static validateEnvironment(requirements: {
    openaiKey?: boolean
    githubToken?: boolean
  }): { valid: true } | { valid: false; missing: string[] } {
    const missing: string[] = []

    if (requirements.openaiKey && !process.env.OPENAI_API_KEY) {
      missing.push('OPENAI_API_KEY')
    }

    if (requirements.githubToken && !process.env.GITHUB_TOKEN) {
      missing.push('GITHUB_TOKEN')
    }

    if (missing.length > 0) {
      return { valid: false, missing }
    }

    return { valid: true }
  }

  /**
   * Validate MCP tools availability
   */
  static validateMCPTools(
    mcpTools: Record<string, unknown>,
    requiredTools: string[]
  ): { valid: true } | { valid: false; missing: string[] } {
    const missing = requiredTools.filter(tool => !mcpTools[tool])

    if (missing.length > 0) {
      return { valid: false, missing }
    }

    return { valid: true }
  }

  /**
   * Validate project name
   */
  static validateProjectName(name: string): { valid: true } | { valid: false; error: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Project name cannot be empty' }
    }

    if (name.length > 100) {
      return { valid: false, error: 'Project name too long (max 100 characters)' }
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      return { valid: false, error: 'Project name contains invalid characters' }
    }

    return { valid: true }
  }

  /**
   * Validate description length
   */
  static validateDescription(description: string): { valid: true } | { valid: false; error: string } {
    if (!description || description.trim().length === 0) {
      return { valid: false, error: 'Description cannot be empty' }
    }

    if (description.length > 5000) {
      return { valid: false, error: 'Description too long (max 5000 characters)' }
    }

    return { valid: true }
  }

  /**
   * Validate workflow context
   */
  static validateWorkflowContext(context: {
    projectPath?: string
    description?: string
    projectName?: string
  }): { valid: true } | { valid: false; errors: string[] } {
    const errors: string[] = []

    if (context.description) {
      const descValidation = this.validateDescription(context.description)
      if (!descValidation.valid) {
        errors.push(descValidation.error)
      }
    }

    if (context.projectName) {
      const nameValidation = this.validateProjectName(context.projectName)
      if (!nameValidation.valid) {
        errors.push(nameValidation.error)
      }
    }

    if (context.projectPath) {
      const pathValidation = this.validateProjectPath(context.projectPath)
      if (!pathValidation.valid) {
        errors.push(pathValidation.error)
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    return { valid: true }
  }

  /**
   * Sanitize file path
   */
  static sanitizeFilePath(filePath: string): string {
    return path.normalize(filePath).replace(/\.\./g, '')
  }

  /**
   * Check if path is safe (within allowed directories)
   */
  static isSafePath(filePath: string, allowedPaths: string[]): boolean {
    const normalizedPath = path.resolve(filePath)
    return allowedPaths.some(allowedPath => 
      normalizedPath.startsWith(path.resolve(allowedPath))
    )
  }
}