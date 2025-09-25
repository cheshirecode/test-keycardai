import type { MCPLogEntry } from '@/types'

export interface CommandResult {
  success: boolean
  message: string
  chainOfThought?: string
  mcpLogs?: MCPLogEntry[]
  data?: unknown
}

export interface CommandContext {
  addMessage: (role: 'user' | 'assistant', content: string, chainOfThought?: string, mcpLogs?: MCPLogEntry[]) => void
  isMounted: { current: boolean }
}

/**
 * Base class for all chat commands
 * Implements Command pattern for better separation of concerns
 */
export abstract class BaseCommand {
  constructor(protected context: CommandContext) {}

  abstract execute(params: unknown): Promise<CommandResult>

  protected addMessage(role: 'user' | 'assistant', content: string, chainOfThought?: string, mcpLogs?: MCPLogEntry[]) {
    this.context.addMessage(role, content, chainOfThought, mcpLogs)
  }

  protected checkMounted(): boolean {
    return this.context.isMounted.current
  }
}
