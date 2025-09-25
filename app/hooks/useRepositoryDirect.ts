import useSWR from 'swr'
import type { Repository } from '@/types'
import { TypedMCPClient } from '@/lib/typed-mcp-client'
import type { GetRepositoryParams } from '@/types/mcp-tools'

interface RepositoryResponse {
  success: boolean
  repository?: Repository
  message?: string
}

const mcpClient = new TypedMCPClient()

const fetcher = async (params: GetRepositoryParams): Promise<RepositoryResponse> => {
  const result = await mcpClient.call('get_repository', params)

  if (!result.success) {
    throw new Error(result.message || 'Failed to load repository')
  }

  return result
}

/**
 * Hook to fetch a specific repository directly via MCP client
 * This is used when the repository is not found in the general repositories list
 */
export function useRepositoryDirect(owner: string, repo: string, enabled: boolean = true) {
  const params: GetRepositoryParams = { owner, repo }
  const cacheKey = enabled ? ['/mcp/repositories/direct', params] : null

  const { data, error, isLoading, mutate: mutateFn } = useSWR<RepositoryResponse>(
    cacheKey,
    () => fetcher(params),
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
