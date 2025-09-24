'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRepository } from '@/contexts/RepositoryContext'
import type { Repository } from '@/types'

/**
 * Hook to synchronize repository selection with URL changes
 * This ensures the repository context stays in sync when users navigate directly via URL
 */
export function useRepositorySync() {
  const pathname = usePathname()
  const { selectedRepository, setSelectedRepositoryInternal } = useRepository()

  useEffect(() => {
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

        // Need to load the repository from the API
        try {
          const response = await fetch('/api/repositories')
          const data = await response.json()

          if (data.success && data.repositories) {
            const repository = data.repositories.find((repository: Repository) => {
              const [repoOwner] = repository.fullName.split('/')
              return repoOwner.toLowerCase() === owner.toLowerCase() && 
                     repository.name.toLowerCase() === repo.toLowerCase()
            })

            if (repository && (!selectedRepository || selectedRepository.id !== repository.id)) {
              // Use the internal setter to avoid navigation loop
              setSelectedRepositoryInternal(repository)
            }
          }
        } catch (error) {
          console.error('Failed to sync repository from URL:', error)
        }
      } else if (pathname === '/') {
        // On home page, don't interfere with repository selection
        // The repository context will handle navigation when a repository is selected
      }
    }

    syncRepositoryFromUrl()
  }, [pathname, selectedRepository, setSelectedRepositoryInternal])
}
