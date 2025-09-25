/**
 * Repository hooks using Jotai atoms
 *
 * Simplified replacement for RepositoryContext that provides the same interface
 * but with better performance and maintainability
 */

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
  isNewlyCreatedRepositoryAtom
} from '@/store/repositoryStore'
import { useRepositoryNavigation, useNewProjectFlow } from '@/lib/navigation'

/**
 * Main hook that provides the same interface as the old RepositoryContext
 * This makes migration easier by providing backward compatibility
 */
export function useRepositoryState() {
  // Atom values
  const selectedRepository = useAtomValue(selectedRepositoryAtom)
  const newlyCreatedRepository = useAtomValue(newlyCreatedRepositoryAtom)
  const isCreatingNewProject = useAtomValue(isCreatingNewProjectAtom)
  const isRepositoryMode = useAtomValue(isRepositoryModeAtom)
  const [onRepositoryRefresh, setOnRepositoryRefresh] = useAtom(onRepositoryRefreshAtom)

  // Action setters
  const setNewlyCreatedRepository = useSetAtom(setNewlyCreatedRepositoryAtom)
  const setIsCreatingNewProject = useSetAtom(isCreatingNewProjectAtom)
  const clearAllRepositoryData = useSetAtom(clearAllRepositoryDataAtom)
  const refreshRepositories = useSetAtom(refreshRepositoriesAtom)

  // Navigation hooks
  const { navigateToRepository, navigateToHome, selectRepositoryWithNavigation } = useRepositoryNavigation()

  // Direct internal setter (bypasses navigation logic)
  const setSelectedRepositoryInternal = useSetAtom(selectedRepositoryAtom)

  return {
    // State
    selectedRepository,
    newlyCreatedRepository,
    isCreatingNewProject,
    isRepositoryMode,
    onRepositoryRefresh,

    // Actions
    setSelectedRepository: selectRepositoryWithNavigation,
    setSelectedRepositoryInternal,
    setNewlyCreatedRepository,
    setIsCreatingNewProject,
    clearAllRepositoryData,
    refreshRepositories,
    setOnRepositoryRefresh,

    // Navigation
    navigateToRepository,
    navigateToHome
  }
}

/**
 * Lightweight hook for components that only need selected repository
 */
export function useSelectedRepository() {
  return useAtomValue(selectedRepositoryAtom)
}

/**
 * Lightweight hook for components that only need repository mode
 */
export function useIsRepositoryMode() {
  return useAtomValue(isRepositoryModeAtom)
}

/**
 * Hook for components that need to check if a repository is newly created
 */
export function useIsNewlyCreated() {
  return useAtomValue(isNewlyCreatedRepositoryAtom)
}

/**
 * Hook for repository creation workflow
 */
export function useRepositoryCreation() {
  const [isCreatingNewProject, setIsCreatingNewProject] = useAtom(isCreatingNewProjectAtom)
  const setNewlyCreatedRepository = useSetAtom(setNewlyCreatedRepositoryAtom)
  const { startNewProject } = useNewProjectFlow()

  return {
    isCreatingNewProject,
    setIsCreatingNewProject,
    setNewlyCreatedRepository,
    startNewProject
  }
}

/**
 * Hook for components that need current repository info
 */
export function useCurrentRepositoryInfo() {
  return useAtomValue(currentRepositoryInfoAtom)
}

/**
 * Hook for repository refresh functionality
 */
export function useRepositoryRefresh() {
  const [onRepositoryRefresh, setOnRepositoryRefresh] = useAtom(onRepositoryRefreshAtom)
  const refreshRepositories = useSetAtom(refreshRepositoriesAtom)

  return {
    onRepositoryRefresh,
    setOnRepositoryRefresh,
    refreshRepositories
  }
}
