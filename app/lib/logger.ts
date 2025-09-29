import { LogData } from '@/api/log/route'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  userId?: string
  sessionId?: string
  component?: string
}

/**
 * Enterprise-grade logging utility for Project Scaffolder
 * Provides centralized logging with Vercel backend integration
 */
export class Logger {
  private config: LoggerConfig
  private sessionId: string
  private buffer: LogData[] = []
  private bufferTimeout?: NodeJS.Timeout

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'test',
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      sessionId: this.generateSessionId(),
      ...config
    }
    this.sessionId = this.config.sessionId || this.generateSessionId()
  }

  private generateSessionId(): string {
    // Use a more predictable session ID for SSR compatibility
    if (typeof window === 'undefined') {
      return 'session_ssr'
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getLevelPriority(level: LogLevel): number {
    const priorities = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 }
    return priorities[level] || 1
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return this.getLevelPriority(level) >= this.getLevelPriority(this.config.level)
  }

  /**
   * Send log entry to Vercel backend
   */
  private async sendLog(logData: LogData): Promise<void> {
    if (!this.shouldLog(logData.level)) return

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logData,
          sessionId: this.sessionId,
          userId: this.config.userId,
          component: this.config.component,
          timestamp: new Date().toISOString(),
          userAgent: navigator?.userAgent,
          url: window?.location?.href
        })
      })

      if (!response.ok) {
        console.warn('Failed to send log to backend:', response.statusText)
      }
    } catch (error) {
      // Fallback to console logging if backend is unavailable
      console.error('Logger backend unavailable:', error)
      this.logToConsole(logData)
    }
  }

  private logToConsole(logData: LogData): void {
    const { level, message, data } = logData
    const logMethod = level === 'error' || level === 'critical' ? 'error' :
                    level === 'warn' ? 'warn' :
                    level === 'debug' ? 'debug' : 'log'
    
    console[logMethod](`[${level.toUpperCase()}] ${message}`, data)
  }

  /**
   * Add log entry to buffer for batch processing
   */
  private bufferLog(logData: LogData): void {
    this.buffer.push(logData)
    
    // Send immediately for critical errors
    if (logData.level === 'critical' || logData.level === 'error') {
      this.flush()
      return
    }

    // Buffer other logs and send in batches
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout)
    }

    this.bufferTimeout = setTimeout(() => {
      this.flush()
    }, 1000) // Send buffered logs every second
  }

  /**
   * Flush buffered logs to backend
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const logsToSend = [...this.buffer]
    this.buffer = []

    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout)
      this.bufferTimeout = undefined
    }

    // Send logs concurrently
    await Promise.allSettled(
      logsToSend.map(log => this.sendLog(log))
    )
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.bufferLog({ message, level: 'debug', data })
  }

  /**
   * Info level logging
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.bufferLog({ message, level: 'info', data })
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.bufferLog({ message, level: 'warn', data })
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const logData: LogData = {
      message,
      level: 'error',
      data: {
        ...data,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      },
      stackTrace: error instanceof Error ? error.stack : undefined
    }
    
    this.bufferLog(logData)
  }

  /**
   * Critical level logging (triggers immediate alerts)
   */
  critical(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const logData: LogData = {
      message,
      level: 'critical',
      data: {
        ...data,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      },
      stackTrace: error instanceof Error ? error.stack : undefined
    }
    
    this.bufferLog(logData)
  }

  /**
   * Log operation performance
   */
  performance(operation: string, duration: number, data?: Record<string, unknown>): void {
    this.bufferLog({
      message: `Operation completed: ${operation}`,
      level: 'info',
      operation,
      duration,
      data
    })
  }

  /**
   * Log user interaction
   */
  userAction(action: string, data?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, {
      action,
      ...data
    })
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      ...context
    })
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Global logger instance
export const logger = new Logger()

// Component-specific loggers
export const createComponentLogger = (component: string) => 
  logger.child({ component })

// Performance measurement utility
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T> | T,
  componentLogger?: Logger
): Promise<T> => {
  const startTime = performance.now()
  const log = componentLogger || logger
  
  try {
    log.debug(`Starting operation: ${operation}`)
    const result = await fn()
    const duration = performance.now() - startTime
    
    log.performance(operation, duration, { success: true })
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    log.error(`Operation failed: ${operation}`, error, { duration })
    throw error
  }
}

// Error boundary logging
export const logErrorBoundary = (error: Error, errorInfo: React.ErrorInfo) => {
  logger.critical('React Error Boundary triggered', error, {
    errorInfo,
    componentStack: errorInfo.componentStack
  })
}

// Unhandled error tracking
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled JavaScript error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise rejection', event.reason)
  })
}

export default logger
