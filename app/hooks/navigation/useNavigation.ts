/**
 * Pure Navigation Hook
 * 
 * Provides navigation actions without any atom dependencies.
 * This hook accepts repository actions as parameters to avoid circular dependencies.
 * 
 * Benefits:
 * - No circular dependencies
 * - Dependency injection pattern
 * - Easy to test with mocked dependencies
 * - Single responsibility: navigation only
 */

'use client'

import { useRouter } from 'next/navigation'
import type { Repository } from '@/types'
import type { RepositoryActions } from '../core/useRepositoryActions'

export interface NavigationActions {
  navigateToRepository: (repository: Repository) => void
  navigateToHome: () => void
  selectRepositoryWithNavigation: (repository: Repository | null) => void
}

/**
 * Pure navigation hook - accepts dependencies as parameters
 */
export function useNavigation(repositoryActions: RepositoryActions): NavigationActions {
  const router = useRouter()

  const navigateToRepository = (repository: Repository) => {
    const [owner] = repository.fullName.split('/')
    const repoName = repository.name

    // Update state first
    repositoryActions.setSelectedRepository(repository)

    // Then navigate
    router.push(`/project/${owner}/${repoName}`)
  }

  const navigateToHome = () => {
    router.push('/')
  }

  const selectRepositoryWithNavigation = (repository: Repository | null) => {
    if (!repository) {
      // Deselecting - go to home
      repositoryActions.setSelectedRepository(null)
      navigateToHome()
      return
    }

    // Check if we need to navigate
    const [owner] = repository.fullName.split('/')
    const expectedPath = `/project/${owner}/${repository.name}`

    // Update state
    repositoryActions.setSelectedRepository(repository)

    // Navigate only if needed
    if (window.location.pathname !== expectedPath) {
      navigateToRepository(repository)
    }
  }

  return {
    navigateToRepository,
    navigateToHome,
    selectRepositoryWithNavigation
  }
}
