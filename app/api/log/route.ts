import { NextRequest, NextResponse } from 'next/server'

export interface LogData {
  message: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  data?: Record<string, unknown>
  timestamp?: string
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  component?: string
  operation?: string
  duration?: number
  stackTrace?: string
}

export interface LogResponse {
  status: 'success' | 'error'
  message: string
  logId?: string
}

/**
 * Centralized logging API route for Vercel deployment
 * Handles frontend logging, error tracking, and monitoring
 */
export async function POST(request: NextRequest): Promise<NextResponse<LogResponse>> {
  try {
    const body: LogData = await request.json()
    const {
      message,
      level = 'info',
      data = {},
      userId,
      sessionId,
      component,
      operation,
      duration,
      stackTrace
    } = body

    // Extract additional context from request
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const url = request.headers.get('referer') || request.url
    const timestamp = new Date().toISOString()
    const logId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Construct comprehensive log entry
    const logEntry = {
      id: logId,
      timestamp,
      level,
      message,
      context: {
        userId,
        sessionId,
        userAgent,
        url,
        component,
        operation,
        duration
      },
      data,
      stackTrace
    }

    // Log to Vercel runtime logs (visible in Vercel dashboard)
    const logPrefix = `[${level.toUpperCase()}]`
    const logMessage = `${logPrefix} ${message}`
    
    switch (level) {
      case 'critical':
      case 'error':
        console.error(logMessage, logEntry)
        break
      case 'warn':
        console.warn(logMessage, logEntry)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, logEntry)
        }
        break
      default:
        console.log(logMessage, logEntry)
    }

    // Forward to external logging service if configured
    if (process.env.EXTERNAL_LOGGING_ENDPOINT) {
      try {
        await fetch(process.env.EXTERNAL_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXTERNAL_LOGGING_TOKEN || ''}`
          },
          body: JSON.stringify(logEntry)
        })
      } catch (externalError) {
        console.error('Failed to forward log to external service:', externalError)
      }
    }

    // For critical errors, also send alerts (if configured)
    if (level === 'critical' && process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Error in Project Scaffolder`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Message', value: message, short: false },
                { title: 'Component', value: component || 'Unknown', short: true },
                { title: 'User', value: userId || 'Anonymous', short: true },
                { title: 'URL', value: url, short: false }
              ]
            }]
          })
        })
      } catch (alertError) {
        console.error('Failed to send critical alert:', alertError)
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Log received and processed',
      logId
    })

  } catch (error) {
    console.error('Logging API error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to process log entry'
    }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'success',
    message: 'Logging API is operational',
    timestamp: new Date().toISOString()
  })
}
