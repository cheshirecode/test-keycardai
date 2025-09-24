import { MCPRequest, MCPResponse } from '../types/mcp'

export class MCPClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/mcp') {
    this.baseUrl = baseUrl
  }

  async call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const request: MCPRequest = {
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
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const mcpResponse: MCPResponse = await response.json()

      if (mcpResponse.error) {
        throw new Error(`MCP Error: ${mcpResponse.error.message}`)
      }

      return mcpResponse.result
    } catch (error) {
      console.error('MCP call failed:', error)
      throw error
    }
  }

  async getAvailableTools() {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET'
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to get tools:', error)
      throw error
    }
  }
}
