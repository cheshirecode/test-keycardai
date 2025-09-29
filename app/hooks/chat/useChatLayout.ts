/**
 * Hook for managing chat layout state
 * Handles mobile accordion expansion and responsive behavior
 */

'use client'

import { useState } from 'react'
import { ChatLayoutState } from '@/types'

export function useChatLayout(): ChatLayoutState {
  const [mobileExpandedPanel, setMobileExpandedPanel] = useState<'chat' | 'preview' | null>('chat')

  return {
    mobileExpandedPanel,
    setMobileExpandedPanel
  }
}
