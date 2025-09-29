/**
 * AI Error Handler
 * Centralized error handling for AI operations
 */

import type { AIErrorContext } from '@/types/mcp/ai-operations'

export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: AIErrorContext
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export class AIErrorHandler {
  /**
   * Handle AI API key validation errors
   */
  static handleMissingAPIKey(operation: string): { success: false; message: string } {
    return {
      success: false,
      message: `AI API key not configured. ${operation} requires OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable.`
    }
  }

  /**
   * Handle GitHub token validation errors
   */
  static handleMissingGitHubToken(): { success: false; message: string } {
    return {
      success: false,
      message: 'GitHub token not configured. Repository creation requires GITHUB_TOKEN.'
    }
  }

  /**
   * Handle AI analysis errors
   */
  static handleAnalysisError(error: unknown, operation: string): { success: false; message: string } {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: `${operation} failed: ${errorMessage}`
    }
  }

  /**
   * Handle project path validation errors
   */
  static handleProjectPathError(projectPath: string): { success: false; message: string } {
    return {
      success: false,
      message: `Project directory not found: ${projectPath}`
    }
  }

  /**
   * Handle tool execution errors
   */
  static handleToolExecutionError(toolName: string, error: unknown): {
    action: string
    tool: string
    success: false
    error: string
    timestamp: string
  } {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      action: `Execute ${toolName}`,
      tool: toolName,
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Handle missing tool errors
   */
  static handleMissingToolError(toolName: string): {
    action: string
    tool: string
    success: false
    error: string
    timestamp: string
  } {
    return {
      action: `Execute ${toolName}`,
      tool: toolName,
      success: false,
      error: `Tool ${toolName} not found`,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Wrap async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<{ success: true; data: T } | { success: false; message: string }> {
    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      console.error(`[AI Error Handler] ${errorContext}:`, error)
      return this.handleAnalysisError(error, errorContext)
    }
  }

  /**
   * Validate environment requirements
   */
  static validateEnvironment(requirements: {
    openaiKey?: boolean
    geminiKey?: boolean
    aiKey?: boolean  // Either OpenAI or Gemini
    githubToken?: boolean
  }): { valid: true } | { valid: false; message: string } {
    if (requirements.openaiKey && !process.env.OPENAI_API_KEY) {
      return { valid: false, message: 'OpenAI API key not configured' }
    }

    if (requirements.geminiKey && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { valid: false, message: 'Gemini API key not configured' }
    }
    
    if (requirements.aiKey && !process.env.OPENAI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { valid: false, message: 'AI API key not configured (OpenAI or Gemini required)' }
    }
    
    if (requirements.githubToken && !process.env.GITHUB_TOKEN) {
      return { valid: false, message: 'GitHub token not configured' }
    }

    return { valid: true }
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    message: string,
    context?: AIErrorContext
  ): { success: false; message: string; context?: AIErrorContext } {
    return {
      success: false,
      message,
      ...(context && { context })
    }
  }

  /**
   * Log error with context
   */
  static logError(error: unknown, context: string, additionalData?: AIErrorContext): void {
    console.error(`[AI Operations Error] ${context}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...additionalData
    })
  }
}