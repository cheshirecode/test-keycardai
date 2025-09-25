'use client'

import { SWRConfig } from 'swr'
import { SWRProviderProps } from '@/types'

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000, // 2 seconds deduplication
        focusThrottleInterval: 5000, // 5 seconds focus throttle
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        // Global error handler
        onError: (error) => {
          console.error('SWR Error:', error)
        },
        // Global success handler for debugging
        onSuccess: (data, key) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`SWR Success for ${key}:`, data)
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
