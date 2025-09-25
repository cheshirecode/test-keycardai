/**
 * Result Type Pattern for Consistent Error Handling
 * Provides type-safe error handling without exceptions
 */

/**
 * Result type - either success with data or failure with error
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Async Result type for promises
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

/**
 * Standard error types used throughout the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 500, details)
    this.name = 'ConfigurationError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, details)
    this.name = 'ExternalServiceError'
  }
}

export class FileSystemError extends AppError {
  constructor(operation: string, path: string, cause?: unknown) {
    super(`File system ${operation} failed for ${path}`, 'FILESYSTEM_ERROR', 500, cause)
    this.name = 'FileSystemError'
  }
}

/**
 * Result utility functions
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ResultUtils {
  /**
   * Create a successful result
   */
  export function success<T>(data: T): Result<T, never> {
    return { success: true, data }
  }

  /**
   * Create a failed result
   */
  export function failure<E>(error: E): Result<never, E> {
    return { success: false, error }
  }

  /**
   * Create a failed result from an Error or string
   */
  export function error(error: Error | string | unknown): Result<never, AppError> {
    if (error instanceof AppError) {
      return { success: false, error }
    }
    if (error instanceof Error) {
      return { success: false, error: new AppError(error.message, 'UNKNOWN_ERROR', 500) }
    }
    const message = typeof error === 'string' ? error : 'Unknown error occurred'
    return { success: false, error: new AppError(message, 'UNKNOWN_ERROR', 500) }
  }

  /**
   * Type guard to check if result is successful
   */
  export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true
  }

  /**
   * Type guard to check if result is failed
   */
  export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false
  }

  /**
   * Map over the data of a successful result
   */
  export function map<T, U, E>(
    result: Result<T, E>,
    mapper: (data: T) => U
  ): Result<U, E> {
    if (isSuccess(result)) {
      return success(mapper(result.data))
    }
    return result
  }

  /**
   * Map over the error of a failed result
   */
  export function mapError<T, E, F>(
    result: Result<T, E>,
    mapper: (error: E) => F
  ): Result<T, F> {
    if (isFailure(result)) {
      return failure(mapper(result.error))
    }
    return result
  }

  /**
   * Chain multiple operations that return Results
   */
  export function flatMap<T, U, E>(
    result: Result<T, E>,
    mapper: (data: T) => Result<U, E>
  ): Result<U, E> {
    if (isSuccess(result)) {
      return mapper(result.data)
    }
    return result
  }

  /**
   * Get the data from a result or throw if failed
   */
  export function unwrap<T, E>(result: Result<T, E>): T {
    if (isSuccess(result)) {
      return result.data
    }
    if (result.error instanceof Error) {
      throw result.error
    }
    throw new Error(String(result.error))
  }

  /**
   * Get the data from a result or return a default value
   */
  export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (isSuccess(result)) {
      return result.data
    }
    return defaultValue
  }

  /**
   * Convert a function that throws to one that returns a Result
   */
  export function trySync<T>(fn: () => T): Result<T, AppError> {
    try {
      return success(fn())
    } catch (error) {
      return ResultUtils.error(error)
    }
  }

  /**
   * Convert an async function that throws to one that returns a Result
   */
  export async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, AppError>> {
    try {
      const data = await fn()
      return success(data)
    } catch (error) {
      return ResultUtils.error(error)
    }
  }

  /**
   * Combine multiple Results into a single Result
   * If all are successful, returns success with array of data
   * If any fail, returns the first failure
   */
  export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const data: T[] = []
    
    for (const result of results) {
      if (isFailure(result)) {
        return result
      }
      data.push(result.data)
    }
    
    return success(data)
  }

  /**
   * Collect all successes and failures separately
   */
  export function partition<T, E>(results: Result<T, E>[]): { 
    successes: T[]
    failures: E[] 
  } {
    const successes: T[] = []
    const failures: E[] = []
    
    for (const result of results) {
      if (isSuccess(result)) {
        successes.push(result.data)
      } else {
        failures.push(result.error)
      }
    }
    
    return { successes, failures }
  }
}

/**
 * Decorator to automatically wrap functions with Result error handling
 */
export function withResult<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => Result<R, AppError> {
  return (...args: T) => {
    return ResultUtils.trySync(() => fn(...args))
  }
}

/**
 * Decorator for async functions
 */
export function withAsyncResult<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => AsyncResult<R, AppError> {
  return async (...args: T) => {
    return ResultUtils.tryAsync(() => fn(...args))
  }
}

/**
 * Helper for Express.js route handlers
 */
export function handleResult<T>(
  result: Result<T, AppError>,
  res: { status: (code: number) => { json: (data: unknown) => void } }, // Express Response
  successStatus: number = 200
): void {
  if (ResultUtils.isSuccess(result)) {
    res.status(successStatus).json({ 
      success: true, 
      data: result.data 
    })
  } else {
    const error = result.error
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
  }
}

/**
 * Helper for Next.js API routes
 */
export function handleNextResult<T>(
  result: Result<T, AppError>,
  successStatus: number = 200
): Response {
  if (ResultUtils.isSuccess(result)) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: result.data 
    }), {
      status: successStatus,
      headers: { 'Content-Type': 'application/json' }
    })
  } else {
    const error = result.error
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }), {
      status: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export default ResultUtils
