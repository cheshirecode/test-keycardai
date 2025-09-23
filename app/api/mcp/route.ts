import { NextRequest, NextResponse } from 'next/server'
import { mcpTools } from './tools'
import { MCPRequest, MCPResponse } from '@/types/mcp'

export async function POST(request: NextRequest) {
  let requestId: string | number = 0
  try {
    const mcpRequest: MCPRequest = await request.json()
    const { method, params, id } = mcpRequest
    requestId = id

    if (!mcpTools[method as keyof typeof mcpTools]) {
      return NextResponse.json({
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        },
        id: requestId
      } as MCPResponse)
    }

    const tool = mcpTools[method as keyof typeof mcpTools]
    const result = await (tool as (...args: unknown[]) => Promise<unknown>)(params || {})

    return NextResponse.json({
      result,
      id: requestId
    } as MCPResponse)
  } catch (error) {
    return NextResponse.json({
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      },
      id: requestId
    } as MCPResponse)
  }
}

export async function GET() {
  // Return available tools for discovery
  const tools = [
    {
      name: 'create_directory',
      description: 'Create a directory at the specified path',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to create' }
        },
        required: ['path']
      }
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'git_init',
      description: 'Initialize a git repository',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' }
        },
        required: ['path']
      }
    },
    {
      name: 'git_add_commit',
      description: 'Add all changes and commit',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' },
          message: { type: 'string', description: 'Commit message' }
        },
        required: ['path', 'message']
      }
    },
    {
      name: 'install_dependencies',
      description: 'Install npm dependencies',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' },
          packages: { type: 'array', items: { type: 'string' }, description: 'Package names' }
        },
        required: ['path']
      }
    },
    {
      name: 'get_project_templates',
      description: 'Get available project templates',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'setup_project_from_template',
      description: 'Create a project from a template',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: { type: 'string', description: 'Path where project will be created' },
          templateId: { type: 'string', description: 'Template identifier' },
          projectName: { type: 'string', description: 'Project name (optional)' }
        },
        required: ['projectPath', 'templateId']
      }
    }
  ]

  return NextResponse.json({ tools })
}
