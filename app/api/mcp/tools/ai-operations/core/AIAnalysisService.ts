/**
 * AI Analysis Service
 * Pure AI analysis logic with focused, single-responsibility functions
 */

import { AIService } from '@/lib/ai-service'
import { AIErrorHandler } from './AIErrorHandler'
import { AIPromptBuilder, ValidationUtils } from '../utils'
import type { 
  AIAnalysisData, 
  AIAnalysisResult, 
  AIOptimizationResult,
  PackageJsonData
} from '@/types/mcp/ai-operations'

export class AIAnalysisService {
  /**
   * Analyze project request using AI
   */
  static async analyzeProjectRequest(description: string, aiProvider?: 'openai' | 'gemini'): Promise<AIAnalysisResult> {
    // Validate environment - require any AI provider
    const envValidation = ValidationUtils.validateEnvironment({ aiKey: true })
    if (!envValidation.valid) {
      return AIErrorHandler.handleMissingAPIKey('AI analysis')
    }

    // Validate description
    const descValidation = ValidationUtils.validateDescription(description)
    if (!descValidation.valid) {
      return AIErrorHandler.createErrorResponse(descValidation.error)
    }

    try {
      const analysis = await AIService.analyzeProjectRequest(description, aiProvider)
      return {
        success: true,
        message: `Analyzed project requirements with ${(analysis.confidence * 100).toFixed(0)}% confidence`,
        analysis: {
          projectType: analysis.projectType,
          features: analysis.features,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          recommendedName: analysis.projectName,
          aiPowered: true
        }
      }
    } catch (error) {
      return AIErrorHandler.handleAnalysisError(error, 'AI project analysis')
    }
  }

  /**
   * Analyze existing project for modifications
   */
  static async analyzeExistingProject(
    projectPath: string,
    requestDescription: string,
    aiProvider?: 'openai' | 'gemini'
  ): Promise<{
    success: boolean
    message: string
    analysis?: {
      projectType: string
      framework: string
      structure: string[]
      dependencies: Record<string, string>
      recommendations: string[]
    }
  }> {
    // Validate environment - require any AI provider
    const envValidation = ValidationUtils.validateEnvironment({ aiKey: true })
    if (!envValidation.valid) {
      return AIErrorHandler.handleMissingAPIKey('Project analysis')
    }

    // Validate project path
    const pathValidation = ValidationUtils.validateProjectPath(projectPath)
    if (!pathValidation.valid) {
      return AIErrorHandler.handleProjectPathError(projectPath)
    }

    try {
      const packageValidation = ValidationUtils.validateAndReadPackageJson(projectPath)
      const projectInfo = packageValidation.valid ? packageValidation.packageInfo : {
        name: 'unknown',
        dependencies: {},
        devDependencies: {}
      }

      const { projectType, framework } = this.parseProjectInfo(projectInfo)
      const structure = this.getProjectStructure(projectPath)
      const contextualAnalysis = await this.performContextualAnalysis(
        projectType,
        framework,
        projectInfo,
        structure,
        requestDescription,
        aiProvider
      )

      return {
        success: true,
        message: `Analyzed existing ${projectType} project for modification request`,
        analysis: {
          projectType,
          framework,
          structure: structure.slice(0, 20), // Limit for response size
          dependencies: (projectInfo.dependencies as Record<string, string>) || {},
          recommendations: this.generateRecommendations(contextualAnalysis, projectType, framework)
        }
      }
    } catch (error) {
      return AIErrorHandler.handleAnalysisError(error, 'Existing project analysis')
    }
  }

  /**
   * Get optimization recommendations for a project
   */
  static async getOptimizationRecommendations(
    projectPath: string,
    projectType: string,
    aiProvider?: 'openai' | 'gemini'
  ): Promise<AIOptimizationResult> {
    const envValidation = ValidationUtils.validateEnvironment({ openaiKey: true })
    if (!envValidation.valid) {
      return {
        recommendations: ['Environment not configured for AI optimization'],
        reasoning: 'OpenAI API key required for AI-powered optimization',
        aiPowered: false
      }
    }

    try {
      return await AIService.optimizeProjectStructure(projectPath, projectType, aiProvider)
    } catch (error) {
      AIErrorHandler.logError(error, 'Optimization recommendations')
      return {
        recommendations: ['Error generating optimization recommendations'],
        reasoning: 'Failed to analyze project for optimization',
        aiPowered: false
      }
    }
  }

  /**
   * Parse project information from package.json
   */
  private static parseProjectInfo(projectInfo: PackageJsonData): {
    projectType: string
    framework: string
  } {
    const deps = {
      ...(projectInfo.dependencies || {}),
      ...(projectInfo.devDependencies || {})
    }

    if (deps.next) {
      return { projectType: 'Next.js Application', framework: 'React' }
    } else if (deps.react) {
      return { projectType: 'React Application', framework: 'React' }
    } else if (deps.vue) {
      return { projectType: 'Vue Application', framework: 'Vue' }
    } else if (deps.express) {
      return { projectType: 'Express API', framework: 'Node.js' }
    }

    return { projectType: 'unknown', framework: 'vanilla' }
  }

  /**
   * Get basic project structure
   */
  private static getProjectStructure(projectPath: string, maxDepth = 3): string[] {
    const structure: string[] = []
    const fs = require('fs') // eslint-disable-line @typescript-eslint/no-require-imports
    const path = require('path') // eslint-disable-line @typescript-eslint/no-require-imports

    function traverse(dirPath: string, currentDepth = 0, relativePath = '') {
      if (currentDepth >= maxDepth) return

      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const item of items) {
          if (item.name.startsWith('.') || ['node_modules', 'dist', 'build'].includes(item.name)) {
            continue
          }

          const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name

          if (item.isDirectory()) {
            structure.push(`${itemPath}/`)
            traverse(path.join(dirPath, item.name), currentDepth + 1, itemPath)
          } else {
            structure.push(itemPath)
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    traverse(projectPath)
    return structure
  }

  /**
   * Perform contextual analysis using AI
   */
  private static async performContextualAnalysis(
    projectType: string,
    framework: string,
    projectInfo: PackageJsonData,
    structure: string[],
    requestDescription: string,
    aiProvider?: 'openai' | 'gemini'
  ): Promise<AIAnalysisData> {
    const deps = {
      ...(projectInfo.dependencies || {}),
      ...(projectInfo.devDependencies || {})
    }

    const prompt = AIPromptBuilder.buildContextualAnalysisPrompt(
      requestDescription,
      projectType,
      framework,
      Object.keys(deps),
      structure
    )

    return await AIService.analyzeProjectRequest(prompt, aiProvider)
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    analysis: AIAnalysisData,
    projectType: string,
    framework: string
  ): string[] {
    return [
      `Project is using ${framework} framework`,
      `Suggested approach: ${analysis.reasoning}`,
      `Confidence level: ${(analysis.confidence * 100).toFixed(0)}%`,
      `Project type: ${projectType}`
    ]
  }
}