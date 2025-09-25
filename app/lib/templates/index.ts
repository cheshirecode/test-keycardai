import type { ProjectTemplate } from '@/types'
import { CONFIG } from '../config'

export const templates: Record<string, ProjectTemplate> = {
  'react-ts': {
    id: 'react-ts',
    name: 'React TypeScript App',
    description: 'Vite + React + TypeScript + Tailwind CSS',
    dependencies: ['react', 'react-dom'],
    devDependencies: [
      '@types/react',
      '@types/react-dom',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      '@vitejs/plugin-react',
      'autoprefixer',
      'eslint',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
      'postcss',
      'tailwindcss',
      'typescript',
      'vite'
    ],
    files: {
      'package.json': JSON.stringify({
        name: 'react-ts-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
          preview: 'vite preview'
        },
        dependencies: {},
        devDependencies: {}
      }, null, 2),
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          React + TypeScript + Tailwind
        </h1>
        <div className="space-y-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
          <p className="text-gray-600">
            Edit <code className="bg-gray-200 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  )
}

export default App`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }]
      }, null, 2),
      'tsconfig.node.json': JSON.stringify({
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true
        },
        include: ['vite.config.ts']
      }, null, 2),
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# React TypeScript App

A modern React application built with Vite, TypeScript, and Tailwind CSS.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts

- \`dev\`: Start development server
- \`build\`: Build for production
- \`lint\`: Run ESLint
- \`preview\`: Preview production build

## Built With

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
`
    }
  },

  'nextjs-fullstack': {
    id: 'nextjs-fullstack',
    name: 'Next.js Fullstack',
    description: 'Next.js 14 + TypeScript + Tailwind + App Router',
    dependencies: ['next', 'react', 'react-dom'],
    devDependencies: [
      'typescript',
      '@types/node',
      '@types/react',
      '@types/react-dom',
      'tailwindcss',
      'postcss',
      'autoprefixer',
      'eslint',
      'eslint-config-next'
    ],
    files: {
      'package.json': JSON.stringify({
        name: 'nextjs-fullstack-app',
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint'
        },
        dependencies: {},
        devDependencies: {}
      }, null, 2),
      'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          lib: ['dom', 'dom.iterable', 'es6'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [
            {
              name: 'next'
            }
          ],
          paths: {
            '@/*': ['./src/*']
          }
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules']
      }, null, 2),
      'tailwind.config.ts': `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config`,
      'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'src/app/layout.tsx': `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next.js Fullstack App',
  description: 'Built with Next.js 14, TypeScript, and Tailwind CSS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
      'src/app/page.tsx': `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-8">
          Welcome to Next.js
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Built with TypeScript and Tailwind CSS
        </p>
        <div className="space-x-4">
          <a
            href="/api/hello"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Test API Route
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Read Docs
          </a>
        </div>
      </div>
    </main>
  )
}`,
      'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      'src/app/api/hello/route.ts': `export async function GET() {
  return Response.json({ message: 'Hello from Next.js API!' })
}`,
      'README.md': `# Next.js Fullstack App

A modern fullstack application built with Next.js 14, TypeScript, and Tailwind CSS.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **API Routes** for backend functionality
- **ESLint** for code quality

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
`
    }
  },

  'node-api': {
    id: 'node-api',
    name: 'Node.js API',
    description: 'Express + TypeScript + ESLint + Jest',
    dependencies: ['express', 'cors', 'helmet', 'dotenv'],
    devDependencies: [
      'typescript',
      '@types/node',
      '@types/express',
      '@types/cors',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'eslint',
      'jest',
      '@types/jest',
      'ts-jest',
      'ts-node',
      'nodemon'
    ],
    files: {
      'package.json': JSON.stringify({
        name: 'node-api',
        version: '1.0.0',
        description: 'Node.js API with TypeScript',
        main: 'dist/index.js',
        scripts: {
          start: 'node dist/index.js',
          dev: 'nodemon src/index.ts',
          build: 'tsc',
          test: 'jest',
          lint: 'eslint src --ext .ts'
        },
        dependencies: {},
        devDependencies: {}
      }, null, 2),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      }, null, 2),
      'src/index.ts': `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || ${CONFIG.PORTS.DEFAULT_DEV}

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Node.js API!' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})

export default app`,
      '.env.example': `PORT=${CONFIG.PORTS.DEFAULT_DEV}
NODE_ENV=development`,
      'README.md': `# Node.js API

A RESTful API built with Express.js and TypeScript.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
npm start
\`\`\`

## Scripts

- \`dev\`: Start development server with hot reload
- \`build\`: Compile TypeScript to JavaScript
- \`start\`: Start production server
- \`test\`: Run tests
- \`lint\`: Run ESLint

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check

## Built With

- [Express.js](https://expressjs.com/) - Web framework
- [TypeScript](https://typescriptlang.org/) - Type safety
- [Jest](https://jestjs.io/) - Testing framework
`
    }
  }
}
