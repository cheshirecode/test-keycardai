'use client'

import React, { useEffect, useRef } from 'react'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { useRepository } from '@/contexts/RepositoryContext'
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
  } = useRepository()
  
  const sidebarRefreshRef = useRef<(() => void) | null>(null)
  
  // Sync repository selection with URL changes
  useRepositorySync()

  // Set up the refresh callback
  useEffect(() => {
    setOnRepositoryRefresh(sidebarRefreshRef.current)
  }, [setOnRepositoryRefresh])

  const handleSidebarRefresh = (refreshFn: () => void) => {
    sidebarRefreshRef.current = refreshFn
    setOnRepositoryRefresh(refreshFn)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <ProjectSidebar
        selectedRepository={selectedRepository}
        onRepositorySelect={setSelectedRepository}
        className="flex-shrink-0"
        newlyCreatedRepository={newlyCreatedRepository}
        onRefresh={handleSidebarRefresh}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {children}
      </div>
    </div>
  )
}
