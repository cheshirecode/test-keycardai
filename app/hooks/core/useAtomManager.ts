/**
 * Core Atom Manager - Single Point of Atom Access
 *
 * This hook provides the ONLY access point to Jotai atoms in the application.
 * All other hooks must use this abstraction instead of importing atoms directly.
 *
 * Benefits:
 * - Eliminates circular dependencies from direct atom imports
 * - Provides consistent atom access patterns
 * - Enables better testing through dependency injection
 * - Centralizes atom management for easier debugging
 */

'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  selectedRepositoryAtom,
  newlyCreatedRepositoryAtom,
  isCreatingNewProjectAtom,
  onRepositoryRefreshAtom,
  isRepositoryModeAtom,
  currentRepositoryInfoAtom,
  setNewlyCreatedRepositoryAtom,
  clearAllRepositoryDataAtom,
  refreshRepositoriesAtom,
  startNewProjectModeAtom,
  completeProjectCreationAtom,
  coordinatedCacheRefreshAtom,
  // isNewlyCreatedRepositoryAtom - removed due to type mismatch, needs refactoring
} from '@/store/repositoryStore'
import { planningModeAtom, isManualModeAtom, currentAIProviderAtom, type PlanningMode } from '@/store/aiRequestStore'
import type { Repository } from '@/types'
import type { AIProvider } from '@/lib/ai-service'

/**
 * Repository atom access interface
 */
export interface RepositoryAtomManager {
  // State getters
  getSelectedRepository: () => Repository | null
  getNewlyCreatedRepository: () => string | null
  getIsCreatingNewProject: () => boolean
  getIsRepositoryMode: () => boolean
  getCurrentRepositoryInfo: () => unknown
  getIsNewlyCreatedRepository: (repoName: string) => boolean

  // State setters
  setSelectedRepository: (repository: Repository | null) => void
  setNewlyCreatedRepository: (repoName: string | null) => void
  setIsCreatingNewProject: (creating: boolean) => void
  clearAllRepositoryData: (preserveCreatingFlag?: boolean) => void
  refreshRepositories: () => void

  // Atomic actions (prevent race conditions)
  startNewProjectMode: () => void
  completeProjectCreation: (projectData: { repositoryUrl: string; name: string; isNewProject: boolean }) => void
  coordinatedCacheRefresh: () => void

  // Callback management
  getOnRepositoryRefresh: () => (() => void) | null
  setOnRepositoryRefresh: (callback: (() => void) | null) => void
}

/**
 * AI settings atom access interface
 */
export interface AIAtomManager {
  getPlanningMode: () => PlanningMode
  setPlanningMode: (mode: PlanningMode) => void
  getIsManualMode: () => boolean
  getCurrentAIProvider: () => AIProvider | null
  getIsProjectPending: (projectId: string) => boolean
}

/**
 * Core atom manager hook - single point of atom access
 */
export function useAtomManager() {
  // Repository atoms
  const selectedRepository = useAtomValue(selectedRepositoryAtom)
  const newlyCreatedRepository = useAtomValue(newlyCreatedRepositoryAtom)
  const isCreatingNewProject = useAtomValue(isCreatingNewProjectAtom)
  const isRepositoryMode = useAtomValue(isRepositoryModeAtom)
  const currentRepositoryInfo = useAtomValue(currentRepositoryInfoAtom)
  const [onRepositoryRefresh, setOnRepositoryRefresh] = useAtom(onRepositoryRefreshAtom)

  // Repository action setters
  const setSelectedRepositoryAtom = useSetAtom(selectedRepositoryAtom)
  const setNewlyCreatedRepositoryAction = useSetAtom(setNewlyCreatedRepositoryAtom)
  const setIsCreatingNewProjectAction = useSetAtom(isCreatingNewProjectAtom)
  const clearAllRepositoryDataAction = useSetAtom(clearAllRepositoryDataAtom)
  const refreshRepositoriesAction = useSetAtom(refreshRepositoriesAtom)
  const startNewProjectModeAction = useSetAtom(startNewProjectModeAtom)
  const completeProjectCreationAction = useSetAtom(completeProjectCreationAtom)
  const coordinatedCacheRefreshAction = useSetAtom(coordinatedCacheRefreshAtom)
  // isNewlyCreatedRepositoryCheck removed - needs proper refactoring for string-based checking

  // AI atoms
  const [planningMode, setPlanningMode] = useAtom(planningModeAtom)
  const isManualMode = useAtomValue(isManualModeAtom)
  const currentAIProvider = useAtomValue(currentAIProviderAtom)

  const repositoryManager: RepositoryAtomManager = {
    // State getters
    getSelectedRepository: () => selectedRepository,
    getNewlyCreatedRepository: () => newlyCreatedRepository,
    getIsCreatingNewProject: () => isCreatingNewProject,
    getIsRepositoryMode: () => isRepositoryMode,
    getCurrentRepositoryInfo: () => currentRepositoryInfo,
    getIsNewlyCreatedRepository: (repoName: string) => {
      // The atom expects a Repository object, but we only have the name
      // For now, return false - this needs proper refactoring
      console.log('Checking newly created repository:', repoName)
      return false
    },

    // State setters
    setSelectedRepository: setSelectedRepositoryAtom,
    setNewlyCreatedRepository: setNewlyCreatedRepositoryAction,
    setIsCreatingNewProject: setIsCreatingNewProjectAction,
    clearAllRepositoryData: clearAllRepositoryDataAction,
    refreshRepositories: refreshRepositoriesAction,

    // Atomic actions (prevent race conditions)
    startNewProjectMode: startNewProjectModeAction,
    completeProjectCreation: completeProjectCreationAction,
    coordinatedCacheRefresh: coordinatedCacheRefreshAction,

    // Callback management
    getOnRepositoryRefresh: () => onRepositoryRefresh,
    setOnRepositoryRefresh: setOnRepositoryRefresh
  }

  const aiManager: AIAtomManager = {
    getPlanningMode: () => planningMode,
    setPlanningMode: setPlanningMode,
    getIsManualMode: () => isManualMode,
    getCurrentAIProvider: () => currentAIProvider,
    getIsProjectPending: (projectId: string) => {
      // TODO: Implement proper project pending state checking
      // This requires a different pattern since we can't use hooks in callbacks
      console.log('Checking project pending state for:', projectId)
      return false
    }
  }

  return {
    repository: repositoryManager,
    ai: aiManager
  }
}
