/**
 * URL Path Analyzer Hook
 * 
 * Pure utility hook for parsing URL paths without any state dependencies.
 * 
 * Benefits:
 * - No dependencies on atoms or state
 * - Pure utility functions
 * - Easy to test
 * - Single responsibility: URL parsing
 */

'use client'

import { usePathname } from 'next/navigation'

export interface PathInfo {
  owner: string | null
  repo: string | null
  isProjectRoute: boolean
  isHomeRoute: boolean
}

/**
 * Pure path analyzer hook - no state dependencies
 */
export function usePathAnalyzer(): PathInfo {
  const pathname = usePathname()

  // Extract owner/repo from current path
  const projectMatch = pathname.match(/^\/project\/([^\/]+)\/([^\/]+)$/)

  if (projectMatch) {
    const [, owner, repo] = projectMatch
    return { 
      owner, 
      repo, 
      isProjectRoute: true,
      isHomeRoute: false
    }
  }

  const isHomeRoute = pathname === '/'

  return { 
    owner: null, 
    repo: null, 
    isProjectRoute: false,
    isHomeRoute
  }
}

/**
 * Utility function to check if two repositories match by owner/repo
 */
export function repositoryMatchesPath(
  repository: { fullName: string; name: string } | null,
  pathInfo: PathInfo
): boolean {
  if (!repository || !pathInfo.owner || !pathInfo.repo) {
    return false
  }

  const [currentOwner] = repository.fullName.split('/')
  return (
    currentOwner.toLowerCase() === pathInfo.owner.toLowerCase() &&
    repository.name.toLowerCase() === pathInfo.repo.toLowerCase()
  )
}
