/**
 * Repository hooks using new decoupled architecture
 *
 * @deprecated This file is maintained for backward compatibility during migration.
 * New code should use:
 * - useRepositoryManager() for complete repository management
 * - useRepositoryStore() for read-only state access
 * - useRepositoryActions() for state mutations
 * - useRepositoryWorkflow() for composed workflows
 *
 * BREAKING CHANGE: Removed circular dependencies with navigation hooks.
 * Navigation is now handled through dependency injection in workflows.
 */

// Import the new decoupled hooks - NO MORE CIRCULAR DEPENDENCIES!
import { useRepositoryState as useRepositoryStateNew, useRepositoryCreation as useRepositoryCreationNew } from './composed/useRepositoryManager'
import { useRepositoryStore } from './core/useRepositoryStore'
import { useAtomManager } from './core/useAtomManager'

/**
 * @deprecated Use useRepositoryManager() instead
 * Main hook that provides the same interface as the old RepositoryContext
 * This makes migration easier by providing backward compatibility
 */
export function useRepositoryState() {
  // Use the new decoupled architecture
  return useRepositoryStateNew()
}

/**
 * @deprecated Use useRepositoryStore().selectedRepository instead
 * Lightweight hook for components that only need selected repository
 */
export function useSelectedRepository() {
  const { repository } = useAtomManager()
  return repository.getSelectedRepository()
}

/**
 * @deprecated Use useRepositoryStore().isRepositoryMode instead
 * Lightweight hook for components that only need repository mode
 */
export function useIsRepositoryMode() {
  const { repository } = useAtomManager()
  return repository.getIsRepositoryMode()
}

/**
 * @deprecated Use useRepositoryStore() and check manually
 * Hook for components that need to check if a repository is newly created
 */
export function useIsNewlyCreated() {
  const { repository } = useAtomManager()
  return (repoName: string) => repository.getIsNewlyCreatedRepository(repoName)
}

/**
 * @deprecated Use useRepositoryManager() instead
 * Hook for repository creation workflow
 */
export function useRepositoryCreation() {
  // Use the new decoupled architecture
  return useRepositoryCreationNew()
}

/**
 * @deprecated Use useRepositoryStore().currentRepositoryInfo instead
 * Hook for components that need current repository info
 */
export function useCurrentRepositoryInfo() {
  const { repository } = useAtomManager()
  return repository.getCurrentRepositoryInfo()
}

/**
 * @deprecated Use useRepositoryManager() instead
 * Hook for repository refresh functionality
 */
export function useRepositoryRefresh() {
  const repositoryStore = useRepositoryStore()
  const { repository } = useAtomManager()

  return {
    onRepositoryRefresh: repositoryStore.onRepositoryRefresh,
    setOnRepositoryRefresh: repository.setOnRepositoryRefresh,
    refreshRepositories: repository.refreshRepositories
  }
}