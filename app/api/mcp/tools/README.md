# 🛠️ MCP Tools

Modular tools for the Model Context Protocol server, organized by functionality.

## 📁 Tool Modules

### 🗂️ **file-operations.ts**
Basic file system operations
- `create_directory` - Create directories
- `write_file` - Write file contents

### 🔧 **git-operations.ts** 
Git version control
- `git_init` - Initialize repository
- `git_add_commit` - Stage and commit changes
- `git_push` - Push to remote
- `git_status` - Check repository status

### 🐙 **github-operations.ts**
GitHub API integration
- `get_github_user` - Get user information
- `check_github_owner_type` - Check if user or organization
- `create_github_repository` - Create new repository
- `create_github_branch` - Create new branch

### 🤖 **ai-operations.ts**
AI-powered project intelligence
- `analyze_project_request` - Analyze user requests
- `generate_project_plan` - Create project plans
- `intelligent_project_setup` - AI-driven setup
- `create_project_with_ai` - Full AI project creation
- `analyze_existing_project` - Analyze existing projects
- `generate_modification_plan` - Plan project modifications

### 📦 **project-operations.ts**
Project-level operations
- `install_dependencies` - Install npm packages
- `get_project_templates` - List available templates
- `setup_project_from_template` - Create from template
- `download_project_zip` - Package project for download

### 🎯 **project-management.ts**
Ongoing project development
- `set_project_context` - Set active project
- `analyze_project_structure` - Analyze project layout
- `get_project_info` - Get project metadata
- `list_project_directory` - List directory contents

### 📝 **file-management.ts**
Advanced file operations
- `read_file` - Read file contents
- `update_file` - Modify existing files
- `delete_file` - Remove files
- `search_files` - Search within files
- `create_file` - Create new files

### 📋 **package-management.ts**
Package and dependency management
- `add_packages` - Install packages
- `remove_packages` - Uninstall packages
- `update_packages` - Update to latest versions
- `get_package_info` - Get package information

### ⚙️ **development-tools.ts**
Code generation and development utilities
- `run_script` - Execute npm scripts
- `generate_code` - Generate code components
- `format_code` - Format and lint code
- `get_available_scripts` - List project scripts

## 🔗 Integration

All tools are imported and exported through `index.ts`:

```typescript
import { mcpTools } from './tools'

// Use any tool
const result = await mcpTools.create_project_with_ai({
  description: "React TypeScript app"
})
```

## 📊 Tool Categories

### **Core Operations** (Essential functionality)
- File Operations, Git Operations, Project Operations

### **AI-Powered** (Intelligent automation)  
- AI Operations, Project Management

### **Advanced Features** (Extended functionality)
- GitHub Operations, File Management, Package Management, Development Tools

---

For detailed API documentation, see [docs/API_GUIDE.md](/docs/API_GUIDE.md)