'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { ProjectSidebar } from '@/components/project'
import { useRepositoryState } from '@/hooks/useRepositoryAtoms'
import { useRepositorySync } from '@/hooks/useRepositorySync'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
    <div className="flex h-screen w-full bg-white min-h-0 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white shadow-lg rounded-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Bars3Icon className="h-6 w-6 text-gray-600" />
      </button>

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
                  setSelectedRepository(repo)
                  setIsSidebarOpen(false) // Close sidebar after selection on mobile
                }}
                className="flex-shrink-0"
                newlyCreatedRepository={newlyCreatedRepository}
                onRefresh={handleSidebarRefresh}
              />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white shadow-lg rounded-lg"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <ProjectSidebar
          selectedRepository={selectedRepository}
          onRepositorySelect={setSelectedRepository}
          className="flex-shrink-0"
          newlyCreatedRepository={newlyCreatedRepository}
          onRefresh={handleSidebarRefresh}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
