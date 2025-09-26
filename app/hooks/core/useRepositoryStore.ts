/**
 * Pure Repository State Hook
 * 
 * Provides read-only access to repository state without any side effects.
 * This hook has NO dependencies on navigation or other systems.
 * 
 * Benefits:
 * - Pure state access with no side effects
 * - No circular dependencies
 * - Easy to test and mock
 * - Single responsibility: state reading only
 */

'use client'

import { useAtomManager } from './useAtomManager'
import type { Repository } from '@/types'

export interface RepositoryState {
  selectedRepository: Repository | null
  newlyCreatedRepository: string | null
  isCreatingNewProject: boolean
  isRepositoryMode: boolean
  currentRepositoryInfo: unknown
  onRepositoryRefresh: (() => void) | null
}

/**
 * Pure repository state hook - read-only access
 */
export function useRepositoryStore(): RepositoryState {
  const { repository } = useAtomManager()

  return {
    selectedRepository: repository.getSelectedRepository(),
    newlyCreatedRepository: repository.getNewlyCreatedRepository(),
    isCreatingNewProject: repository.getIsCreatingNewProject(),
    isRepositoryMode: repository.getIsRepositoryMode(),
    currentRepositoryInfo: repository.getCurrentRepositoryInfo(),
    onRepositoryRefresh: repository.getOnRepositoryRefresh()
  }
}

/**
 * Utility hook to check if a repository is newly created
 */
export function useIsNewlyCreatedRepository(repoName: string): boolean {
  const { repository } = useAtomManager()
  return repository.getIsNewlyCreatedRepository(repoName)
}
