/**
 * Repository-related Types
 * 
 * Types for repository management, GitHub integration, and repository context
 */

export interface Repository {
  id: string
  name: string
  fullName: string
  url: string
  description: string | null
  private: boolean
  createdAt: string
  updatedAt: string
  isScaffoldedProject: boolean
}

export interface RepositoryDetails {
  readme?: string
  languages?: Record<string, number>
  topics?: string[]
  license?: string
  defaultBranch?: string
  size?: number
  starsCount?: number
  forksCount?: number
  openIssuesCount?: number
  lastCommit?: {
    message: string
    author: string
    date: string
  }
}
