import { useState, useCallback } from 'react'
import { MCPClient } from '../mcp-client'
import { Message, ProjectInfo } from '../../types/mcp'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const mcpClient = new MCPClient()

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, chainOfThought?: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      chainOfThought: chainOfThought
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

        // Show AI analysis and reasoning
        addMessage('assistant', `🤖 AI Analysis: ${project.reasoning}`)
        addMessage('assistant', `📊 Confidence: ${(project.confidence * 100).toFixed(1)}%`)
        addMessage('assistant', `📁 Project Type: ${project.type}`)

        if (project.features && project.features.length > 0) {
          addMessage('assistant', `✨ Detected Features: ${project.features.join(', ')}`)
        }

        // Show execution progress
        addMessage('assistant', '🔄 Executing project creation plan...')

        // Show each step result
        if (project.executionSteps) {
          project.executionSteps.forEach((step) => {
            if (step.success) {
              addMessage('assistant', `✅ Step ${step.step}: ${step.action}`)
            } else {
              addMessage('assistant', `❌ Step ${step.step}: ${step.action} - ${step.error}`)
            }
          })
        }

        // Final success message with repository URL
        const finalMessage = project.repositoryUrl
          ? `🎉 Project created successfully!\n📂 Local Path: ${project.path}\n🔗 Repository: ${project.repositoryUrl}`
          : `🎉 Project created successfully!\n📂 Path: ${project.path}`

        addMessage('assistant', finalMessage, chainOfThought)
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
