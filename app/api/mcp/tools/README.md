# 🛠️ MCP Tools

Modular tools for AI-powered project operations.

## 📁 Tool Modules

### 🤖 **ai-operations.ts** - AI-Powered Intelligence
- `create_project_with_ai` - Create projects with AI analysis
- `analyze_project_request` - Understand user requests
- `generate_modification_plan` - Plan project changes

### 📦 **project-operations.ts** - Project Management
- `install_dependencies` - Install npm packages
- `setup_project_from_template` - Create from templates
- `download_project_zip` - Package projects

### 📝 **file-management.ts** - File Operations
- `create_file` - Create new files
- `read_file` - Read file contents
- `update_file` - Modify files
- `delete_file` - Remove files

### 🔧 **git-operations.ts** - Version Control
- `git_init` - Initialize repository
- `git_add_commit` - Stage and commit
- `git_push` - Push to remote

### 🐙 **github-operations.ts** - GitHub Integration
- `create_github_repository` - Create repositories
- `get_github_user` - Get user info

### 📋 **package-management.ts** - Dependencies
- `add_packages` - Install packages
- `remove_packages` - Uninstall packages
- `update_packages` - Update versions

### ⚙️ **development-tools.ts** - Development Utilities
- `run_script` - Execute npm scripts
- `generate_code` - Generate components
- `cleanup_processes` - Clean dev processes

## 🔗 Usage

```typescript
import { mcpTools } from './tools'

const result = await mcpTools.create_project_with_ai({
  description: "React TypeScript app"
})
```

---

For complete API reference, see [docs/API_GUIDE.md](/docs/API_GUIDE.md)