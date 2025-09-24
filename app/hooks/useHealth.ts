import useSWR from 'swr'

interface HealthResponse {
  status: string
  services?: {
    githubOwner?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

const fetcher = async (url: string): Promise<HealthResponse> => {
  const response = await fetch(url)
  return response.json()
}

export function useHealth() {
  const { data, error, isLoading } = useSWR<HealthResponse>(
    '/api/health',
    fetcher,
    {
      // Cache for 10 minutes since health data doesn't change often
      dedupingInterval: 10 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // Don't retry as much for health endpoint
      errorRetryCount: 1,
    }
  )

  return {
    healthData: data,
    githubOwner: data?.services?.githubOwner,
    isLoading,
    error: error?.message || null,
  }
}
