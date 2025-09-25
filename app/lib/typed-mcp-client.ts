/**
 * Type-Safe MCP Client
 * Provides complete type safety for MCP tool calls with compile-time validation
 */

import { CONFIG } from './config'
import { Result, ExternalServiceError } from './result'
import type { 
  MCPToolName, 
  MCPToolParams, 
  MCPToolResult,
  TypedMCPRequest,
  TypedMCPResponse
} from '@/types/mcp-tools'
import { isValidMCPTool } from '@/types/mcp-tools'

/**
 * Enhanced error class for MCP operations
 */
export class MCPError extends ExternalServiceError {
  public mcpCode: number
  
  constructor(
    message: string,
    mcpCode: number,
    public data?: unknown
  ) {
    super('MCP', message, { code: mcpCode, data })
    this.name = 'MCPError'
    this.mcpCode = mcpCode
  }
}

/**
 * Type-safe MCP Client with complete compile-time safety
 */
export class TypedMCPClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/mcp') {
    this.baseUrl = baseUrl
  }

  /**
   * Type-safe MCP tool call with full compile-time validation
   */
  async call<K extends MCPToolName>(
    method: K,
    params: MCPToolParams<K>
  ): Promise<MCPToolResult<K>> {
    const request: TypedMCPRequest<K> = {
      method,
      params,
      id: Date.now()
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(CONFIG.TIMEOUTS.API_REQUEST)
      })

      if (!response.ok) {
        throw new MCPError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      const mcpResponse: TypedMCPResponse<K> = await response.json()

      if (mcpResponse.error) {
        throw new MCPError(
          mcpResponse.error.message,
          mcpResponse.error.code,
          mcpResponse.error.data
        )
      }

      if (mcpResponse.result === undefined) {
        throw new MCPError('No result returned from MCP call', CONFIG.MCP_ERRORS.INTERNAL_ERROR)
      }

      return mcpResponse.result
    } catch (error) {
      if (error instanceof MCPError) {
        throw error
      }
      
      console.error('MCP call failed:', error)
      throw new MCPError(
        error instanceof Error ? error.message : 'Unknown error',
        CONFIG.MCP_ERRORS.INTERNAL_ERROR
      )
    }
  }

  /**
   * Safe MCP call that returns Result type instead of throwing
   */
  async safeCall<K extends MCPToolName>(
    method: K,
    params: MCPToolParams<K>
  ): Promise<Result<MCPToolResult<K>, MCPError>> {
    try {
      const result = await this.call(method, params)
      return { success: true, data: result }
    } catch (error) {
      const mcpError = error instanceof MCPError 
        ? error 
        : new MCPError(
            error instanceof Error ? error.message : 'Unknown error',
            CONFIG.MCP_ERRORS.INTERNAL_ERROR
          )
      return { success: false, error: mcpError }
    }
  }

  /**
   * Get available tools with type safety
   */
  async getAvailableTools(): Promise<{ tools: Array<{ name: MCPToolName; description: string }> }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(CONFIG.TIMEOUTS.API_REQUEST)
      })

      if (!response.ok) {
        throw new MCPError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get tools:', error)
      throw new MCPError(
        error instanceof Error ? error.message : 'Failed to get tools',
        CONFIG.MCP_ERRORS.INTERNAL_ERROR
      )
    }
  }

  /**
   * Validate that a method exists and is typed correctly
   */
  isValidMethod(method: string): method is Extract<MCPToolName, string> {
    return isValidMCPTool(method)
  }

  /**
   * Batch multiple MCP calls with type safety
   */
  async batchCall(
    calls: Record<string, { method: MCPToolName; params: unknown }>
  ): Promise<Record<string, Result<unknown, MCPError>>> {
    const results: Record<string, Result<unknown, MCPError>> = {}

    // Execute all calls in parallel
    const promises = Object.entries(calls).map(async ([key, { method, params }]) => {
      const result = await this.safeCall(method, params as never)
      return { key, result }
    })

    const settled = await Promise.allSettled(promises)

    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        results[outcome.value.key] = outcome.value.result
      } else {
        const reason = outcome.reason || 'Batch call failed'
        results[outcome.reason?.key || 'unknown'] = {
          success: false,
          error: new MCPError(
            typeof reason === 'string' ? reason : reason.message || 'Batch call failed', 
            CONFIG.MCP_ERRORS.INTERNAL_ERROR
          )
        }
      }
    }

    return results
  }
}

/**
 * Singleton instance for global use
 */
export const typedMCPClient = new TypedMCPClient()

/**
 * Hook-style wrapper for React components
 */
export function useMCPClient() {
  return {
    client: typedMCPClient,
    call: typedMCPClient.call.bind(typedMCPClient),
    safeCall: typedMCPClient.safeCall.bind(typedMCPClient),
    batchCall: typedMCPClient.batchCall.bind(typedMCPClient),
    isValidMethod: typedMCPClient.isValidMethod.bind(typedMCPClient)
  }
}

/**
 * Utility type guards for runtime validation
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MCPTypeGuards {
  export function isSuccessResult<T>(result: Result<T>): result is { success: true; data: T } {
    return result.success === true
  }

  export function isErrorResult<T>(result: Result<T>): result is { success: false; error: MCPError } {
    return result.success === false
  }

  export function isFileOperationResult(result: unknown): result is import('@/api/mcp/tools/file-management').FileOperationResult {
    return typeof result === 'object' && result !== null && 'success' in result && 'message' in result
  }

  export function isPackageResult(result: unknown): result is import('@/api/mcp/tools/package-management').PackageResult {
    return typeof result === 'object' && result !== null && 'success' in result && 'message' in result
  }
}

export default TypedMCPClient
