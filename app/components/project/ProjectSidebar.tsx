'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import type { Repository } from '@/types'
import { ChevronDownIcon, ChevronRightIcon, TrashIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FolderIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import { useRepositories } from '@/hooks/useRepositories'
import { useRepositoryNavigation } from '@/lib/navigation'
import { CONFIG } from '@/lib/config'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { DeleteRepositoryParams, ListRepositoriesParams } from '@/types/mcp-tools'
import { useAtomValue } from 'jotai'
import { isProjectPendingAtom, generateProjectId } from '@/store/aiRequestStore'

interface ProjectSidebarProps {
  selectedRepository?: Repository | null
  onRepositorySelect: (repository: Repository | null) => void
  className?: string
  onRefresh?: (refreshFn: () => void) => void
  newlyCreatedRepository?: string | null
  onMobileClose?: () => void
}

export function ProjectSidebar({ selectedRepository, onRepositorySelect, className = '', onRefresh, newlyCreatedRepository, onMobileClose }: ProjectSidebarProps) {
  const { navigateToHome } = useRepositoryNavigation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [filter, setFilter] = useState('')
  const [debouncedFilter, setDebouncedFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deletingRepositoryId, setDeletingRepositoryId] = useState<string | null>(null)
  const [repositoryParams, setRepositoryParams] = useState<ListRepositoriesParams>({
    sort: 'updated',
    direction: 'desc',
    type: 'all'
  })

  // Debounce the filter input to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filter)
    }, 300)

    return () => clearTimeout(timer)
  }, [filter])

  // Use the repositories hook with filtering parameters
  const { repositories, isLoading: loading, error, refresh } = useRepositories({
    ...repositoryParams,
    nameFilter: debouncedFilter || undefined
  })

  // Check if we have active filters
  const hasActiveFilters = useMemo(() => {
    return (
      debouncedFilter.length > 0 ||
      repositoryParams.type !== 'all' ||
      repositoryParams.sort !== 'updated' ||
      repositoryParams.direction !== 'desc'
    )
  }, [debouncedFilter, repositoryParams])

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

    // Start the fade-out animation
    setDeletingRepositoryId(repository.id)

    try {
      const [owner, repo] = repository.fullName.split('/')
      const mcpClient = new TypedMCPClient()

      // First validate permissions
      const permissionCheck = await mcpClient.call('validate_repository_permissions', {
        owner
      })

      if (!permissionCheck.canDelete) {
        alert(`Failed to delete repository: ${permissionCheck.message}`)
        setDeletingRepositoryId(null) // Reset animation state on error
        return
      }

      // Proceed with deletion if permissions are valid
      const params: DeleteRepositoryParams = { owner, repo }
      const result = await mcpClient.call('delete_repository', params)

      if (result.success) {
        // Check if we're deleting the currently selected repository
        const isDeletingCurrentRepo = selectedRepository?.id === repository.id

        // Wait for 1 second (animation duration) before refreshing
        setTimeout(() => {
          // Reset the deleting state
          setDeletingRepositoryId(null)

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
          }, 300) // Small delay to ensure refresh completes
        }, 1000) // 1 second delay for animation

      } else {
        alert(`Failed to delete repository: ${result.message}`)
        setDeletingRepositoryId(null) // Reset animation state on error
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete repository. Please try again.')
      setDeletingRepositoryId(null) // Reset animation state on error
    }
  }

  // Since filtering and sorting are now handled server-side, we just use the repositories as-is
  const sortedRepositories = repositories

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
                if (onMobileClose) {
                  // Mobile: close the overlay
                  onMobileClose()
                } else {
                  // Desktop: collapse the sidebar
                  setIsCollapsed(true)
                }
              }}
              className={`text-gray-400 hover:text-gray-600 transition-colors ${
                onMobileClose ? 'p-2 lg:p-1' : 'p-1'
              }`}
              title={onMobileClose ? "Close sidebar" : "Collapse sidebar"}
            >
              {onMobileClose ? (
                // Mobile: X icon, larger size
                <XMarkIcon className="w-5 h-5 lg:w-4 lg:h-4" />
              ) : (
                // Desktop: < arrow icon
                <ChevronDownIcon className="w-4 h-4 transform rotate-90" />
              )}
            </button>
          </div>
        </div>

        {/* Search/Filter */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : hasActiveFilters
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <FunnelIcon className="w-3 h-3" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>

            {/* Quick Sort Toggle */}
            <button
              onClick={() => setRepositoryParams(prev => ({
                ...prev,
                direction: prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title={`Sort ${repositoryParams.direction === 'asc' ? 'descending' : 'ascending'}`}
            >
              {repositoryParams.direction === 'asc' ?
                <ArrowUpIcon className="w-3 h-3" /> :
                <ArrowDownIcon className="w-3 h-3" />
              }
              <span>{repositoryParams.sort}</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-md border">
              {/* Repository Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Type</label>
                <select
                  value={repositoryParams.type || 'all'}
                  onChange={(e) => setRepositoryParams(prev => ({
                    ...prev,
                    type: e.target.value as 'all' | 'public' | 'private'
                  }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Repositories</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Sort By</label>
                <select
                  value={repositoryParams.sort || 'updated'}
                  onChange={(e) => setRepositoryParams(prev => ({
                    ...prev,
                    sort: e.target.value as 'created' | 'updated' | 'pushed' | 'full_name'
                  }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="updated">Last Updated</option>
                  <option value="created">Created Date</option>
                  <option value="pushed">Last Push</option>
                  <option value="full_name">Name</option>
                </select>
              </div>

              {/* Quick Reset */}
              <button
                onClick={() => {
                  setRepositoryParams({
                    sort: 'updated',
                    direction: 'desc',
                    type: 'all'
                  })
                  setFilter('')
                }}
                className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
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
          <div className="p-4">
            <div className="flex items-center justify-center space-y-3 flex-col">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 text-sm">Loading repositories...</p>
            </div>

            {/* Loading skeleton */}
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map((index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-start space-x-3 p-3 rounded-md bg-gray-100">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                      isDeleting={deletingRepositoryId === repo.id}
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
                      isDeleting={deletingRepositoryId === repo.id}
                      onClick={() => handleRepositoryClick(repo)}
                      onDelete={(e) => handleDeleteRepository(repo, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {sortedRepositories.length === 0 && !loading && !error && (
              <div className="p-4 text-center text-gray-500 text-sm">
                {hasActiveFilters ? (
                  <div>
                    <p>No repositories match your current filters.</p>
                    <button
                      onClick={() => {
                        setRepositoryParams({
                          sort: 'updated',
                          direction: 'desc',
                          type: 'all'
                        })
                        setFilter('')
                        setShowFilters(false)
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  'No repositories found.'
                )}
              </div>
            )}

            {/* Results count */}
            {!loading && !error && sortedRepositories.length > 0 && (
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                {hasActiveFilters ? (
                  `${sortedRepositories.length} repositories match your filters`
                ) : (
                  `${sortedRepositories.length} repositories total`
                )}
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
  isDeleting?: boolean
  onClick: () => void
  onDelete: (event: React.MouseEvent) => void
}

function RepositoryItem({ repository, isSelected, isNewlyCreated = false, isDeleting = false, onClick, onDelete }: RepositoryItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if this project has pending AI requests
  const projectId = useMemo(() => generateProjectId(repository.name, repository.fullName), [repository.name, repository.fullName])
  const pendingAtom = useMemo(() => isProjectPendingAtom(projectId), [projectId])
  const isPending = useAtomValue(pendingAtom)

  return (
    <div
      data-testid="repository-item"
      className={`w-full p-3 rounded-md group relative transition-all duration-1000 ${
        isDeleting
          ? 'opacity-0 transform scale-95 pointer-events-none bg-red-50 border-l-4 border-red-400'
          : isPending
          ? 'bg-orange-50 border-l-4 border-orange-400 opacity-75 transition-colors'
          : isSelected
          ? 'bg-blue-100 border-l-4 border-blue-500 transition-colors'
          : isNewlyCreated
          ? 'bg-green-50 border-l-4 border-green-400 hover:bg-green-100 transition-colors'
          : 'hover:bg-gray-100 border-l-4 border-transparent transition-colors'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Main clickable area */}
        <button
          onClick={onClick}
          className="flex items-start space-x-2 flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer"
        >
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
                isSelected ? 'text-blue-900' : isPending ? 'text-orange-700' : 'text-gray-900'
              }`}>
                {repository.name}
              </h4>
              {isPending && (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-500 flex-shrink-0" />
              )}
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
        </button>

        {/* Delete button - separate from main content */}
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent triggering the main onClick
            if (!isPending) {
              onDelete(e)
            }
          }}
          disabled={isPending}
          className={`flex-shrink-0 p-1 transition-colors ${
            isPending
              ? 'text-gray-300 cursor-not-allowed opacity-50'
              : 'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
          }`}
          title={isPending ? 'Cannot delete while AI is processing' : `Delete ${repository.name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
