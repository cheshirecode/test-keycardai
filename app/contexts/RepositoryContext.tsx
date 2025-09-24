'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { Repository } from '@/types'

interface RepositoryContextType {
  selectedRepository: Repository | null
  setSelectedRepository: (repository: Repository | null) => void
  isRepositoryMode: boolean
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined)

interface RepositoryProviderProps {
  children: ReactNode
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)

  const isRepositoryMode = selectedRepository !== null

  return (
    <RepositoryContext.Provider value={{
      selectedRepository,
      setSelectedRepository,
      isRepositoryMode
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
