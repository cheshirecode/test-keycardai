'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRepositoryManager } from '@/hooks/composed/useRepositoryManager'
import { useRepository } from '@/hooks/useRepositories'

interface RepositoryPageWrapperProps {
  owner: string
  repo: string
  children: React.ReactNode
}

export function RepositoryPageWrapper({ owner, repo, children }: RepositoryPageWrapperProps) {
  const repositoryManager = useRepositoryManager()
  const { selectedRepository, setSelectedRepository, setIsCreatingNewProject, isCreatingNewProject } = repositoryManager
  const { repository, isLoading: loading, error } = useRepository(owner, repo)

  useEffect(() => {
    if (repository) {
      // Only update if it's different from current selection
      if (!selectedRepository || selectedRepository.id !== repository.id) {
        setSelectedRepository(repository)
      }

      // Clear the creating new project flag when we have a specific repository loaded
      if (isCreatingNewProject) {
        console.log('🔄 Clearing isCreatingNewProject flag because we loaded a specific repository:', repository.name)
        setIsCreatingNewProject(false)
      }
    }
  }, [repository, selectedRepository, setSelectedRepository, isCreatingNewProject, setIsCreatingNewProject])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Loading repository {owner}/{repo}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-xl">❌</span>
          </div>
          <div>
            <p className="text-red-600 font-medium">Repository not found</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
