import { NextResponse } from 'next/server'
import { ConfigHelpers } from '@/lib/config'

export async function GET() {
  try {
    // Check essential services
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        openai: !!process.env.OPENAI_API_KEY,
        github: !!process.env.GITHUB_TOKEN,
        githubOwner: process.env.GITHUB_OWNER || 'default (authenticated user)',
        // Add other service checks as needed
      },
      uptime: process.uptime(),
      memory: {
        used: ConfigHelpers.bytesToMB(process.memoryUsage().heapUsed),
        total: ConfigHelpers.bytesToMB(process.memoryUsage().heapTotal),
        limit: ConfigHelpers.bytesToMB(process.memoryUsage().rss)
      }
    }

    // Determine overall health status
    const hasRequiredServices = healthChecks.services.openai && healthChecks.services.github
    if (!hasRequiredServices) {
      healthChecks.status = 'degraded'
    }

    const statusCode = healthChecks.status === 'healthy' ? 200 : 503

    const response = NextResponse.json(healthChecks, { status: statusCode })

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

    return response
  } catch (error) {
    console.error('Health check failed:', error)

    const response = NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

    return response
  }
}
