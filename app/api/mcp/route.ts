import { NextRequest, NextResponse } from 'next/server'
import { mcpTools } from './tools'
import type { MCPRequest, MCPResponse } from '@/types'

// Security headers for all responses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export async function POST(request: NextRequest) {
  let requestId: string | number = 0

  try {
    // Validate request size (protect against large payloads)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
      const response = NextResponse.json({
        error: { code: -32000, message: 'Request payload too large' },
        id: requestId
      } as MCPResponse, { status: 413 })
      return addSecurityHeaders(response)
    }

    const mcpRequest: MCPRequest = await request.json()
    const { method, params, id } = mcpRequest
    requestId = id

    // Validate request structure
    if (!method || typeof method !== 'string') {
      const response = NextResponse.json({
        error: { code: -32600, message: 'Invalid method parameter' },
        id: requestId
      } as MCPResponse, { status: 400 })
      return addSecurityHeaders(response)
    }

    if (!mcpTools[method as keyof typeof mcpTools]) {
      const response = NextResponse.json({
        error: { code: -32601, message: `Method not found: ${method}` },
        id: requestId
      } as MCPResponse, { status: 404 })
      return addSecurityHeaders(response)
    }

    const tool = mcpTools[method as keyof typeof mcpTools]
    const result = await (tool as (...args: unknown[]) => Promise<unknown>)(params || {})

    const response = NextResponse.json({ result, id: requestId } as MCPResponse)
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('MCP API Error:', error)

    const response = NextResponse.json({
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      },
      id: requestId
    } as MCPResponse, { status: 500 })
    return addSecurityHeaders(response)
  }
}

export async function GET() {
  try {
    const tools = Object.keys(mcpTools).map(name => ({
      name,
      description: `MCP tool: ${name}`
    }))

    const response = NextResponse.json({ tools })
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Failed to get tools:', error)
    const response = NextResponse.json(
      { error: 'Failed to get tools' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}