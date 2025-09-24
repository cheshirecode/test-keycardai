import '@testing-library/jest-dom'

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-api-key'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Skip AI SDK mocking for now - we'll add it when implementing actual components

// Mock fetch globally
global.fetch = vi.fn()

// Extend expect with custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received != null
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
})
