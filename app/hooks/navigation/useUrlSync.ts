/**
 * URL Synchronization Hook
 *
 * Handles URL ↔ State synchronization without mixing data fetching concerns.
 * Uses dependency injection to avoid circular dependencies.
 *
 * Benefits:
 * - Separated concerns: URL sync only, no data fetching
 * - No circular dependencies through dependency injection
 * - Easy to test with mocked dependencies
 * - Single responsibility: URL synchronization
 */

'use client'

import { useEffect } from 'react'
import { usePathAnalyzer, repositoryMatchesPath } from './usePathAnalyzer'
import type { Repository } from '@/types'
import type { RepositoryState } from '../core/useRepositoryStore'
import type { RepositoryActions } from '../core/useRepositoryActions'

export interface UrlSyncDependencies {
  repositoryState: RepositoryState
  repositoryActions: RepositoryActions
  loadRepositoryByPath: (owner: string, repo: string) => Promise<Repository | null>
}

/**
 * URL synchronization hook - accepts dependencies to avoid circular imports
 */
export function useUrlSync(dependencies: UrlSyncDependencies) {
  const pathInfo = usePathAnalyzer()
  const { repositoryState, repositoryActions, loadRepositoryByPath } = dependencies

  useEffect(() => {
    const controller = new AbortController()

    const syncUrlWithState = async () => {
      // Handle project routes
      if (pathInfo.isProjectRoute && pathInfo.owner && pathInfo.repo) {
        // Check if we already have the correct repository selected
        if (repositoryState.selectedRepository) {
          if (repositoryMatchesPath(repositoryState.selectedRepository, pathInfo)) {
            return // Already correct
          }
        }

        // Need to load repository from external source
        try {
          const repository = await loadRepositoryByPath(pathInfo.owner, pathInfo.repo)

          // Check if request was aborted
          if (controller.signal.aborted) {
            return
          }

          if (repository && (!repositoryState.selectedRepository || repositoryState.selectedRepository.id !== repository.id)) {
            // Check again if not aborted before updating state
            if (!controller.signal.aborted) {
              repositoryActions.setSelectedRepository(repository)
            }
          }
        } catch (error) {
          // Only log error if it's not an abort error
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Failed to sync repository from URL:', error)
          }
        }
      }
      // Handle home route
      else if (pathInfo.isHomeRoute) {
        // On home page, only clear repository selection if we have one AND we're NOT in creating mode
        // This prevents interfering with the new project mode
        if (repositoryState.selectedRepository && !repositoryState.isCreatingNewProject) {
          console.log('🏠 URL sync: Clearing repository selection on home page (not in new project mode)')
          repositoryActions.setSelectedRepository(null)
        }
        
        // Clear newly created repository highlighting when navigating to home
        // This provides a clean slate for the user
        if (repositoryState.newlyCreatedRepository && !repositoryState.isCreatingNewProject) {
          console.log('🏠 URL sync: Clearing newly created repository highlighting on home page')
          repositoryActions.setNewlyCreatedRepository(null)
        }
      }
    }

    syncUrlWithState()

    // Cleanup function to abort the request if dependencies change
    return () => {
      controller.abort()
    }
  }, [pathInfo, repositoryState.selectedRepository, repositoryState.newlyCreatedRepository, repositoryState.isCreatingNewProject, repositoryActions, loadRepositoryByPath])
}
