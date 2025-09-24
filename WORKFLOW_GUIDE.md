# 🎯 Workflow Guide

This guide shows you how to use the Project Scaffolder effectively for both creating new projects and modifying existing ones.

## 🆕 Creating New Projects

### Basic Project Creation
```
👤 "Create a React TypeScript app"
🤖 Creates: React app with TypeScript, modern tooling, GitHub repo
```

### Specific Requirements
```
👤 "Build a Next.js dashboard with authentication"
🤖 Creates: Next.js app with auth setup, dashboard layout, TypeScript
```

### Full-Stack Projects
```
👤 "Create a todo app with React frontend and Node.js API"
🤖 Creates: Monorepo with React frontend + Express API + database setup
```

## 🔄 Modifying Existing Projects

### Adding Packages
```
👤 "add jotai"
🤖 📦 Installs jotai state management library
   💾 Updates package.json and commits changes
```

### Creating Components
```
👤 "create UserProfile component"
🤖 📝 Generates React TypeScript component
   📁 Places in src/components/UserProfile.tsx
   💾 Commits to repository
```

### Adding Features
```
👤 "add routing"
🤖 📦 Installs react-router-dom
   📝 Sets up routing configuration
   📁 Creates pages directory structure
   💾 Commits all changes
```

## 🧠 How the AI Understands Your Requests

### New Project Keywords
- "Create", "Build", "Generate", "New project"
- "Make a", "Set up", "Initialize"

### Modification Keywords  
- "Add", "Install", "Include", "Integrate"
- "Create component", "Add feature", "Update"
- "Remove", "Configure", "Setup"

### Smart Package Recognition
- **State Management:** "jotai", "zustand", "redux"
- **Styling:** "tailwind", "styled-components", "emotion"
- **UI Libraries:** "material-ui", "chakra", "headless-ui"
- **Forms:** "react-hook-form", "formik"
- **Testing:** "jest", "cypress", "testing-library"

## 📊 Visual Indicators

### Project Status
When you have an active project, you'll see:
```
🟢 my-react-app (React TypeScript)
```

### Context-Aware Input
- **No active project:** "Describe your project (e.g., 'Create a React app')"
- **Active project:** "Modify my-react-app (e.g., 'add jotai', 'create component')"

## ✅ Best Practices

### 1. Be Specific About Requirements
- ❌ "Create an app"
- ✅ "Create a React TypeScript app with authentication"

### 2. Use Clear Modification Requests  
- ❌ "I want state management"
- ✅ "add jotai for state management"

### 3. One Change at a Time
- ❌ "add jotai and tailwind and create a header component"
- ✅ "add jotai" → wait for completion → "add tailwind" → "create header component"

### 4. Check Your Repository
After each modification, your GitHub repository is automatically updated with:
- New files and changes
- Descriptive commit messages
- Proper project structure

## 🚀 Example Complete Workflow

### Step 1: Create Project
```
👤 "Create a React TypeScript app for a task manager"
🤖 ✨ Creates "task-manager" project
   🔗 Repository: https://github.com/user/task-manager
   📁 Complete React TypeScript setup
```

### Step 2: Add State Management
```
👤 "add jotai"
🤖 🔄 Modifying task-manager
   📦 Installing jotai package
   ✅ State management ready!
```

### Step 3: Create Components
```
👤 "create TaskCard component"
🤖 📝 Generating TaskCard.tsx
   🎨 TypeScript interface included
   📁 Added to src/components/
   ✅ Component ready!
```

### Step 4: Add Styling
```
👤 "add tailwind css"
🤖 📦 Installing Tailwind CSS
   ⚙️ Configuring tailwind.config.js
   📝 Setting up globals.css
   ✅ Styling framework ready!
```

### Result
You now have a complete React TypeScript task manager with:
- ✅ Jotai state management
- ✅ TaskCard component
- ✅ Tailwind CSS styling
- ✅ All changes committed to GitHub
- ✅ Ready for development

## 💡 Tips for Success

1. **Wait for Completion:** Let each request finish before starting the next
2. **Use Natural Language:** Speak naturally - the AI understands context
3. **Check Visual Indicators:** Green project badge shows your active project
4. **Review Repository:** All changes are committed with clear messages
5. **Start Simple:** Begin with basic project, then add features incrementally

---

Happy coding! 🎉
