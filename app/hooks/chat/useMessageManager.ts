import { useState, useCallback } from 'react'
import type { Message, MCPLogEntry } from '@/types'
import { generateStableId } from '@/lib/hydration-utils'

/**
 * Hook for managing chat messages state
 * Single responsibility: Message state management
 */
export function useMessageManager() {
  const [messages, setMessages] = useState<Message[]>([])

  const addMessage = useCallback((
    role: 'user' | 'assistant',
    content: string,
    chainOfThought?: string,
    mcpLogs?: MCPLogEntry[]
  ) => {
    const message: Message = {
      id: generateStableId('msg'),
      role,
      content,
      timestamp: new Date(),
      chainOfThought,
      mcpLogs
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    addMessage,
    clearMessages
  }
}
