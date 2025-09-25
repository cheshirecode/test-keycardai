/**
 * Centralized Error Handler
 * Provides consistent error handling, logging, and formatting across the application
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  AppError, 
  ValidationError, 
  ConfigurationError, 
  ExternalServiceError,
  FileSystemError,
  Result,
  ResultUtils
} from './result'
import { CONFIG } from './config'

/**
 * Error log levels
 */
export enum ErrorLevel {
  INFO = 'info',
  WARN = 'warn', 
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: string
  stackTrace?: string
  additionalData?: Record<string, unknown>
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  /**
   * Log an error with context
   */
  static logError(
    error: Error | AppError,
    level: ErrorLevel = ErrorLevel.ERROR,
    context: ErrorContext = {}
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: error.message,
      name: error.name,
      code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
      statusCode: error instanceof AppError ? error.statusCode : 500,
      stack: error.stack,
      context
    }

    // In production, you'd send this to your logging service
    if (level === ErrorLevel.CRITICAL || level === ErrorLevel.ERROR) {
      console.error('Error:', JSON.stringify(logEntry, null, 2))
    } else {
      console.warn('Warning:', JSON.stringify(logEntry, null, 2))
    }

    // TODO: Integrate with external logging service like DataDog, Sentry, etc.
    // Example: sentryLogger.captureException(error, { extra: context })
  }

  /**
   * Handle MCP API errors specifically
   */
  static handleMCPError(error: unknown, context: ErrorContext = {}): AppError {
    if (error instanceof AppError) {
      this.logError(error, ErrorLevel.ERROR, context)
      return error
    }

    if (error instanceof Error) {
      const mcpError = new ExternalServiceError('MCP', error.message)
      this.logError(mcpError, ErrorLevel.ERROR, context)
      return mcpError
    }

    const unknownError = new AppError(
      'Unknown MCP error occurred',
      'MCP_UNKNOWN_ERROR',
      500,
      error
    )
    this.logError(unknownError, ErrorLevel.ERROR, context)
    return unknownError
  }

  /**
   * Handle file system errors
   */
  static handleFileSystemError(
    operation: string,
    path: string,
    cause: unknown,
    context: ErrorContext = {}
  ): FileSystemError {
    const error = new FileSystemError(operation, path, cause)
    this.logError(error, ErrorLevel.ERROR, context)
    return error
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(
    message: string,
    field?: string,
    details?: unknown,
    context: ErrorContext = {}
  ): ValidationError {
    const error = new ValidationError(message, field, details)
    this.logError(error, ErrorLevel.WARN, context)
    return error
  }

  /**
   * Handle configuration errors
   */
  static handleConfigurationError(
    message: string,
    details?: unknown,
    context: ErrorContext = {}
  ): ConfigurationError {
    const error = new ConfigurationError(message, details)
    this.logError(error, ErrorLevel.CRITICAL, context)
    return error
  }

  /**
   * Convert any error to a standardized AppError
   */
  static normalizeError(error: unknown, context: ErrorContext = {}): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      const appError = new AppError(error.message, 'UNKNOWN_ERROR', 500)
      this.logError(appError, ErrorLevel.ERROR, context)
      return appError
    }

    const unknownError = new AppError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      error
    )
    this.logError(unknownError, ErrorLevel.ERROR, context)
    return unknownError
  }

  /**
   * Format error for user display (sanitized)
   */
  static formatUserError(error: AppError): string {
    // Don't expose internal details to users
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return error.message
      case 'NOT_FOUND':
        return error.message
      case 'CONFIGURATION_ERROR':
        return 'Service configuration error. Please try again later.'
      case 'EXTERNAL_SERVICE_ERROR':
        return 'External service unavailable. Please try again later.'
      case 'FILESYSTEM_ERROR':
        return 'File operation failed. Please check permissions and try again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  /**
   * Create error context from Next.js request
   */
  static createContextFromRequest(request: NextRequest, additionalData?: Record<string, unknown>): ErrorContext {
    return {
      requestId: crypto.randomUUID(),
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      timestamp: new Date().toISOString(),
      additionalData
    }
  }

  /**
   * Handle errors in Next.js API routes
   */
  static handleAPIError(
    error: unknown,
    request?: NextRequest,
    additionalContext?: Record<string, unknown>
  ): NextResponse {
    const context = request 
      ? this.createContextFromRequest(request, additionalContext)
      : { timestamp: new Date().toISOString(), ...additionalContext }

    const appError = this.normalizeError(error, context)

    const response = {
      success: false,
      error: {
        code: appError.code,
        message: this.formatUserError(appError),
        ...(process.env.NODE_ENV === 'development' && {
          details: appError.details,
          stack: appError.stack
        })
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { 
      status: appError.statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Wrap API route handler with error handling
   */
  static wrapAPIHandler<T>(
    handler: (request: NextRequest, context?: unknown) => Promise<T>
  ) {
    return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
      try {
        const result = await handler(request, context)
        
        if (result instanceof NextResponse) {
          return result
        }

        // If handler returns data, wrap in success response
        return NextResponse.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        return this.handleAPIError(error, request)
      }
    }
  }

  /**
   * Convert Result to NextResponse
   */
  static resultToResponse<T>(
    result: Result<T, AppError>,
    successStatus: number = 200
  ): NextResponse {
    if (ResultUtils.isSuccess(result)) {
      return NextResponse.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      }, { status: successStatus })
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: result.error.code,
          message: this.formatUserError(result.error),
          ...(process.env.NODE_ENV === 'development' && {
            details: result.error.details,
            stack: result.error.stack
          })
        },
        timestamp: new Date().toISOString()
      }, { status: result.error.statusCode })
    }
  }

  /**
   * Retry mechanism for operations that might fail temporarily
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = CONFIG.AI.MAX_RETRIES,
    delay: number = 1000,
    context: ErrorContext = {}
  ): Promise<Result<T, AppError>> {
    let lastError: unknown
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        return ResultUtils.success(result)
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
          continue
        }
      }
    }
    
    const appError = this.normalizeError(lastError, {
      ...context,
      additionalData: { ...context.additionalData, attempts: maxRetries }
    })
    
    return ResultUtils.failure(appError)
  }
}

/**
 * Utility decorators for automatic error handling
 */

/**
 * Decorator to wrap class methods with error handling
 */
export function HandleErrors<T extends (...args: unknown[]) => unknown>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> {
  const method = descriptor.value!
  
  descriptor.value = (async function(this: unknown, ...args: unknown[]) {
    try {
      return await method.apply(this, args)
    } catch (error) {
      const context: ErrorContext = {
        method: `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`,
        timestamp: new Date().toISOString()
      }
      throw ErrorHandler.normalizeError(error, context)
    }
  }) as T
  
  return descriptor
}

/**
 * Async wrapper that returns Result instead of throwing
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<Result<T, AppError>> {
  try {
    const result = await operation()
    return ResultUtils.success(result)
  } catch (error) {
    const appError = ErrorHandler.normalizeError(error, context)
    return ResultUtils.failure(appError)
  }
}

/**
 * Sync wrapper that returns Result instead of throwing
 */
export function safe<T>(
  operation: () => T,
  context: ErrorContext = {}
): Result<T, AppError> {
  try {
    const result = operation()
    return ResultUtils.success(result)
  } catch (error) {
    const appError = ErrorHandler.normalizeError(error, context)
    return ResultUtils.failure(appError)
  }
}

export default ErrorHandler
