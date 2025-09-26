'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { ProjectSidebar } from '@/components/project'
import { Footer } from './Footer'
import { useRepositoryManager } from '@/hooks/composed/useRepositoryManager'
import { MainLayoutProps } from '@/types'

export function MainLayout({ children }: MainLayoutProps) {
  // Use new decoupled repository manager - includes URL sync automatically
  const repositoryManager = useRepositoryManager()
  const {
    selectedRepository,
    selectRepositoryWithNavigation,
    newlyCreatedRepository,
    setOnRepositoryRefresh
  } = repositoryManager

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const sidebarRefreshRef = useRef<(() => void) | null>(null)

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
    <div className="flex h-screen w-full bg-white min-h-0 overflow-hidden">

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[80vw]">
            <div className="flex h-full">
              <ProjectSidebar
                selectedRepository={selectedRepository}
                onRepositorySelect={(repo) => {
                  selectRepositoryWithNavigation(repo)
                  setIsSidebarOpen(false) // Close sidebar after selection on mobile
                }}
                className="flex-shrink-0"
                newlyCreatedRepository={newlyCreatedRepository}
                onRefresh={handleSidebarRefresh}
                onMobileClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <ProjectSidebar
          selectedRepository={selectedRepository}
          onRepositorySelect={selectRepositoryWithNavigation}
          className="flex-shrink-0"
          newlyCreatedRepository={newlyCreatedRepository}
          onRefresh={handleSidebarRefresh}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-10">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {React.cloneElement(children as React.ReactElement, {
            onToggleSidebar: () => setIsSidebarOpen(true)
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <Footer />
    </div>
  )
}
