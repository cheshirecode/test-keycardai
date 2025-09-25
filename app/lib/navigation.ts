/**
 * Navigation utilities for repository management
 *
 * Separates navigation logic from state management for better testability
 * and maintainability
 */

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import type { Repository } from '@/types'
import { 
  selectedRepositoryAtom, 
  setSelectedRepositoryAtom,
  clearAllRepositoryDataAtom
} from '@/store/repositoryStore'

/**
 * Hook for repository navigation functionality
 */
export function useRepositoryNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const setSelectedRepository = useSetAtom(setSelectedRepositoryAtom)

  const navigateToRepository = (repository: Repository) => {
    const [owner] = repository.fullName.split('/')
    const repoName = repository.name

    // Update state first
    setSelectedRepository(repository)

    // Then navigate
    router.push(`/project/${owner}/${repoName}`)
  }

  const navigateToHome = () => {
    router.push('/')
  }

  const selectRepositoryWithNavigation = (repository: Repository | null) => {
    if (!repository) {
      // Deselecting - go to home if not already there
      setSelectedRepository(null)
      if (pathname !== '/') {
        navigateToHome()
      }
      return
    }

    // Check if we need to navigate
    const [owner] = repository.fullName.split('/')
    const expectedPath = `/project/${owner}/${repository.name}`

    // Update state
    setSelectedRepository(repository)

    // Navigate only if needed
    if (pathname !== expectedPath) {
      navigateToRepository(repository)
    }
  }

  return {
    navigateToRepository,
    navigateToHome,
    selectRepositoryWithNavigation
  }
}

/**
 * Hook to get current repository path information
 */
export function useRepositoryPath() {
  const pathname = usePathname()

  // Extract owner/repo from current path
  const projectMatch = pathname.match(/^\/project\/([^\/]+)\/([^\/]+)$/)

  if (projectMatch) {
    const [, owner, repo] = projectMatch
    return { owner, repo, isProjectRoute: true }
  }

  return { owner: null, repo: null, isProjectRoute: false }
}

/**
 * Hook to sync URL with repository state
 * This replaces the complex useRepositorySync hook
 */
export function useRepositoryUrlSync() {
  const [selectedRepository] = useAtom(selectedRepositoryAtom)
  const setSelectedRepository = useSetAtom(setSelectedRepositoryAtom)
  const { owner, repo, isProjectRoute } = useRepositoryPath()

  // This effect handles URL -> state synchronization
  // It's much simpler than the previous implementation
  React.useEffect(() => {
    if (!isProjectRoute) return
    if (!owner || !repo) return

    // Check if we already have the correct repository
    if (selectedRepository) {
      const [currentOwner] = selectedRepository.fullName.split('/')
      if (currentOwner.toLowerCase() === owner.toLowerCase() &&
          selectedRepository.name.toLowerCase() === repo.toLowerCase()) {
        return // Already correct
      }
    }

    // Need to load repository - this would trigger the existing hooks
    // The repository loading logic can stay in the existing hooks

  }, [owner, repo, isProjectRoute, selectedRepository, setSelectedRepository])
}

/**
 * Simple hook to handle new project flow
 */
export function useNewProjectFlow() {
  const clearAllData = useSetAtom(clearAllRepositoryDataAtom)
  const { navigateToHome } = useRepositoryNavigation()

  const startNewProject = () => {
    console.log('🚀 Starting new project flow')

    // Clear all data but preserve the creating flag
    clearAllData(true)

    // Navigate to home
    navigateToHome()

    console.log('✅ New project flow initialized')
  }

  return { startNewProject }
}
