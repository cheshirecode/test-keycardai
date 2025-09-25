/**
 * Hook for managing chat scrolling behavior
 * Handles auto-scroll to bottom when new messages arrive
 */

'use client'

import { useRef, useEffect } from 'react'
import { Message } from '@/types'
import { ChatScrollingState } from '@/types'

export function useChatScrolling(messages: Message[]): ChatScrollingState {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return {
    messagesEndRef,
    scrollToBottom
  }
}
