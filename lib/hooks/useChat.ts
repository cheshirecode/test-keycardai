import { useState, useCallback } from 'react'
import { MCPClient } from '../mcp-client'
import { Message, ProjectInfo, MCPLogEntry } from '../../types/mcp'

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
          status: 'completed'
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
    } finally {
      setIsLoading(false)
    }
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
