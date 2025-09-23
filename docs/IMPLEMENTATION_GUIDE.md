# Implementation Guide: Quick Start Agent

## Overview
Step-by-step implementation guide for Solution 1: Quick Start Agent - an MCP-based project scaffolding agent with chat interface.

## Prerequisites
- Node.js 18+ installed
- Git installed and configured
- OpenAI API key
- Basic understanding of Next.js, TypeScript, and MCP protocol

## Implementation Timeline (3 hours)

### Phase 1: Project Setup (20 minutes)

#### 1.1 Initialize Next.js Project
```bash
npx create-next-app@latest project-scaffolder --typescript --tailwind --eslint --app
cd project-scaffolder
```

#### 1.2 Install Dependencies
```bash
# Core dependencies
npm install ai @ai-sdk/openai zod

# Development dependencies
npm install -D @types/node

# Additional utilities
npm install uuid clsx
```

#### 1.3 Environment Setup
```bash
# Create .env.local
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local
```

#### 1.4 Project Structure Setup
```bash
mkdir -p lib/templates types docs
mkdir -p app/api/mcp/tools app/components
```

### Phase 2: MCP Server Implementation (30 minutes)

#### 2.1 MCP Types Definition
Create `types/mcp.ts`:
```typescript
export interface MCPRequest {
  method: string
  params: Record<string, any>
  id: string | number
}

export interface MCPResponse {
  result?: any
  error?: MCPError
  id: string | number
}

export interface MCPError {
  code: number
  message: string
  data?: any
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}
```

#### 2.2 Git Tools Implementation
Create `lib/git-tools.ts`:
```typescript
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export class GitTools {
  static async initRepository(projectPath: string): Promise<void> {
    try {
      execSync('git init', { cwd: projectPath })

      // Create .gitignore
      const gitignore = `
node_modules/
.env.local
.env
dist/
build/
.DS_Store
*.log
.next/
coverage/
`.trim()

      fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore)
    } catch (error) {
      throw new Error(`Git init failed: ${error}`)
    }
  }

  static async addAndCommit(projectPath: string, message: string): Promise<void> {
    try {
      execSync('git add .', { cwd: projectPath })
      execSync(`git commit -m "${message}"`, { cwd: projectPath })
    } catch (error) {
      throw new Error(`Git commit failed: ${error}`)
    }
  }

  static async getStatus(projectPath: string): Promise<string> {
    try {
      return execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf8' })
    } catch (error) {
      return 'Not a git repository'
    }
  }
}
```

#### 2.3 MCP Tools Implementation
Create `app/api/mcp/tools/index.ts`:
```typescript
import * as fs from 'fs'
import * as path from 'path'
import { GitTools } from '@/lib/git-tools'
import { execSync } from 'child_process'

export const mcpTools = {
  create_directory: async (params: { path: string }) => {
    try {
      fs.mkdirSync(params.path, { recursive: true })
      return { success: true, path: params.path }
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`)
    }
  },

  write_file: async (params: { path: string; content: string }) => {
    try {
      const dir = path.dirname(params.path)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(params.path, params.content)
      return { success: true, path: params.path }
    } catch (error) {
      throw new Error(`Failed to write file: ${error}`)
    }
  },

  git_init: async (params: { path: string }) => {
    try {
      await GitTools.initRepository(params.path)
      return { success: true, message: 'Git repository initialized' }
    } catch (error) {
      throw new Error(`Git init failed: ${error}`)
    }
  },

  git_add_commit: async (params: { path: string; message: string }) => {
    try {
      await GitTools.addAndCommit(params.path, params.message)
      return { success: true, message: `Committed: ${params.message}` }
    } catch (error) {
      throw new Error(`Git commit failed: ${error}`)
    }
  },

  install_dependencies: async (params: { path: string; packages?: string[] }) => {
    try {
      const command = params.packages
        ? `npm install ${params.packages.join(' ')}`
        : 'npm install'

      execSync(command, { cwd: params.path })
      return { success: true, message: 'Dependencies installed' }
    } catch (error) {
      throw new Error(`Package installation failed: ${error}`)
    }
  },

  get_project_templates: async () => {
    const templates = [
      {
        id: 'react-ts',
        name: 'React TypeScript App',
        description: 'Vite + React + TypeScript + Tailwind CSS',
        files: ['src/', 'public/', 'package.json', 'tsconfig.json', 'vite.config.ts']
      },
      {
        id: 'nextjs-fullstack',
        name: 'Next.js Fullstack',
        description: 'Next.js 14 + TypeScript + Tailwind + App Router',
        files: ['app/', 'components/', 'lib/', 'package.json', 'next.config.js']
      },
      {
        id: 'node-api',
        name: 'Node.js API',
        description: 'Express + TypeScript + ESLint + Jest',
        files: ['src/', 'tests/', 'package.json', 'tsconfig.json']
      }
    ]
    return { templates }
  }
}
```

#### 2.4 MCP Server Route
Create `app/api/mcp/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { mcpTools } from './tools'
import { MCPRequest, MCPResponse } from '@/types/mcp'

export async function POST(request: NextRequest) {
  try {
    const mcpRequest: MCPRequest = await request.json()
    const { method, params, id } = mcpRequest

    if (!mcpTools[method as keyof typeof mcpTools]) {
      return NextResponse.json({
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        },
        id
      } as MCPResponse)
    }

    const tool = mcpTools[method as keyof typeof mcpTools]
    const result = await tool(params || {})

    return NextResponse.json({
      result,
      id
    } as MCPResponse)
  } catch (error) {
    return NextResponse.json({
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      },
      id: null
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
    }
  ]

  return NextResponse.json({ tools })
}
```

### Phase 3: Project Templates (25 minutes)

#### 3.1 Template System
Create `lib/templates/index.ts`:
```typescript
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  files: Record<string, string>
  dependencies: string[]
  devDependencies: string[]
}

export const templates: Record<string, ProjectTemplate> = {
  'react-ts': {
    id: 'react-ts',
    name: 'React TypeScript App',
    description: 'Vite + React + TypeScript + Tailwind CSS',
    dependencies: ['react', 'react-dom'],
    devDependencies: [
      '@types/react',
      '@types/react-dom',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      '@vitejs/plugin-react',
      'autoprefixer',
      'eslint',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
      'postcss',
      'tailwindcss',
      'typescript',
      'vite'
    ],
    files: {
      'package.json': `{
  "name": "react-ts-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {},
  "devDependencies": {}
}`,
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          React + TypeScript + Tailwind
        </h1>
        <div className="space-y-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
          <p className="text-gray-600">
            Edit <code className="bg-gray-200 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  )
}

export default App`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      'src/App.css': `/* Add custom styles here */`,
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
      'tsconfig.node.json': `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# React TypeScript App

A modern React application built with Vite, TypeScript, and Tailwind CSS.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts

- \`dev\`: Start development server
- \`build\`: Build for production
- \`lint\`: Run ESLint
- \`preview\`: Preview production build
`
    }
  }
}
```

### Phase 4: AI Service Integration (45 minutes)

#### 4.1 AI Service
Create `lib/ai-service.ts`:
```typescript
import { generateObject, generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const ProjectAnalysisSchema = z.object({
  projectType: z.enum(['react-ts', 'nextjs-fullstack', 'node-api', 'static', 'unknown']),
  features: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
})

const MCPActionSchema = z.object({
  actions: z.array(z.object({
    tool: z.string(),
    params: z.record(z.any()),
    description: z.string()
  })),
  response: z.string()
})

export class AIService {
  static async analyzeProjectRequest(userMessage: string) {
    try {
      const result = await generateObject({
        model: openai('gpt-3.5-turbo'),
        schema: ProjectAnalysisSchema,
        prompt: `
Analyze this project creation request and determine the best template:

User request: "${userMessage}"

Available templates:
- react-ts: Vite + React + TypeScript + Tailwind CSS
- nextjs-fullstack: Next.js 14 + TypeScript + Tailwind + App Router
- node-api: Express + TypeScript + ESLint + Jest
- static: Simple HTML/CSS/JS static site

Consider:
- Programming language/framework mentions
- Project type (frontend/backend/fullstack)
- Specific technologies mentioned
- Project complexity level

Return the most appropriate template with confidence score.
        `.trim()
      })

      return result.object
    } catch (error) {
      console.error('AI analysis failed:', error)
      return {
        projectType: 'react-ts' as const,
        features: [],
        confidence: 0.5,
        reasoning: 'Fallback to React TypeScript template'
      }
    }
  }

  static async generateMCPActions(userMessage: string, analysis: any) {
    try {
      const result = await generateObject({
        model: openai('gpt-3.5-turbo'),
        schema: MCPActionSchema,
        prompt: `
Create MCP tool actions for this project request:

User: "${userMessage}"
Analyzed as: ${analysis.projectType} (confidence: ${analysis.confidence})

Available MCP tools:
- create_directory(path): Create directories
- write_file(path, content): Write files
- git_init(path): Initialize git repo
- git_add_commit(path, message): Commit changes
- install_dependencies(path, packages?): Install npm packages

Generate a sequence of actions to:
1. Create project structure
2. Write template files
3. Initialize git repository
4. Install dependencies
5. Make initial commit

Keep the response message minimal and action-focused.
        `.trim()
      })

      return result.object
    } catch (error) {
      console.error('MCP action generation failed:', error)
      return {
        actions: [],
        response: 'Error generating project. Please try again.'
      }
    }
  }
}
```

#### 4.2 MCP Client
Create `lib/mcp-client.ts`:
```typescript
import { MCPRequest, MCPResponse } from '@/types/mcp'

export class MCPClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/mcp') {
    this.baseUrl = baseUrl
  }

  async call(method: string, params: Record<string, any> = {}): Promise<any> {
    const request: MCPRequest = {
      method,
      params,
      id: Date.now()
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const mcpResponse: MCPResponse = await response.json()

      if (mcpResponse.error) {
        throw new Error(`MCP Error: ${mcpResponse.error.message}`)
      }

      return mcpResponse.result
    } catch (error) {
      console.error('MCP call failed:', error)
      throw error
    }
  }

  async getAvailableTools() {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET'
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to get tools:', error)
      throw error
    }
  }
}
```

### Phase 5: Frontend Implementation (60 minutes)

#### 5.1 Chat Hook
Create `lib/hooks/useChat.ts`:
```typescript
import { useState, useCallback } from 'react'
import { MCPClient } from '@/lib/mcp-client'
import { AIService } from '@/lib/ai-service'
import { templates } from '@/lib/templates'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ProjectInfo {
  name: string
  path: string
  template: string
  status: 'creating' | 'completed' | 'error'
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const mcpClient = new MCPClient()

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

  const executeProjectCreation = async (actions: any[], projectPath: string) => {
    try {
      for (const action of actions) {
        console.log(`Executing: ${action.tool}`, action.params)
        await mcpClient.call(action.tool, action.params)
      }

      setCurrentProject(prev => prev ? { ...prev, status: 'completed' } : null)
      return true
    } catch (error) {
      console.error('Project creation failed:', error)
      setCurrentProject(prev => prev ? { ...prev, status: 'error' } : null)
      throw error
    }
  }

  const sendMessage = async (content: string) => {
    if (isLoading) return

    setIsLoading(true)
    addMessage('user', content)

    try {
      // 1. Analyze user request with AI
      const analysis = await AIService.analyzeProjectRequest(content)

      // 2. Extract project name and path
      const projectName = content.match(/(?:create|build|make)\s+(?:a\s+)?(.+?)(?:\s+(?:project|app))?$/i)?.[1] || 'my-project'
      const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const projectPath = `/tmp/projects/${sanitizedName}-${Date.now()}`

      // 3. Set project info
      setCurrentProject({
        name: sanitizedName,
        path: projectPath,
        template: analysis.projectType,
        status: 'creating'
      })

      // 4. Generate MCP actions
      const { actions, response } = await AIService.generateMCPActions(content, analysis)

      // Add template files to actions
      const template = templates[analysis.projectType]
      if (template) {
        // Create directory
        actions.unshift({
          tool: 'create_directory',
          params: { path: projectPath },
          description: 'Create project directory'
        })

        // Write template files
        Object.entries(template.files).forEach(([filePath, fileContent]) => {
          actions.push({
            tool: 'write_file',
            params: {
              path: `${projectPath}/${filePath}`,
              content: fileContent
            },
            description: `Create ${filePath}`
          })
        })

        // Initialize git
        actions.push({
          tool: 'git_init',
          params: { path: projectPath },
          description: 'Initialize git repository'
        })

        // Install dependencies
        actions.push({
          tool: 'install_dependencies',
          params: { path: projectPath },
          description: 'Install dependencies'
        })

        // Initial commit
        actions.push({
          tool: 'git_add_commit',
          params: {
            path: projectPath,
            message: `Initial commit: ${template.name} project`
          },
          description: 'Create initial commit'
        })
      }

      // 5. Execute actions
      addMessage('assistant', '✓ Creating project...')
      await executeProjectCreation(actions, projectPath)
      addMessage('assistant', '✓ Project created successfully. Ready to code!')

    } catch (error) {
      console.error('Chat error:', error)
      addMessage('assistant', 'Sorry, something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    currentProject,
    sendMessage
  }
}
```

#### 5.2 Chat Interface Component
Create `app/components/ChatInterface.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { ProjectPreview } from './ProjectPreview'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, isLoading, currentProject, sendMessage } = useChat()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🚀 Project Scaffolder</h1>
        <p className="text-gray-600">Create projects with natural language</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Panel */}
        <div className="flex flex-col">
          <div className="flex-1 border rounded-lg p-4 overflow-y-auto mb-4 bg-white">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p className="mb-4">👋 Hi! I can help you create projects.</p>
                <p className="text-sm">Try: "Create a React app with TypeScript"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'Agent'}
                    </div>
                    <div className="text-gray-800">{message.content}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-gray-50 mr-8 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Agent</div>
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-gray-600">Working...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your project..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>

        {/* Project Preview Panel */}
        <div className="border rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">Project Preview</h2>
          {currentProject ? (
            <ProjectPreview project={currentProject} />
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No project created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### 5.3 Project Preview Component
Create `app/components/ProjectPreview.tsx`:
```typescript
'use client'

import { templates } from '@/lib/templates'

interface ProjectInfo {
  name: string
  path: string
  template: string
  status: 'creating' | 'completed' | 'error'
}

interface ProjectPreviewProps {
  project: ProjectInfo
}

export function ProjectPreview({ project }: ProjectPreviewProps) {
  const template = templates[project.template]

  const getStatusIcon = () => {
    switch (project.status) {
      case 'creating':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      case 'completed':
        return <span className="text-green-500">✓</span>
      case 'error':
        return <span className="text-red-500">✗</span>
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (project.status) {
      case 'creating':
        return 'Creating...'
      case 'completed':
        return 'Ready to code!'
      case 'error':
        return 'Creation failed'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Project Info */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">{project.name}</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{template?.description || 'Unknown template'}</p>
        <p className="text-xs text-gray-500 mt-1">Path: {project.path}</p>
      </div>

      {/* File Structure */}
      {template && (
        <div>
          <h4 className="font-medium mb-2">File Structure</h4>
          <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
            <div className="space-y-1">
              {Object.keys(template.files).map((filePath) => (
                <div key={filePath} className="flex items-center space-x-2">
                  <span className="text-blue-400">📄</span>
                  <span>{filePath}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {project.status === 'completed' && (
        <div>
          <h4 className="font-medium mb-2">Next Steps</h4>
          <div className="bg-green-50 p-3 rounded-lg text-sm">
            <ol className="list-decimal list-inside space-y-1">
              <li>cd {project.name}</li>
              <li>npm run dev</li>
              <li>Open in your editor</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### 5.4 Main Page
Update `app/page.tsx`:
```typescript
import { ChatInterface } from './components/ChatInterface'

export default function Home() {
  return <ChatInterface />
}
```

### Phase 6: Testing & Polish (30 minutes)

#### 6.1 Basic Testing
Create test project creation:
```bash
# Test MCP server
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "get_project_templates", "params": {}, "id": 1}'

# Test git tools
mkdir test-project
cd test-project
git init
echo "# Test" > README.md
git add .
git commit -m "Initial commit"
```

#### 6.2 Error Handling
Add error boundaries and graceful fallbacks:
- Network errors during MCP calls
- Git command failures
- Invalid file paths
- Permission errors

#### 6.3 UI Polish
- Loading states
- Error messages
- Success animations
- Responsive design

## Deployment Considerations

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### Security
- Input validation for file paths
- Sanitize user inputs
- Rate limiting for API calls
- Secure file operations

### Performance
- Streaming responses for large projects
- Background file generation
- Template caching
- Optimized bundle size

## Testing Checklist

- [ ] MCP server endpoints respond correctly
- [ ] Git operations work in different environments
- [ ] File generation creates valid projects
- [ ] Chat interface handles errors gracefully
- [ ] Project templates are functional
- [ ] AI analysis produces reasonable results
- [ ] Dependencies install correctly
- [ ] Generated projects can be run

## Common Issues & Solutions

### Git Issues
- **Problem**: Git not found
- **Solution**: Check git installation, provide fallback

### File Permissions
- **Problem**: Cannot write files
- **Solution**: Validate paths, handle permission errors

### Network Issues
- **Problem**: OpenAI API timeout
- **Solution**: Implement retries, fallback responses

### Template Issues
- **Problem**: Invalid package.json
- **Solution**: Validate templates, test generation

---

This guide provides complete implementation steps for the Quick Start Agent. Follow each phase sequentially, testing at each step to ensure everything works correctly.
