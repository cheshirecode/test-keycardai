import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseCommand, CommandContext, CommandResult } from './BaseCommand'
import type { MCPLogEntry } from '@/types'

// Test implementation of BaseCommand
class TestCommand extends BaseCommand {
  async execute(params: { shouldSucceed: boolean }): Promise<CommandResult> {
    if (params.shouldSucceed) {
      this.addMessage('assistant', 'Success message')
      return {
        success: true,
        message: 'Command executed successfully'
      }
    } else {
      this.addMessage('assistant', 'Error message')
      return {
        success: false,
        message: 'Command failed'
      }
    }
  }

  // Expose protected methods for testing
  public testAddMessage(role: 'user' | 'assistant', content: string, chainOfThought?: string, mcpLogs?: MCPLogEntry[]) {
    return this.addMessage(role, content, chainOfThought, mcpLogs)
  }

  public testCheckMounted() {
    return this.checkMounted()
  }
}

describe('BaseCommand', () => {
  let mockContext: CommandContext
  let testCommand: TestCommand

  beforeEach(() => {
    mockContext = {
      addMessage: vi.fn(),
      isMounted: { current: true }
    }
    testCommand = new TestCommand(mockContext)
  })

  describe('constructor', () => {
    it('should initialize with provided context', () => {
      expect(testCommand).toBeInstanceOf(BaseCommand)
      expect(testCommand).toBeInstanceOf(TestCommand)
    })
  })

  describe('execute method', () => {
    it('should be abstract and require implementation', async () => {
      const result = await testCommand.execute({ shouldSucceed: true })
      
      expect(result).toMatchObject({
        success: true,
        message: 'Command executed successfully'
      })
    })

    it('should handle failure cases', async () => {
      const result = await testCommand.execute({ shouldSucceed: false })
      
      expect(result).toMatchObject({
        success: false,
        message: 'Command failed'
      })
    })
  })

  describe('addMessage', () => {
    it('should call context addMessage with correct parameters', () => {
      testCommand.testAddMessage('user', 'Test message')
      
      expect(mockContext.addMessage).toHaveBeenCalledWith(
        'user',
        'Test message',
        undefined,
        undefined
      )
    })

    it('should pass through all optional parameters', () => {
      const chainOfThought = 'Test reasoning'
      const mcpLogs: MCPLogEntry[] = [{ timestamp: '2024-01-01T00:00:00Z', type: 'info', tool: 'test', message: 'log' }]
      
      testCommand.testAddMessage('assistant', 'Test message', chainOfThought, mcpLogs)
      
      expect(mockContext.addMessage).toHaveBeenCalledWith(
        'assistant',
        'Test message',
        chainOfThought,
        mcpLogs
      )
    })
  })

  describe('checkMounted', () => {
    it('should return true when component is mounted', () => {
      mockContext.isMounted.current = true
      
      const result = testCommand.testCheckMounted()
      
      expect(result).toBe(true)
    })

    it('should return false when component is unmounted', () => {
      mockContext.isMounted.current = false
      
      const result = testCommand.testCheckMounted()
      
      expect(result).toBe(false)
    })
  })

  describe('command execution flow', () => {
    it('should add messages during execution', async () => {
      await testCommand.execute({ shouldSucceed: true })
      
      expect(mockContext.addMessage).toHaveBeenCalledWith(
        'assistant',
        'Success message',
        undefined,
        undefined
      )
    })

    it('should handle multiple message calls', async () => {
      // Execute both success and failure to test multiple calls
      await testCommand.execute({ shouldSucceed: true })
      await testCommand.execute({ shouldSucceed: false })
      
      expect(mockContext.addMessage).toHaveBeenCalledTimes(2)
      expect(mockContext.addMessage).toHaveBeenNthCalledWith(1, 'assistant', 'Success message', undefined, undefined)
      expect(mockContext.addMessage).toHaveBeenNthCalledWith(2, 'assistant', 'Error message', undefined, undefined)
    })
  })

  describe('CommandResult interface', () => {
    it('should return properly structured CommandResult', async () => {
      const result = await testCommand.execute({ shouldSucceed: true })
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
    })

    it('should support optional properties in CommandResult', async () => {
      // Create a command that returns optional properties
      class ExtendedTestCommand extends BaseCommand {
        async execute(): Promise<CommandResult> {
          return {
            success: true,
            message: 'Success',
            chainOfThought: 'Test reasoning',
            mcpLogs: [{ timestamp: '2024-01-01', type: 'info', tool: 'test', message: 'log' }],
            data: { customData: 'test' }
          }
        }
      }

      const extendedCommand = new ExtendedTestCommand(mockContext)
      const result = await extendedCommand.execute()
      
      expect(result).toHaveProperty('chainOfThought')
      expect(result).toHaveProperty('mcpLogs')
      expect(result).toHaveProperty('data')
    })
  })

  describe('error handling', () => {
    it('should handle errors gracefully in derived classes', async () => {
      class ErrorCommand extends BaseCommand {
        async execute(): Promise<CommandResult> {
          throw new Error('Test error')
        }
      }

      const errorCommand = new ErrorCommand(mockContext)
      
      await expect(errorCommand.execute()).rejects.toThrow('Test error')
    })
  })
})
