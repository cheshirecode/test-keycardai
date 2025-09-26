/**
 * GitHub Error Handler
 * Centralized error handling for GitHub API operations
 */

import type { 
  IGitHubErrorHandler, 
  APIResponse, 
  ErrorContext 
} from '@/types/github'

export class GitHubErrorHandler implements IGitHubErrorHandler {
  /**
   * Handle GitHub API errors and return standardized response
   */
  static handleAPIError(error: unknown, operation: string): APIResponse {
    const apiError = error as {
      status?: number
      message?: string
      response?: {
        status?: number
        data?: {
          message?: string
          errors?: Array<{ message?: string }>
          documentation_url?: string
        }
      }
    }

    const status = apiError.status || apiError.response?.status || 500
    const baseMessage = apiError.response?.data?.message || apiError.message || 'Unknown GitHub API error'
    const errors = apiError.response?.data?.errors
    const docUrl = apiError.response?.data?.documentation_url

    let message = `${operation} failed: ${baseMessage}`
    
    // Add specific error details if available
    if (errors && errors.length > 0) {
      const errorMessages = errors.map(err => err.message).filter(Boolean)
      if (errorMessages.length > 0) {
        message += ` (${errorMessages.join(', ')})`
      }
    }

    // Add documentation URL for certain errors
    if (docUrl && (status === 403 || status === 422)) {
      message += ` - See: ${docUrl}`
    }

    return {
      success: false,
      message,
      error: this.getErrorCode(status, operation)
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    const apiError = error as { status?: number; response?: { status?: number } }
    const status = apiError.status || apiError.response?.status || 0
    
    // Retryable status codes
    const retryableStatuses = [
      408, // Request Timeout
      429, // Too Many Requests (Rate Limit)
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ]

    return retryableStatuses.includes(status)
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: unknown): string {
    const apiError = error as {
      status?: number
      message?: string
      response?: {
        status?: number
        data?: { message?: string }
      }
    }

    const status = apiError.status || apiError.response?.status
    const message = apiError.response?.data?.message || apiError.message || 'Unknown error'

    // Provide user-friendly messages for common errors
    switch (status) {
      case 401:
        return 'Authentication failed. Please check your GitHub token.'
      case 403:
        if (message.includes('rate limit')) {
          return 'GitHub API rate limit exceeded. Please wait and try again.'
        }
        return 'Access denied. You may not have permission for this operation.'
      case 404:
        return 'Resource not found. The repository or user may not exist or be accessible.'
      case 422:
        if (message.includes('already exists')) {
          return 'Repository already exists. Please choose a different name.'
        }
        return `Validation error: ${message}`
      case 429:
        return 'Too many requests. Please wait before trying again.'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'GitHub service is temporarily unavailable. Please try again later.'
      default:
        return message
    }
  }

  /**
   * Log error with context for debugging
   */
  static logError(error: unknown, context: ErrorContext): void {
    const apiError = error as {
      status?: number
      message?: string
      response?: { status?: number; data?: unknown }
      stack?: string
    }

    const logData = {
      operation: context.operation,
      endpoint: context.endpoint,
      parameters: context.parameters,
      timestamp: context.timestamp,
      retryCount: context.retryCount || 0,
      error: {
        status: apiError.status || apiError.response?.status,
        message: apiError.message,
        response: apiError.response?.data,
        stack: apiError.stack
      }
    }

    console.error('[GitHub API Error]', JSON.stringify(logData, null, 2))
  }

  /**
   * Get standardized error code based on status and operation
   */
  private static getErrorCode(status: number, operation: string): string {
    const operationCode = operation.toUpperCase().replace(/\s+/g, '_')
    
    switch (status) {
      case 401:
        return `GITHUB_AUTH_ERROR_${operationCode}`
      case 403:
        return `GITHUB_PERMISSION_ERROR_${operationCode}`
      case 404:
        return `GITHUB_NOT_FOUND_${operationCode}`
      case 422:
        return `GITHUB_VALIDATION_ERROR_${operationCode}`
      case 429:
        return `GITHUB_RATE_LIMIT_${operationCode}`
      case 500:
      case 502:
      case 503:
      case 504:
        return `GITHUB_SERVER_ERROR_${operationCode}`
      default:
        return `GITHUB_API_ERROR_${status}_${operationCode}`
    }
  }

  /**
   * Create error response with context
   */
  static createErrorResponse(
    message: string, 
    operation: string, 
    context?: Partial<ErrorContext>
  ): APIResponse {
    const errorContext: ErrorContext = {
      operation,
      timestamp: new Date().toISOString(),
      ...context
    }

    this.logError(new Error(message), errorContext)

    return {
      success: false,
      message,
      error: this.getErrorCode(500, operation)
    }
  }

  /**
   * Wrap async operation with error handling
   */
  static async withErrorHandling<T>(
    operation: string,
    asyncFn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<APIResponse<T>> {
    try {
      const result = await asyncFn()
      return {
        success: true,
        data: result,
        message: `${operation} completed successfully`
      }
    } catch (error) {
      const errorContext: ErrorContext = {
        operation,
        timestamp: new Date().toISOString(),
        ...context
      }

      this.logError(error, errorContext)
      const errorResponse = this.handleAPIError(error, operation)
      return {
        success: false,
        message: errorResponse.message,
        error: errorResponse.error
      }
    }
  }

  // Instance methods that delegate to static methods
  handleAPIError(error: unknown, operation: string): APIResponse {
    return GitHubErrorHandler.handleAPIError(error, operation)
  }

  isRetryableError(error: unknown): boolean {
    return GitHubErrorHandler.isRetryableError(error)
  }

  formatErrorMessage(error: unknown): string {
    return GitHubErrorHandler.formatErrorMessage(error)
  }

  logError(error: unknown, context: ErrorContext): void {
    GitHubErrorHandler.logError(error, context)
  }
}
