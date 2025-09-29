import { AIAnalysisService } from './ai-operations/core/AIAnalysisService'
import { ProjectPlanningService } from './ai-operations/core/ProjectPlanningService'
import { ProjectExecutionService } from './ai-operations/core/ProjectExecutionService'
import { AIErrorHandler } from './ai-operations/core/AIErrorHandler'
import type {
  IntelligentProjectSetupParams,
  CreateProjectWithAIParams,
  GenerateModificationPlanParams,
  AnalyzeProjectParams,
  GenerateProjectPlanParams,
  AnalyzeAndOptimizeParams,
  AnalyzeExistingProjectParams,
  ContextualProjectResult,
  AIAnalysisResult,
  AIProjectPlanResult,
  AIProjectResult,
  ProjectAnalysisData
} from '@/types/mcp/ai-operations'

/**
 * AI Operations Module
 * Handles AI-powered project analysis, planning, and creation using OpenAI
 */
export const aiOperations = {
  /**
   * Analyzes a project description using AI to determine project type and features
   */
  analyze_project_request: async (params: AnalyzeProjectParams): Promise<AIAnalysisResult> => {
    return AIAnalysisService.analyzeProjectRequest(params.description, params.aiProvider)
  },

  /**
   * Generates a comprehensive project plan using AI analysis
   */
  generate_project_plan: async (params: GenerateProjectPlanParams): Promise<AIProjectPlanResult> => {
    return ProjectPlanningService.generateProjectPlan(
      params.description,
      params.projectPath,
      params.projectName,
      params.aiProvider
    )
  },

  /**
   * Sets up a project intelligently using AI analysis and optionally executes the plan
   */
  intelligent_project_setup: async (params: IntelligentProjectSetupParams, mcpTools: Record<string, (...args: unknown[]) => Promise<unknown>>): Promise<{
    success: boolean
    message: string
    analysis?: {
      projectType: string
      confidence: number
      reasoning: string
      features: string[]
      recommendedName: string
    }
    plannedActions?: string[]
    executionResults?: Array<{
      action: string
      tool: string
      success: boolean
      result?: unknown
      error?: string
    }> | null
    aiPowered: boolean
    llmUsed: string
  }> => {
    return ProjectExecutionService.executeIntelligentProjectSetup(params, mcpTools)
  },

  /**
   * Creates a complete project using AI analysis and execution
   */
  create_project_with_ai: async (params: CreateProjectWithAIParams, mcpTools: Record<string, (...args: unknown[]) => Promise<unknown>>): Promise<AIProjectResult> => {
    return ProjectExecutionService.createProjectWithAI(params, mcpTools)
  },

  /**
   * Analyzes and provides optimization recommendations for a project
   */
  analyze_and_optimize: async (params: AnalyzeAndOptimizeParams): Promise<{
    success: boolean
    message: string
    analysis?: {
      projectAnalysis: unknown
      optimization: {
        recommendations: string[]
        reasoning: string
        aiPowered?: boolean
      } | null
      aiPowered: boolean
      processingTime: number
      modelUsed: string
    } | null
  }> => {
    // Validate environment
    const envValidation = AIErrorHandler.validateEnvironment({ openaiKey: true })
    if (!envValidation.valid) {
      return {
        success: false,
        message: 'OpenAI API key not configured for AI analysis.',
        analysis: null
      }
    }

    try {
      // Use AI Analysis Service for project analysis
      const analysisResult = await AIAnalysisService.analyzeProjectRequest(params.description)
      if (!analysisResult.success) {
        return {
          success: false,
          message: analysisResult.message,
          analysis: null
        }
      }

      let optimization: {
        recommendations: string[]
        reasoning: string
        aiPowered?: boolean
      } | null = null

      if (params.includeOptimization && analysisResult.analysis) {
        // Get project optimization recommendations
        optimization = await AIAnalysisService.getOptimizationRecommendations(
          '/tmp/sample',
          analysisResult.analysis.projectType
        )
      }

      return {
        success: true,
        message: `AI analysis complete with ${analysisResult.analysis?.confidence ? (analysisResult.analysis.confidence * 100).toFixed(1) : '0'}% confidence`,
        analysis: {
          projectAnalysis: analysisResult.analysis,
          optimization: params.includeOptimization ? optimization : null,
          aiPowered: true,
          processingTime: Date.now(),
          modelUsed: 'gpt-3.5-turbo'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        analysis: null
      }
    }
  },

  /**
   * Analyze an existing project for modification requests
   */
  analyze_existing_project: async (params: AnalyzeExistingProjectParams): Promise<ContextualProjectResult> => {
    return AIAnalysisService.analyzeExistingProject(params.projectPath, params.requestDescription)
  },

  /**
   * Generate a modification plan for an existing project
   */
  generate_modification_plan: async (params: GenerateModificationPlanParams): Promise<ContextualProjectResult> => {
    // First analyze the existing project if analysis data not provided
    let analysisData = params.analysisData
    if (!analysisData) {
      const analysisResult = await aiOperations.analyze_existing_project({
        projectPath: params.projectPath,
        requestDescription: params.requestDescription
      })

      if (!analysisResult.success) {
        return analysisResult
      }

      // Convert analysis result to ProjectAnalysisData format
      analysisData = {
        projectType: analysisResult.analysis?.projectType || 'unknown',
        framework: analysisResult.analysis?.framework || 'unknown',
        structure: analysisResult.analysis?.structure || [],
        dependencies: analysisResult.analysis?.dependencies || {},
        devDependencies: {},
        scripts: {},
        recommendations: analysisResult.analysis?.recommendations || [],
        confidence: 0.8,
        reasoning: 'Analysis from existing project'
      }
    }

    // Generate step-by-step modification plan
    const modificationPlan = await ProjectPlanningService.generateModificationPlan(
      params.requestDescription,
      analysisData as ProjectAnalysisData,
      params.projectPath,
      params.fastMode || false
    )

      return {
        success: true,
        message: `Generated modification plan with ${modificationPlan.length} steps`,
        analysis: {
          projectType: (analysisData as Record<string, unknown>)?.projectType as string || 'unknown',
          framework: (analysisData as Record<string, unknown>)?.framework as string || 'unknown',
          structure: (analysisData as Record<string, unknown>)?.structure as string[] || [],
          dependencies: (analysisData as Record<string, unknown>)?.dependencies as Record<string, string> || {},
          recommendations: (analysisData as Record<string, unknown>)?.recommendations as string[] || [],
          modificationPlan
        }
      }
  }
}
