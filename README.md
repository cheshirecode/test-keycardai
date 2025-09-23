# Project Scaffolder - MCP Agent

An intelligent project scaffolding agent that creates ready-to-use development projects through natural language conversation, built with MCP (Model Context Protocol).

## 🚀 Live Demo

**Try it now:** [https://test-keycardai-rv8wigyxy-dac4158s-projects.vercel.app](https://test-keycardai-rv8wigyxy-dac4158s-projects.vercel.app)

> Deployed on Vercel with automatic deployments from the `main` branch.

## Features

- 🤖 **AI-Powered**: Uses OpenAI GPT to understand project requirements
- 💬 **Chat Interface**: Natural language project creation
- 🛠️ **MCP Protocol**: Real MCP server implementation for tool orchestration
- 📁 **Template Library**: Pre-built templates for React, Next.js, and Node.js
- 🔧 **Git Integration**: Automatic repository initialization and commits
- ⚡ **Quick Setup**: Full project scaffolding in seconds

## Built With

- **Frontend**: Next.js 14 + TypeScript + React 18 + Tailwind CSS 3
- **AI Integration**: Vercel AI SDK + OpenAI GPT-3.5-turbo
- **Protocol**: MCP (Model Context Protocol) for agent communication
- **Templates**: React, Next.js, Node.js with modern tooling

## Getting Started

### Prerequisites

- **Node.js 18+** installed
- **Git** installed and configured
- **OpenAI API key** - Get yours from [OpenAI Platform](https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/cheshirecode/test-keycardai.git
cd test-keycardai
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key:
# OPENAI_API_KEY=your_actual_api_key_here
```

> **⚠️ Important**: You **must** configure your OpenAI API key for the AI features to work. The application will not function without it.

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000) to use the application.

## 🚀 Deployment Workflow

The project uses continuous deployment with Vercel and GitHub integration:

```mermaid
graph TD
    A[💻 Local Development] -->|git push| B[📦 GitHub Repository]
    B -->|webhook| C[🔄 Vercel Build Trigger]
    C --> D{🏗️ Build Process}
    D -->|✅ Success| E[🌐 Production Deployment]
    D -->|❌ Failure| F[📧 Build Error Notification]
    E --> G[🔗 Live URL Updated]

    H[🌿 Feature Branch Push] -->|webhook| I[👀 Preview Deployment]
    I --> J[🔍 Preview URL]

    K[⚙️ Environment Variables] --> C
    L[🔐 API Keys] --> K

    style E fill:#28a745
    style F fill:#dc3545
    style I fill:#17a2b8
    style A fill:#6f42c1
```

### Deployment Process

1. **Push to Main Branch** → Triggers production deployment
2. **Push to Feature Branch** → Creates preview deployment
3. **Environment Variables** → Automatically configured in Vercel
4. **Build Logs** → Available in Vercel dashboard

### Environment Variables in Production

The following environment variables are configured in Vercel:
- `OPENAI_API_KEY` - Encrypted and secure
- `NODE_ENV` - Automatically set to `production`

## Usage

### Chat Commands

Simply describe what you want to build:

- "Create a React TypeScript app"
- "Build a Next.js project with Tailwind"
- "Create a Node.js API with Express"
- "Make a dashboard with authentication"

### Available Templates

1. **React TypeScript App**
   - Vite + React 18 + TypeScript + Tailwind CSS 3
   - ESLint + Hot Module Replacement

2. **Next.js Fullstack**
   - Next.js 14 + App Router + TypeScript
   - Tailwind CSS 3 + API Routes

3. **Node.js API**
   - Express + TypeScript + Jest
   - CORS + Helmet + Environment config

## MCP Integration

This project implements a real MCP server with the following tools:

- `create_directory`: Create project directories
- `write_file`: Write template files
- `git_init`: Initialize Git repository
- `git_add_commit`: Stage and commit changes
- `install_dependencies`: Install npm packages
- `setup_project_from_template`: Complete project setup

### MCP API

The MCP server is available at `/api/mcp` and follows JSON-RPC 2.0 specification.

Example request:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "get_project_templates",
    "params": {},
    "id": 1
  }'
```

## Architecture

```
test-keycardai/
├── app/
│   ├── api/mcp/           # MCP server implementation
│   ├── components/        # React components
│   └── page.tsx          # Main application
├── lib/
│   ├── templates/        # Project templates
│   ├── ai-service.ts     # AI integration
│   ├── mcp-client.ts     # MCP client
│   └── git-tools.ts      # Git utilities
├── types/
│   └── mcp.ts           # TypeScript definitions
└── docs/                # Comprehensive documentation
```

## Documentation

- [Solution Designs](./docs/SOLUTION_DESIGNS.md) - Complete design specifications
- [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md) - Step-by-step implementation
- [API Reference](./docs/API_REFERENCE.md) - MCP tools and endpoints

## Testing

### Manual Testing

1. Start the development server
2. Test project creation with different templates
3. Verify generated projects can be built and run

### API Testing

Test MCP endpoints:
```bash
# Get available templates
curl -X GET http://localhost:3000/api/mcp

# Create a project
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "setup_project_from_template",
    "params": {
      "projectPath": "/tmp/test-project",
      "templateId": "react-ts",
      "projectName": "my-test-app"
    },
    "id": 1
  }'
```

## Scripts

- `dev`: Start development server
- `build`: Build for production
- `start`: Start production server
- `lint`: Run ESLint
- `lint:fix`: Run ESLint with auto-fix
- `type-check`: Run TypeScript type checking
- `prepare`: Install git hooks (runs automatically on npm install)
- `commitlint`: Validate commit message format

## Deployment

### Automatic Deployment (Recommended)

The project is configured for **continuous deployment**:

1. **Push to main branch** → Automatic production deployment
2. **Push to feature branch** → Automatic preview deployment
3. **Environment variables** are automatically applied from Vercel configuration

```bash
# Deploy to production
git push origin main

# Create preview deployment
git checkout -b feature/my-feature
git push origin feature/my-feature
```

### Manual Deployment

For manual control, use the Vercel CLI:

```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

### Environment Configuration

**For Vercel deployment**, environment variables are managed through:
- Vercel Dashboard: https://vercel.com/dac4158s-projects/test-keycardai/settings/environment-variables
- Vercel CLI: `vercel env add VARIABLE_NAME`

**Current production environment:**
- ✅ `OPENAI_API_KEY` configured and encrypted
- ✅ Automatic deployments enabled
- ✅ Preview deployments for all branches

## Development Workflow

### Git Hooks & Commit Standards

This project uses **lefthook** and **commitlint** to enforce code quality and conventional commit messages:

#### Pre-commit Hooks:
- **ESLint**: Automatically lints staged files
- **TypeScript**: Type-checks staged files
- **Auto-fix**: Automatically fixes linting issues when possible

#### Commit Message Format:
Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope?): description

[optional body]

[optional footer(s)]
```

**Examples:**
- `feat: add project scaffolding feature`
- `fix(mcp): resolve template generation issue`
- `docs: update API documentation`
- `refactor(ui): improve chat interface`

**Valid types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes

#### Pre-push Hooks:
- **Build Check**: Ensures the project builds successfully before pushing

## Security Considerations

- **Input Validation**: All file paths and user inputs are validated
- **Sandboxing**: Project creation is isolated to specified directories
- **API Key Protection**: OpenAI API key stored in environment variables
- **Rate Limiting**: Consider implementing for production use

## Performance

- **Template Caching**: Templates loaded once at startup
- **Streaming**: Real-time progress updates
- **Error Handling**: Graceful degradation on failures
- **Memory Management**: Efficient file operations

## Future Enhancements

- **Additional Templates**: Vue, Angular, Python, Go projects
- **CI/CD Integration**: GitHub Actions, GitLab CI setup
- **Team Features**: Shared templates, collaboration tools
- **Advanced AI**: Multi-step project planning, architecture suggestions
- **Plugin System**: Custom template extensions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Troubleshooting

### Common Issues

1. **OpenAI API Error**:
   - Check your API key is correctly set in `.env.local`
   - Verify the API key is valid at [OpenAI Platform](https://platform.openai.com/api-keys)
   - For Vercel deployment, ensure environment variable is set in dashboard

2. **Git Commands Fail**:
   - Ensure Git is installed and configured
   - Set global Git user: `git config --global user.name "Your Name"`
   - Set global Git email: `git config --global user.email "your.email@example.com"`

3. **Deployment Failures**:
   - Check build logs in Vercel dashboard
   - Verify environment variables are configured in Vercel
   - Ensure main branch is up to date: `git push origin main`

4. **Permission Errors**:
   - Check file system permissions for project creation
   - Ensure Node.js has write access to project directory

5. **Port Conflicts**:
   - Change the port in `next.config.js` if needed
   - Or use: `npm run dev -- --port 3001`

### Getting Help

- Check the [API Reference](./docs/API_REFERENCE.md) for detailed documentation
- Review [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md) for setup steps
- Open an issue for bugs or feature requests

---

**Project Scaffolder** - Creating the future, one project at a time. 🚀