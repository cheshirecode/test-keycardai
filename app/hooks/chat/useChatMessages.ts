/**
 * Hook for managing chat message utilities
 * Handles quick start options and commit processing
 */

'use client'

import { useMemo } from 'react'

interface UseChatMessagesProps {
  isRepositoryMode: boolean
  rawCommits: Array<{
    hash: string
    author: string
    timestamp: number
    subject: string
    body?: string
    message?: string
  }>
}

export function useChatMessages({ isRepositoryMode, rawCommits }: UseChatMessagesProps) {
  // Sort commits chronologically (oldest first for chat display)
  const commits = useMemo(() => {
    return [...rawCommits].reverse()
  }, [rawCommits])

  const quickStartOptions = isRepositoryMode ? [
    'Add authentication to this project',
    'Add a database integration',
    'Improve the UI/UX design',
    'Add testing framework',
    'Optimize performance'
  ] : [
    'Create a React TypeScript app',
    'Create a Next.js fullstack project',
    'Create a Node.js API',
    'Build a dashboard with Next.js'
  ]

  return {
    commits,
    quickStartOptions
  }
}
