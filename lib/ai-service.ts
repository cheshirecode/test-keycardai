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
    try {
      const result = await generateObject({
        model: openai('gpt-3.5-turbo'),
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

  static async generateMCPActions(userMessage: string, analysis: { projectType: string, projectName?: string, confidence: number }, projectPath: string) {
    try {
      const result = await generateObject({
        model: openai('gpt-3.5-turbo'),
        schema: MCPActionSchema,
        prompt: `
Create MCP tool actions for this project request:

User: "${userMessage}"
Analyzed as: ${analysis.projectType} (confidence: ${analysis.confidence})
Project path: ${projectPath}
Project name: ${analysis.projectName || 'my-project'}

Available MCP tools:
- setup_project_from_template(projectPath, templateId, projectName): Create project from template
- git_init(path): Initialize git repo
- install_dependencies(path): Install npm packages
- git_add_commit(path, message): Commit changes

Generate a sequence of actions to:
1. Create project from template
2. Initialize git repository
3. Install dependencies
4. Make initial commit

Keep the response message minimal and action-focused (like "✓ Creating project..." then "✓ Project ready!").
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
}
