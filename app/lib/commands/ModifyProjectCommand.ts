import { BaseCommand, CommandResult } from './BaseCommand'
import { MCPClient } from '@/lib/mcp-client'
import type { MCPLogEntry, ProjectInfo } from '@/types'

export interface ModifyProjectParams {
  content: string
  project: ProjectInfo
}

/**
 * Command for modifying existing projects
 * Single responsibility: Project modification workflow
 */
export class ModifyProjectCommand extends BaseCommand {
  private mcpClient = new MCPClient()

  async execute(params: ModifyProjectParams): Promise<CommandResult> {
    try {
      // First, analyze the existing project
      const analysisResult = await this.mcpClient.call('analyze_existing_project', {
        projectPath: params.project.path,
        requestDescription: params.content
      }) as { 
        success: boolean
        message: string
        analysis?: {
          projectType: string
          framework: string
          structure: string[]
          dependencies: Record<string, string>
          recommendations: string[]
        }
      }

      if (!analysisResult.success) {
        this.addMessage('assistant', `❌ Failed to analyze existing project: ${analysisResult.message}`)
        return {
          success: false,
          message: analysisResult.message
        }
      }

      // Generate modification plan
      const planResult = await this.mcpClient.call('generate_modification_plan', {
        projectPath: params.project.path,
        requestDescription: params.content,
        analysisData: analysisResult.analysis
      }) as { 
        success: boolean
        message: string
        analysis?: {
          projectType: string
          framework: string
          modificationPlan: Array<{
            step: number
            action: string
            tool: string
            params: unknown
            description: string
          }>
        }
      }

      if (!planResult.success || !planResult.analysis?.modificationPlan) {
        this.addMessage('assistant', `❌ Failed to generate modification plan: ${planResult.message}`)
        return {
          success: false,
          message: planResult.message
        }
      }

      const plan = planResult.analysis.modificationPlan

      // Show the plan to the user
      const planMessage = [
        `🔄 **Modifying Existing Project: ${params.project.name}**`,
        ``,
        `**📊 Project Analysis:**`,
        `• Type: ${analysisResult.analysis?.projectType}`,
        `• Framework: ${analysisResult.analysis?.framework}`,
        `• Current Dependencies: ${Object.keys(analysisResult.analysis?.dependencies || {}).length} packages`,
        ``,
        `**🛠️ Modification Plan:**`,
        ...plan.map(step => `${step.step}. ${step.description}`),
        ``,
        `⚡ Executing modifications...`
      ].join('\n')

      this.addMessage('assistant', planMessage)

      // Execute the modification plan
      const mcpLogs: MCPLogEntry[] = []
      let successCount = 0

      for (const step of plan) {
        try {
          const stepStart = Date.now()
          const stepResult = await this.mcpClient.call(step.tool, step.params as Record<string, unknown>)
          const duration = Date.now() - stepStart

          mcpLogs.push({
            timestamp: new Date().toISOString(),
            type: 'response',
            tool: step.tool,
            message: `Step ${step.step}: ${step.description} completed`,
            data: stepResult,
            duration
          })

          successCount++
        } catch (stepError) {
          mcpLogs.push({
            timestamp: new Date().toISOString(),
            type: 'error',
            tool: step.tool,
            message: `Step ${step.step}: ${step.description} failed`,
            data: stepError instanceof Error ? stepError.message : 'Unknown error'
          })
        }
      }

      // Commit changes if any modifications were made
      if (successCount > 0) {
        try {
          await this.mcpClient.call('git_add_commit', {
            path: params.project.path,
            message: `feat: ${params.content.toLowerCase()}\n\nModifications applied via MCP:\n${plan.map(s => `- ${s.description}`).join('\n')}`
          })

          mcpLogs.push({
            timestamp: new Date().toISOString(),
            type: 'info',
            tool: 'git_add_commit',
            message: 'Changes committed to git',
            data: 'Automatic commit after modifications'
          })
        } catch (commitError) {
          mcpLogs.push({
            timestamp: new Date().toISOString(),
            type: 'error',
            tool: 'git_add_commit',
            message: 'Failed to commit changes',
            data: commitError instanceof Error ? commitError.message : 'Unknown error'
          })
        }
      }

      // Final success message
      const successMessage = [
        `✅ **Project Modifications Completed!**`,
        ``,
        `**📊 Results:**`,
        `• Successfully executed: ${successCount}/${plan.length} steps`,
        `• Project: ${params.project.name}`,
        `• Path: ${params.project.path}`,
        ...(params.project.repositoryUrl ? [`• Repository: ${params.project.repositoryUrl}`] : []),
        ``,
        `🎉 Your project has been updated! ${params.project.repositoryUrl ? 'Changes have been committed to the repository.' : ''}`
      ].join('\n')

      this.addMessage('assistant', successMessage, planMessage, mcpLogs)

      return {
        success: true,
        message: successMessage,
        chainOfThought: planMessage,
        mcpLogs
      }

    } catch (error) {
      console.error('Project modification error:', error)
      const errorMessage = `❌ Failed to modify project: ${error instanceof Error ? error.message : 'Unknown error'}`
      this.addMessage('assistant', errorMessage)
      
      return {
        success: false,
        message: errorMessage
      }
    }
  }
}
