'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Repository } from '@/types'

interface RepositoryContextType {
  selectedRepository: Repository | null
  setSelectedRepository: (repository: Repository | null) => void
  setSelectedRepositoryInternal: (repository: Repository | null) => void
  isRepositoryMode: boolean
  navigateToRepository: (repository: Repository) => void
  navigateToHome: () => void
  newlyCreatedRepository: string | null
  setNewlyCreatedRepository: (repositoryName: string | null) => void
  refreshRepositories: () => void
  onRepositoryRefresh: (() => void) | null
  setOnRepositoryRefresh: (callback: (() => void) | null) => void
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined)

interface RepositoryProviderProps {
  children: ReactNode
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [newlyCreatedRepository, setNewlyCreatedRepository] = useState<string | null>(null)
  const [onRepositoryRefresh, setOnRepositoryRefresh] = useState<(() => void) | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isRepositoryMode = selectedRepository !== null

  const navigateToRepository = useCallback((repository: Repository) => {
    // Extract owner from fullName (format: "owner/repo")
    const [owner] = repository.fullName.split('/')
    const repoName = repository.name

    // Navigate to the repository route
    router.push(`/project/${owner}/${repoName}`)
  }, [router])

  const navigateToHome = useCallback(() => {
    router.push('/')
  }, [router])

  const setSelectedRepositoryWithNavigation = useCallback((repository: Repository | null) => {
    setSelectedRepository(repository)

    // Only navigate if we're not already on the correct route
    if (repository) {
      const [owner] = repository.fullName.split('/')
      const expectedPath = `/project/${owner}/${repository.name}`
      if (pathname !== expectedPath) {
        navigateToRepository(repository)
      }
    } else {
      // Navigate to home if deselecting and not already there
      if (pathname !== '/') {
        navigateToHome()
      }
    }
  }, [pathname, navigateToRepository, navigateToHome])

  const refreshRepositories = useCallback(() => {
    if (onRepositoryRefresh) {
      onRepositoryRefresh()
    }
  }, [onRepositoryRefresh])

  return (
    <RepositoryContext.Provider value={{
      selectedRepository,
      setSelectedRepository: setSelectedRepositoryWithNavigation,
      setSelectedRepositoryInternal: setSelectedRepository,
      isRepositoryMode,
      navigateToRepository,
      navigateToHome,
      newlyCreatedRepository,
      setNewlyCreatedRepository,
      refreshRepositories,
      onRepositoryRefresh,
      setOnRepositoryRefresh
    }}>
      {children}
    </RepositoryContext.Provider>
  )
}

export function useRepository() {
  const context = useContext(RepositoryContext)
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider')
  }
  return context
}

// Repository type is now exported from @/types
