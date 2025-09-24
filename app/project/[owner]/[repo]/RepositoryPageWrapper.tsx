'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRepository } from '@/contexts/RepositoryContext'
import type { Repository } from '@/types'

interface RepositoryPageWrapperProps {
  owner: string
  repo: string
  children: React.ReactNode
}

export function RepositoryPageWrapper({ owner, repo, children }: RepositoryPageWrapperProps) {
  const { selectedRepository, setSelectedRepositoryInternal } = useRepository()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRepositoryFromUrl = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch repositories to find the matching one
        const response = await fetch('/api/repositories')
        const data = await response.json()

        if (data.success && data.repositories) {
          // Find repository by owner and name
          const repository = data.repositories.find((repository: Repository) => {
            // Extract owner from fullName (format: "owner/repo")
            const [repoOwner] = repository.fullName.split('/')
            return repoOwner.toLowerCase() === owner.toLowerCase() && 
                   repository.name.toLowerCase() === repo.toLowerCase()
          })

          if (repository) {
            // Only update if it's different from current selection
            if (!selectedRepository || selectedRepository.id !== repository.id) {
              setSelectedRepositoryInternal(repository)
            }
          } else {
            setError(`Repository ${owner}/${repo} not found`)
          }
        } else {
          setError(data.message || 'Failed to load repositories')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repository')
      } finally {
        setLoading(false)
      }
    }

    loadRepositoryFromUrl()
  }, [owner, repo, selectedRepository, setSelectedRepositoryInternal])

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
