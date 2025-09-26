/**
 * Navigation utilities - REFACTORED to eliminate circular dependencies
 *
 * @deprecated This file is maintained for backward compatibility during migration.
 * New code should use:
 * - useNavigation() from @/hooks/navigation/useNavigation
 * - usePathAnalyzer() from @/hooks/navigation/usePathAnalyzer  
 * - useUrlSync() from @/hooks/navigation/useUrlSync
 * - useNewProjectWorkflow() from @/hooks/workflows/useNewProjectWorkflow
 * 
 * BREAKING CHANGE: Removed direct atom imports to eliminate circular dependencies.
 * Navigation now uses dependency injection pattern.
 */

import { useRepositoryActions } from '@/hooks/core/useRepositoryActions'
import { useNavigation } from '@/hooks/navigation/useNavigation'
import { usePathAnalyzer } from '@/hooks/navigation/usePathAnalyzer'
import { useNewProjectWorkflow } from '@/hooks/workflows/useNewProjectWorkflow'

/**
 * @deprecated Use useNavigation(repositoryActions) instead
 * Hook for repository navigation functionality
 */
export function useRepositoryNavigation() {
  const repositoryActions = useRepositoryActions()
  return useNavigation(repositoryActions)
}

/**
 * @deprecated Use usePathAnalyzer() instead
 * Hook to get current repository path information
 */
export function useRepositoryPath() {
  return usePathAnalyzer()
}

/**
 * @deprecated Use useUrlSync() with proper dependencies instead
 * Hook to sync URL with repository state
 */
export function useRepositoryUrlSync() {
  console.warn('useRepositoryUrlSync is deprecated. Use useUrlSync() with proper dependencies instead.')
  // This hook is no longer implemented to avoid circular dependencies
  // Components should use useRepositoryManager() which includes URL sync
}

/**
 * @deprecated Use useNewProjectWorkflow() with proper dependencies instead
 * Simple hook to handle new project flow
 */
export function useNewProjectFlow() {
  const repositoryActions = useRepositoryActions()
  const navigation = useNavigation(repositoryActions)
  return useNewProjectWorkflow({ repositoryActions, navigation })
}