'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { ProjectSidebar } from '@/components/project'
import { useRepositoryState } from '@/hooks/useRepositoryAtoms'
import { useRepositorySync } from '@/hooks/useRepositorySync'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const {
    selectedRepository,
    setSelectedRepository,
    newlyCreatedRepository,
    setOnRepositoryRefresh
  } = useRepositoryState()

  const sidebarRefreshRef = useRef<(() => void) | null>(null)

  // Sync repository selection with URL changes
  useRepositorySync()

  // Set up the refresh callback - only set if we have a valid function
  useEffect(() => {
    if (sidebarRefreshRef.current) {
      setOnRepositoryRefresh(sidebarRefreshRef.current)
    }
  }, [setOnRepositoryRefresh])

  const handleSidebarRefresh = useCallback((refreshFn: () => void) => {
    sidebarRefreshRef.current = refreshFn
    setOnRepositoryRefresh(refreshFn)
  }, [setOnRepositoryRefresh])

  return (
    <div className="flex h-screen bg-white min-h-0">
      {/* Sidebar */}
      <ProjectSidebar
        selectedRepository={selectedRepository}
        onRepositorySelect={setSelectedRepository}
        className="flex-shrink-0"
        newlyCreatedRepository={newlyCreatedRepository}
        onRefresh={handleSidebarRefresh}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {children}
      </div>
    </div>
  )
}
