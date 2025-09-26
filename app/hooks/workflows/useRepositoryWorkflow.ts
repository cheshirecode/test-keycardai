/**
 * Repository Workflow Hook
 *
 * Composes core hooks to provide complete repository management workflow.
 * This replaces the old useRepositoryAtoms with proper separation of concerns.
 *
 * Benefits:
 * - Composes focused hooks instead of managing everything directly
 * - No circular dependencies through dependency injection
 * - Clear separation of state, actions, and navigation
 * - Easy to test each concern independently
 */

'use client'

import { useRepositoryStore } from '../core/useRepositoryStore'
import { useRepositoryActions } from '../core/useRepositoryActions'
import { useNavigation } from '../navigation/useNavigation'
import { useRepositoryData } from '../data/useRepositoryData'
import { useUrlSync } from '../navigation/useUrlSync'
import type { Repository } from '@/types'

export interface RepositoryWorkflow {
  // State
  selectedRepository: Repository | null
  newlyCreatedRepository: string | null
  isCreatingNewProject: boolean
  isRepositoryMode: boolean
  currentRepositoryInfo: unknown
  onRepositoryRefresh: (() => void) | null

  // Actions
  setSelectedRepository: (repository: Repository | null) => void
  setNewlyCreatedRepository: (repoName: string) => void
  setIsCreatingNewProject: (creating: boolean) => void
  clearAllRepositoryData: (preserveCreatingFlag?: boolean) => void
  refreshRepositories: () => void
  setOnRepositoryRefresh: (callback: (() => void) | null) => void

  // Navigation
  navigateToRepository: (repository: Repository) => void
  navigateToHome: () => void
  selectRepositoryWithNavigation: (repository: Repository | null) => void

  // Data
  loadAllRepositories: () => Promise<Repository[]>
  loadRepositoryByPath: (owner: string, repo: string) => Promise<Repository | null>
  loadRepositoryById: (id: string) => Promise<Repository | null>
}

/**
 * Complete repository workflow hook - composes all repository concerns
 */
export function useRepositoryWorkflow(): RepositoryWorkflow {
  // Core hooks
  const repositoryState = useRepositoryStore()
  const repositoryActions = useRepositoryActions()

  // Data fetching
  const repositoryData = useRepositoryData()

  // Navigation (with dependency injection)
  const navigation = useNavigation(repositoryActions)

  // URL synchronization (with dependency injection)
  useUrlSync({
    repositoryState,
    repositoryActions,
    loadRepositoryByPath: repositoryData.loadRepositoryByPath
  })

  return {
    // State (from core)
    ...repositoryState,

    // Actions (from core)
    ...repositoryActions,

    // Navigation (composed)
    ...navigation,

    // Data (composed)
    ...repositoryData
  }
}
