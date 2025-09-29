import { useChatOrchestrator } from './useChatOrchestrator'

/**
 * Main useChat hook - now simplified to use the orchestrator
 * This maintains backward compatibility while using the new architecture
 */
export function useChat(fastMode?: boolean) {
  return useChatOrchestrator(fastMode)
}
