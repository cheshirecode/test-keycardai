/**
 * AI Settings Manager Hook
 *
 * High-level composed hook for AI-related settings and state.
 * Eliminates direct atom access from components.
 *
 * Benefits:
 * - Single hook for all AI settings
 * - No direct atom access in components
 * - Easy to extend with more AI settings
 * - Clean abstraction layer
 */

'use client'

import { useAtomManager } from '../core/useAtomManager'
import type { AIProvider } from '@/lib/ai-service'

export interface AIManager {
  isFastMode: boolean
  setIsFastMode: (fastMode: boolean) => void
  aiProvider: AIProvider
  setAIProvider: (provider: AIProvider) => void
}

/**
 * High-level AI manager hook for components
 */
export function useAIManager(): AIManager {
  const { ai } = useAtomManager()

  return {
    isFastMode: ai.getIsFastMode(),
    setIsFastMode: ai.setIsFastMode,
    aiProvider: ai.getAIProvider(),
    setAIProvider: ai.setAIProvider
  }
}
