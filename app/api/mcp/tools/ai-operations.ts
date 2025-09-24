import * as fs from 'fs'
import * as path from 'path'
import { AIService } from '../../../../lib/ai-service'
import { RepositoryTools } from '../../../../lib/repository-tools'

export interface AnalyzeProjectParams {
  description: string
}

export interface GenerateProjectPlanParams {
  description: string
  projectPath: string
  projectName?: string
}

export interface IntelligentProjectSetupParams {
  description: string
  projectPath: string
  autoExecute?: boolean
}

export interface CreateProjectWithAIParams {
  description: string
  projectPath?: string
  projectName?: string
}

export interface AnalyzeAndOptimizeParams {
  description: string
  projectType?: string
  includeOptimization?: boolean
}

export interface AIAnalysisResult {
  success: boolean
  message: string
  analysis?: {
    projectType: string
    features: string[]
    confidence: number
    reasoning: string
    recommendedName?: string
    aiPowered: boolean
  } | null
}

export interface AIProjectPlanResult {
  success: boolean
  message: string
  plan?: {
    analysis: {
      projectType: string
      confidence: number
      reasoning: string
      features: string[]
    }
    actions: unknown[]
    expectedOutcome: string
    totalSteps: number
    aiPowered: boolean
  } | null
}

export interface AIProjectResult {
  success: boolean
  message: string
  project?: {
    name: string
    path: string
    type: string
    description: string
    confidence: number
    reasoning: string
    features: string[]
    repositoryUrl?: string | null
    totalSteps: number
    executionSteps: unknown[]
    createdAt: string
    aiPowered: boolean
    llmUsed: string
  } | null
  chainOfThought?: string
}

/**
 * AI Operations Module
 * Handles AI-powered project analysis, planning, and creation using OpenAI
 */
export const aiOperations = {
  /**
   * Analyzes a project description using AI to determine project type and features
   */
  analyze_project_request: async (params: AnalyzeProjectParams): Promise<AIAnalysisResult> => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
          analysis: null
        }
      }

      const analysis = await AIService.analyzeProjectRequest(params.description)

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
      return {
        success: false,
        message: `AI analysis failed: ${error}`,
        analysis: null
      }
    }
  },

  /**
   * Generates a comprehensive project plan using AI analysis
   */
  generate_project_plan: async (params: GenerateProjectPlanParams): Promise<AIProjectPlanResult> => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
          plan: null
        }
      }

      // First analyze the project
      const analysis = await AIService.analyzeProjectRequest(params.description)

      // Then generate action plan
      const { actions, response } = await AIService.generateMCPActions(
        params.description,
        analysis,
        params.projectPath
      )

      return {
        success: true,
        message: 'Generated intelligent project plan using AI analysis',
        plan: {
          analysis: {
            projectType: analysis.projectType,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            features: analysis.features
          },
          actions,
          expectedOutcome: response,
          totalSteps: actions.length,
          aiPowered: true
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `AI planning failed: ${error}`,
        plan: null
      }
    }
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
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured. AI-powered setup requires OPENAI_API_KEY.',
          aiPowered: false,
          llmUsed: ''
        }
      }

      // Step 1: AI Analysis
      const analysis = await AIService.analyzeProjectRequest(params.description)

      // Step 2: Generate action plan
      const { actions } = await AIService.generateMCPActions(
        params.description,
        analysis,
        params.projectPath
      )

      const executionResults: Array<{
        action: string
        tool: string
        success: boolean
        result?: unknown
        error?: string
      }> = []

      if (params.autoExecute) {
        // Step 3: Execute actions with AI decision-making
        for (const action of actions) {
          try {
            const tool = mcpTools[action.tool as keyof typeof mcpTools]
            if (tool) {
              const result = await (tool as (...args: unknown[]) => Promise<unknown>)(action.params)
              executionResults.push({
                action: action.description,
                tool: action.tool,
                success: true,
                result
              })
            } else {
              executionResults.push({
                action: action.description,
                tool: action.tool,
                success: false,
                error: `Tool ${action.tool} not found`
              })
            }
          } catch (error) {
            executionResults.push({
              action: action.description,
              tool: action.tool,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      return {
        success: true,
        message: `AI analysis complete. ${params.autoExecute ? 'Project setup executed.' : 'Plan generated.'}`,
        analysis: {
          projectType: analysis.projectType,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          features: analysis.features,
          recommendedName: analysis.projectName || 'my-project'
        },
        plannedActions: actions.map(a => a.description),
        executionResults: params.autoExecute ? executionResults : null,
        aiPowered: true,
        llmUsed: 'OpenAI GPT-3.5-turbo'
      }
    } catch (error) {
      return {
        success: false,
        message: `Intelligent setup failed: ${error}`,
        aiPowered: false,
        llmUsed: ''
      }
    }
  },

  /**
   * Creates a complete project using AI analysis and execution
   */
  create_project_with_ai: async (params: CreateProjectWithAIParams, mcpTools: Record<string, (...args: unknown[]) => Promise<unknown>>): Promise<AIProjectResult> => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured. AI-powered project creation requires OPENAI_API_KEY.',
          project: null
        }
      }

      if (!process.env.GITHUB_TOKEN) {
        return {
          success: false,
          message: 'GitHub token not configured. Repository creation requires GITHUB_TOKEN.',
          project: null
        }
      }

      // Step 1: AI Analysis with enhanced decision making
      const analysis = await AIService.analyzeProjectRequest(params.description)

      // Step 2: Generate project path if not provided
      const projectName = params.projectName || analysis.projectName || 'my-project'
      const sanitizedName = (projectName || 'my-project').toLowerCase().replace(/[^a-z0-9-]/g, '-')

      // Ensure Vercel compatibility by using proper tmp directory
      const tmpProjectsDir = '/tmp/projects'
      if (!fs.existsSync(tmpProjectsDir)) {
        fs.mkdirSync(tmpProjectsDir, { recursive: true })
      }

      const projectPath = params.projectPath || path.join(tmpProjectsDir, `${sanitizedName}-${Date.now()}`)

      // Step 3: Generate comprehensive action plan
      const { actions } = await AIService.generateMCPActions(
        params.description,
        analysis,
        projectPath
      )

      // Step 4: Execute all actions with detailed progress tracking
      const executionResults: Array<{
        step: number
        action: string
        tool: string
        success: boolean
        result?: unknown
        error?: string
        timestamp: string
      }> = []
      let currentStep = 1

      for (const action of actions) {
        try {
          console.log(`[AI Project Creation] Step ${currentStep}/${actions.length}: ${action.description}`)

          const tool = mcpTools[action.tool as keyof typeof mcpTools]
          if (tool) {
            const result = await (tool as (...args: unknown[]) => Promise<unknown>)(action.params)
            executionResults.push({
              step: currentStep,
              action: action.description,
              tool: action.tool,
              success: true,
              result,
              timestamp: new Date().toISOString()
            })
          } else {
            executionResults.push({
              step: currentStep,
              action: action.description,
              tool: action.tool,
              success: false,
              error: `Tool ${action.tool} not found`,
              timestamp: new Date().toISOString()
            })
          }
          currentStep++
        } catch (error) {
          executionResults.push({
            step: currentStep,
            action: action.description,
            tool: action.tool,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
          currentStep++
        }
      }

      // Step 5: Get final project information
      // Extract repository URL from execution results if git_init was executed
      let repositoryUrl: string | null = null

      const gitInitResult = executionResults.find(result => result.tool === 'git_init')
      if (gitInitResult && gitInitResult.success && gitInitResult.result) {
        const result = gitInitResult.result as { repoUrl?: string }
        repositoryUrl = result.repoUrl || null
      }

      // Fallback: try to get repository URL using tools (less reliable)
      if (!repositoryUrl) {
        repositoryUrl = await RepositoryTools.getRepositoryUrl(projectPath)
      }

      // Create chain of thought summary
      const chainOfThought = [
        `🤖 AI Analysis: ${analysis.reasoning}`,
        `📊 Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
        `📁 Project Type: ${analysis.projectType}`,
        ...(analysis.features && analysis.features.length > 0 ? [`✨ Detected Features: ${analysis.features.join(', ')}`] : []),
        '🔄 Execution Plan:',
        ...actions.map((action, index) => `  ${index + 1}. ${action.description}`),
        repositoryUrl ? `🔗 Repository: ${repositoryUrl}` : '',
        `📂 Project Path: ${projectPath}`,
        `✅ Total Steps: ${actions.length}`,
        `🤖 AI Model: OpenAI GPT-3.5-turbo`
      ].filter(Boolean).join('\n')

      return {
        success: true,
        message: `AI-powered project created successfully using ${analysis.projectType}`,
        project: {
          name: sanitizedName,
          path: projectPath,
          type: analysis.projectType,
          description: params.description,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          features: analysis.features,
          repositoryUrl,
          totalSteps: actions.length,
          executionSteps: executionResults,
          createdAt: new Date().toISOString(),
          aiPowered: true,
          llmUsed: 'OpenAI GPT-3.5-turbo'
        },
        chainOfThought: chainOfThought
      }
    } catch (error) {
      console.error('AI project creation failed:', error)
      return {
        success: false,
        message: `AI project creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        project: null
      }
    }
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
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured for AI analysis.',
          analysis: null
        }
      }

      // Primary AI analysis
      const analysis = await AIService.analyzeProjectRequest(params.description)

      let optimization: {
        recommendations: string[]
        reasoning: string
        aiPowered?: boolean
      } | null = null
      if (params.includeOptimization) {
        // Get project optimization recommendations
        optimization = await AIService.optimizeProjectStructure('/tmp/sample', analysis.projectType)

        // Get Git workflow recommendations (stored but not returned in current implementation)
        await AIService.recommendGitWorkflow(
          analysis.projectType,
          analysis.features
        )
      }

      return {
        success: true,
        message: `AI analysis complete with ${(analysis.confidence * 100).toFixed(1)}% confidence`,
        analysis: {
          projectAnalysis: analysis,
          optimization: params.includeOptimization ? optimization : null,
          aiPowered: true,
          processingTime: Date.now(),
          modelUsed: 'OpenAI GPT-3.5-turbo'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        analysis: null
      }
    }
  }
}
