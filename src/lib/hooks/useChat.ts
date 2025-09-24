import { useState, useCallback } from 'react'
import { MCPClient } from '../mcp-client'
import { Message, ProjectInfo, MCPLogEntry } from '../../typings/ui'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const mcpClient = new MCPClient()

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, chainOfThought?: string, mcpLogs?: MCPLogEntry[]) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      chainOfThought: chainOfThought,
      mcpLogs: mcpLogs
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

  // This function is kept for potential future use but not currently called
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const executeProjectCreation = async (actions: Array<{tool: string, params: Record<string, unknown>, description: string}>) => {
    try {
      for (const action of actions) {
        console.log(`Executing: ${action.tool}`, action.params)
        await mcpClient.call(action.tool, action.params)
      }

      setCurrentProject(prev => prev ? { ...prev, status: 'completed' } : null)
      return true
    } catch (error) {
      console.error('Project creation failed:', error)
      setCurrentProject(prev => prev ? { ...prev, status: 'error' } : null)
      throw error
    }
  }

  const sendMessage = async (content: string) => {
    if (isLoading) return

    setIsLoading(true)
    addMessage('user', content)

    try {
      // Determine if this is a new project request or a modification to existing project
      const isModificationRequest = currentProject && await isProjectModificationRequest(content)
      
      if (isModificationRequest && currentProject) {
        // Handle modification to existing project
        await handleProjectModification(content, currentProject)
      } else {
        // Handle new project creation
        await handleNewProjectCreation(content)
      }
    } catch (error) {
      console.error('Request failed:', error)
      addMessage('assistant', `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewProjectCreation = async (content: string) => {
    try {
      // Use the secure server-side AI-powered project creation
        const result = await mcpClient.call('create_project_with_ai', {
          description: content
        }) as { success: boolean; message: string; project?: {
          name: string;
          path: string;
          type: string;
        description: string;
        confidence: number;
        reasoning: string;
        features: string[];
        repositoryUrl?: string;
        totalSteps: number;
        executionSteps: Array<{
          step: number;
          action: string;
          tool: string;
          success: boolean;
          result?: unknown;
          error?: string;
          timestamp: string;
        }>;
        createdAt: string;
        aiPowered: boolean;
        llmUsed: string;
      }; chainOfThought?: string }

      if (result.success && result.project) {
        const { project } = result

        // Set project info from AI response
        setCurrentProject({
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
        addMessage('assistant', responseContent, chainOfThought, mcpLogs)

        // Final message is already included in the comprehensive response above
      } else {
        // Fallback to basic project creation if AI fails
        addMessage('assistant', '🤖 AI analysis failed, using fallback method...')
        addMessage('assistant', result.message || 'Creating project with basic setup...')

        // Use the basic MCP tools for fallback
        const fallbackResult = await mcpClient.call('intelligent_project_setup', {
          description: content,
          projectPath: `/tmp/projects/fallback-${Date.now()}`,
          autoExecute: false
        }) as { success: boolean; message: string; analysis?: {
          projectType: string;
          confidence: number;
          reasoning: string;
          features: string[];
          recommendedName: string;
        }; plannedActions?: string[] }

        addMessage('assistant', fallbackResult.message || 'Project setup completed')
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong'

      // Check if it's an AI-related error
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        addMessage('assistant', '🤖 AI service unavailable. Using intelligent fallback...')
        addMessage('assistant', '💡 Try: "Create a React TypeScript project" for basic setup')
      } else {
        addMessage('assistant', `❌ Project creation failed: ${errorMessage}`)
      }

      setCurrentProject(prev => prev ? { ...prev, status: 'error' } : null)
    }
  }

  const handleProjectModification = async (content: string, project: ProjectInfo) => {
    try {
      // First, analyze the existing project
      const analysisResult = await mcpClient.call('analyze_existing_project', {
        projectPath: project.path,
        requestDescription: content
      }) as { success: boolean; message: string; analysis?: {
        projectType: string;
        framework: string;
        structure: string[];
        dependencies: Record<string, string>;
        recommendations: string[];
      }}

      if (!analysisResult.success) {
        addMessage('assistant', `❌ Failed to analyze existing project: ${analysisResult.message}`)
        return
      }

      // Generate modification plan
      const planResult = await mcpClient.call('generate_modification_plan', {
        projectPath: project.path,
        requestDescription: content,
        analysisData: analysisResult.analysis
      }) as { success: boolean; message: string; analysis?: {
        projectType: string;
        framework: string;
        modificationPlan: Array<{
          step: number;
          action: string;
          tool: string;
          params: unknown;
          description: string;
        }>;
      }}

      if (!planResult.success || !planResult.analysis?.modificationPlan) {
        addMessage('assistant', `❌ Failed to generate modification plan: ${planResult.message}`)
        return
      }

      const plan = planResult.analysis.modificationPlan
      
      // Show the plan to the user
      const planMessage = [
        `🔄 **Modifying Existing Project: ${project.name}**`,
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

      addMessage('assistant', planMessage)

      // Execute the modification plan
      const mcpLogs: MCPLogEntry[] = []
      let successCount = 0

      for (const step of plan) {
        try {
          const stepStart = Date.now()
          const stepResult = await mcpClient.call(step.tool, step.params as Record<string, unknown>)
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
          await mcpClient.call('git_add_commit', {
            path: project.path,
            message: `feat: ${content.toLowerCase()}\n\nModifications applied via MCP:\n${plan.map(s => `- ${s.description}`).join('\n')}`
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
        `• Project: ${project.name}`,
        `• Path: ${project.path}`,
        ...(project.repositoryUrl ? [`• Repository: ${project.repositoryUrl}`] : []),
        ``,
        `🎉 Your project has been updated! ${project.repositoryUrl ? 'Changes have been committed to the repository.' : ''}`
      ].join('\n')

      addMessage('assistant', successMessage, planMessage, mcpLogs)

    } catch (error) {
      console.error('Project modification error:', error)
      addMessage('assistant', `❌ Failed to modify project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const isProjectModificationRequest = async (content: string): Promise<boolean> => {
    // Check for modification keywords
    const modificationKeywords = [
      'add', 'install', 'include', 'integrate', 'update', 'upgrade', 'modify', 'change',
      'remove', 'delete', 'uninstall', 'configure', 'setup', 'enable', 'disable',
      'implement', 'create component', 'create hook', 'create page', 'create util',
      'refactor', 'optimize', 'fix', 'debug', 'test'
    ]

    const lowerContent = content.toLowerCase()
    
    // If content starts with clear modification intent
    const hasModificationIntent = modificationKeywords.some(keyword => 
      lowerContent.includes(keyword)
    )

    // If content doesn't contain new project keywords
    const newProjectKeywords = ['create project', 'new project', 'build app', 'generate app', 'scaffold']
    const hasNewProjectIntent = newProjectKeywords.some(keyword =>
      lowerContent.includes(keyword)
    )

    // It's a modification if:
    // 1. Has modification keywords AND no new project keywords
    // 2. OR is a short command-like request (likely modification)
    return hasModificationIntent && !hasNewProjectIntent || 
           (content.split(' ').length <= 3 && hasModificationIntent)
  }

  const clearChat = useCallback(() => {
    setMessages([])
    setCurrentProject(null)
  }, [])

  return {
    messages,
    isLoading,
    currentProject,
    sendMessage,
    clearChat
  }
}
