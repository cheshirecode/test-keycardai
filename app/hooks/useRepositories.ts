import useSWR, { mutate } from 'swr'
import type { Repository } from '@/types'
import { useRepositoryDirect } from './useRepositoryDirect'

interface RepositoriesResponse {
  success: boolean
  repositories: Repository[]
  owner: string
  total: number
  message?: string
}

const fetcher = async (url: string): Promise<RepositoriesResponse> => {
  const response = await fetch(url)
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to load repositories')
  }
  
  return data
}

export function useRepositories() {
  const { data, error, isLoading, mutate: mutateFn } = useSWR<RepositoriesResponse>(
    '/api/repositories',
    fetcher,
    {
      // Cache for 5 minutes, but revalidate on focus
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Retry on error
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  )

  return {
    repositories: data?.repositories || [],
    owner: data?.owner,
    total: data?.total || 0,
    isLoading,
    error: error?.message || null,
    refresh: mutateFn,
    // Global mutate function for cache invalidation
    invalidateCache: () => mutate('/api/repositories'),
  }
}

// Helper function to invalidate repositories cache globally
export const invalidateRepositoriesCache = () => {
  return mutate('/api/repositories')
}

// Helper function to find a specific repository by owner and name
export function useRepository(owner: string, repo: string) {
  const { repositories, isLoading: isLoadingList, error: listError, refresh } = useRepositories()
  
  const repository = repositories.find((repository: Repository) => {
    const [repoOwner] = repository.fullName.split('/')
    return repoOwner.toLowerCase() === owner.toLowerCase() && 
           repository.name.toLowerCase() === repo.toLowerCase()
  })

  // If repository not found in list and list loading is complete, try direct API
  const shouldTryDirect = !isLoadingList && !repository && repositories.length >= 0
  const { 
    repository: directRepository, 
    isLoading: isLoadingDirect, 
    error: directError 
  } = useRepositoryDirect(owner, repo, shouldTryDirect)

  // Use repository from list if found, otherwise use direct repository
  const finalRepository = repository || directRepository
  const isLoading = isLoadingList || (shouldTryDirect && isLoadingDirect)
  
  // Only show error if both methods have completed and no repository found
  const finalError = listError || (shouldTryDirect && !isLoadingDirect && !directRepository ? directError : null)

  return {
    repository: finalRepository,
    isLoading,
    error: finalError,
    refresh,
  }
}
