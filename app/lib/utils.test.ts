import { describe, it, expect } from 'vitest'

// Simple utility functions to test Vitest setup
const add = (a: number, b: number) => a + b
const multiply = (a: number, b: number) => a * b
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

describe('Utility Functions', () => {
  describe('Math operations', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
      expect(add(-1, 1)).toBe(0)
      expect(add(0, 0)).toBe(0)
    })

    it('should multiply two numbers correctly', () => {
      expect(multiply(3, 4)).toBe(12)
      expect(multiply(-2, 5)).toBe(-10)
      expect(multiply(0, 10)).toBe(0)
    })
  })

  describe('String operations', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
      expect(capitalize('')).toBe('')
    })
  })

  describe('Vitest features demonstration', () => {
    it('should handle async operations', async () => {
      const asyncOperation = async () => {
        return new Promise(resolve => setTimeout(() => resolve('done'), 10))
      }

      await expect(asyncOperation()).resolves.toBe('done')
    })

    it('should handle object matching', () => {
      const user = { name: 'John', age: 30, email: 'john@example.com' }

      expect(user).toMatchObject({ name: 'John', age: 30 })
      expect(user).toHaveProperty('email')
    })

    it('should handle array operations', () => {
      const numbers = [1, 2, 3, 4, 5]

      expect(numbers).toHaveLength(5)
      expect(numbers).toContain(3)
      expect(numbers).toEqual(expect.arrayContaining([1, 2, 3]))
    })

    it('should handle error testing', () => {
      const throwError = () => {
        throw new Error('Something went wrong')
      }

      expect(throwError).toThrow('Something went wrong')
      expect(throwError).toThrow(Error)
    })

    it('should handle spies and mocks', () => {
      const mockFn = vi.fn()
      mockFn('arg1', 'arg2')

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
