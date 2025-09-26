/**
 * Response Parser
 * Utilities for parsing AI responses
 */

import type { WorkflowAction } from '@/types/mcp/ai-operations'

export class ResponseParser {
  /**
   * Parse AI response for modification plan
   */
  static parseModificationPlan(aiResponse: string): WorkflowAction[] {
    try {
      // Clean the response to extract JSON
      const cleanedResponse = aiResponse.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      const aiPlan = JSON.parse(cleanedResponse)

      // Validate the plan structure
      if (Array.isArray(aiPlan) && aiPlan.every(step =>
        typeof step.step === 'number' &&
        typeof step.action === 'string' &&
        typeof step.tool === 'string' &&
        typeof step.params === 'object' &&
        typeof step.description === 'string'
      )) {
        return aiPlan
      } else {
        throw new Error('Invalid AI plan structure')
      }
    } catch (error) {
      console.log(`[Response Parser] Failed to parse AI response: ${error}`)
      throw error
    }
  }

  /**
   * Extract component name from request description
   */
  static extractComponentName(description: string): string {
    const match = description.match(/component\s+(?:called\s+)?([a-zA-Z]+)/i)
    return match ? match[1] : 'NewComponent'
  }

  /**
   * Extract package name from request description
   */
  static extractPackageName(description: string): string | null {
    // Look for common package patterns - enhanced for state management libraries
    const patterns = [
      // Direct package mentions
      /\b(jotai|zustand|redux|mobx|recoil|valtio)\b/i,
      // Standard installation patterns
      /install\s+([a-zA-Z0-9-@\/]+)/i,
      /add\s+([a-zA-Z0-9-@\/]+)(?:\s+package)?/i,
      /\b([a-zA-Z0-9-@\/]+)\s+package/i,
      // Simple "add X" patterns
      /^add\s+([a-zA-Z0-9-@\/]+)$/i
    ]

    for (const pattern of patterns) {
      const match = description.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Extract service name from request description
   */
  static extractServiceName(description: string): string {
    const patterns = [
      /(?:api|service|endpoint)\s+(?:for\s+)?([a-zA-Z]+)/i,
      /create\s+([a-zA-Z]+)\s+(?:api|service)/i,
      /([a-zA-Z]+)\s+service/i
    ]

    for (const pattern of patterns) {
      const match = description.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return 'ApiService'
  }

  /**
   * Extract multiple packages from request description
   */
  static extractMultiplePackages(description: string): string[] {
    const packages: string[] = []

    // Common state management and UI libraries
    const commonPackages = {
      'state management': ['jotai', 'zustand'],
      'jotai': ['jotai'],
      'zustand': ['zustand'],
      'redux': ['@reduxjs/toolkit', 'react-redux'],
      'router': ['react-router-dom'],
      'forms': ['react-hook-form'],
      'ui': ['@headlessui/react', '@heroicons/react'],
      'styling': ['tailwindcss', '@tailwindcss/forms'],
      'date': ['date-fns'],
      'icons': ['react-icons'],
      'animation': ['framer-motion']
    }

    const lowerDescription = description.toLowerCase()

    // Check for known package categories
    for (const [keyword, packageList] of Object.entries(commonPackages)) {
      if (lowerDescription.includes(keyword)) {
        packages.push(...packageList)
      }
    }

    // If no category matches, try to extract individual package names
    if (packages.length === 0) {
      const singlePackage = this.extractPackageName(description)
      if (singlePackage) {
        packages.push(singlePackage)
      }
    }

    return [...new Set(packages)] // Remove duplicates
  }

  /**
   * Sanitize project name
   */
  static sanitizeProjectName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  }

  /**
   * Parse project type from dependencies
   */
  static parseProjectType(dependencies: Record<string, string>): {
    projectType: string
    framework: string
  } {
    if (dependencies.next) {
      return { projectType: 'Next.js Application', framework: 'React' }
    } else if (dependencies.react) {
      return { projectType: 'React Application', framework: 'React' }
    } else if (dependencies.vue) {
      return { projectType: 'Vue Application', framework: 'Vue' }
    } else if (dependencies.express) {
      return { projectType: 'Express API', framework: 'Node.js' }
    }

    return { projectType: 'unknown', framework: 'vanilla' }
  }

  /**
   * Validate workflow action structure
   */
  static validateWorkflowAction(action: unknown): action is WorkflowAction {
    return (
      typeof action === 'object' &&
      action !== null &&
      typeof (action as WorkflowAction).step === 'number' &&
      typeof (action as WorkflowAction).action === 'string' &&
      typeof (action as WorkflowAction).tool === 'string' &&
      typeof (action as WorkflowAction).params === 'object' &&
      typeof (action as WorkflowAction).description === 'string'
    )
  }
}