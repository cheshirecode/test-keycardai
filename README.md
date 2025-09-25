# 🚀 Project Scaffolder

Create and modify projects using natural language. Just describe what you want, and get a complete project with GitHub repository.

## ✨ Quick Start

**Try it live:** [https://test-keycardai.vercel.app](https://test-keycardai.vercel.app)

**Examples:**
- "Create a React TypeScript todo app"
- "Add authentication to my project"
- "Create a UserCard component"

## 🎯 What It Does

**Creates Projects:**
- React/Next.js with TypeScript
- Node.js APIs with Express
- Full-stack applications
- Complete GitHub repositories

**Modifies Projects:**
- Adds packages and dependencies
- Creates components and files
- Updates configurations
- Commits all changes automatically

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, MCP protocol
- **AI:** OpenAI GPT-3.5-turbo
- **GitHub:** API integration
- **Deployment:** Vercel

## 🔧 Setup

**Prerequisites:**
- Node.js 18+
- GitHub account
- OpenAI API key

**Environment Variables:**
```bash
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token
```

**Installation:**
```bash
git clone https://github.com/cheshirecode/test-keycardai.git
cd test-keycardai
npm install
npm run dev
```

## 📋 Examples

**Create Project:**
```
👤 "Create a React TypeScript todo app"
🤖 ✨ Creating todo-app...
   📦 Installing dependencies
   🔗 Repository: https://github.com/user/todo-app
   ✅ Ready!
```

**Modify Project:**
```
👤 "add jotai for state management"
🤖 📦 Installing jotai
   💾 Committing changes
   ✅ Done!
```

## ✨ Features

- **AI-Powered:** Understands natural language requests
- **GitHub Integration:** Creates repositories automatically
- **Smart Dependencies:** Installs correct packages
- **Context-Aware:** Remembers your active project
- **Real-time Updates:** See changes immediately

## 🧪 Development

```bash
npm test          # Run tests
npm run lint      # Check code quality
npm run build     # Build for production
```

## 🚀 Deployment

**Vercel (Recommended):**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cheshirecode/test-keycardai)

## 📚 Documentation

- [API Guide](docs/API_GUIDE.md) - Complete API reference
- [Workflow Guide](WORKFLOW_GUIDE.md) - Usage examples and best practices

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

**Built with ❤️ using AI and modern web technologies**