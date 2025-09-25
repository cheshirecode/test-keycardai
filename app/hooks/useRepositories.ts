import useSWR, { mutate } from 'swr'
import type { Repository } from '@/types'
import { useRepositoryDirect } from './useRepositoryDirect'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { ListRepositoriesParams } from '@/types/mcp-tools'

interface RepositoriesResponse {
  success: boolean
  repositories: Repository[]
  owner?: string
  total?: number
  message?: string
}

const mcpClient = new TypedMCPClient()

const fetcher = async (key: string): Promise<RepositoriesResponse> => {
  // Parse the key to extract any query parameters
  const url = new URL(key, 'http://localhost')
  
  const params: ListRepositoriesParams = {
    owner: url.searchParams.get('owner') || undefined,
    nameFilter: url.searchParams.get('nameFilter') || undefined,
    type: (url.searchParams.get('type') as 'all' | 'public' | 'private') || undefined,
    sort: (url.searchParams.get('sort') as 'created' | 'updated' | 'pushed' | 'full_name') || undefined,
    direction: (url.searchParams.get('direction') as 'asc' | 'desc') || undefined
  }

  const result = await mcpClient.call('list_repositories', params)
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to load repositories')
  }
  
  return {
    success: result.success,
    repositories: result.repositories || [],
    owner: result.owner,
    total: result.total,
    message: result.message
  }
}

export function useRepositories() {
  const { data, error, isLoading, mutate: mutateFn } = useSWR<RepositoriesResponse>(
    '/mcp/repositories',
    fetcher,
    {
      // Cache for 5 minutes
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false, // Disable to prevent unwanted side effects with auto-selection
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
    invalidateCache: () => mutate('/mcp/repositories'),
  }
}

// Helper function to invalidate repositories cache globally
export const invalidateRepositoriesCache = () => {
  return mutate('/mcp/repositories')
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
