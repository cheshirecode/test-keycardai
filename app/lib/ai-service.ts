import { generateObject, generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const ProjectAnalysisSchema = z.object({
  projectType: z.enum(['react-ts', 'nextjs-fullstack', 'node-api', 'unknown']),
  features: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  projectName: z.string().optional()
})

const MCPActionSchema = z.object({
  actions: z.array(z.object({
    tool: z.string(),
    params: z.record(z.string(), z.unknown()),
    description: z.string()
  })),
  response: z.string()
})

export class AIService {
  static async analyzeProjectRequest(userMessage: string) {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, returning fallback analysis')
      return {
        projectType: 'react-ts' as const,
        features: ['basic-setup'],
        confidence: 0.3,
        reasoning: 'Fallback analysis: OpenAI API key not configured. Using default React TypeScript template.',
        projectName: 'my-project'
      }
    }
    try {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ProjectAnalysisSchema,
        prompt: `
Analyze this project creation request and determine the best template:

User request: "${userMessage}"

Available templates:
- react-ts: Vite + React + TypeScript + Tailwind CSS (for frontend SPAs)
- nextjs-fullstack: Next.js 14 + TypeScript + Tailwind + App Router (for fullstack web apps)
- node-api: Express + TypeScript + ESLint + Jest (for backend APIs)

Consider:
- Programming language/framework mentions
- Project type (frontend/backend/fullstack)
- Specific technologies mentioned
- Project complexity level

Extract a project name if mentioned, or suggest one based on the request.
Return the most appropriate template with confidence score and reasoning.
        `.trim()
      })

      return result.object
    } catch (error) {
      console.error('AI analysis failed:', error)
      return {
        projectType: 'react-ts' as const,
        features: [],
        confidence: 0.5,
        reasoning: 'Fallback to React TypeScript template due to analysis error',
        projectName: 'my-project'
      }
    }
  }

  static async generateMCPActions(userMessage: string, analysis: { projectType: string, projectName?: string, confidence: number }, projectPath: string, existingRepository?: { name: string, fullName: string, url: string, description?: string }) {
    try {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: MCPActionSchema,
        prompt: `
Create MCP tool actions for this ${existingRepository ? 'REPOSITORY MODIFICATION' : 'PROJECT CREATION'} request:

User: "${userMessage}"
Analyzed as: ${analysis.projectType} (confidence: ${analysis.confidence})
Project path: ${projectPath}
Project name: ${analysis.projectName || 'my-project'}
${existingRepository ? `
EXISTING REPOSITORY CONTEXT:
- Repository: ${existingRepository.name}
- URL: ${existingRepository.url}
- Description: ${existingRepository.description || 'No description'}

This is a MODIFICATION request for an existing repository, NOT new project creation.
` : ''}

Available MCP tools:
${existingRepository ? `
FOR REPOSITORY MODIFICATIONS:
- clone_repository(url, path): Clone existing repository
- add_packages(projectPath, packages): Add npm packages
- generate_code(projectPath, type, name): Generate components/files
- update_file(projectPath, filePath, content): Update existing files
- git_add_commit(path, message): Commit changes
- git_push(path, repository): Push changes to remote
` : `
FOR NEW PROJECT CREATION:
- setup_project_from_template(projectPath, templateId, projectName): Create project from template
- git_init(path): Initialize git repo
- install_dependencies(path): Install npm packages
- git_add_commit(path, message): Commit changes
`}

Generate a sequence of actions to:
${existingRepository ? `
1. Clone the existing repository
2. Make the requested modifications (add packages, generate code, etc.)
3. Commit the changes
4. Push changes back to the repository
` : `
1. Create project from template
2. Initialize git repository
3. Install dependencies
4. Make initial commit
`}

Keep the response message minimal and action-focused.
        `.trim()
      })

      return result.object
    } catch (error) {
      console.error('MCP action generation failed:', error)
      return {
        actions: [
          {
            tool: 'setup_project_from_template',
            params: {
              projectPath,
              templateId: analysis.projectType,
              projectName: analysis.projectName || 'my-project'
            },
            description: 'Create project from template'
          },
          {
            tool: 'git_init',
            params: { path: projectPath },
            description: 'Initialize git repository'
          },
          {
            tool: 'install_dependencies',
            params: { path: projectPath },
            description: 'Install dependencies'
          },
          {
            tool: 'git_add_commit',
            params: {
              path: projectPath,
              message: `Initial commit: ${analysis.projectName || 'my-project'}`
            },
            description: 'Create initial commit'
          }
        ],
        response: '✓ Project created successfully. Ready to code!'
      }
    }
  }

  static async generateResponse(userMessage: string, context?: string) {
    try {
      const result = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: `
You are a helpful project scaffolding assistant. Respond to the user's message briefly and professionally.

User: "${userMessage}"
${context ? `Context: ${context}` : ''}

Keep responses short, friendly, and action-focused. Use checkmarks (✓) for completed actions.
If something went wrong, be helpful but concise.
        `.trim()
      })

      return result.text
    } catch (error) {
      console.error('Response generation failed:', error)
      return 'I encountered an issue. Please try again.'
    }
  }

  static async optimizeProjectStructure(projectPath: string, projectType: string) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          recommendations: [],
          reasoning: 'OpenAI API key not configured'
        }
      }

      const result = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: `
Analyze this ${projectType} project structure and provide optimization recommendations:

Project type: ${projectType}
Project path: ${projectPath}

Consider:
- Best practices for ${projectType} projects
- Recommended directory structure
- Essential configuration files
- Development workflow optimizations
- Performance and maintainability improvements

Provide 3-5 specific, actionable recommendations.
        `.trim()
      })

      return {
        recommendations: result.text.split('\n').filter(line => line.trim().length > 0),
        reasoning: `AI analysis for ${projectType} project optimization`,
        aiPowered: true
      }
    } catch (error) {
      console.error('Project optimization failed:', error)
      return {
        recommendations: [`Consider using standard ${projectType} project structure`],
        reasoning: 'Fallback recommendations due to AI service error'
      }
    }
  }

  static async recommendGitWorkflow(projectType: string, features: string[]) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          workflow: 'standard',
          steps: ['init', 'add', 'commit'],
          reasoning: 'OpenAI API key not configured - using standard workflow'
        }
      }

      const result = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: `
Recommend the optimal Git workflow for this project:

Project type: ${projectType}
Features: ${features.join(', ')}

Consider:
- Project complexity and team size
- Deployment strategy (GitHub integration vs local)
- Best practices for ${projectType} projects
- Continuous integration needs

Recommend workflow type and key steps.
        `.trim()
      })

      return {
        workflow: 'ai-optimized',
        recommendations: result.text,
        aiPowered: true,
        reasoning: `AI-recommended workflow for ${projectType} with features: ${features.join(', ')}`
      }
    } catch (error) {
      console.error('Git workflow recommendation failed:', error)
      return {
        workflow: 'standard',
        steps: ['init', 'add', 'commit'],
        reasoning: 'Fallback to standard workflow due to AI service error'
      }
    }
  }
}
