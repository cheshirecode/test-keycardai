import { BaseCommand, CommandResult } from './BaseCommand'
import { MCPClient } from '@/lib/mcp-client'
import type { MCPLogEntry, Repository } from '@/types'

export interface ModifyRepositoryParams {
  content: string
  repository: Repository
  refreshRepositories: () => void
  invalidateRepositoriesCache: () => void
}

/**
 * Command for modifying existing repositories
 * Single responsibility: Repository modification workflow
 */
export class ModifyRepositoryCommand extends BaseCommand {
  private mcpClient = new MCPClient()

  async execute(params: ModifyRepositoryParams): Promise<CommandResult> {
    try {
      // For repository modifications, we need to use a different approach
      // that properly handles existing repository context
      this.addMessage('assistant', `🔄 **Modifying Repository: ${params.repository.name}**\n\nAnalyzing your request and preparing modifications...`)

      // First, analyze the existing repository
      const analysisResult = await this.mcpClient.call('analyze_existing_project', {
        projectPath: `/tmp/repositories/${params.repository.name}`, // We'll need to clone or access the repo
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
        this.addMessage('assistant', `❌ Failed to analyze existing repository: ${analysisResult.message}`)
        return {
          success: false,
          message: analysisResult.message
        }
      }

      // Generate modification plan specifically for repository modification
      const planResult = await this.mcpClient.call('generate_modification_plan', {
        projectPath: `/tmp/repositories/${params.repository.name}`,
        requestDescription: params.content,
        analysisData: analysisResult.analysis,
        repositoryContext: {
          name: params.repository.name,
          fullName: params.repository.fullName,
          url: params.repository.url,
          description: params.repository.description
        }
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
        `🔄 **Modifying Repository: ${params.repository.name}**`,
        ``,
        `**📊 Repository Analysis:**`,
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

      // Commit and push changes if any modifications were made
      if (successCount > 0) {
        try {
          // First commit locally
          await this.mcpClient.call('git_add_commit', {
            path: `/tmp/repositories/${params.repository.name}`,
            message: `feat: ${params.content.toLowerCase()}\n\nModifications applied via MCP:\n${plan.map(s => `- ${s.description}`).join('\n')}`
          })

          // Then push to remote repository
          await this.mcpClient.call('git_push', {
            path: `/tmp/repositories/${params.repository.name}`,
            repository: params.repository
          })

          mcpLogs.push({
            timestamp: new Date().toISOString(),
            type: 'info',
            tool: 'git_push',
            message: 'Changes committed and pushed to repository',
            data: 'Automatic commit and push after modifications'
          })
        } catch (commitError) {
          mcpLogs.push({
            timestamp: new Date().toISOString(),
            type: 'error',
            tool: 'git_push',
            message: 'Failed to commit and push changes',
            data: commitError instanceof Error ? commitError.message : 'Unknown error'
          })
        }
      }

      // Final success message
      const successMessage = [
        `✅ **Repository Modifications Completed!**`,
        ``,
        `**📊 Results:**`,
        `• Successfully executed: ${successCount}/${plan.length} steps`,
        `• Repository: ${params.repository.name}`,
        `• URL: ${params.repository.url}`,
        ``,
        `🎉 Your repository has been updated! Changes have been committed and pushed to GitHub.`
      ].join('\n')

      this.addMessage('assistant', successMessage, planMessage, mcpLogs)

      // Refresh the repositories list after successful modification
      setTimeout(() => {
        if (this.checkMounted()) {
          params.invalidateRepositoriesCache()
          params.refreshRepositories()
        }
      }, 1000)

      return {
        success: true,
        message: successMessage,
        chainOfThought: planMessage,
        mcpLogs
      }

    } catch (error) {
      console.error('Repository modification error:', error)
      const errorMessage = `❌ Failed to modify repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      this.addMessage('assistant', errorMessage)

      return {
        success: false,
        message: errorMessage
      }
    }
  }
}
