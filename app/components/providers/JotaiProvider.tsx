'use client'

import { Provider } from 'jotai'
import { JotaiProviderProps } from '@/types'

/**
 * Jotai Provider component for global state management
 */
export function JotaiProvider({ children }: JotaiProviderProps) {
  return <Provider>{children}</Provider>
}
