# API Reference: MCP Project Scaffolder

## Overview
This document provides complete API documentation for the MCP Project Scaffolder agent, including all server endpoints, tool specifications, and integration patterns.

## MCP Protocol Implementation

### Base URL
```
Local Development: http://localhost:3000/api/mcp
Production: https://your-domain.com/api/mcp
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

**Error Codes:**
- `-32603`: Git commit failed (no changes, invalid repository)

---

### 5. install_dependencies

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

---

This API reference provides complete documentation for integrating with and extending the MCP Project Scaffolder agent.
