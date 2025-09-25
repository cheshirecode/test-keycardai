/**
 * Application Configuration Constants
 * Centralizes all hardcoded values for better maintainability and testing
 */

export const CONFIG = {
  /**
   * Development server ports
   */
  PORTS: {
    DEV_SERVERS: [3000, 3001, 8000, 8080] as const,
    DEFAULT_DEV: 3000,
    DEFAULT_API: 8000,
  },

  /**
   * Timeout configurations (in milliseconds)
   */
  TIMEOUTS: {
    SCRIPT_EXECUTION: 60_000, // 60 seconds
    PACKAGE_INSTALL: 120_000, // 2 minutes
    API_REQUEST: 30_000, // 30 seconds
    PROCESS_KILL: 2_000, // 2 seconds before force kill
    UI_FEEDBACK: 3_000, // 3 seconds for UI notifications
  },

  /**
   * File and memory size limits
   */
  LIMITS: {
    MAX_REQUEST_SIZE: 1024 * 1024, // 1MB for API requests
    MAX_FILE_SIZE: 1024 * 1024, // 1MB for file reading
    MAX_OUTPUT_BUFFER: 1024 * 1024, // 1MB for command output
    FILE_SIZE_DISPLAY_UNIT: 1024, // Bytes to KB conversion
  },

  /**
   * Memory configuration
   */
  MEMORY: {
    MB_CONVERSION: 1024 * 1024, // Bytes to MB
  },

  /**
   * HTTP error codes for MCP API
   */
  MCP_ERRORS: {
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    PAYLOAD_TOO_LARGE: -32000,
  },

  /**
   * HTTP status codes
   */
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    PAYLOAD_TOO_LARGE: 413,
    INTERNAL_SERVER_ERROR: 500,
  },

  /**
   * Project structure constraints
   */
  PROJECT: {
    MAX_STRUCTURE_DEPTH: 2,
    MAX_STRUCTURE_ITEMS: 20,
    TEMP_DIR: '/tmp/projects',
    IGNORED_DIRS: ['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', '.cache'] as const,
    IGNORED_FILES: ['.DS_Store', '.env', '.env.local', '.env.*.local'],
  },

  /**
   * Environment variables
   */
  ENV_VARS: {
    REQUIRED: ['OPENAI_API_KEY', 'GITHUB_TOKEN'],
    OPTIONAL: ['NODE_ENV', 'VERCEL_URL', 'PORT'],
  },

  /**
   * AI/LLM Configuration
   */
  AI: {
    DEFAULT_MODEL: 'OpenAI GPT-3.5-turbo',
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_RETRIES: 3,
  },

  /**
   * Local development URLs
   */
  DEV_URLS: {
    LOCAL_BASE: 'http://localhost',
    get LOCAL_DEV() {
      return `${this.LOCAL_BASE}:${CONFIG.PORTS.DEFAULT_DEV}`
    },
    get LOCAL_API() {
      return `${this.LOCAL_BASE}:${CONFIG.PORTS.DEFAULT_API}`
    },
  },
} as const

/**
 * Type-safe environment variable access
 */
export class EnvConfig {
  /**
   * Check if required environment variables are present
   */
  static validateRequired(): { isValid: boolean; missing: string[] } {
    const missing: string[] = []
    
    for (const envVar of CONFIG.ENV_VARS.REQUIRED) {
      if (!process.env[envVar]) {
        missing.push(envVar)
      }
    }

    return {
      isValid: missing.length === 0,
      missing
    }
  }

  /**
   * Get environment variable with fallback
   */
  static get(key: string, fallback?: string): string | undefined {
    return process.env[key] || fallback
  }

  /**
   * Get required environment variable, throws if missing
   */
  static getRequired(key: string): string {
    const value = process.env[key]
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`)
    }
    return value
  }

  /**
   * Check if running in development
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  /**
   * Check if running in production
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  /**
   * Check if running in test environment
   */
  static isTest(): boolean {
    return process.env.NODE_ENV === 'test'
  }
}

/**
 * Helper functions for common operations
 */
export class ConfigHelpers {
  /**
   * Convert bytes to MB
   */
  static bytesToMB(bytes: number): number {
    return Math.round(bytes / CONFIG.MEMORY.MB_CONVERSION)
  }

  /**
   * Convert bytes to KB
   */
  static bytesToKB(bytes: number): number {
    return Math.round(bytes / CONFIG.LIMITS.FILE_SIZE_DISPLAY_UNIT)
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const kb = this.bytesToKB(bytes)
    if (kb < 1024) {
      return `${kb}KB`
    }
    const mb = this.bytesToMB(bytes)
    return `${mb}MB`
  }

  /**
   * Check if port is in development range
   */
  static isDevPort(port: number): boolean {
    return (CONFIG.PORTS.DEV_SERVERS as readonly number[]).includes(port)
  }

  /**
   * Get default local URL for environment
   */
  static getLocalUrl(port?: number): string {
    const targetPort = port || CONFIG.PORTS.DEFAULT_DEV
    return `${CONFIG.DEV_URLS.LOCAL_BASE}:${targetPort}`
  }
}

export default CONFIG
