/**
 * Repository State Management with Jotai
 *
 * Clean, atomic state management for repository-related data
 * Replaces the complex RepositoryContext with simpler, more maintainable atoms
 */

import { atom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import type { Repository } from '@/types'

// ==============================================================================
// BASE ATOMS - Core state pieces
// ==============================================================================

/**
 * Currently selected repository
 */
export const selectedRepositoryAtom = atomWithReset<Repository | null>(null)

/**
 * Name of newly created repository (for highlighting and auto-selection)
 */
export const newlyCreatedRepositoryAtom = atomWithReset<string | null>(null)

/**
 * Flag indicating if user is in the process of creating a new project
 */
export const isCreatingNewProjectAtom = atomWithReset<boolean>(false)

/**
 * Callback function for refreshing repositories list
 */
export const onRepositoryRefreshAtom = atom<(() => void) | null>(null)

// ==============================================================================
// DERIVED ATOMS - Computed values
// ==============================================================================

/**
 * Repository mode is when we have a selected repository AND we're not creating a new project
 */
export const isRepositoryModeAtom = atom((get) => {
  const selectedRepository = get(selectedRepositoryAtom)
  const isCreatingNewProject = get(isCreatingNewProjectAtom)
  return selectedRepository !== null && !isCreatingNewProject
})

/**
 * Helper atom to get the current repository's owner and name
 */
export const currentRepositoryInfoAtom = atom((get) => {
  const repository = get(selectedRepositoryAtom)
  if (!repository) return null

  const [owner] = repository.fullName.split('/')
  return {
    owner,
    repo: repository.name,
    fullName: repository.fullName
  }
})

// ==============================================================================
// ACTION ATOMS - Write-only atoms for state mutations
// ==============================================================================

/**
 * Clear all repository-related data
 */
export const clearAllRepositoryDataAtom = atom(
  null,
  (get, set, preserveCreatingFlag?: boolean) => {
    console.log('🗑️ clearAllRepositoryData called - preserveCreatingFlag:', preserveCreatingFlag)

    // Clear repository state
    set(selectedRepositoryAtom, null)
    set(newlyCreatedRepositoryAtom, null)

    if (!preserveCreatingFlag) {
      set(isCreatingNewProjectAtom, false)
    }

    // Trigger refresh if callback is available
    const refreshCallback = get(onRepositoryRefreshAtom)
    if (refreshCallback && typeof refreshCallback === 'function') {
      refreshCallback()
    }

    console.log('🗑️ Repository data cleared')
  }
)

/**
 * Atomic action to start new project mode
 * This is a single, atomic operation that prevents race conditions
 */
export const startNewProjectModeAtom = atom(
  null,
  (get, set) => {
    console.log('🚀 startNewProjectMode - atomic action')

    // Single atomic operation - no race conditions possible
    set(selectedRepositoryAtom, null)
    set(newlyCreatedRepositoryAtom, null)
    set(isCreatingNewProjectAtom, true)

    console.log('✅ New project mode activated atomically')
  }
)

/**
 * Atomic action for project creation completion
 * Handles all state updates that happen when a project is successfully created
 */
export const completeProjectCreationAtom = atom(
  null,
  (get, set, projectData: { repositoryUrl: string; name: string; isNewProject: boolean }) => {
    console.log('🎯 completeProjectCreation - atomic action', projectData)

    // Extract repository name from URL or use project name
    const repoName = projectData.repositoryUrl.split('/').pop() || projectData.name

    // Atomic project creation completion
    if (projectData.isNewProject) {
      set(isCreatingNewProjectAtom, false)
    }
    set(newlyCreatedRepositoryAtom, repoName)

    // Trigger refresh without setTimeout - use reactive pattern
    set(refreshRepositoriesAtom)

    console.log('✅ Project creation completed atomically', { repoName })
  }
)

/**
 * Atomic action for cache refresh coordination
 * Ensures cache invalidation and refresh happen together
 */
export const coordinatedCacheRefreshAtom = atom(
  null,
  (get, set) => {
    console.log('🔄 coordinatedCacheRefresh - atomic action')

    // Coordinate cache operations atomically
    // This will be used by commands instead of separate invalidate + refresh calls
    set(refreshRepositoriesAtom)

    console.log('✅ Cache refresh coordinated atomically')
  }
)

/**
 * Set selected repository with proper cleanup
 */
export const setSelectedRepositoryAtom = atom(
  null,
  (get, set, repository: Repository | null) => {
    const currentSelected = get(selectedRepositoryAtom)
    const newlyCreated = get(newlyCreatedRepositoryAtom)

    // Only update if different
    if (!currentSelected || currentSelected.id !== repository?.id) {
      set(selectedRepositoryAtom, repository)
    }

    // Clear newly created flag when appropriate
    if (repository && newlyCreated) {
      if (repository.name === newlyCreated ||
          repository.fullName.includes(newlyCreated)) {
        set(newlyCreatedRepositoryAtom, null)
      }
    }

    // Clear creating flag when selecting an existing repository
    if (repository && get(isCreatingNewProjectAtom)) {
      console.log('🔄 Clearing isCreatingNewProject flag because repository selected:', repository.name)
      set(isCreatingNewProjectAtom, false)
    }
  }
)

/**
 * Set newly created repository with reactive cleanup
 * No more arbitrary timeouts - clearing is based on user actions
 */
export const setNewlyCreatedRepositoryAtom = atom(
  null,
  (get, set, repositoryName: string | null) => {
    console.log('🎯 setNewlyCreatedRepository - reactive pattern', { repositoryName })
    set(newlyCreatedRepositoryAtom, repositoryName)
    
    // No setTimeout! Clearing happens reactively based on user actions:
    // 1. When user selects the highlighted repository (in setSelectedRepositoryAtom)
    // 2. When user starts new project mode (in startNewProjectModeAtom)
    // 3. When user clears all repository data (in clearAllRepositoryDataAtom)
    
    console.log('✅ Repository highlighting set reactively - no race conditions')
  }
)

// ==============================================================================
// UTILITY ATOMS - For common operations
// ==============================================================================

/**
 * Refresh repositories helper
 */
export const refreshRepositoriesAtom = atom(
  null,
  (get) => {
    const refreshCallback = get(onRepositoryRefreshAtom)
    if (refreshCallback && typeof refreshCallback === 'function') {
      refreshCallback()
    }
  }
)

/**
 * Check if a repository is the newly created one
 */
export const isNewlyCreatedRepositoryAtom = atom((get) => {
  return (repository: Repository) => {
    const newlyCreated = get(newlyCreatedRepositoryAtom)
    if (!newlyCreated) return false

    return repository.name === newlyCreated ||
           repository.fullName.includes(newlyCreated)
  }
})
