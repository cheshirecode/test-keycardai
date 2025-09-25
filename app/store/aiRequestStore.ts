import { atom } from 'jotai'

/**
 * Atom to track projects with pending AI requests
 * Key: project identifier (name or ID)
 * Value: AI request details
 */
export interface PendingAIRequest {
  projectId: string
  projectName: string
  requestType: 'creation' | 'modification' | 'analysis'
  startTime: number
  description?: string
}

/**
 * Map of pending AI requests by project ID
 */
export const pendingAIRequestsAtom = atom<Map<string, PendingAIRequest>>(new Map())

/**
 * Derived atom to check if a specific project has pending AI requests
 */
export const isProjectPendingAtom = (projectId: string) =>
  atom((get) => {
    const pendingRequests = get(pendingAIRequestsAtom)
    return pendingRequests.has(projectId)
  })

/**
 * Derived atom to get all pending project IDs
 */
export const pendingProjectIdsAtom = atom((get) => {
  const pendingRequests = get(pendingAIRequestsAtom)
  return Array.from(pendingRequests.keys())
})

/**
 * Derived atom to get count of pending requests
 */
export const pendingRequestCountAtom = atom((get) => {
  const pendingRequests = get(pendingAIRequestsAtom)
  return pendingRequests.size
})

/**
 * Action atoms for managing pending requests
 */

/**
 * Add a pending AI request for a project
 */
export const addPendingRequestAtom = atom(
  null,
  (get, set, request: PendingAIRequest) => {
    const currentRequests = get(pendingAIRequestsAtom)
    const newRequests = new Map(currentRequests)
    newRequests.set(request.projectId, request)
    set(pendingAIRequestsAtom, newRequests)
  }
)

/**
 * Remove a pending AI request for a project
 */
export const removePendingRequestAtom = atom(
  null,
  (get, set, projectId: string) => {
    const currentRequests = get(pendingAIRequestsAtom)
    const newRequests = new Map(currentRequests)
    newRequests.delete(projectId)
    set(pendingAIRequestsAtom, newRequests)
  }
)

/**
 * Clear all pending requests
 */
export const clearAllPendingRequestsAtom = atom(
  null,
  (get, set) => {
    set(pendingAIRequestsAtom, new Map())
  }
)

/**
 * Get pending request details for a specific project
 */
export const getPendingRequestAtom = (projectId: string) =>
  atom((get) => {
    const pendingRequests = get(pendingAIRequestsAtom)
    return pendingRequests.get(projectId)
  })

/**
 * Update pending request details
 */
export const updatePendingRequestAtom = atom(
  null,
  (get, set, projectId: string, updates: Partial<PendingAIRequest>) => {
    const currentRequests = get(pendingAIRequestsAtom)
    const existingRequest = currentRequests.get(projectId)

    if (existingRequest) {
      const newRequests = new Map(currentRequests)
      newRequests.set(projectId, { ...existingRequest, ...updates })
      set(pendingAIRequestsAtom, newRequests)
    }
  }
)

/**
 * Utility functions for working with pending requests
 */

/**
 * Generate a project ID from project info
 */
export function generateProjectId(projectName: string, projectPath?: string): string {
  // Use project path if available, otherwise use name
  return projectPath || projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

/**
 * Create a pending request object
 */
export function createPendingRequest(
  projectName: string,
  requestType: PendingAIRequest['requestType'],
  description?: string,
  projectPath?: string
): PendingAIRequest {
  return {
    projectId: generateProjectId(projectName, projectPath),
    projectName,
    requestType,
    startTime: Date.now(),
    description
  }
}
