import useSWR from 'swr'
import type { Repository } from '@/types'

interface RepositoryResponse {
  success: boolean
  repository?: Repository
  message?: string
}

const fetcher = async (url: string): Promise<RepositoryResponse> => {
  const response = await fetch(url)
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to load repository')
  }
  
  return data
}

/**
 * Hook to fetch a specific repository directly from GitHub API
 * This is used when the repository is not found in the general repositories list
 */
export function useRepositoryDirect(owner: string, repo: string, enabled: boolean = true) {
  const { data, error, isLoading, mutate: mutateFn } = useSWR<RepositoryResponse>(
    enabled ? `/api/repositories/direct?owner=${owner}&repo=${repo}` : null,
    fetcher,
    {
      // Cache for 2 minutes since this is for specific repository access
      dedupingInterval: 2 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  return {
    repository: data?.repository,
    isLoading,
    error: error?.message || null,
    refresh: mutateFn,
  }
}
