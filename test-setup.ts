import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
  // Clear all timers
  vi.clearAllTimers()
})

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks()
})

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-api-key'
// NODE_ENV is read-only in some environments, so we use Object.defineProperty
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
  configurable: true
})

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

// Mock fetch globally with better error handling
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response)
)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock performance API
global.performance = {
  ...performance,
  now: vi.fn(() => Date.now()),
}

// Mock Math.random for consistent test results
vi.spyOn(Math, 'random').mockReturnValue(0.5)
