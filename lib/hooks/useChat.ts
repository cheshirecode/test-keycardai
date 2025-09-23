import { useState, useCallback } from 'react'
import { MCPClient } from '@/lib/mcp-client'
import { AIService } from '@/lib/ai-service'
import { Message, ProjectInfo } from '@/types/mcp'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const mcpClient = new MCPClient()

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

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
      // 1. Analyze user request with AI
      const analysis = await AIService.analyzeProjectRequest(content)

      // 2. Extract project name and path
      const projectName = analysis.projectName ||
        content.match(/(?:create|build|make)\s+(?:a\s+)?(.+?)(?:\s+(?:project|app))?$/i)?.[1] ||
        'my-project'
      const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const projectPath = `/tmp/projects/${sanitizedName}-${Date.now()}`

      // 3. Set project info
      setCurrentProject({
        name: sanitizedName,
        path: projectPath,
        template: analysis.projectType,
        status: 'creating'
      })

      // 4. Generate MCP actions
      const { actions, response } = await AIService.generateMCPActions(content, analysis, projectPath)

      // 5. Show progress message
      addMessage('assistant', '✓ Creating project...')

      // 6. Execute actions
      await executeProjectCreation(actions)
      addMessage('assistant', response)

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong'
      addMessage('assistant', `Sorry, project creation failed: ${errorMessage}`)
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
