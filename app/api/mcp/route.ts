import { NextRequest, NextResponse } from 'next/server'
import { mcpTools } from './tools'
import type { MCPRequest, MCPResponse } from '@/types'
import { CONFIG } from '@/lib/config'
import { ErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/result'

// Security headers for all responses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export const POST = ErrorHandler.wrapAPIHandler(async (request: NextRequest) => {
  let requestId: string | number = 0

  // Validate request size (protect against large payloads)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > CONFIG.LIMITS.MAX_REQUEST_SIZE) {
    throw new ValidationError(
      'Request payload too large',
      'content-length',
      { size: contentLength, limit: CONFIG.LIMITS.MAX_REQUEST_SIZE }
    )
  }

  const mcpRequest: MCPRequest = await request.json()
  const { method, params, id } = mcpRequest
  requestId = id

  // Validate request structure
  if (!method || typeof method !== 'string') {
    throw new ValidationError('Invalid method parameter', 'method')
  }

  if (!mcpTools[method as keyof typeof mcpTools]) {
    throw new ValidationError(`Method not found: ${method}`, 'method')
  }

  const tool = mcpTools[method as keyof typeof mcpTools]
  const result = await (tool as (...args: unknown[]) => Promise<unknown>)(params || {})

  const response = NextResponse.json({ result, id: requestId } as MCPResponse)
  return addSecurityHeaders(response)
})

export const GET = ErrorHandler.wrapAPIHandler(async () => {
  const tools = Object.keys(mcpTools).map(name => ({
    name,
    description: `MCP tool: ${name}`
  }))

  const response = NextResponse.json({ tools })
  return addSecurityHeaders(response)
})