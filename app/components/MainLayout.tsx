'use client'

import React from 'react'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { useRepository } from '@/contexts/RepositoryContext'
import { useRepositorySync } from '@/hooks/useRepositorySync'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { selectedRepository, setSelectedRepository } = useRepository()
  
  // Sync repository selection with URL changes
  useRepositorySync()

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <ProjectSidebar
        selectedRepository={selectedRepository}
        onRepositorySelect={setSelectedRepository}
        className="flex-shrink-0"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {children}
      </div>
    </div>
  )
}
