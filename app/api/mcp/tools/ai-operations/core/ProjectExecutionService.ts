/**
 * Project Execution Service
 * Handles MCP tool orchestration and project execution workflows
 */

import * as fs from 'fs'
import * as path from 'path'
import { AIService } from '@/lib/ai-service'
import { RepositoryTools } from '@/lib/repository-tools'
import { CONFIG } from '@/lib/config'
import { AIErrorHandler } from './AIErrorHandler'
import { AIPromptBuilder } from '../utils'
import type {
  IntelligentProjectSetupParams,
  CreateProjectWithAIParams,
  AIProjectResult,
  AIExecutionStep,
  MCPToolRegistry
} from '@/types/mcp/ai-operations'

export class ProjectExecutionService {
  /**
   * Execute intelligent project setup with AI analysis and optional execution
   */
  static async executeIntelligentProjectSetup(
    params: IntelligentProjectSetupParams,
    mcpTools: MCPToolRegistry
  ): Promise<{
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
  }> {
    // Check if Fast Mode is enabled - skip AI processing
    if (params.fastMode) {
      console.log('[Fast Mode] Skipping AI processing, using rule-based setup')
      const fastResponse = AIPromptBuilder.buildFastModeResponse(`project-${Date.now()}`)
      return {
        success: true,
        message: 'Fast Mode: Using rule-based project setup (AI processing skipped)',
        analysis: fastResponse.analysis,
        plannedActions: fastResponse.plannedActions,
        executionResults: null,
        aiPowered: false,
        llmUsed: 'none (Fast Mode)'
      }
    }

    // Validate environment
    const envValidation = AIErrorHandler.validateEnvironment({ openaiKey: true })
    if (!envValidation.valid) {
      return {
        success: false,
        message: 'OpenAI API key not configured. AI-powered setup requires OPENAI_API_KEY.',
        aiPowered: false,
        llmUsed: ''
      }
    }

    try {
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
        llmUsed: CONFIG.AI.DEFAULT_MODEL
      }
    } catch (error) {
      return {
        success: false,
        message: `Intelligent setup failed: ${error}`,
        aiPowered: false,
        llmUsed: ''
      }
    }
  }

  /**
   * Create a complete project using AI analysis and execution
   */
  static async createProjectWithAI(
    params: CreateProjectWithAIParams,
    mcpTools: MCPToolRegistry
  ): Promise<AIProjectResult> {
    // Check if Fast Mode is enabled - skip AI processing
    if (params.fastMode) {
      console.log('[Fast Mode] Skipping AI project creation, using rule-based approach')
      return this.createFastModeProject()
    }

    // Validate environment
    const envValidation = AIErrorHandler.validateEnvironment({
      openaiKey: true,
      githubToken: true
    })
    if (!envValidation.valid) {
      return {
        success: false,
        message: envValidation.message,
        project: null
      }
    }

    try {
      // Step 1: AI Analysis with enhanced decision making
      const analysisPrompt = this.buildAnalysisPrompt(params)
      const analysis = await AIService.analyzeProjectRequest(analysisPrompt, params.aiProvider)

      // Step 2: Generate project path if not provided
      const { projectName, projectPath } = this.prepareProjectPaths(params, analysis)

      // Step 3: Generate comprehensive action plan
      const { actions } = await AIService.generateMCPActions(
        params.existingRepository ? analysisPrompt : params.description,
        analysis,
        projectPath,
        params.existingRepository,
        params.aiProvider
      )

      // Step 4: Execute all actions with detailed progress tracking
      const executionResults = await this.executeActions(actions, mcpTools)

      // Step 5: Get final project information
      const repositoryUrl = await this.extractRepositoryUrl(executionResults, projectPath)

      // Create chain of thought summary
      const chainOfThought = AIPromptBuilder.buildChainOfThought(
        analysis,
        actions,
        repositoryUrl,
        projectPath,
        CONFIG.AI.DEFAULT_MODEL
      )

      return {
        success: true,
        message: `AI-powered project created successfully using ${analysis.projectType}`,
        project: {
          name: projectName,
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
          llmUsed: CONFIG.AI.DEFAULT_MODEL
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
  }

  /**
   * Create fast mode project response
   */
  private static createFastModeProject(): AIProjectResult {
    const projectName = `fast-project-${Date.now()}`
    const projectPath = `/tmp/projects/${projectName}`

    return {
      success: true,
      message: 'Fast Mode: Project created using rule-based approach (AI processing skipped)',
      project: {
        name: projectName,
        path: projectPath,
        type: 'web-application',
        description: 'Fast Mode project created with basic setup',
        confidence: 0.8,
        reasoning: 'Fast Mode: Rule-based project creation for quick demonstration',
        features: ['typescript', 'react', 'vite', 'tailwind'],
        repositoryUrl: undefined,
        totalSteps: 3,
        executionSteps: [
          {
            step: 1,
            action: 'Create directory structure',
            tool: 'rule-based',
            success: true,
            result: {
              success: true,
              data: 'Directory structure created',
              executionTime: 100,
              timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          },
          {
            step: 2,
            action: 'Install basic dependencies',
            tool: 'rule-based',
            success: true,
            result: {
              success: true,
              data: 'Dependencies configured',
              executionTime: 150,
              timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          },
          {
            step: 3,
            action: 'Setup configuration',
            tool: 'rule-based',
            success: true,
            result: {
              success: true,
              data: 'Configuration files created',
              executionTime: 80,
              timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        aiPowered: false,
        llmUsed: 'none (Fast Mode)'
      }
    }
  }

  /**
   * Build analysis prompt for project creation
   */
  private static buildAnalysisPrompt(params: CreateProjectWithAIParams): string {
    const isRepositoryModification = !!params.existingRepository

    if (isRepositoryModification && params.existingRepository) {
      return AIPromptBuilder.buildRepositoryModificationPrompt(
        params.description,
        params.existingRepository
      )
    }

    return params.description
  }

  /**
   * Prepare project name and path
   */
  private static prepareProjectPaths(
    params: CreateProjectWithAIParams,
    analysis: { projectName?: string }
  ): { projectName: string; projectPath: string } {
    const projectName = params.projectName || analysis.projectName || 'my-project'
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Ensure Vercel compatibility by using proper tmp directory
    const tmpProjectsDir = CONFIG.PROJECT.TEMP_DIR
    if (!fs.existsSync(tmpProjectsDir)) {
      fs.mkdirSync(tmpProjectsDir, { recursive: true })
    }

    const projectPath = params.projectPath || path.join(tmpProjectsDir, `${sanitizedName}-${Date.now()}`)

    return { projectName: sanitizedName, projectPath }
  }

  /**
   * Execute all actions with detailed progress tracking
   */
  private static async executeActions(
    actions: Array<{ tool: string; params: unknown; description: string }>,
    mcpTools: MCPToolRegistry
  ): Promise<AIExecutionStep[]> {
    const executionResults: AIExecutionStep[] = []
    let currentStep = 1

    for (const action of actions) {
      try {
        console.log(`[AI Project Creation] Step ${currentStep}/${actions.length}: ${action.description}`)

        const tool = mcpTools[action.tool as keyof typeof mcpTools]
        if (tool) {
          const toolResult = await (tool as (...args: unknown[]) => Promise<unknown>)(action.params)
          executionResults.push({
            step: currentStep,
            action: action.description,
            tool: action.tool,
            success: true,
            result: {
              success: true,
              data: toolResult,
              executionTime: 0,
              timestamp: new Date().toISOString()
            },
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

    return executionResults
  }

  /**
   * Extract repository URL from execution results
   */
  private static async extractRepositoryUrl(
    executionResults: AIExecutionStep[],
    projectPath: string
  ): Promise<string | null> {
    // Extract repository URL from execution results if git_init was executed
    const gitInitResult = executionResults.find(result => result.tool === 'git_init')
    if (gitInitResult && gitInitResult.success && gitInitResult.result) {
      const result = gitInitResult.result as { repoUrl?: string }
      return result.repoUrl || null
    }

    // Fallback: try to get repository URL using tools (less reliable)
    try {
      return await RepositoryTools.getRepositoryUrl(projectPath)
    } catch {
      return null
    }
  }
}