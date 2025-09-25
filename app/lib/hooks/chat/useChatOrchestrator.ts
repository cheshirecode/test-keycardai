import { useState, useRef, useEffect } from 'react'
import { useRepository } from '@/contexts/RepositoryContext'
import { invalidateRepositoriesCache } from '@/hooks/useRepositories'
import type { ProjectInfo } from '@/types'

import { useMessageManager } from './useMessageManager'
import { useRequestClassifier } from './useRequestClassifier'
import { CreateProjectCommand } from '../../commands/CreateProjectCommand'
import { ModifyRepositoryCommand } from '../../commands/ModifyRepositoryCommand'
import { ModifyProjectCommand } from '../../commands/ModifyProjectCommand'
import type { CommandContext } from '../../commands/BaseCommand'

// Custom hook to track if component is mounted
const useIsMounted = () => {
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  return isMounted
}

/**
 * Main orchestrator hook for chat functionality
 * Coordinates message management, request classification, and command execution
 */
export function useChatOrchestrator() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const isMounted = useIsMounted()
  
  const {
    selectedRepository,
    setNewlyCreatedRepository,
    refreshRepositories,
    isCreatingNewProject,
    setIsCreatingNewProject,
    navigateToRepository
  } = useRepository()

  const { messages, addMessage, clearMessages } = useMessageManager()
  const { classifyRequest } = useRequestClassifier()

  // Clear currentProject when selectedRepository changes (user navigates to different repo)
  useEffect(() => {
    setCurrentProject(null)
  }, [selectedRepository])

  // Create command context
  const commandContext: CommandContext = {
    addMessage,
    isMounted
  }

  // Initialize commands
  const createProjectCommand = new CreateProjectCommand(commandContext)
  const modifyRepositoryCommand = new ModifyRepositoryCommand(commandContext)
  const modifyProjectCommand = new ModifyProjectCommand(commandContext)

  const sendMessage = async (content: string) => {
    if (isLoading) return

    setIsLoading(true)
    addMessage('user', content)

    try {
      // Classify the request
      const classification = classifyRequest(
        content,
        !!selectedRepository,
        !!currentProject
      )

      console.log('Request classification:', classification)

      // Execute appropriate command based on classification
      switch (classification.type) {
        case 'repository_modification':
          if (selectedRepository) {
            await modifyRepositoryCommand.execute({
              content,
              repository: selectedRepository,
              refreshRepositories,
              invalidateRepositoriesCache
            })
          } else {
            // Fallback to new project creation
            await createProjectCommand.execute({
              content,
              setCurrentProject,
              setNewlyCreatedRepository,
              refreshRepositories,
              navigateToRepository,
              invalidateRepositoriesCache,
              isCreatingNewProject,
              setIsCreatingNewProject
            })
          }
          break

        case 'project_modification':
          if (currentProject) {
            await modifyProjectCommand.execute({
              content,
              project: currentProject
            })
          } else {
            // Fallback to new project creation
            await createProjectCommand.execute({
              content,
              setCurrentProject,
              setNewlyCreatedRepository,
              refreshRepositories,
              navigateToRepository,
              invalidateRepositoriesCache,
              isCreatingNewProject,
              setIsCreatingNewProject
            })
          }
          break

        case 'new_project':
        default:
          await createProjectCommand.execute({
            content,
            setCurrentProject,
            setNewlyCreatedRepository,
            refreshRepositories,
            navigateToRepository,
            invalidateRepositoriesCache,
            isCreatingNewProject,
            setIsCreatingNewProject
          })
          break
      }

    } catch (error) {
      console.error('Request failed:', error)
      addMessage('assistant', `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    clearMessages()
    setCurrentProject(null)
  }

  return {
    messages,
    isLoading,
    currentProject,
    sendMessage,
    clearChat
  }
}
