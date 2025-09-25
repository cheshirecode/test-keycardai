'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { Repository } from '@/types'
import { ChevronDownIcon, ChevronRightIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { FolderIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import { useRepositories } from '@/hooks/useRepositories'
import { useRepository } from '@/contexts/RepositoryContext'
import { CONFIG } from '@/lib/config'

interface ProjectSidebarProps {
  selectedRepository?: Repository | null
  onRepositorySelect: (repository: Repository | null) => void
  className?: string
  onRefresh?: (refreshFn: () => void) => void
  newlyCreatedRepository?: string | null
}

export function ProjectSidebar({ selectedRepository, onRepositorySelect, className = '', onRefresh, newlyCreatedRepository }: ProjectSidebarProps) {
  const { repositories, isLoading: loading, error, refresh } = useRepositories()
  const { navigateToHome } = useRepository()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [filter, setFilter] = useState('')

  // Use ref to avoid dependency on refresh function
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    // Register the refresh function with the parent
    if (onRefresh) {
      onRefresh(refreshRef.current)
    }
  }, [onRefresh]) // Remove refresh from dependencies

  // Auto-refresh and select newly created repository
  useEffect(() => {
    if (newlyCreatedRepository) {
      refreshRef.current()
    }
  }, [newlyCreatedRepository]) // Remove refresh from dependencies

  // Highlight newly created repository but don't auto-navigate
  useEffect(() => {
    if (newlyCreatedRepository && repositories.length > 0) {
      // Just highlight the new repository without auto-navigation
      // User can click to navigate manually
      const newRepo = repositories.find(repo =>
        repo.name === newlyCreatedRepository ||
        repo.fullName.includes(newlyCreatedRepository)
      )

      // Clear the newly created flag after highlighting
      if (newRepo) {
        setTimeout(() => {
          // Clear after showing highlighting for a bit
        }, CONFIG.TIMEOUTS.UI_FEEDBACK)
      }
    }
  }, [repositories, newlyCreatedRepository])

  const handleDeleteRepository = async (repository: Repository, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent repository selection

    if (!confirm(`Are you sure you want to delete "${repository.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const [owner, repo] = repository.fullName.split('/')
      const response = await fetch('/api/repositories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo }),
      })

      const result = await response.json()

      if (result.success) {
        // Check if we're deleting the currently selected repository
        const isDeletingCurrentRepo = selectedRepository?.id === repository.id

        // Invalidate the cache to refetch repositories
        refresh()

        // Wait for refresh, then handle routing
        setTimeout(() => {
          if (isDeletingCurrentRepo) {
            // If deleting current repo, navigate to first available project
            if (repositories.length > 1) {
              // Find first repository that's not the one being deleted
              const firstRepo = repositories.find(repo => repo.id !== repository.id)
              if (firstRepo) {
                onRepositorySelect(firstRepo)
              } else {
                // No other repositories, go to home
                navigateToHome()
              }
            } else {
              // No other repositories, go to home
              navigateToHome()
            }
          }
        }, 500) // Small delay to ensure refresh completes

      } else {
        alert(`Failed to delete repository: ${result.message}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete repository. Please try again.')
    }
  }

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(filter.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(filter.toLowerCase()))
  )

  // Sort repositories by updatedAt (most recent first), then by name (alphabetical)
  const sortedRepositories = [...filteredRepositories].sort((a, b) => {
    // First sort by updatedAt (most recent first)
    const dateA = new Date(a.updatedAt).getTime()
    const dateB = new Date(b.updatedAt).getTime()

    if (dateB !== dateA) {
      return dateB - dateA // Most recent first
    }

    // If dates are equal, sort by name (alphabetical)
    return a.name.localeCompare(b.name)
  })

  const scaffoldedProjects = sortedRepositories.filter(repo => repo.isScaffoldedProject)
  const otherRepositories = sortedRepositories.filter(repo => !repo.isScaffoldedProject)


  const handleRepositoryClick = (repository: Repository) => {
    if (selectedRepository?.id === repository.id) {
      onRepositorySelect(null) // Deselect if clicking the same repository
    } else {
      onRepositorySelect(repository)
    }
  }

  if (isCollapsed) {
    return (
      <div className={`bg-gray-50 border-r border-gray-200 ${className}`} style={{ width: '60px' }}>
        <div className="p-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 border-r border-gray-200 flex flex-col h-full ${className}`} style={{ width: '320px' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                navigateToHome()
                onRepositorySelect(null)
              }}
              className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Create new project"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronDownIcon className="w-4 h-4 transform rotate-90" />
            </button>
          </div>
        </div>

        {/* Search/Filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="mt-2 w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="p-4 text-center text-gray-500">
            Loading repositories...
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="p-2">
            {/* Scaffolded Projects Section */}
            {scaffoldedProjects.length > 0 && (
              <div className="mb-6">
                <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Scaffolded Projects ({scaffoldedProjects.length})
                </h3>
                <div className="mt-1 space-y-1">
                  {scaffoldedProjects.map((repo) => (
                    <RepositoryItem
                      key={repo.id}
                      repository={repo}
                      isSelected={selectedRepository?.id === repo.id}
                      isNewlyCreated={newlyCreatedRepository ?
                        (repo.name === newlyCreatedRepository || repo.fullName.includes(newlyCreatedRepository)) :
                        false}
                      onClick={() => handleRepositoryClick(repo)}
                      onDelete={(e) => handleDeleteRepository(repo, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Repositories Section */}
            {otherRepositories.length > 0 && (
              <div>
                <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Other Repositories ({otherRepositories.length})
                </h3>
                <div className="mt-1 space-y-1">
                  {otherRepositories.map((repo) => (
                    <RepositoryItem
                      key={repo.id}
                      repository={repo}
                      isSelected={selectedRepository?.id === repo.id}
                      isNewlyCreated={newlyCreatedRepository ?
                        (repo.name === newlyCreatedRepository || repo.fullName.includes(newlyCreatedRepository)) :
                        false}
                      onClick={() => handleRepositoryClick(repo)}
                      onDelete={(e) => handleDeleteRepository(repo, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredRepositories.length === 0 && !loading && !error && (
              <div className="p-4 text-center text-gray-500 text-sm">
                {filter ? 'No repositories match your search.' : 'No repositories found.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface RepositoryItemProps {
  repository: Repository
  isSelected: boolean
  isNewlyCreated?: boolean
  onClick: () => void
  onDelete: (event: React.MouseEvent) => void
}

function RepositoryItem({ repository, isSelected, isNewlyCreated = false, onClick, onDelete }: RepositoryItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <button
      onClick={onClick}
      data-testid="repository-item"
      className={`w-full p-3 text-left rounded-md transition-colors group ${
        isSelected
          ? 'bg-blue-100 border-l-4 border-blue-500'
          : isNewlyCreated
          ? 'bg-green-50 border-l-4 border-green-400 hover:bg-green-100'
          : 'hover:bg-gray-100 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            {repository.isScaffoldedProject ? (
              <FolderIcon className="w-4 h-4 text-blue-500" />
            ) : (
              <div className="w-4 h-4 rounded bg-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h4 className={`text-sm font-medium truncate ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {repository.name}
              </h4>
              {repository.private ? (
                <LockClosedIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
              ) : (
                <GlobeAltIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>

            {repository.description && (
              <p className={`text-xs mt-1 line-clamp-2 ${
                isSelected ? 'text-blue-700' : 'text-gray-600'
              }`}>
                {repository.description}
              </p>
            )}

            <p className={`text-xs mt-1 ${
              isSelected ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Updated {formatDate(repository.updatedAt)}
            </p>
          </div>
        </div>

        {/* Delete button - show for all repositories */}
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title={`Delete ${repository.name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </button>
  )
}
