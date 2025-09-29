import { BaseCommand, CommandResult } from './BaseCommand'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { MCPLogEntry, ProjectInfo, Repository } from '@/types'

export interface CreateProjectParams {
  content: string
  setCurrentProject: (project: ProjectInfo | null) => void
  navigateToRepository: (repo: Repository) => void
  isCreatingNewProject: boolean
  fastMode?: boolean
  aiProvider?: 'openai' | 'gemini'
  // Atomic operations - no more parameter explosion
  completeProjectCreation: (projectData: { repositoryUrl: string; name: string; isNewProject: boolean }) => void
}

/**
 * Command for creating new projects
 * Single responsibility: New project creation workflow
 */
export class CreateProjectCommand extends BaseCommand {
  private mcpClient = new TypedMCPClient()

  async execute(params: CreateProjectParams): Promise<CommandResult> {
    try {
      // Use the secure server-side AI-powered project creation
      const result = await this.mcpClient.call('create_project_with_ai', {
        description: params.content,
        fastMode: params.fastMode,
        aiProvider: params.aiProvider
      }) as {
        success: boolean
        message: string
        project?: {
          name: string
          path: string
          type: string
          description: string
          confidence: number
          reasoning: string
          features: string[]
          repositoryUrl?: string
          totalSteps: number
          executionSteps: Array<{
            step: number
            action: string
            tool: string
            success: boolean
            result?: unknown
            error?: string
            timestamp: string
          }>
          createdAt: string
          aiPowered: boolean
          llmUsed: string
        }
        chainOfThought?: string
      }

      if (result.success && result.project) {
        const { project } = result

        // Set project info from AI response
        params.setCurrentProject({
          name: project.name,
          path: project.path,
          template: project.type,
          status: 'completed',
          repositoryUrl: project.repositoryUrl
        })

        // Use chainOfThought from server response if available, otherwise create summary
        const chainOfThought = result.chainOfThought || [
          `🤖 AI Analysis: ${project.reasoning}`,
          `📊 Confidence: ${(project.confidence * 100).toFixed(1)}%`,
          `📁 Project Type: ${project.type}`,
          ...(project.features && project.features.length > 0 ? [`✨ Detected Features: ${project.features.join(', ')}`] : []),
          '🔄 Execution Plan:',
          ...(project.executionSteps?.map(step => `  ${step.success ? '✅' : '❌'} Step ${step.step}: ${step.action}`) || []),
          project.repositoryUrl ? `🔗 Repository: ${project.repositoryUrl}` : '',
          `📂 Project Path: ${project.path}`
        ].filter(Boolean).join('\n')

        // Convert execution steps to MCP logs
        const mcpLogs: MCPLogEntry[] = project.executionSteps?.map(step => ({
          timestamp: step.timestamp,
          type: step.success ? 'response' : 'error' as const,
          tool: step.tool,
          message: step.success ?
            `Step ${step.step}: ${step.action} completed successfully` :
            `Step ${step.step}: ${step.action} failed - ${step.error}`,
          data: step.result || step.error
        })) || []

        // Create comprehensive response message
        const responseContent = [
          `✨ **Project Created Successfully!**`,
          ``,
          `**📊 Analysis Results:**`,
          `• Type: ${project.type}`,
          `• Confidence: ${(project.confidence * 100).toFixed(1)}%`,
          `• AI Model: ${project.llmUsed}`,
          ...(project.features && project.features.length > 0 ? [`• Features: ${project.features.join(', ')}`] : []),
          ``,
          `**📂 Project Details:**`,
          `• Name: ${project.name}`,
          `• Path: ${project.path}`,
          `• Total Steps: ${project.totalSteps}`,
          `• Created: ${new Date(project.createdAt).toLocaleString()}`,
          ...(project.repositoryUrl ? [`• Repository: ${project.repositoryUrl}`] : []),
          ``,
          `🎉 Your project is ready! Check the Project Preview panel to download or clone it.`
        ].join('\n')

        // Add single comprehensive message with debugging info
        this.addMessage('assistant', responseContent, chainOfThought, mcpLogs)

        // Handle project creation completion with atomic operation
        if (project.repositoryUrl) {
          // Use atomic operation to handle all project creation state updates
          params.completeProjectCreation({
            repositoryUrl: project.repositoryUrl,
            name: project.name,
            isNewProject: params.isCreatingNewProject
          })
          
          console.log('✅ Project creation completed atomically - no race conditions')
        }

        return {
          success: true,
          message: responseContent,
          chainOfThought,
          mcpLogs
        }
      } else {
        // Fallback to basic project creation if AI fails
        this.addMessage('assistant', '🤖 AI analysis failed, using fallback method...')
        this.addMessage('assistant', result.message || 'Creating project with basic setup...')

        // Use the basic MCP tools for fallback
        const fallbackResult = await this.mcpClient.call('intelligent_project_setup', {
          description: params.content,
          projectPath: `/tmp/projects/fallback-${Date.now()}`,
          autoExecute: false,
          fastMode: params.fastMode
        }) as {
          success: boolean
          message: string
          analysis?: {
            projectType: string
            confidence: number
            reasoning: string
            features: string[]
            recommendedName: string
          }
          plannedActions?: string[]
        }

        this.addMessage('assistant', fallbackResult.message || 'Project setup completed')

        return {
          success: false,
          message: result.message || 'Project creation failed'
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong'

      // Check if it's an AI-related error
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        this.addMessage('assistant', '🤖 AI service unavailable. Using intelligent fallback...')
        this.addMessage('assistant', '💡 Try: "Create a React TypeScript project" for basic setup')
      } else {
        this.addMessage('assistant', `❌ Project creation failed: ${errorMessage}`)
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }
}
