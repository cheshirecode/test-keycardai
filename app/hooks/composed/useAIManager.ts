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
import type { PlanningMode } from '@/store/aiRequestStore'

export interface AIManager {
  planningMode: PlanningMode
  setPlanningMode: (mode: PlanningMode) => void
  isManualMode: boolean
  aiProvider: AIProvider | null
  // Legacy compatibility
  isFastMode: boolean
  setIsFastMode: (fastMode: boolean) => void
  setAIProvider: (provider: AIProvider) => void
}

/**
 * High-level AI manager hook for components
 */
export function useAIManager(): AIManager {
  const { ai } = useAtomManager()
  const planningMode = ai.getPlanningMode()
  const isManualMode = ai.getIsManualMode()
  const aiProvider = ai.getCurrentAIProvider()

  return {
    planningMode,
    setPlanningMode: ai.setPlanningMode,
    isManualMode,
    aiProvider,
    // Legacy compatibility methods
    isFastMode: isManualMode,
    setIsFastMode: (fastMode: boolean) => {
      ai.setPlanningMode(fastMode ? 'manual' : 'gemini')
    },
    setAIProvider: (provider: AIProvider) => {
      ai.setPlanningMode(provider)
    }
  }
}
