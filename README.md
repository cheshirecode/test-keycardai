# 🚀 Project Scaffolder

AI-powered project creation and modification through natural language conversation.

## ✨ Quick Start

1. **Try it live:** [https://test-keycardai.vercel.app](https://test-keycardai.vercel.app)
2. **Create:** "Build a React TypeScript app with authentication"
3. **Modify:** "Add jotai state management" or "Create UserCard component"
4. **Get results:** Complete projects with GitHub repositories

## 🎯 What It Does

**Create Projects**
- React/Next.js with TypeScript
- Node.js APIs with Express  
- Vue/Nuxt applications
- Python/FastAPI backends
- Full-stack combinations

**Modify Existing Projects**
- Add packages: "add jotai" → installs state management
- Create components: "create UserCard component" → generates files
- Update configs: "add tailwind" → configures styling
- Auto-commit: All changes saved to GitHub

## 🏗️ How It Works

```
Natural Language → AI Analysis → Code Generation → GitHub Repository
```

1. **AI Analysis:** GPT analyzes your request and creates execution plan
2. **Code Generation:** Creates files, installs packages, configures tools
3. **GitHub Integration:** Commits everything to a new or existing repository
4. **Ongoing Support:** Continue modifying projects through conversation

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, MCP protocol
- **AI:** OpenAI GPT-3.5-turbo
- **GitHub:** API integration for repository management
- **Deployment:** Vercel

## 🔧 Development Setup

**Prerequisites:** Node.js 18+, GitHub account, OpenAI API key

**Environment Variables:**
```bash
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_username  # Optional
```

**Installation:**
```bash
git clone https://github.com/cheshirecode/test-keycardai.git
cd test-keycardai
npm install
npm run dev
```

## 📋 Examples

**Create New Project:**
```
👤 "Create a React TypeScript app for a todo list"
🤖 ✨ Creating todo-list-app...
   📦 Installing dependencies
   🔗 Repository: https://github.com/user/todo-list-app
   ✅ Project ready!
```

**Modify Existing Project:**
```
👤 "add jotai for state management"
🤖 🔄 Modifying todo-list-app...
   📦 Installing jotai
   💾 Committing changes
   ✅ State management added!
```

## 🏆 Key Features

**✅ Enhanced New Project Flow**
- Smart state management with creation flags
- Direct navigation to newly created repositories
- Eliminates refresh delays and navigation issues

**✅ Context-Aware Development**
- Remembers your active project
- Distinguishes between new projects vs modifications
- Maintains conversation context throughout sessions

**✅ Smart Package Detection**
- Recognizes popular libraries (jotai, zustand, tailwind)
- Installs correct dependencies automatically
- Handles dev vs production packages

**✅ Robust GitHub Integration**
- Creates repositories automatically
- Commits changes with descriptive messages
- Supports personal and organization accounts
- Race condition protection with proper cleanup

**✅ Memory Leak Prevention**
- Component mount status tracking
- Proper async operation cleanup
- AbortController for fetch requests
- Stable dependency management

## 🧪 Testing

```bash
npm test          # Run tests
npm run type-check # TypeScript validation
npm run lint      # Code linting
npm run ci        # Full CI check
```

## 📁 Project Structure

```
├── app/                 # Next.js App Router
│   ├── api/mcp/        # MCP protocol server with AI tools
│   ├── components/     # React components with memory leak protection
│   ├── contexts/       # React contexts with proper state management
│   ├── hooks/          # Custom hooks with AbortController support
│   └── lib/            # Utilities and services
├── types/              # TypeScript definitions
└── docs/              # Comprehensive documentation
```

## 🔧 Recent Improvements

**🚀 Performance & Stability**
- Fixed race conditions in async operations
- Eliminated memory leaks with mount status tracking
- Improved dependency stability to prevent infinite loops
- Enhanced error handling with proper cleanup

**🎯 User Experience**
- Streamlined new project creation flow
- Direct navigation to created repositories
- Better state management and context awareness
- Eliminated unwanted auto-navigation issues

## 🚀 Deployment

**Vercel (Recommended):**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cheshirecode/test-keycardai)

**Manual:**
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'feat: description'`
4. Push and open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

**Built with ❤️ using AI and modern web technologies**