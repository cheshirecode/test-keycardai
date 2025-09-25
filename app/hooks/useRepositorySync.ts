'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRepository } from '@/contexts/RepositoryContext'
import type { Repository } from '@/types'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { ListRepositoriesParams } from '@/types/mcp-tools'

/**
 * Hook to synchronize repository selection with URL changes
 * This ensures the repository context stays in sync when users navigate directly via URL
 */
export function useRepositorySync() {
  const pathname = usePathname()
  const { selectedRepository, setSelectedRepositoryInternal } = useRepository()

  useEffect(() => {
    const controller = new AbortController()
    console.log('🔄 useRepositorySync: Effect triggered - pathname:', pathname, 'selectedRepository:', selectedRepository?.name || 'null')

    const syncRepositoryFromUrl = async () => {
      // Check if we're on a repository route
      const projectMatch = pathname.match(/^\/project\/([^\/]+)\/([^\/]+)$/)

      if (projectMatch) {
        const [, owner, repo] = projectMatch

        // Check if we already have the correct repository selected
        if (selectedRepository) {
          const [currentOwner] = selectedRepository.fullName.split('/')
          if (currentOwner.toLowerCase() === owner.toLowerCase() &&
              selectedRepository.name.toLowerCase() === repo.toLowerCase()) {
            // Already have the correct repository selected
            return
          }
        }

        // Need to load the repository from the MCP client
        try {
          const mcpClient = new TypedMCPClient()
          const params: ListRepositoriesParams = {}

          const result = await mcpClient.call('list_repositories', params)

          // Check if request was aborted
          if (controller.signal.aborted) {
            return
          }

          if (result.success && result.repositories) {
            const repository = result.repositories.find((repository: Repository) => {
              const [repoOwner] = repository.fullName.split('/')
              return repoOwner.toLowerCase() === owner.toLowerCase() &&
                     repository.name.toLowerCase() === repo.toLowerCase()
            })

            if (repository && (!selectedRepository || selectedRepository.id !== repository.id)) {
              // Check again if not aborted before updating state
              if (!controller.signal.aborted) {
                console.log('🔄 useRepositorySync: Setting repository from URL:', repository.name)
                // Use the internal setter to avoid navigation loop
                setSelectedRepositoryInternal(repository)
              }
            }
          }
        } catch (error) {
          // Only log error if it's not an abort error
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Failed to sync repository from URL:', error)
          }
        }
      } else if (pathname === '/') {
        // On home page, clear repository selection if one is currently selected
        // This ensures clean state when navigating away from project routes
        // On home page, don't interfere with repository selection
        // The repository context will handle navigation when a repository is selected
        console.log('🏠 useRepositorySync on home page - selectedRepository:', !!selectedRepository)

        // If we have a selectedRepository but we're on home page, it might be from
        // clicking "New Project" - let's check if we should clear it
        if (selectedRepository) {
          setSelectedRepositoryInternal(null)

          // If we have a selectedRepository but we're on home page, it might be from
          // clicking "New Project" - let's check if we should clear it
          console.log('🔄 useRepositorySync: On home page but selectedRepository is set:', selectedRepository.name)
          console.log('🔄 This might be interfering with New Project mode')
        }
      }
    }

    syncRepositoryFromUrl()

    // Cleanup function to abort the request if dependencies change
    return () => {
      controller.abort()
    }
  }, [pathname, selectedRepository, setSelectedRepositoryInternal])
}
