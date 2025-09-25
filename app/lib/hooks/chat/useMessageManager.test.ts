import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageManager } from './useMessageManager'
import type { MCPLogEntry } from '@/types'

describe('useMessageManager', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any

  beforeEach(() => {
    result = renderHook(() => useMessageManager())
  })

  describe('initial state', () => {
    it('should start with empty messages array', () => {
      expect(result.result.current.messages).toEqual([])
    })
  })

  describe('addMessage', () => {
    it('should add a user message correctly', () => {
      act(() => {
        result.result.current.addMessage('user', 'Hello, world!')
      })

      const messages = result.result.current.messages
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello, world!',
        timestamp: expect.any(Date)
      })
      expect(messages[0].id).toBeDefined()
    })

    it('should add an assistant message correctly', () => {
      act(() => {
        result.result.current.addMessage('assistant', 'Hi there!')
      })

      const messages = result.result.current.messages
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        role: 'assistant',
        content: 'Hi there!',
        timestamp: expect.any(Date)
      })
    })

    it('should add message with chain of thought', () => {
      const chainOfThought = '🤖 AI Analysis: This is a greeting'

      act(() => {
        result.result.current.addMessage('assistant', 'Hello!', chainOfThought)
      })

      const messages = result.result.current.messages
      expect(messages[0].chainOfThought).toBe(chainOfThought)
    })

    it('should add message with MCP logs', () => {
      const mcpLogs: MCPLogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          type: 'response',
          tool: 'test_tool',
          message: 'Test log entry',
          data: { test: true }
        }
      ]

      act(() => {
        result.result.current.addMessage('assistant', 'Response', undefined, mcpLogs)
      })

      const messages = result.result.current.messages
      expect(messages[0].mcpLogs).toEqual(mcpLogs)
    })

    it('should add multiple messages in order', () => {
      act(() => {
        result.result.current.addMessage('user', 'First message')
        result.result.current.addMessage('assistant', 'Second message')
        result.result.current.addMessage('user', 'Third message')
      })

      const messages = result.result.current.messages
      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('First message')
      expect(messages[1].content).toBe('Second message')
      expect(messages[2].content).toBe('Third message')
    })

    it('should generate unique IDs for each message', () => {
      act(() => {
        result.result.current.addMessage('user', 'Message 1')
        result.result.current.addMessage('user', 'Message 2')
      })

      const messages = result.result.current.messages
      expect(messages).toHaveLength(2)
      expect(messages[0].id).not.toBe(messages[1].id)
      expect(typeof messages[0].id).toBe('string')
      expect(typeof messages[1].id).toBe('string')
      expect(messages[0].id.length).toBeGreaterThan(0)
      expect(messages[1].id.length).toBeGreaterThan(0)
    })

    it('should return the added message', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let addedMessage: any

      act(() => {
        addedMessage = result.result.current.addMessage('user', 'Test message')
      })

      expect(addedMessage).toMatchObject({
        role: 'user',
        content: 'Test message',
        timestamp: expect.any(Date)
      })
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      // Add some messages first
      act(() => {
        result.result.current.addMessage('user', 'Message 1')
        result.result.current.addMessage('assistant', 'Message 2')
      })

      expect(result.result.current.messages).toHaveLength(2)

      // Clear messages
      act(() => {
        result.result.current.clearMessages()
      })

      expect(result.result.current.messages).toEqual([])
    })

    it('should work when messages array is already empty', () => {
      expect(result.result.current.messages).toHaveLength(0)

      act(() => {
        result.result.current.clearMessages()
      })

      expect(result.result.current.messages).toEqual([])
    })
  })

  describe('message structure', () => {
    it('should create messages with correct structure', () => {
      const chainOfThought = 'Test reasoning'
      const mcpLogs: MCPLogEntry[] = [{
        timestamp: '2024-01-01T00:00:00Z',
        type: 'info',
        tool: 'test',
        message: 'Test log'
      }]

      act(() => {
        result.result.current.addMessage('assistant', 'Complete message', chainOfThought, mcpLogs)
      })

      const message = result.result.current.messages[0]

      expect(message).toHaveProperty('id')
      expect(message).toHaveProperty('role', 'assistant')
      expect(message).toHaveProperty('content', 'Complete message')
      expect(message).toHaveProperty('timestamp')
      expect(message).toHaveProperty('chainOfThought', chainOfThought)
      expect(message).toHaveProperty('mcpLogs', mcpLogs)

      expect(typeof message.id).toBe('string')
      expect(message.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('performance and memory', () => {
    it('should handle large number of messages efficiently', () => {
      const startTime = performance.now()

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.result.current.addMessage('user', `Message ${i}`)
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.result.current.messages).toHaveLength(1000)
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })
  })
})
