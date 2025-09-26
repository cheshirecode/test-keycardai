/**
 * Repository Data Fetching Hook
 *
 * Pure data fetching hook without any state management concerns.
 *
 * Benefits:
 * - Single responsibility: data fetching only
 * - No state management coupling
 * - Easy to test and mock
 * - Reusable across different contexts
 */

'use client'

import { useCallback } from 'react'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { Repository } from '@/types'
import type { ListRepositoriesParams } from '@/types/mcp-tools'

/**
 * Repository data fetching hook - pure data operations
 */
export function useRepositoryData() {
  const loadAllRepositories = useCallback(async (): Promise<Repository[]> => {
    try {
      const mcpClient = new TypedMCPClient()
      const params: ListRepositoriesParams = {}
      const result = await mcpClient.call('list_repositories', params)

      if (result.success && result.repositories) {
        return result.repositories
      }

      return []
    } catch (error) {
      console.error('Failed to load repositories:', error)
      return []
    }
  }, [])

  const loadRepositoryByPath = useCallback(async (owner: string, repo: string): Promise<Repository | null> => {
    try {
      const repositories = await loadAllRepositories()

      const repository = repositories.find((repository: Repository) => {
        const [repoOwner] = repository.fullName.split('/')
        return repoOwner.toLowerCase() === owner.toLowerCase() &&
               repository.name.toLowerCase() === repo.toLowerCase()
      })

      return repository || null
    } catch (error) {
      console.error('Failed to load repository by path:', error)
      return null
    }
  }, [loadAllRepositories])

  const loadRepositoryById = useCallback(async (id: string): Promise<Repository | null> => {
    try {
      const repositories = await loadAllRepositories()
      const repository = repositories.find(repo => repo.id === id)
      return repository || null
    } catch (error) {
      console.error('Failed to load repository by ID:', error)
      return null
    }
  }, [loadAllRepositories])

  return {
    loadAllRepositories,
    loadRepositoryByPath,
    loadRepositoryById
  }
}
