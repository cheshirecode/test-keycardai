# API Reference: AI-Powered MCP Project Scaffolder

## Overview
This document provides complete API documentation for the AI-powered MCP Project Scaffolder, featuring intelligent decision-making, GitHub API integration, and comprehensive project automation capabilities.

## 🏗️ System Architecture

The system uses a sophisticated architecture with AI at its core:

### **Security-First Design**
- ✅ **Server-side AI**: All LLM operations happen on the server
- ✅ **No API Key Exposure**: OpenAI and GitHub tokens never reach client
- ✅ **Environment Variables**: All secrets managed server-side
- ✅ **MCP Protocol**: Standardized tool interface for extensibility

### **AI Integration**
- ✅ **OpenAI GPT-3.5-turbo**: Powers all intelligent decision-making
- ✅ **Confidence Scoring**: AI provides confidence levels for recommendations
- ✅ **Natural Language Processing**: Understands complex project requirements
- ✅ **Fallback Systems**: Graceful degradation when AI unavailable

### **GitHub API Integration**
- ✅ **Repository Automation**: Direct GitHub repository creation with full project files
- ✅ **Organization Support**: Configurable repository ownership (personal/organization)
- ✅ **Serverless Compatible**: No local git CLI dependency
- ✅ **Automatic Commits**: Complete project files committed directly to GitHub
- ✅ **Repository Metadata**: Persistent tracking to ensure proper file uploads
- ✅ **Token-based Auth**: Secure API authentication

## MCP Protocol Implementation

### Base URL
```
Local Development: http://localhost:3000/api/mcp
Production: https://test-keycardai-hmmx4tn4f-dac4158s-projects.vercel.app/api/mcp
```

### Request Format
All MCP requests follow the JSON-RPC 2.0 specification:

```typescript
interface MCPRequest {
  method: string           // Tool name to execute
  params: Record<string, any>  // Tool parameters
  id: string | number      // Request identifier
}
```

### Response Format
```typescript
interface MCPResponse {
  result?: any            // Tool execution result
  error?: MCPError       // Error information (if failed)
  id: string | number    // Matches request ID
}

interface MCPError {
  code: number           // Error code
  message: string        // Human-readable error message
  data?: any            // Additional error context
}
```

## 🔐 Security & API Configuration

**SECURITY FIRST**: All sensitive operations happen server-side to protect API keys and tokens.

### Environment Variables (Server-Side Only)
```bash
# Required for AI functionality
OPENAI_API_KEY=sk-your-openai-key

# Required for GitHub repository operations
GITHUB_TOKEN=ghp-your-github-token

# Optional: specify organization/user for repository creation
GITHUB_ORG=mcp-integration

# Optional for commit authorship
GIT_USER_NAME=Your Name
GIT_USER_EMAIL=your.email@example.com
```

### Security Measures
- ✅ **No Client-Side API Keys**: All LLM calls happen on server
- ✅ **Environment Variable Encryption**: Vercel encrypts all sensitive data
- ✅ **Token Scope Limitation**: GitHub token has minimal required permissions
- ✅ **Request Validation**: All inputs sanitized server-side
- ✅ **Error Masking**: Detailed errors not exposed to client

### GitHub Token Setup
1. Visit [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `user`
4. Set in Vercel dashboard environment variables

### Architecture Benefits
- ✅ **Serverless Compatible**: No local git CLI dependency
- ✅ **Direct GitHub Integration**: Repository operations via HTTP API
- ✅ **Automatic Repository Creation**: GitHub repos created automatically
- ✅ **Production Ready**: Works perfectly in Vercel environment
- ✅ **No Git Installation Required**: Pure API-based operations

### Recommended Workflow
```bash
git_init → git_configure_user → git_add_commit
```

### Production Considerations
- **Vercel serverless functions** don't have persistent git configuration
- **SOLUTION**: Use `GIT_USER_NAME` and `GIT_USER_EMAIL` environment variables
- **Automatic configuration**: `git_init` auto-configures user from environment variables
- **Deployment authentication** requires commit author to have Vercel project access
- **Generated projects** work automatically with environment variables configured

### Environment Variable Configuration
Set these in your deployment environment (e.g., Vercel dashboard):
```bash
GIT_USER_NAME=Project Scaffolder
GIT_USER_EMAIL=scaffolder@example.com
```

**Benefits:**
- ✅ **Automatic git user configuration** in all environments
- ✅ **No manual `git_configure_user` calls needed**
- ✅ **Consistent authorship** across all generated projects
- ✅ **Works in development and production**

## 🤖 AI-Powered MCP Tools

The system now includes sophisticated AI-powered tools that use OpenAI GPT-3.5-turbo for intelligent decision-making. These tools provide advanced project analysis, planning, and execution capabilities.

### 1. analyze_project_request

**AI-powered natural language project analysis with intelligent recommendations.**

**Method:** `analyze_project_request`

**Parameters:**
```typescript
{
  description: string  // Natural language project description
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  analysis: {
    projectType: 'react-ts' | 'nextjs-fullstack' | 'node-api' | 'unknown'
    features: string[]          // Detected features
    confidence: number          // AI confidence (0-1)
    reasoning: string           // AI reasoning for decisions
    recommendedName: string     // Suggested project name
    aiPowered: boolean          // Always true for this tool
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "analyze_project_request",
    "params": {
      "description": "Create a React app with authentication and dashboard"
    },
    "id": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Analyzed project requirements with 95% confidence",
  "analysis": {
    "projectType": "react-ts",
    "features": ["authentication", "dashboard", "routing"],
    "confidence": 0.95,
    "reasoning": "User wants React app with auth features, React TypeScript is optimal choice",
    "recommendedName": "auth-dashboard-app",
    "aiPowered": true
  }
}
```

### 2. generate_project_plan

**AI creates intelligent step-by-step project creation plans with confidence scoring.**

**Method:** `generate_project_plan`

**Parameters:**
```typescript
{
  description: string    // Project description
  projectPath: string    // Target project path
  projectName?: string   // Optional project name
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  plan: {
    analysis: {
      projectType: string
      confidence: number
      reasoning: string
      features: string[]
    }
    actions: Array<{
      tool: string
      params: Record<string, unknown>
      description: string
    }>
    expectedOutcome: string
    totalSteps: number
    aiPowered: boolean
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "generate_project_plan",
    "params": {
      "description": "Build a Next.js e-commerce site with payments",
      "projectPath": "/tmp/ecommerce-site"
    },
    "id": 1
  }'
```

### 3. intelligent_project_setup

**Complete AI-powered project setup with analysis, planning, and optional execution.**

**Method:** `intelligent_project_setup`

**Parameters:**
```typescript
{
  description: string    // Project requirements in natural language
  projectPath: string    // Where to create the project
  autoExecute?: boolean   // Whether to automatically execute the plan (default: false)
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  analysis: {
    projectType: string
    confidence: number
    reasoning: string
    features: string[]
    recommendedName: string
  }
  plannedActions: string[]
  executionResults?: Array<{
    action: string
    tool: string
    success: boolean
    result?: any
    error?: string
  }>
  aiPowered: boolean
  llmUsed: string
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "intelligent_project_setup",
    "params": {
      "description": "Create a Node.js API with authentication",
      "projectPath": "/tmp/auth-api",
      "autoExecute": true
    },
    "id": 1
  }'
```

### 4. create_project_with_ai

**Server-side only complete AI-powered project creation (most secure option).**

**Method:** `create_project_with_ai`

**Parameters:**
```typescript
{
  description: string         // Natural language project description
  projectPath?: string        // Optional project path (auto-generated if not provided)
  projectName?: string        // Optional project name (extracted from description if not provided)
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  project: {
    name: string
    path: string
    type: string
    description: string
    confidence: number
    reasoning: string
    features: string[]
    repositoryUrl: string
    totalSteps: number
    executionSteps: Array<{
      step: number
      action: string
      tool: string
      success: boolean
      result?: any
      error?: string
      timestamp: string
    }>
    createdAt: string
    aiPowered: boolean
    llmUsed: string
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "create_project_with_ai",
    "params": {
      "description": "Build a React dashboard with charts and data visualization"
    },
    "id": 1
  }'
```

### 5. analyze_and_optimize

**Enhanced AI analysis with project optimization and workflow recommendations.**

**Method:** `analyze_and_optimize`

**Parameters:**
```typescript
{
  description: string           // Project description for analysis
  projectType?: string          // Optional project type override
  includeOptimization?: boolean // Include optimization recommendations (default: false)
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  analysis: {
    projectAnalysis: {
      projectType: string
      confidence: number
      reasoning: string
      features: string[]
    }
    optimization?: {
      recommendations: string[]
      reasoning: string
      aiPowered: boolean
    }
    aiPowered: boolean
    processingTime: number
    modelUsed: string
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "analyze_and_optimize",
    "params": {
      "description": "Create a scalable web application",
      "includeOptimization": true
    },
    "id": 1
  }'
```

## Available MCP Tools

### 1. create_directory

Creates a directory at the specified path.

**Method:** `create_directory`

**Parameters:**
```typescript
{
  path: string  // Directory path to create (supports nested paths)
}
```

**Response:**
```typescript
{
  success: boolean
  path: string     // Created directory path
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "create_directory",
    "params": {"path": "/tmp/my-project/src"},
    "id": 1
  }'
```

**Error Codes:**
- `-32603`: Directory creation failed (permissions, invalid path)

---

### 2. write_file

Writes content to a file, creating parent directories if needed.

**Method:** `write_file`

**Parameters:**
```typescript
{
  path: string,     // File path (relative or absolute)
  content: string   // File content to write
}
```

**Response:**
```typescript
{
  success: boolean
  path: string      // Written file path
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "write_file",
    "params": {
      "path": "/tmp/my-project/package.json",
      "content": "{\n  \"name\": \"my-project\"\n}"
    },
    "id": 2
  }'
```

**Error Codes:**
- `-32603`: File write failed (permissions, disk space, invalid path)

---

### 3. git_init

Initializes a Git repository in the specified directory.

**Method:** `git_init`

**Parameters:**
```typescript
{
  path: string  // Project directory path
}
```

**Response:**
```typescript
{
  success: boolean
  message: string   // Confirmation message
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_init",
    "params": {"path": "/tmp/my-project"},
    "id": 3
  }'
```

**What it does:**
- Runs `git init` in the specified directory
- Creates a `.gitignore` file with common ignore patterns
- Sets up initial git configuration

**⚠️ Git User Configuration:**
- **Uses system's global git configuration** (`git config --global user.name` and `git config --global user.email`)
- If no global config exists, commits will fail
- Use `git_configure_user` to set repository-specific user configuration
- **Recommendation**: Always call `git_configure_user` after `git_init` for consistent authorship

**Error Codes:**
- `-32603`: Git initialization failed (git not installed, permissions)

---

### 4. git_add_commit

Adds all changes and creates a commit with the specified message.

**Method:** `git_add_commit`

**Parameters:**
```typescript
{
  path: string,     // Project directory path
  message: string   // Commit message
}
```

**Response:**
```typescript
{
  success: boolean
  message: string   // Commit confirmation
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_add_commit",
    "params": {
      "path": "/tmp/my-project",
      "message": "Initial commit"
    },
    "id": 4
  }'
```

**What it does:**
- Runs `git add .` to stage all changes
- Runs `git commit -m "message"` to create commit

**⚠️ Git User Configuration:**
- **Requires git user configuration** (either global or repository-specific)
- **Uses system's global git user** if no repository-specific config exists
- **Current system user**: `cheshireCode <dac4158@gmail.com>` (from global config)
- **Recommendation**: Use `git_configure_user` first to set desired commit author

**Error Codes:**
- `-32603`: Git commit failed (no changes, invalid repository, missing user config)

---

### 5. git_status

Get the current status of a git repository.

**Method:** `git_status`

**Parameters:**
```typescript
{
  path: string  // Project directory path
}
```

**Response:**
```typescript
{
  success: boolean
  status: string    // Git status output
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_status",
    "params": {"path": "/tmp/my-project"},
    "id": 5
  }'
```

---

### 6. git_create_branch

Create a new git branch and switch to it.

**Method:** `git_create_branch`

**Parameters:**
```typescript
{
  path: string,        // Project directory path
  branchName: string   // Name of the new branch
}
```

**Response:**
```typescript
{
  success: boolean
  message: string   // Confirmation message
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_create_branch",
    "params": {
      "path": "/tmp/my-project",
      "branchName": "feature/new-feature"
    },
    "id": 6
  }'
```

---

### 7. git_set_remote

Set or update the git remote origin URL.

**Method:** `git_set_remote`

**Parameters:**
```typescript
{
  path: string,      // Project directory path
  remoteUrl: string  // Remote repository URL
}
```

**Response:**
```typescript
{
  success: boolean
  message: string   // Confirmation message
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_set_remote",
    "params": {
      "path": "/tmp/my-project",
      "remoteUrl": "https://github.com/user/repo.git"
    },
    "id": 7
  }'
```

---

### 8. git_configure_user

Configure git user name and email for a specific repository.

**Method:** `git_configure_user`

**Parameters:**
```typescript
{
  path: string,   // Project directory path
  name: string,   // User name
  email: string   // User email
}
```

**Response:**
```typescript
{
  success: boolean
  message: string   // Confirmation message
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_configure_user",
    "params": {
      "path": "/tmp/my-project",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "id": 8
  }'
```

**What it does:**
- Sets repository-specific git user configuration
- Overrides global git configuration for this repository
- **Essential for consistent commit authorship** in generated projects

**⚠️ Important Notes:**
- **Repository-specific config takes precedence** over global config
- **Recommended workflow**: Always call this after `git_init` and before `git_add_commit`
- **Without this**: Commits will use system's global git user (`cheshireCode <dac4158@gmail.com>`)
- **Use case**: Ensure generated projects have correct commit authorship

**Common Usage Pattern:**
```bash
# 1. Initialize repository
curl -X POST http://localhost:3000/api/mcp -d '{"method": "git_init", "params": {"path": "/tmp/my-project"}, "id": 1}'

# 2. Configure user (IMPORTANT!)
curl -X POST http://localhost:3000/api/mcp -d '{"method": "git_configure_user", "params": {"path": "/tmp/my-project", "name": "Project Owner", "email": "owner@example.com"}, "id": 2}'

# 3. Make commits with correct authorship
curl -X POST http://localhost:3000/api/mcp -d '{"method": "git_add_commit", "params": {"path": "/tmp/my-project", "message": "Initial commit"}, "id": 3}'
```

---

### 9. git_history

Get the commit history of a git repository.

**Method:** `git_history`

**Parameters:**
```typescript
{
  path: string,    // Project directory path
  limit?: number   // Number of commits to show (default: 10)
}
```

**Response:**
```typescript
{
  success: boolean
  history: string   // Commit history output
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_history",
    "params": {
      "path": "/tmp/my-project",
      "limit": 5
    },
    "id": 9
  }'
```

---

### 10. git_configure_user_from_env

Configure git user from environment variables only.

**Method:** `git_configure_user_from_env`

**Parameters:**
```typescript
{
  path: string    // Project directory path
}
```

**Response:**
```typescript
{
  success: boolean
  message: string   // Confirmation message
  source: string    // Always "environment_variables"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "git_configure_user_from_env",
    "params": {"path": "/tmp/my-project"},
    "id": 10
  }'
```

**What it does:**
- Reads `GIT_USER_NAME` and `GIT_USER_EMAIL` environment variables
- Configures git user for the specified repository
- Fails if environment variables are not set

**Use Case:**
- Explicit environment variable configuration
- Testing environment variable setup
- When you want to ensure environment variables are used

**Error Codes:**
- `-32603`: Environment variables not set or git configuration failed

---

### 11. install_dependencies

Installs npm dependencies in the specified project.

**Method:** `install_dependencies`

**Parameters:**
```typescript
{
  path: string,           // Project directory path
  packages?: string[]     // Optional: specific packages to install
}
```

**Response:**
```typescript
{
  success: boolean
  message: string         // Installation confirmation
}
```

**Examples:**
```bash
# Install all dependencies from package.json
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "install_dependencies",
    "params": {"path": "/tmp/my-project"},
    "id": 5
  }'

# Install specific packages
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "install_dependencies",
    "params": {
      "path": "/tmp/my-project",
      "packages": ["react", "typescript"]
    },
    "id": 6
  }'
```

**Error Codes:**
- `-32603`: Package installation failed (network, package not found)

---

### 6. get_project_templates

Retrieves available project templates.

**Method:** `get_project_templates`

**Parameters:**
```typescript
{}  // No parameters required
```

**Response:**
```typescript
{
  templates: Array<{
    id: string,           // Template identifier
    name: string,         // Human-readable name
    description: string,  // Template description
    files: string[]       // List of files created
  }>
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "get_project_templates",
    "params": {},
    "id": 7
  }'
```

**Sample Response:**
```json
{
  "result": {
    "templates": [
      {
        "id": "react-ts",
        "name": "React TypeScript App",
        "description": "Vite + React + TypeScript + Tailwind CSS",
        "files": ["src/", "public/", "package.json", "tsconfig.json"]
      },
      {
        "id": "nextjs-fullstack",
        "name": "Next.js Fullstack",
        "description": "Next.js 14 + TypeScript + Tailwind + App Router",
        "files": ["app/", "components/", "lib/", "package.json"]
      }
    ]
  },
  "id": 7
}
```

## Tool Discovery Endpoint

### GET /api/mcp

Returns available tools and their schemas for discovery.

**Example:**
```bash
curl -X GET http://localhost:3000/api/mcp
```

**Response:**
```json
{
  "tools": [
    {
      "name": "create_directory",
      "description": "Create a directory at the specified path",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Directory path to create"
          }
        },
        "required": ["path"]
      }
    }
    // ... more tools
  ]
}
```

## AI Service Integration

### Project Analysis

The AI service analyzes user requests to determine project type and configuration.

**Input:** Natural language project description
**Output:** Structured project configuration

```typescript
interface ProjectAnalysis {
  projectType: 'react-ts' | 'nextjs-fullstack' | 'node-api' | 'static' | 'unknown'
  features: string[]
  confidence: number      // 0-1 confidence score
  reasoning: string       // AI reasoning explanation
}
```

### MCP Action Generation

Converts project analysis into executable MCP tool calls.

**Input:** User message + project analysis
**Output:** Sequence of MCP actions

```typescript
interface MCPAction {
  tool: string           // MCP tool name
  params: Record<string, any>  // Tool parameters
  description: string    // Human-readable action description
}

interface ActionPlan {
  actions: MCPAction[]
  response: string       // User-facing response message
}
```

## Client Libraries

### JavaScript/TypeScript Client

```typescript
import { MCPClient } from '@/lib/mcp-client'

const client = new MCPClient('http://localhost:3000/api/mcp')

// Create a project
async function createProject() {
  try {
    // Create directory
    await client.call('create_directory', { path: '/tmp/my-app' })

    // Write package.json
    await client.call('write_file', {
      path: '/tmp/my-app/package.json',
      content: JSON.stringify({ name: 'my-app' }, null, 2)
    })

    // Initialize git
    await client.call('git_init', { path: '/tmp/my-app' })

    // Install dependencies
    await client.call('install_dependencies', { path: '/tmp/my-app' })

    // Initial commit
    await client.call('git_add_commit', {
      path: '/tmp/my-app',
      message: 'Initial commit'
    })

    console.log('Project created successfully!')
  } catch (error) {
    console.error('Project creation failed:', error)
  }
}
```

### React Hook

```typescript
import { useChat } from '@/lib/hooks/useChat'

function ProjectScaffolder() {
  const { messages, isLoading, sendMessage, currentProject } = useChat()

  const handleSubmit = (message: string) => {
    sendMessage(message)
  }

  return (
    <div>
      {/* Chat interface */}
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Project status */}
      {currentProject && (
        <div>Creating {currentProject.name}...</div>
      )}
    </div>
  )
}
```

## Error Handling

### Common Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| -32600 | Invalid Request | Malformed JSON |
| -32601 | Method Not Found | Unknown tool name |
| -32602 | Invalid Params | Missing required parameters |
| -32603 | Internal Error | Tool execution failed |

### Error Response Examples

```json
{
  "error": {
    "code": -32601,
    "message": "Method not found: invalid_tool",
    "data": {
      "available_methods": ["create_directory", "write_file", "git_init"]
    }
  },
  "id": 1
}
```

```json
{
  "error": {
    "code": -32603,
    "message": "Git init failed: git: command not found",
    "data": {
      "stderr": "git: command not found",
      "path": "/tmp/my-project"
    }
  },
  "id": 2
}
```

## Rate Limiting

### Current Limits
- **Development**: No rate limiting
- **Production**: 100 requests per minute per IP

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Authentication

### Current Implementation
- No authentication required for local development
- Production deployments should implement API key authentication

### Recommended Security
```typescript
// Add to MCP server
const authMiddleware = (req: Request) => {
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!apiKey || !validateApiKey(apiKey)) {
    throw new Error('Unauthorized')
  }
}
```

## Performance Considerations

### Optimization Strategies
- **Template Caching**: Pre-load common templates in memory
- **Streaming**: Stream large file generation progress
- **Background Processing**: Execute git/npm operations asynchronously
- **Request Batching**: Combine multiple tool calls when possible

### Monitoring Metrics
- Tool execution time
- Error rates by tool
- Project creation success rate
- Resource usage (CPU, memory, disk)

## Extending the API

### Adding New Tools

1. **Define Tool Interface:**
```typescript
interface NewToolParams {
  param1: string
  param2?: number
}
```

2. **Implement Tool Logic:**
```typescript
export const newTool = async (params: NewToolParams) => {
  // Tool implementation
  return { success: true, result: 'data' }
}
```

3. **Register Tool:**
```typescript
export const mcpTools = {
  // ... existing tools
  new_tool: newTool
}
```

4. **Add Tool Schema:**
```typescript
// In GET /api/mcp endpoint
{
  name: 'new_tool',
  description: 'Description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' },
      param2: { type: 'number', description: 'Optional parameter' }
    },
    required: ['param1']
  }
}
```

### Custom Templates

Add new project templates:

```typescript
// lib/templates/custom-template.ts
export const customTemplate: ProjectTemplate = {
  id: 'custom-framework',
  name: 'Custom Framework App',
  description: 'Custom framework with specific setup',
  dependencies: ['custom-framework'],
  devDependencies: ['@types/custom'],
  files: {
    'package.json': '...',
    'src/index.ts': '...',
    // ... more files
  }
}
```

Register in `lib/templates/index.ts`:
```typescript
export const templates = {
  // ... existing templates
  'custom-framework': customTemplate
}
```

## Testing

### Tool Testing
```typescript
// Test individual tools
describe('MCP Tools', () => {
  test('create_directory creates directory', async () => {
    const result = await mcpTools.create_directory({ path: '/tmp/test' })
    expect(result.success).toBe(true)
    expect(fs.existsSync('/tmp/test')).toBe(true)
  })
})
```

### Integration Testing
```typescript
// Test full workflow
describe('Project Creation', () => {
  test('creates functional React project', async () => {
    const client = new MCPClient()

    await client.call('create_directory', { path: '/tmp/test-react' })
    await client.call('write_file', {
      path: '/tmp/test-react/package.json',
      content: reactPackageJson
    })
    await client.call('git_init', { path: '/tmp/test-react' })
    await client.call('install_dependencies', { path: '/tmp/test-react' })

    // Verify project can build
    const buildResult = execSync('npm run build', { cwd: '/tmp/test-react' })
    expect(buildResult).toBeTruthy()
  })
})
```

## 🔧 Testing & Debugging Endpoints

### Health Check Endpoint

**Endpoint:** `GET /api/health`

**Purpose:** Monitor system status and verify environment configuration

**Response:**
```typescript
{
  timestamp: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  environment: string
  services: {
    openai: boolean          // OpenAI API key availability
    github: boolean          // GitHub token availability
    githubOrg: string        // Configured GitHub organization
  }
  uptime: number             // Process uptime in seconds
  memory: {
    used: number             // Used memory in MB
    total: number            // Total memory in MB
    limit: number            // Memory limit in MB
  }
}
```

**Example:**
```bash
curl http://localhost:3002/api/health
```

**Response:**
```json
{
  "timestamp": "2024-09-25T00:35:12.345Z",
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development",
  "services": {
    "openai": true,
    "github": true,
    "githubOrg": "mcp-integration"
  },
  "uptime": 1234.567,
  "memory": {
    "used": 45,
    "total": 78,
    "limit": 120
  }
}
```

### Environment Variable Verification

**Purpose:** Verify environment variables are properly configured

**Key Indicators:**
- ✅ `services.openai: true` - AI functionality available
- ✅ `services.github: true` - GitHub repository operations available
- ✅ `services.githubOrg: "mcp-integration"` - Organization correctly configured
- ❌ `services.githubOrg: "default (authenticated user)"` - Using fallback

**Usage in CI/CD:**
- Use health endpoint to verify deployment configuration
- Check `services` object to ensure all required services are available
- Monitor `githubOrg` value to confirm organization setup

---

This API reference provides complete documentation for integrating with and extending the MCP Project Scaffolder agent.
