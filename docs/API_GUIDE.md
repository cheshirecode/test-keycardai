# 🛠️ API Guide

Complete reference for the Project Scaffolder API and MCP tools.

## 🔌 MCP Server API

The core API follows the Model Context Protocol (MCP) specification for AI-powered project operations.

### Base Endpoint
```
POST /api/mcp
```

### Request Format
```json
{
  "id": "unique-request-id",
  "method": "tool_call",
  "params": {
    "tool": "tool_name",
    "params": {
      "projectPath": "/path/to/project",
      "description": "user request"
    }
  }
}
```

### Response Format
```json
{
  "id": "unique-request-id",
  "result": {
    "success": true,
    "message": "Operation completed",
    "data": {}
  }
}
```

## 🎯 Core MCP Tools

### 1. Project Creation

#### `create_project_with_ai`
Creates new projects using AI analysis.

**Parameters:**
- `description` (string): Natural language project description

**Example:**
```json
{
  "tool": "create_project_with_ai",
  "params": {
    "description": "Create a React TypeScript app with authentication"
  }
}
```

#### `intelligent_project_setup`
Fallback project creation without AI.

**Parameters:**
- `description` (string): Project description
- `projectPath` (string): Target directory
- `autoExecute` (boolean): Whether to execute immediately

### 2. Project Analysis

#### `analyze_existing_project`
Analyzes existing project structure and dependencies.

**Parameters:**
- `projectPath` (string): Path to project
- `requestDescription` (string): What you want to analyze

#### `generate_modification_plan`
Creates step-by-step modification plan for existing projects.

**Parameters:**
- `projectPath` (string): Path to project
- `requestDescription` (string): Desired modifications
- `analysisData` (object): Previous analysis results

### 3. Package Management

#### `add_packages`
Installs npm packages.

**Parameters:**
- `projectPath` (string): Project directory
- `packages` (string[]): Package names to install
- `dev` (boolean): Install as dev dependencies

**Example:**
```json
{
  "tool": "add_packages", 
  "params": {
    "projectPath": "/path/to/project",
    "packages": ["jotai", "@types/node"],
    "dev": false
  }
}
```

#### `remove_packages`
Uninstalls packages.

#### `update_packages`
Updates packages to latest versions.

### 4. File Operations

#### `create_file`
Creates new files with content.

#### `read_file`
Reads file contents.

#### `update_file`
Modifies existing files.

#### `delete_file`
Removes files.

### 5. Git Operations

#### `git_init`
Initializes git repository.

#### `git_add_commit`
Stages and commits changes.

**Parameters:**
- `path` (string): Repository path
- `message` (string): Commit message

#### `git_push`
Pushes commits to remote repository.

### 6. GitHub Integration

#### `create_github_repository`
Creates GitHub repository.

**Parameters:**
- `name` (string): Repository name
- `description` (string): Repository description
- `private` (boolean): Private repository flag

## 🎨 Frontend Integration

### React Hook: `useChat`

The main hook for chat interface integration with enhanced async flow management.

```typescript
import { useChat } from '@/lib/hooks/useChat'

export function MyComponent() {
  const { 
    messages, 
    isLoading, 
    currentProject, 
    sendMessage, 
    clearChat 
  } = useChat()

  const handleRequest = async () => {
    await sendMessage("Create a React app")
  }

  return (
    <div>
      {currentProject && (
        <div>Active: {currentProject.name}</div>
      )}
      {/* Chat interface */}
    </div>
  )
}
```

**Enhanced Features:**
- **Memory leak protection**: Mount status tracking prevents stale state updates
- **Context-aware**: Distinguishes between new projects and modifications
- **Repository integration**: Works with selected repositories and direct navigation
- **Error handling**: Comprehensive async operation cleanup
- **Race condition prevention**: AbortController integration for fetch requests

### MCP Client

Direct API communication:

```typescript
import { MCPClient } from '@/lib/mcp-client'

const client = new MCPClient()

// Create project
const result = await client.call('create_project_with_ai', {
  description: 'React TypeScript app'
})

// Add package
await client.call('add_packages', {
  projectPath: '/path/to/project',
  packages: ['jotai']
})
```

## 🔧 Environment Configuration

### Required Variables
```bash
# AI Service
OPENAI_API_KEY=sk-...

# GitHub Integration
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=username  # Optional: defaults to authenticated user

# Optional: Development
NODE_ENV=development
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add GITHUB_TOKEN
```

## 📊 Response Types

### Project Creation Response
```typescript
interface ProjectResult {
  success: boolean
  message: string
  project?: {
    name: string
    path: string
    type: string
    repositoryUrl?: string
    features: string[]
    confidence: number
  }
  chainOfThought?: string
}
```

### Modification Response
```typescript
interface ModificationResult {
  success: boolean
  message: string
  executedSteps: number
  totalSteps: number
  project: {
    name: string
    path: string
    repositoryUrl?: string
  }
}
```

### Error Response
```typescript
interface MCPError {
  code: number
  message: string
  data?: unknown
}
```

## 🚀 Advanced Usage

### Custom Tool Development

Create new MCP tools by extending the base structure:

```typescript
// app/api/mcp/tools/my-custom-tools.ts
export const myCustomTool = async (params: MyParams): Promise<MyResult> => {
  try {
    // Tool implementation
    return {
      success: true,
      message: "Custom operation completed",
      data: result
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed: ${error.message}`
    }
  }
}

// Add to tools/index.ts
export const mcpTools = {
  // ... existing tools
  my_custom_tool: myCustomTool
}
```

### Batch Operations

Execute multiple tools in sequence:

```typescript
const operations = [
  { tool: 'add_packages', params: { packages: ['react-router-dom'] } },
  { tool: 'create_file', params: { path: 'src/App.tsx', content: '...' } },
  { tool: 'git_add_commit', params: { message: 'Add routing' } }
]

for (const op of operations) {
  await client.call(op.tool, op.params)
}
```

## 🔍 Debugging

### Enable Debug Mode
```bash
DEBUG=mcp:* npm run dev
```

### Check Logs
- Frontend: Browser console
- Backend: Terminal output
- Vercel: Function logs in dashboard

### Common Issues

1. **AI Analysis Failing**: Check OpenAI API key and usage limits
2. **GitHub Integration Issues**: Verify token permissions
3. **Repository Refresh Errors**: Fixed in recent updates with defensive callback handling
4. **Type Errors**: Ensure TypeScript configuration is correct
5. **File Operations Failing**: Check path permissions and existence

### Recent Major Improvements

**🚀 Async Flow & Memory Management**
- **Fixed**: Race conditions in `useRepositorySync` with AbortController cleanup
- **Fixed**: Memory leaks in `useChat` with mount status tracking
- **Fixed**: Infinite loops in `ProjectSidebar` with ref-based dependency stability
- **Fixed**: SWR focus revalidation issues causing unwanted side effects

**🎯 New Project Flow Enhancement**
- **Added**: `isCreatingNewProject` flag for better state management
- **Improved**: Direct navigation to newly created repositories
- **Enhanced**: New Project button with comprehensive state clearing
- **Eliminated**: Refresh delays and auto-navigation conflicts

**🔧 Technical Improvements**
- **Added**: `useIsMounted` hook for component lifecycle tracking
- **Enhanced**: Error handling with proper async operation cleanup
- **Improved**: Dependency array stability to prevent unnecessary re-renders
- **Fixed**: TypeScript errors and linting issues

**🛡️ Stability & Performance**
- **Eliminated**: Race conditions in async operations
- **Prevented**: Stale state updates after component unmount
- **Improved**: SWR configuration to prevent unwanted revalidation
- **Enhanced**: Overall application stability and user experience

---

For more examples, see the [Workflow Guide](../WORKFLOW_GUIDE.md).
