/**
 * Pure Repository Actions Hook
 *
 * Provides action dispatchers for repository state without any side effects.
 * This hook has NO dependencies on navigation or other systems.
 *
 * Benefits:
 * - Pure action dispatching with no side effects
 * - No circular dependencies
 * - Easy to test and mock
 * - Single responsibility: state mutations only
 */

'use client'

import { useAtomManager } from './useAtomManager'
import type { Repository } from '@/types'

export interface RepositoryActions {
  setSelectedRepository: (repository: Repository | null) => void
  setNewlyCreatedRepository: (repoName: string | null) => void
  setIsCreatingNewProject: (creating: boolean) => void
  clearAllRepositoryData: (preserveCreatingFlag?: boolean) => void
  refreshRepositories: () => void
  setOnRepositoryRefresh: (callback: (() => void) | null) => void

  // Atomic actions (prevent race conditions)
  startNewProjectMode: () => void
  completeProjectCreation: (projectData: { repositoryUrl: string; name: string; isNewProject: boolean }) => void
  coordinatedCacheRefresh: () => void
}

/**
 * Pure repository actions hook - action dispatchers only
 */
export function useRepositoryActions(): RepositoryActions {
  const { repository } = useAtomManager()

  return {
    setSelectedRepository: repository.setSelectedRepository,
    setNewlyCreatedRepository: repository.setNewlyCreatedRepository,
    setIsCreatingNewProject: repository.setIsCreatingNewProject,
    clearAllRepositoryData: repository.clearAllRepositoryData,
    refreshRepositories: repository.refreshRepositories,
    setOnRepositoryRefresh: repository.setOnRepositoryRefresh,

    // Atomic actions (prevent race conditions)
    startNewProjectMode: repository.startNewProjectMode,
    completeProjectCreation: repository.completeProjectCreation,
    coordinatedCacheRefresh: repository.coordinatedCacheRefresh
  }
}
