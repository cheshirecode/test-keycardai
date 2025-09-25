# 🛠️ API Guide

Complete reference for the Project Scaffolder API.

## 🔌 Core API

**Base Endpoint:** `POST /api/mcp`

**Request:**
```json
{
  "method": "create_project_with_ai",
  "params": {
    "description": "Create a React TypeScript app"
  }
}
```

**Response:**
```json
{
  "result": {
    "success": true,
    "message": "Project created successfully",
    "project": {
      "name": "my-app",
      "repositoryUrl": "https://github.com/user/my-app"
    }
  }
}
```

## 🎯 Available Tools

### Project Creation
- **`create_project_with_ai`** - Create projects with AI analysis
- **`intelligent_project_setup`** - Create projects without AI

### Project Management  
- **`analyze_existing_project`** - Analyze project structure
- **`generate_modification_plan`** - Plan project changes

### Package Management
- **`add_packages`** - Install npm packages
- **`remove_packages`** - Uninstall packages  
- **`update_packages`** - Update to latest versions

### File Operations
- **`create_file`** - Create new files
- **`read_file`** - Read file contents
- **`update_file`** - Modify existing files
- **`delete_file`** - Remove files

### Git & GitHub
- **`git_init`** - Initialize repository
- **`git_add_commit`** - Stage and commit changes
- **`git_push`** - Push to remote
- **`create_github_repository`** - Create GitHub repo

### Development Tools
- **`run_script`** - Execute npm scripts
- **`generate_code`** - Generate components
- **`cleanup_processes`** - Clean up dev processes

## 🎨 Frontend Integration

### React Hook: `useChat`

```typescript
import { useChat } from '@/lib/hooks/useChat'

export function ChatComponent() {
  const { messages, isLoading, sendMessage, clearChat } = useChat()

  const handleSubmit = async (input: string) => {
    await sendMessage(input)
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

### MCP Client

```typescript
import { MCPClient } from '@/lib/mcp-client'

const client = new MCPClient()

// Create project
const result = await client.call('create_project_with_ai', {
  description: 'React TypeScript app'
})

// Add packages
await client.call('add_packages', {
  projectPath: '/path/to/project',
  packages: ['jotai', 'tailwindcss']
})
```

## 🔧 Environment Setup

```bash
# Required
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...

# Optional
GITHUB_OWNER=username
```

## 📊 Response Format

All tools return:
```typescript
interface ToolResult {
  success: boolean
  message: string
  data?: any
  error?: string
}
```

## 🔍 Debugging

**Enable Debug Mode:**
```bash
DEBUG=mcp:* npm run dev
```

**Common Issues:**
- **AI failing**: Check OpenAI API key
- **GitHub errors**: Verify token permissions  
- **File operations**: Check path permissions

---

For usage examples, see the [Workflow Guide](../WORKFLOW_GUIDE.md).
