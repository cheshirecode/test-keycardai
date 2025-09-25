/**
 * Repository API Route - MCP Server Actions
 * Enhanced with security validations and permission checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { ErrorHandler } from '@/lib/error-handler'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { ListRepositoriesParams, DeleteRepositoryParams } from '@/types/mcp-tools'

/**
 * Get repositories using MCP server action
 */
export const GET = ErrorHandler.wrapAPIHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  
  const params: ListRepositoriesParams = {
    owner: searchParams.get('owner') || undefined,
    nameFilter: searchParams.get('nameFilter') || undefined,
    type: (searchParams.get('type') as 'all' | 'public' | 'private') || undefined,
    sort: (searchParams.get('sort') as 'created' | 'updated' | 'pushed' | 'full_name') || undefined,
    direction: (searchParams.get('direction') as 'asc' | 'desc') || undefined
  }

  const mcpClient = new TypedMCPClient()
  const result = await mcpClient.call('list_repositories', params)

  if (!result.success) {
    return NextResponse.json({
      success: false,
      message: result.message
    }, { status: 400 })
  }

  return NextResponse.json(result)
})

/**
 * Delete repository using MCP server action with enhanced permission validation
 */
export const DELETE = ErrorHandler.wrapAPIHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  const params: DeleteRepositoryParams = {
    owner: body.owner,
    repo: body.repo
  }

  if (!params.owner || !params.repo) {
    return NextResponse.json({
      success: false,
      message: 'Owner and repository name are required'
    }, { status: 400 })
  }

  const mcpClient = new TypedMCPClient()
  
  // First validate permissions
  const permissionCheck = await mcpClient.call('validate_repository_permissions', { 
    owner: params.owner 
  })

  if (!permissionCheck.canDelete) {
    return NextResponse.json({
      success: false,
      message: permissionCheck.message,
      details: {
        githubOwner: permissionCheck.githubOwner,
        authenticatedUser: permissionCheck.authenticatedUser,
        requestedOwner: params.owner
      }
    }, { status: 403 })
  }

  // Proceed with deletion if permissions are valid
  const result = await mcpClient.call('delete_repository', params)

  if (!result.success) {
    return NextResponse.json({
      success: false,
      message: result.message
    }, { status: 400 })
  }

  return NextResponse.json(result)
})

/**
 * Validate repository permissions endpoint
 */
export const POST = ErrorHandler.wrapAPIHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  if (!body.owner) {
    return NextResponse.json({
      success: false,
      message: 'Owner parameter is required'
    }, { status: 400 })
  }

  const mcpClient = new TypedMCPClient()
  const result = await mcpClient.call('validate_repository_permissions', { 
    owner: body.owner 
  })

  return NextResponse.json(result)
})
