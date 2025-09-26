/**
 * GitHub API Client
 * Base API client abstraction over Octokit with error handling and retry logic
 */

import { Octokit } from '@octokit/rest'
import type {
  IGitHubAPIClient,
  APIResponse,
  RequestOptions,
  GitHubServiceConfig
} from '@/types/github'

export class GitHubAPIClient implements IGitHubAPIClient {
  private octokit: Octokit
  private isAvailable: boolean
  private config: GitHubServiceConfig

  constructor(config: GitHubServiceConfig = {}) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    }

    const token = config.token || process.env.GITHUB_TOKEN
    this.isAvailable = !!token

    if (token) {
      this.octokit = new Octokit({
        auth: token,
        baseUrl: config.baseURL || 'https://api.github.com',
        request: {
          timeout: this.config.timeout
        }
      })
    } else {
      // Create a dummy octokit instance to prevent errors
      this.octokit = new Octokit({
        baseUrl: config.baseURL || 'https://api.github.com'
      })
    }
  }

  /**
   * Check if GitHub API client is available (has valid token)
   */
  isClientAvailable(): boolean {
    return this.isAvailable
  }

  /**
   * Generic request method with error handling and retry logic
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    if (!this.isAvailable) {
      return {
        success: false,
        message: 'GitHub token not available',
        error: 'GITHUB_TOKEN_MISSING'
      }
    }

    const { method = 'GET', body, headers } = options
    const params = (options as { params?: Record<string, unknown> }).params
    let lastError: unknown

    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        this.logRequest(endpoint, options, attempt)

        const requestOptions: Record<string, unknown> = {}
        
        if (params) {
          Object.assign(requestOptions, params)
        }
        
        if (body) {
          requestOptions.data = body
        }
        
        requestOptions.headers = {
          'User-Agent': 'Project-Scaffolder',
          ...(headers || {})
        }

        const response = await this.octokit.request(`${method} ${endpoint}`, requestOptions)

        return {
          success: true,
          data: response.data as T,
          message: 'Request successful'
        }
      } catch (error) {
        lastError = error

        if (this.isRateLimitError(error)) {
          await this.handleRateLimit(error)
          continue // Retry after rate limit
        }

        if (!this.isRetryableError(error) || attempt === (this.config.retryAttempts || 3)) {
          break // Don't retry non-retryable errors or on final attempt
        }

        // Wait before retry
        await this.delay(this.config.retryDelay! * attempt)
      }
    }

    return this.formatErrorResponse<T>(lastError)
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...(params && { params }) } as RequestOptions & { params?: Record<string, unknown> })
  }

  /**
   * POST request helper
   */
  async post<T>(endpoint: string, data?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data })
  }

  /**
   * PUT request helper
   */
  async put<T>(endpoint: string, data?: unknown): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: data })
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * Handle GitHub API rate limiting
   */
  private async handleRateLimit(error: unknown): Promise<void> {
    const rateLimitError = error as { response?: { headers?: { 'x-ratelimit-reset'?: string } } }
    const resetTime = rateLimitError.response?.headers?.['x-ratelimit-reset']

    if (resetTime) {
      const resetTimestamp = parseInt(resetTime) * 1000
      const waitTime = Math.max(resetTimestamp - Date.now(), 1000)

      console.log(`[GitHub API] Rate limit hit, waiting ${Math.ceil(waitTime / 1000)}s`)
      await this.delay(waitTime)
    } else {
      // Default wait time if reset time not available
      await this.delay(60000) // 1 minute
    }
  }

  /**
   * Check if error is due to rate limiting
   */
  private isRateLimitError(error: unknown): boolean {
    const apiError = error as { status?: number }
    return apiError.status === 403 || apiError.status === 429
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const apiError = error as { status?: number }
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(apiError.status || 0)
  }

  /**
   * Format error response
   */
  private formatErrorResponse<T>(error: unknown): APIResponse<T> {
    const apiError = error as {
      status?: number
      message?: string
      response?: { data?: { message?: string } }
    }

    const status = apiError.status || 500
    const message = apiError.response?.data?.message || apiError.message || 'Unknown GitHub API error'

    return {
      success: false,
      message: `GitHub API error (${status}): ${message}`,
      error: `GITHUB_API_ERROR_${status}`
    }
  }

  /**
   * Log API requests for debugging
   */
  private logRequest(endpoint: string, options: RequestOptions, attempt: number): void {
    const { method = 'GET' } = options
    const retryText = attempt > 1 ? ` (attempt ${attempt})` : ''
    console.log(`[GitHub API] ${method} ${endpoint}${retryText}`)
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
