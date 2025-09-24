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
      name: 'git_status',
      description: 'Get git repository status',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' }
        },
        required: ['path']
      }
    },
    {
      name: 'git_create_branch',
      description: 'Create a new git branch',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' },
          branchName: { type: 'string', description: 'Branch name' }
        },
        required: ['path', 'branchName']
      }
    },
    {
      name: 'git_set_remote',
      description: 'Set git remote origin URL',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' },
          remoteUrl: { type: 'string', description: 'Remote repository URL' }
        },
        required: ['path', 'remoteUrl']
      }
    },
    {
      name: 'git_configure_user',
      description: 'Configure git user name and email for repository (uses environment variables as fallback)',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' },
          name: { type: 'string', description: 'User name (optional if GIT_USER_NAME env var is set)' },
          email: { type: 'string', description: 'User email (optional if GIT_USER_EMAIL env var is set)' }
        },
        required: ['path']
      }
    },
    {
      name: 'git_history',
      description: 'Get git commit history',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' },
          limit: { type: 'number', description: 'Number of commits to show (default: 10)' }
        },
        required: ['path']
      }
    },
    {
      name: 'git_configure_user_from_env',
      description: 'Configure git user from environment variables (GIT_USER_NAME and GIT_USER_EMAIL)',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Project path' }
        },
        required: ['path']
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
    },
    {
      name: 'analyze_project_request',
      description: 'Use AI to analyze project requirements and recommend optimal templates and features',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Natural language description of the project to create' }
        },
        required: ['description']
      }
    },
    {
      name: 'generate_project_plan',
      description: 'Generate intelligent step-by-step project creation plan using AI analysis',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Project description' },
          projectPath: { type: 'string', description: 'Target project path' },
          projectName: { type: 'string', description: 'Optional project name' }
        },
        required: ['description', 'projectPath']
      }
    },
    {
      name: 'intelligent_project_setup',
      description: 'AI-powered complete project setup with analysis, planning, and optional execution',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Project requirements in natural language' },
          projectPath: { type: 'string', description: 'Where to create the project' },
          autoExecute: { type: 'boolean', description: 'Whether to automatically execute the plan (default: false)' }
        },
        required: ['description', 'projectPath']
      }
    },
    {
      name: 'create_project_with_ai',
      description: 'Server-side only AI-powered project creation (secure, complete workflow)',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Natural language project description' },
          projectPath: { type: 'string', description: 'Optional project path (auto-generated if not provided)' },
          projectName: { type: 'string', description: 'Optional project name (extracted from description if not provided)' }
        },
        required: ['description']
      }
    },
    {
      name: 'analyze_and_optimize',
      description: 'Enhanced AI analysis with project optimization and workflow recommendations',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Project description for analysis' },
          projectType: { type: 'string', description: 'Optional project type override' },
          includeOptimization: { type: 'boolean', description: 'Include optimization recommendations (default: false)' }
        },
        required: ['description']
      }
    }
  ]

  return NextResponse.json({ tools })
}
