import { useState, useRef, useEffect } from 'react'
import { useRepositoryManager } from '@/hooks/composed/useRepositoryManager'
import { useRepositoryActions } from '@/hooks/core/useRepositoryActions'
import type { ProjectInfo } from '@/types'

import { useMessageManager } from './useMessageManager'
import { useRequestClassifier } from './useRequestClassifier'
import { CreateProjectCommand } from '@/lib/commands/CreateProjectCommand'
import { ModifyRepositoryCommand } from '@/lib/commands/ModifyRepositoryCommand'
import { ModifyProjectCommand } from '@/lib/commands/ModifyProjectCommand'
import type { CommandContext } from '@/lib/commands/BaseCommand'

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
export function useChatOrchestrator(fastMode: boolean = false, aiProvider?: 'openai' | 'gemini') {
  const [isLoading, setIsLoading] = useState(false)
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null)
  const isMounted = useIsMounted()

  // Use new decoupled repository manager - NO MORE CIRCULAR DEPENDENCIES!
  const repositoryManager = useRepositoryManager()
  const {
    selectedRepository,
    isCreatingNewProject,
    navigateToRepository
  } = repositoryManager

  // Get atomic operations to eliminate race conditions
  const { completeProjectCreation, coordinatedCacheRefresh } = useRepositoryActions()

  const { messages, addMessage, clearMessages } = useMessageManager()
  const { classifyRequest } = useRequestClassifier()

  // Clear currentProject when selectedRepository changes (user navigates to different repo)
  // but only if we already had a current project and are switching to a different repository
  useEffect(() => {
    if (currentProject && selectedRepository) {
      // Extract repository name from project (could be from repositoryUrl or name)
      let projectRepoName = currentProject.name
      if (currentProject.repositoryUrl) {
        // Extract repo name from GitHub URL
        const urlMatch = currentProject.repositoryUrl.match(/github\.com\/[^\/]+\/([^\/]+)/)
        if (urlMatch) {
          projectRepoName = urlMatch[1]
        }
      }

      const selectedRepoName = selectedRepository.name

      // Only clear if we're switching to a different repository
      if (projectRepoName !== selectedRepoName) {
        console.log('🔄 Clearing currentProject because switching repositories:', {
          from: projectRepoName,
          to: selectedRepoName
        })
        setCurrentProject(null)
      }
    }
  }, [selectedRepository, currentProject])

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
              coordinatedCacheRefresh
            })
          } else {
            // Fallback to new project creation
            await createProjectCommand.execute({
              content,
              setCurrentProject,
              navigateToRepository,
              isCreatingNewProject,
              completeProjectCreation,
              ...(fastMode !== undefined && { fastMode }),
              ...(aiProvider && { aiProvider })
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
              navigateToRepository,
              isCreatingNewProject,
              completeProjectCreation,
              ...(fastMode !== undefined && { fastMode }),
              ...(aiProvider && { aiProvider })
            })
          }
          break

        case 'new_project':
        default:
            await createProjectCommand.execute({
              content,
              setCurrentProject,
              navigateToRepository,
              isCreatingNewProject,
              completeProjectCreation,
              ...(fastMode !== undefined && { fastMode }),
              ...(aiProvider && { aiProvider })
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
    console.log('🧹 clearChat called - resetting loading state')
    clearMessages()
    setCurrentProject(null)
    setIsLoading(false) // Reset loading state when clearing chat
    console.log('🧹 clearChat completed - isLoading should now be false')
  }

  return {
    messages,
    isLoading,
    currentProject,
    sendMessage,
    clearChat
  }
}
