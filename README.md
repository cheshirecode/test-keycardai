# 🚀 Project Scaffolder

An AI-powered project scaffolding tool that creates ready-to-use development projects through natural language conversation.

## ✨ Quick Start

1. **Try the live demo:** [https://test-keycardai-hmmx4tn4f-dac4158s-projects.vercel.app](https://test-keycardai-hmmx4tn4f-dac4158s-projects.vercel.app)
2. **Type your request:** "Create a React TypeScript app with authentication"
3. **Get your project:** Complete project with GitHub repository

## 🎯 What It Does

### Create Projects
- **React/Next.js** apps with TypeScript
- **Node.js APIs** with Express
- **Vue/Nuxt** applications  
- **Python/FastAPI** backends
- **Full-stack** combinations

### Ongoing Development
- **Add packages:** "add jotai" → installs state management
- **Create components:** "create UserCard component" → generates React component
- **Modify configs:** "add tailwind" → configures styling
- **Auto-commit:** All changes committed to your repository

## 🏗️ How It Works

```
Natural Language → AI Analysis → Project Generation → GitHub Repository
```

1. **AI Analysis:** OpenAI GPT-3.5 analyzes your request
2. **Smart Planning:** Generates step-by-step project plan
3. **Auto-Generation:** Creates files, installs dependencies, sets up configs
4. **GitHub Integration:** Creates repository with all your code
5. **Ongoing Support:** Continue modifying the same project

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, MCP protocol
- **AI:** OpenAI GPT-3.5-turbo
- **Repository:** GitHub API integration
- **Deployment:** Vercel

## 🔧 Setup for Development

### Prerequisites
- Node.js 18+
- GitHub account
- OpenAI API key

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_username  # Optional: defaults to authenticated user
```

### Installation
```bash
# Clone and install
git clone https://github.com/cheshirecode/test-keycardai.git
cd test-keycardai
npm install

# Start development
npm run dev
```

## 📋 Example Conversations

### Create New Project
```
👤 "Create a React TypeScript app for a todo list"
🤖 ✨ Analyzing request... 95% confidence
   📁 Creating todo-list-app
   ⚡ Installing dependencies
   🔗 Repository: https://github.com/user/todo-list-app
   ✅ Project ready!
```

### Modify Existing Project  
```
👤 "add jotai for state management"
🤖 🔄 Modifying todo-list-app
   📦 Installing jotai
   📝 Updating package.json
   💾 Committing changes
   ✅ State management added!
```

## 🏆 Key Features

### ✅ Context-Aware Development
- Remembers your active project
- Distinguishes between new projects vs modifications
- Maintains project state throughout conversation

### ✅ Smart Package Detection
- Recognizes popular libraries: jotai, zustand, tailwind
- Installs correct dependencies automatically
- Handles dev vs production packages

### ✅ GitHub Integration
- Creates repositories automatically
- Commits all changes with descriptive messages
- Supports both personal and organization accounts

### ✅ Visual Feedback
- Project status indicators
- Real-time progress updates
- Context-aware input suggestions

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Full CI check
npm run ci
```

## 📁 Project Structure

```
├── app/                 # Next.js App Router
│   ├── api/mcp/        # MCP protocol server
│   └── typings/        # Server-side types
├── src/                # Frontend source
│   ├── components/     # React components
│   ├── lib/           # Utilities and services
│   └── typings/       # Client-side types
└── docs/              # Additional documentation
```

## 🚀 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cheshirecode/test-keycardai)

Or manually:
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using AI and modern web technologies**