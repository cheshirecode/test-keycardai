/**
 * Hydration-safe utilities to prevent SSR/client mismatches
 */
import React, { useEffect, useState } from 'react'

/**
 * Hook to detect if we're on the client side (hydrated)
 * Prevents hydration mismatches by returning false during SSR
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Generate a hydration-safe unique ID
 * Returns a predictable ID during SSR, then updates to unique ID on client
 */
export function useHydrationSafeId(prefix = 'id') {
  const [id, setId] = useState(`${prefix}-ssr`)
  const isClient = useIsClient()

  useEffect(() => {
    if (isClient) {
      setId(`${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [isClient, prefix])

  return id
}

/**
 * Generate hydration-safe timestamp
 * Returns null during SSR, actual timestamp on client
 */
export function useHydrationSafeTimestamp() {
  const [timestamp, setTimestamp] = useState<Date | null>(null)
  const isClient = useIsClient()

  useEffect(() => {
    if (isClient) {
      setTimestamp(new Date())
    }
  }, [isClient])

  return timestamp
}

/**
 * Utility to suppress hydration warnings for specific elements
 * Use sparingly and only when necessary
 */
export function suppressHydrationWarning(element: React.ReactElement) {
  return React.cloneElement(element, {
    suppressHydrationWarning: true,
    ...element.props
  })
}

/**
 * Generate a stable ID that works across SSR and client
 * Uses counter-based approach instead of random values
 */
let idCounter = 0
export function generateStableId(prefix = 'stable') {
  return `${prefix}-${++idCounter}`
}
