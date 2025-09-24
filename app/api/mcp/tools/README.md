# MCP Tools - Modular Architecture

This directory contains the refactored, modular implementation of MCP (Model Context Protocol) tools. The monolithic `index.ts` file has been split into focused, well-organized modules.

## Architecture Overview

The MCP tools are now organized by functional area, making the codebase more maintainable, testable, and extensible.

### Module Structure

```
tools/
├── index.ts                 # Main export combining all modules
├── file-operations.ts       # Basic file system operations
├── git-operations.ts        # Git repository management
├── github-operations.ts     # GitHub API integration
├── ai-operations.ts         # AI-powered analysis and creation
├── project-operations.ts    # Project-level operations
├── project-management.ts    # Ongoing project development
├── file-management.ts       # Advanced file operations
├── package-management.ts    # Package installation and management
├── development-tools.ts     # Script execution and code generation
└── README.md               # This documentation
```

## Module Details

### 🗂️ File Operations (`file-operations.ts`)
Basic file system operations that form the foundation of project creation.

**Tools:**
- `create_directory` - Creates directories with recursive support
- `write_file` - Writes content to files, creating directories as needed

**Types:**
- `CreateDirectoryParams`
- `WriteFileParams`
- `FileOperationResult`

### 🔄 Git Operations (`git-operations.ts`)
Comprehensive Git repository management functionality.

**Tools:**
- `git_init` - Initialize Git repositories
- `git_add_commit` - Stage and commit changes
- `git_status` - Get repository status
- `git_create_branch` - Create new branches
- `git_set_remote` - Configure remote origins
- `git_configure_user` - Set Git user configuration
- `git_configure_user_from_env` - Configure from environment variables
- `git_history` - Retrieve commit history

**Types:**
- `GitPathParams`
- `GitCommitParams`
- `GitConfigureUserParams`
- `GitOperationResult`

### 🐙 GitHub Operations (`github-operations.ts`)
GitHub API integration for remote repository management.

**Tools:**
- `get_github_user` - Get authenticated user information
- `check_github_owner_type` - Determine if owner is user or organization
- `create_github_branch` - Create GitHub repositories from project directories

**Types:**
- `CheckOwnerTypeParams`
- `CreateGitHubBranchParams`
- `GitHubUserResult`
- `GitHubOwnerResult`
- `GitHubBranchResult`

### 🤖 AI Operations (`ai-operations.ts`)
AI-powered project analysis and intelligent project creation using OpenAI.

**Tools:**
- `analyze_project_request` - Analyze project descriptions to determine type and features
- `generate_project_plan` - Create comprehensive project plans
- `intelligent_project_setup` - Set up projects with AI decision-making
- `create_project_with_ai` - Complete AI-powered project creation
- `analyze_and_optimize` - Provide optimization recommendations

**Types:**
- `AnalyzeProjectParams`
- `GenerateProjectPlanParams`
- `IntelligentProjectSetupParams`
- `CreateProjectWithAIParams`
- `AnalyzeAndOptimizeParams`
- Various result types for AI operations

### 📦 Project Operations (`project-operations.ts`)
High-level project management operations including templates and packaging.

**Tools:**
- `install_dependencies` - Install npm packages
- `get_project_templates` - List available project templates
- `setup_project_from_template` - Create projects from predefined templates
- `download_project_zip` - Create downloadable ZIP archives

**Types:**
- `InstallDependenciesParams`
- `SetupProjectFromTemplateParams`
- `DownloadProjectZipParams`
- Various result types for project operations

### 🎯 Project Management (`project-management.ts`)
Ongoing project development and context management.

**Tools:**
- `set_project_context` - Set current project for subsequent operations
- `analyze_project_structure` - Analyze existing project structure and dependencies
- `get_project_info` - Get basic project information
- `list_project_directory` - Browse project directory contents

**Types:**
- `ProjectContextParams`, `AnalyzeProjectParams`
- `ProjectAnalysisResult`, `ProjectContextResult`

### 📁 File Management (`file-management.ts`)
Advanced file operations for project development.

**Tools:**
- `read_file` - Read file contents for analysis
- `update_file` - Modify existing files with backup support
- `delete_file` - Remove files or directories
- `search_files` - Search files by name or content
- `create_file` - Create new files with content

**Types:**
- `ReadFileParams`, `UpdateFileParams`, `DeleteFileParams`, `SearchFilesParams`
- `FileOperationResult`

### 📋 Package Management (`package-management.ts`)
Package installation and dependency management.

**Tools:**
- `add_packages` - Add new dependencies or dev dependencies
- `remove_packages` - Remove packages from project
- `update_packages` - Update packages to latest versions
- `get_package_info` - Get package information and check for outdated packages

**Types:**
- `PackageParams`, `PackageInfoParams`
- `PackageResult`

### ⚡ Development Tools (`development-tools.ts`)
Script execution and code generation for ongoing development.

**Tools:**
- `run_script` - Execute npm scripts with arguments
- `generate_code` - Generate components, pages, hooks, utilities, tests
- `format_code` - Run linting and formatting scripts
- `get_available_scripts` - List available npm scripts

**Types:**
- `RunScriptParams`, `GenerateCodeParams`
- `DevelopmentResult`

## Benefits of Modular Architecture

### 🔧 Maintainability
- **Single Responsibility**: Each module has a clear, focused purpose
- **Easier Navigation**: Related functionality is grouped together
- **Reduced Complexity**: Smaller, more manageable files

### 🧪 Testability
- **Unit Testing**: Individual modules can be tested in isolation
- **Mock Dependencies**: Easier to mock specific functionality
- **Focused Tests**: Tests can target specific operational areas

### 🚀 Extensibility
- **Easy Addition**: New tools can be added to appropriate modules
- **Clear Patterns**: Consistent structure makes it easy to follow patterns
- **Independent Development**: Teams can work on different modules simultaneously

### 📖 Documentation
- **Self-Documenting**: Module names clearly indicate their purpose
- **Type Safety**: Comprehensive TypeScript interfaces
- **Clear Contracts**: Well-defined input/output types

## Usage

The main `index.ts` file re-exports all tools from the modules, maintaining backward compatibility:

```typescript
import { mcpTools } from './tools'

// All tools are available as before
await mcpTools.create_directory({ path: '/tmp/myproject' })
await mcpTools.git_init({ path: '/tmp/myproject' })
await mcpTools.analyze_project_request({ description: 'React app' })
```

## Adding New Tools

When adding new tools:

1. **Identify the Module**: Determine which module the tool belongs to based on its primary function
2. **Add Types**: Define TypeScript interfaces for parameters and results
3. **Implement Function**: Add the tool function to the appropriate module
4. **Export in Index**: Add the tool to the main `mcpTools` object in `index.ts`
5. **Document**: Update this README with the new tool information

## Type Safety

All modules include comprehensive TypeScript types to ensure type safety and provide excellent developer experience with IDE support. The modular structure makes it easier to maintain and extend these types.
