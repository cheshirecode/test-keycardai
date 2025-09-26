/**
 * Repository Manager Hook
 *
 * High-level composed hook for components that need repository management.
 * This replaces the old useRepositoryAtoms and provides a clean interface.
 *
 * Benefits:
 * - Single hook for all repository needs
 * - No circular dependencies
 * - Easy to use in components
 * - Backward compatible interface
 */

'use client'

import { useRepositoryWorkflow } from '../workflows/useRepositoryWorkflow'
import { useRepositoryStore } from '../core/useRepositoryStore'
import { useRepositoryActions } from '../core/useRepositoryActions'
import { useNavigation } from '../navigation/useNavigation'
import { useNewProjectWorkflow } from '../workflows/useNewProjectWorkflow'
import type { Repository } from '@/types'

export interface RepositoryManager {
  // State
  selectedRepository: Repository | null
  newlyCreatedRepository: string | null
  isCreatingNewProject: boolean
  isRepositoryMode: boolean
  currentRepositoryInfo: unknown
  onRepositoryRefresh: (() => void) | null

  // Repository Actions
  setSelectedRepository: (repository: Repository | null) => void
  setNewlyCreatedRepository: (repoName: string) => void
  setIsCreatingNewProject: (creating: boolean) => void
  clearAllRepositoryData: (preserveCreatingFlag?: boolean) => void
  refreshRepositories: () => void
  setOnRepositoryRefresh: (callback: (() => void) | null) => void

  // Navigation Actions
  navigateToRepository: (repository: Repository) => void
  navigateToHome: () => void
  selectRepositoryWithNavigation: (repository: Repository | null) => void

  // Workflow Actions
  startNewProject: () => void

  // Data Loading
  loadAllRepositories: () => Promise<Repository[]>
  loadRepositoryByPath: (owner: string, repo: string) => Promise<Repository | null>
  loadRepositoryById: (id: string) => Promise<Repository | null>
}

/**
 * High-level repository manager hook for components
 */
export function useRepositoryManager(): RepositoryManager {
  const repositoryWorkflow = useRepositoryWorkflow()

  // Get core hooks for new project workflow
  const repositoryActions = useRepositoryActions()
  const navigation = useNavigation(repositoryActions)
  const newProjectWorkflow = useNewProjectWorkflow({ repositoryActions, navigation })

  return {
    ...repositoryWorkflow,
    ...newProjectWorkflow
  }
}

/**
 * Backward compatibility hooks - these maintain the old interface
 */

/**
 * @deprecated Use useRepositoryManager() instead
 * Maintained for backward compatibility during migration
 */
export function useRepositoryState() {
  const repositoryStore = useRepositoryStore()
  return repositoryStore
}

/**
 * @deprecated Use useRepositoryManager() instead
 * Maintained for backward compatibility during migration
 */
export function useRepositoryCreation() {
  const repositoryActions = useRepositoryActions()
  const repositoryStore = useRepositoryStore()
  const navigation = useNavigation(repositoryActions)
  const newProjectWorkflow = useNewProjectWorkflow({ repositoryActions, navigation })

  return {
    isCreatingNewProject: repositoryStore.isCreatingNewProject,
    setIsCreatingNewProject: repositoryActions.setIsCreatingNewProject,
    setNewlyCreatedRepository: repositoryActions.setNewlyCreatedRepository,
    ...newProjectWorkflow
  }
}
