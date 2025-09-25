import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fullProcessCleanup, safeProcessCleanup, ProcessCleanupResult } from '../../../lib/process-cleanup'
import { CONFIG } from '@/lib/config'
// import { AIService } from '@/lib/ai-service' // Currently unused

export interface RunScriptParams {
  projectPath: string
  script: string
  args?: string[]
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
}

export interface GenerateCodeParams {
  projectPath: string
  type: 'component' | 'page' | 'hook' | 'utility' | 'test' | 'config'
  name: string
  framework?: string
  description?: string
  props?: Record<string, string>
}

export interface DevelopmentResult {
  success: boolean
  message: string
  output?: string
  filePath?: string
  content?: string
  error?: string
}

/**
 * Development Tools Module
 * Handles script execution, code generation, and development workflows
 */
export const developmentTools = {
  /**
   * Clean up processes and build artifacts before starting development
   */
  cleanup_processes: async (params: { 
    projectPath?: string
    ports?: number[]
    killNodeProcesses?: boolean
    cleanBuildArtifacts?: boolean
  }): Promise<ProcessCleanupResult> => {
    try {
      return await fullProcessCleanup({
        projectPath: params.projectPath,
        ports: params.ports || [...CONFIG.PORTS.DEV_SERVERS],
        killNodeProcesses: params.killNodeProcesses || false,
        cleanBuildArtifacts: params.cleanBuildArtifacts !== false // Default to true
      })
    } catch (error) {
      return {
        success: false,
        message: 'Process cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Safe cleanup that won't interfere with current processes
   */
  safe_cleanup: async (params: { projectPath?: string }): Promise<ProcessCleanupResult> => {
    try {
      return await safeProcessCleanup(params.projectPath)
    } catch (error) {
      return {
        success: false,
        message: 'Safe cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Run a script in the project
   */
  run_script: async (params: RunScriptParams): Promise<DevelopmentResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'No package.json found.'
        }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const availableScripts = packageJson.scripts || {}

      // Check if script exists
      if (!availableScripts[params.script]) {
        return {
          success: false,
          message: `Script "${params.script}" not found. Available scripts: ${Object.keys(availableScripts).join(', ')}`
        }
      }

      const packageManager = params.packageManager || detectPackageManager(params.projectPath)
      const args = params.args ? ` ${params.args.join(' ')}` : ''
      
      let command: string
      switch (packageManager) {
        case 'yarn':
          command = `yarn ${params.script}${args}`
          break
        case 'pnpm':
          command = `pnpm run ${params.script}${args}`
          break
        case 'bun':
          command = `bun run ${params.script}${args}`
          break
        default:
          command = `npm run ${params.script}${args}`
      }

      try {
        const output = execSync(command, {
          cwd: params.projectPath,
          encoding: 'utf8',
          timeout: CONFIG.TIMEOUTS.SCRIPT_EXECUTION,
          maxBuffer: CONFIG.LIMITS.MAX_OUTPUT_BUFFER
        })

        return {
          success: true,
          message: `Script "${params.script}" executed successfully`,
          output: output.toString()
        }
      } catch (execError: unknown) {
        const errorMessage = execError instanceof Error ? execError.message : 'Unknown error'
        const errorOutput = (execError as { stdout?: string }).stdout || ''
        const errorDetails = (execError as { stderr?: string }).stderr || errorMessage
        
        return {
          success: false,
          message: `Script "${params.script}" failed`,
          error: errorDetails,
          output: errorOutput
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to run script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Generate code for components, pages, hooks, etc.
   */
  generate_code: async (params: GenerateCodeParams): Promise<DevelopmentResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      // Analyze project to understand structure and conventions
      const projectInfo = await analyzeProjectForGeneration(params.projectPath)
      
      // Generate code based on type and framework
      const codeResult = await generateCodeContent(params, projectInfo)
      
      if (!codeResult.success) {
        return codeResult
      }

      // Determine file path based on project structure and type
      const filePath = determineFilePath(params, projectInfo)
      const fullPath = path.join(params.projectPath, filePath)

      // Create directory if it doesn't exist
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Check if file already exists
      if (fs.existsSync(fullPath)) {
        return {
          success: false,
          message: `File already exists: ${filePath}. Use update_file to modify it.`
        }
      }

      // Write the generated code
      fs.writeFileSync(fullPath, codeResult.content!, 'utf8')

      return {
        success: true,
        message: `Generated ${params.type} "${params.name}" successfully`,
        filePath,
        content: codeResult.content
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Run linting and formatting
   */
  format_code: async (params: { projectPath: string; files?: string[] }): Promise<DevelopmentResult> => {
    try {
      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'No package.json found.'
        }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const scripts = packageJson.scripts || {}
      
      const commands: string[] = []
      
      // Check for common formatting scripts
      if (scripts.lint) {
        commands.push('lint')
      }
      if (scripts.format) {
        commands.push('format')
      }
      if (scripts['lint:fix']) {
        commands.push('lint:fix')
      }

      if (commands.length === 0) {
        return {
          success: false,
          message: 'No formatting scripts found (lint, format, lint:fix)'
        }
      }

      const packageManager = detectPackageManager(params.projectPath)
      let output = ''

      for (const script of commands) {
        try {
          let command: string
          switch (packageManager) {
            case 'yarn':
              command = `yarn ${script}`
              break
            case 'pnpm':
              command = `pnpm run ${script}`
              break
            case 'bun':
              command = `bun run ${script}`
              break
            default:
              command = `npm run ${script}`
          }

          const result = execSync(command, {
            cwd: params.projectPath,
            encoding: 'utf8',
            timeout: CONFIG.TIMEOUTS.SCRIPT_EXECUTION
          })

          output += `${script}: ${result}\n`
        } catch (execError: unknown) {
          const errorMessage = execError instanceof Error ? execError.message : 'Unknown error'
          output += `${script} failed: ${errorMessage}\n`
        }
      }

      return {
        success: true,
        message: `Code formatting completed`,
        output
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to format code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Get available scripts in the project
   */
  get_available_scripts: async (params: { projectPath: string }): Promise<{
    success: boolean
    message: string
    scripts?: Record<string, string>
  }> => {
    try {
      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'No package.json found.'
        }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const scripts = packageJson.scripts || {}

      return {
        success: true,
        message: `Found ${Object.keys(scripts).length} scripts`,
        scripts
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to get scripts: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Detect package manager
 */
function detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' | 'bun' {
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) return 'bun'
  return 'npm'
}

/**
 * Analyze project to understand structure and conventions
 */
async function analyzeProjectForGeneration(projectPath: string): Promise<{
  framework: string
  isTypeScript: boolean
  hasSrcDir: boolean
  hasAppDir: boolean
  hasPagesDir: boolean
  hasComponentsDir: boolean
  packageJson: Record<string, unknown>
}> {
  const packageJsonPath = path.join(projectPath, 'package.json')
  const packageJson = fs.existsSync(packageJsonPath) 
    ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    : {}

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  let framework = 'vanilla'
  let isTypeScript = false
  
  if (deps.next) framework = 'next'
  else if (deps.react) framework = 'react'
  else if (deps.vue) framework = 'vue'
  else if (deps.angular) framework = 'angular'
  
  if (deps.typescript || fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
    isTypeScript = true
  }

  // Check directory structure
  const hasSrcDir = fs.existsSync(path.join(projectPath, 'src'))
  const hasAppDir = fs.existsSync(path.join(projectPath, 'app'))
  const hasPagesDir = fs.existsSync(path.join(projectPath, 'pages'))
  const hasComponentsDir = fs.existsSync(path.join(projectPath, 'src/components')) || 
                            fs.existsSync(path.join(projectPath, 'components'))

  return {
    framework,
    isTypeScript,
    hasSrcDir,
    hasAppDir,
    hasPagesDir,
    hasComponentsDir,
    packageJson
  }
}

/**
 * Generate code content based on type and framework
 */
async function generateCodeContent(params: GenerateCodeParams, projectInfo: { isTypeScript: boolean }): Promise<DevelopmentResult> {
  const { type, name, description, props } = params
  const { isTypeScript } = projectInfo
  let content = ''

  switch (type) {
    case 'component':
      content = generateReactComponent(name, isTypeScript, props, description)
      break
    case 'page':
      content = generateReactPage(name, isTypeScript, description)
      break
    case 'hook':
      content = generateReactHook(name, isTypeScript, description)
      break
    case 'utility':
      content = generateUtility(name, isTypeScript, description)
      break
    case 'test':
      content = generateTest(name, isTypeScript, description)
      break
    default:
      return {
        success: false,
        message: `Unsupported code type: ${type}`
      }
  }

  return {
    success: true,
    message: `Generated ${type} code`,
    content
  }
}

/**
 * Determine file path based on project structure
 */
function determineFilePath(params: GenerateCodeParams, projectInfo: { 
  isTypeScript: boolean
  hasSrcDir: boolean
  hasAppDir: boolean
  hasComponentsDir: boolean
}): string {
  const { type, name } = params
  const { isTypeScript, hasSrcDir, hasAppDir, hasComponentsDir } = projectInfo
  
  const ext = isTypeScript ? (type === 'utility' ? 'ts' : 'tsx') : (type === 'utility' ? 'js' : 'jsx')
  
  const baseDir = hasSrcDir ? 'src' : ''
  
  switch (type) {
    case 'component':
      if (hasComponentsDir) {
        return path.join(baseDir, 'components', `${name}.${ext}`)
      }
      return path.join(baseDir, `${name}.${ext}`)
      
    case 'page':
      if (hasAppDir) {
        return path.join('app', name.toLowerCase(), `page.${ext}`)
      }
      return path.join(baseDir, 'pages', `${name.toLowerCase()}.${ext}`)
      
    case 'hook':
      return path.join(baseDir, 'hooks', `use${name}.${ext}`)
      
    case 'utility':
      return path.join(baseDir, 'utils', `${name}.${ext}`)
      
    case 'test':
      return path.join(baseDir, '__tests__', `${name}.test.${ext}`)
      
    default:
      return path.join(baseDir, `${name}.${ext}`)
  }
}

/**
 * Code generation templates
 */
function generateReactComponent(name: string, isTypeScript: boolean, props?: Record<string, string>, description?: string): string {
  const propsInterface = isTypeScript && props ? 
    `interface ${name}Props {\n${Object.entries(props).map(([key, type]) => `  ${key}: ${type}`).join('\n')}\n}\n\n` : ''
  
  const propsParam = props ? `props: ${isTypeScript ? `${name}Props` : 'Record<string, unknown>'}` : ''
  
  return `${description ? `/**\n * ${description}\n */\n` : ''}${propsInterface}export default function ${name}(${propsParam}) {
  return (
    <div>
      <h1>${name}</h1>
      {/* Component content */}
    </div>
  )
}`
}

function generateReactPage(name: string, isTypeScript: boolean, description?: string): string {
  return `${description ? `/**\n * ${description}\n */\n` : ''}export default function ${name}Page() {
  return (
    <main>
      <h1>${name}</h1>
      {/* Page content */}
    </main>
  )
}`
}

function generateReactHook(name: string, isTypeScript: boolean, description?: string): string {
  const hookName = name.startsWith('use') ? name : `use${name}`
  
  return `${description ? `/**\n * ${description}\n */\n` : ''}import { useState, useEffect } from 'react'

export function ${hookName}() {
  const [state, setState] = useState${isTypeScript ? '<unknown>' : ''}(null)

  useEffect(() => {
    // Hook logic
  }, [])

  return { state, setState }
}`
}

function generateUtility(name: string, isTypeScript: boolean, description?: string): string {
  return `${description ? `/**\n * ${description}\n */\n` : ''}export function ${name}(${isTypeScript ? 'input: unknown' : 'input'})${isTypeScript ? ': unknown' : ''} {
  // Utility function logic
  return input
}`
}

function generateTest(name: string, isTypeScript: boolean, description?: string): string {
  return `${description ? `/**\n * ${description}\n */\n` : ''}import { describe, it, expect } from 'vitest'

describe('${name}', () => {
  it('should work correctly', () => {
    // Test implementation
    expect(true).toBe(true)
  })
})`
}
