'use client'

import React from 'react'
import { ProjectSidebar } from './ProjectSidebar'
import { useRepository } from '../contexts/RepositoryContext'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { selectedRepository, setSelectedRepository } = useRepository()

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <ProjectSidebar
        selectedRepository={selectedRepository}
        onRepositorySelect={setSelectedRepository}
        className="flex-shrink-0"
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
