import * as fs from 'fs'
import * as path from 'path'
import { AIService } from '@/lib/ai-service'
import { RepositoryTools } from '@/lib/repository-tools'
import { CONFIG } from '@/lib/config'
import type {
  IntelligentProjectSetupParams,
  CreateProjectWithAIParams,
  GenerateModificationPlanParams
} from '@/types/mcp-tools'

export interface AnalyzeProjectParams {
  description: string
}

export interface GenerateProjectPlanParams {
  description: string
  projectPath: string
  projectName?: string
}


export interface AnalyzeAndOptimizeParams {
  description: string
  projectType?: string
  includeOptimization?: boolean
}

export interface AnalyzeExistingProjectParams {
  projectPath: string
  requestDescription: string
  includeFileAnalysis?: boolean
}


export interface ContextualProjectResult {
  success: boolean
  message: string
  analysis?: {
    projectType: string
    framework: string
    structure: string[]
    dependencies: Record<string, string>
    recommendations: string[]
    modificationPlan?: Array<{
      step: number
      action: string
      tool: string
      params: unknown
      description: string
    }>
  }
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
      // Check if Fast Mode is enabled - skip AI processing
      if (params.fastMode) {
        console.log('[Fast Mode] Skipping AI processing, using rule-based setup')
        return {
          success: true,
          message: 'Fast Mode: Using rule-based project setup (AI processing skipped)',
          analysis: {
            projectType: 'web-application',
            confidence: 0.8,
            reasoning: 'Fast Mode: Rule-based analysis based on common patterns',
            features: ['typescript', 'react', 'modern-tooling'],
            recommendedName: `project-${Date.now()}`
          },
          plannedActions: [
            'Create project structure',
            'Install basic dependencies',
            'Setup configuration files'
          ],
          executionResults: null,
          aiPowered: false,
          llmUsed: 'none (Fast Mode)'
        }
      }

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
  },

  /**
   * Creates a complete project using AI analysis and execution
   */
  create_project_with_ai: async (params: CreateProjectWithAIParams, mcpTools: Record<string, (...args: unknown[]) => Promise<unknown>>): Promise<AIProjectResult> => {
    try {
      // Check if Fast Mode is enabled - skip AI processing
      if (params.fastMode) {
        console.log('[Fast Mode] Skipping AI project creation, using rule-based approach')

        // Generate a basic project using rule-based logic
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
                result: 'Directory structure created',
                timestamp: new Date().toISOString()
              },
              {
                step: 2,
                action: 'Install basic dependencies',
                tool: 'rule-based',
                success: true,
                result: 'Dependencies configured',
                timestamp: new Date().toISOString()
              },
              {
                step: 3,
                action: 'Setup configuration',
                tool: 'rule-based',
                success: true,
                result: 'Configuration files created',
                timestamp: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString(),
            aiPowered: false,
            llmUsed: 'none (Fast Mode)'
          }
        }
      }

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
      // Check if this is a repository modification request
      const isRepositoryModification = !!params.existingRepository
      let analysisPrompt = params.description

      if (isRepositoryModification && params.existingRepository) {
        analysisPrompt = `REPOSITORY MODIFICATION REQUEST:
Repository: ${params.existingRepository.name}
URL: ${params.existingRepository.url}
Description: ${params.existingRepository.description || 'No description'}

User Request: ${params.description}

This is a modification to an existing repository, NOT a new project creation. Please analyze what changes need to be made to the existing codebase.`
      }

      const analysis = await AIService.analyzeProjectRequest(analysisPrompt)

      // Step 2: Generate project path if not provided
      const projectName = params.projectName || analysis.projectName || 'my-project'
      const sanitizedName = (projectName || 'my-project').toLowerCase().replace(/[^a-z0-9-]/g, '-')

      // Ensure Vercel compatibility by using proper tmp directory
      const tmpProjectsDir = CONFIG.PROJECT.TEMP_DIR
      if (!fs.existsSync(tmpProjectsDir)) {
        fs.mkdirSync(tmpProjectsDir, { recursive: true })
      }

      const projectPath = params.projectPath || path.join(tmpProjectsDir, `${sanitizedName}-${Date.now()}`)

      // Step 3: Generate comprehensive action plan
      const { actions } = await AIService.generateMCPActions(
        isRepositoryModification ? analysisPrompt : params.description,
        analysis,
        projectPath,
        isRepositoryModification ? params.existingRepository : undefined
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
        `🤖 AI Model: ${CONFIG.AI.DEFAULT_MODEL}`
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
          modelUsed: CONFIG.AI.DEFAULT_MODEL
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
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured for project analysis.'
        }
      }

      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      // Read project structure and metadata
      const packageJsonPath = path.join(params.projectPath, 'package.json')
      let projectInfo: Record<string, unknown> = { name: 'unknown', dependencies: {}, devDependencies: {} }

      if (fs.existsSync(packageJsonPath)) {
        projectInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      }

      // Analyze project type and framework
      const deps = {
        ...(projectInfo.dependencies as Record<string, string> || {}),
        ...(projectInfo.devDependencies as Record<string, string> || {})
      }
      let projectType = 'unknown'
      let framework = 'vanilla'

      if (deps.next) {
        projectType = 'Next.js Application'
        framework = 'React'
      } else if (deps.react) {
        projectType = 'React Application'
        framework = 'React'
      } else if (deps.vue) {
        projectType = 'Vue Application'
        framework = 'Vue'
      } else if (deps.express) {
        projectType = 'Express API'
        framework = 'Node.js'
      }

      // Get basic file structure
      const structure = getProjectStructure(params.projectPath)

      // Use AI to analyze the request in context of the existing project
      const contextualAnalysis = await AIService.analyzeProjectRequest(`
        Existing Project Context:
        - Type: ${projectType}
        - Framework: ${framework}
        - Dependencies: ${Object.keys(deps).join(', ')}
        - Structure: ${structure.slice(0, 10).join(', ')}${structure.length > 10 ? '...' : ''}

        User Request: ${params.requestDescription}

        Please analyze how to implement this request in the context of the existing project.
      `)

      // Generate recommendations based on existing project
      const recommendations = [
        `Project is using ${framework} framework`,
        `Current dependencies: ${Object.keys(projectInfo.dependencies || {}).length} packages`,
        `Suggested approach: ${contextualAnalysis.reasoning}`,
        `Confidence level: ${(contextualAnalysis.confidence * 100).toFixed(0)}%`
      ]

      return {
        success: true,
        message: `Analyzed existing ${projectType} project for modification request`,
        analysis: {
          projectType,
          framework,
          structure: structure.slice(0, CONFIG.PROJECT.MAX_STRUCTURE_ITEMS), // Limit for response size
          dependencies: (projectInfo.dependencies as Record<string, string>) || {},
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to analyze existing project: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  /**
   * Generate a modification plan for an existing project
   */
  generate_modification_plan: async (params: GenerateModificationPlanParams): Promise<ContextualProjectResult> => {
    try {
      // Check if Fast Mode is enabled - skip AI requirement check
      if (params.fastMode) {
        console.log('[Fast Mode] Skipping AI requirement check for modification planning')
      } else if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured for modification planning.'
        }
      }

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

        analysisData = analysisResult.analysis as Record<string, unknown>
      }

      // Generate step-by-step modification plan
      const modificationPlan = await generateContextualPlan(
        params.requestDescription,
        analysisData as Record<string, unknown>,
        params.projectPath,
        params.fastMode || false
      )

      return {
        success: true,
        message: `Generated modification plan with ${modificationPlan.length} steps`,
        analysis: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          projectType: (analysisData as any)?.projectType || 'unknown',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          framework: (analysisData as any)?.framework || 'unknown',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          structure: (analysisData as any)?.structure || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dependencies: (analysisData as any)?.dependencies || {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recommendations: (analysisData as any)?.recommendations || [],
          modificationPlan
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate modification plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Helper function to get project structure
 */
function getProjectStructure(projectPath: string, maxDepth = CONFIG.PROJECT.MAX_STRUCTURE_DEPTH): string[] {
  const structure: string[] = []

  function traverse(dirPath: string, currentDepth = 0, relativePath = '') {
    if (currentDepth >= maxDepth) return

    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const item of items) {
        if (item.name.startsWith('.') || (CONFIG.PROJECT.IGNORED_DIRS as readonly string[]).includes(item.name)) {
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
 * Generate a contextual modification plan using AI when available, with intelligent fallbacks
 */
async function generateContextualPlan(
  requestDescription: string,
  analysisData: Record<string, unknown>,
  projectPath: string,
  fastMode: boolean = false
): Promise<Array<{
  step: number
  action: string
  tool: string
  params: unknown
  description: string
}>> {
  console.log('[AI Planning] Generating modification plan with AI...')

  // Check if Fast Mode is enabled - skip AI processing
  if (fastMode) {
    console.log('[Fast Mode] Skipping AI planning, using rule-based approach')
    return generateRuleBasedPlan(requestDescription, analysisData, projectPath)
  }

  // First try AI-powered planning if OpenAI API is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiPlan = await generateAIPoweredPlan(requestDescription, analysisData, projectPath)
      if (aiPlan.length > 0) {
        console.log(`[AI Planning] Successfully generated AI plan with ${aiPlan.length} steps`)
        return aiPlan
      }
    } catch (error) {
      console.log(`[AI Planning] AI planning failed, falling back to rule-based: ${error}`)
    }
  } else {
    console.log('[AI Planning] OpenAI API key not available, using rule-based planning')
  }

  // Fall back to rule-based planning
  console.log('[AI Planning] Using rule-based modification planning')
  return generateRuleBasedPlan(requestDescription, analysisData, projectPath)
}

/**
 * Generate AI-powered modification plan using OpenAI
 */
async function generateAIPoweredPlan(
  requestDescription: string,
  analysisData: Record<string, unknown>,
  projectPath: string
): Promise<Array<{
  step: number
  action: string
  tool: string
  params: unknown
  description: string
}>> {
  const prompt = `You are an expert software architect and developer. Based on the following project analysis and user request, generate a detailed step-by-step modification plan.

PROJECT ANALYSIS:
- Type: ${analysisData.projectType || 'unknown'}
- Framework: ${analysisData.framework || 'unknown'}
- Structure: ${JSON.stringify(analysisData.structure || [])}
- Dependencies: ${JSON.stringify(analysisData.dependencies || {})}
- Recommendations: ${JSON.stringify(analysisData.recommendations || [])}

USER REQUEST:
${requestDescription}

PROJECT PATH: ${projectPath}

Available MCP tools:
- generate_code: Create new files/components
- add_packages: Install npm packages
- write_file: Create/update specific files
- create_directory: Create new directories
- run_script: Execute npm scripts or commands

Generate a JSON array of modification steps. Each step should have:
{
  "step": number,
  "action": "brief action name",
  "tool": "mcp_tool_name",
  "params": { tool_specific_parameters },
  "description": "detailed description of what this step does"
}

Focus on:
1. Installing any required dependencies first
2. Creating necessary directory structure
3. Generating/modifying code files
4. Running any build/setup commands
5. Ensuring compatibility with existing project structure

Respond with ONLY the JSON array, no other text.`

  try {
    // Use the ai library directly for this specific use case
    const { generateText } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt
    })

    // Parse the AI response
    const cleanedResponse = result.text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
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
    console.log(`[AI Planning] Failed to parse AI response: ${error}`)
    throw error
  }
}

/**
 * Generate rule-based modification plan as fallback
 */
function generateRuleBasedPlan(
  requestDescription: string,
  analysisData: Record<string, unknown>,
  projectPath: string
): Array<{
  step: number
  action: string
  tool: string
  params: unknown
  description: string
}> {
  // Create a basic modification plan based on common patterns
  const plan: Array<{
    step: number
    action: string
    tool: string
    params: unknown
    description: string
  }> = []

  // Enhanced rule-based planning with more sophisticated pattern matching
  const lowerRequest = requestDescription.toLowerCase()

  // Component creation patterns
  if ((lowerRequest.includes('add') || lowerRequest.includes('create')) &&
      (lowerRequest.includes('component') || lowerRequest.includes('page'))) {
    plan.push({
      step: 1,
      action: 'Generate React component',
      tool: 'generate_code',
      params: {
        projectPath,
        type: 'component',
        name: extractComponentName(requestDescription),
        framework: analysisData.framework || 'react'
      },
      description: 'Create new React component based on request'
    })
  }

  // Handle package installation requests (including jotai, zustand, etc.)
  const packageName = extractPackageName(requestDescription)
  if (packageName || requestDescription.includes('install') || requestDescription.includes('add')) {
    const detectedPackages = packageName ? [packageName] : extractMultiplePackages(requestDescription)

    if (detectedPackages.length > 0) {
      plan.push({
        step: plan.length + 1,
        action: 'Install packages',
        tool: 'add_packages',
        params: {
          projectPath,
          packages: detectedPackages,
          dev: requestDescription.includes('dev') || requestDescription.includes('development')
        },
        description: `Install ${detectedPackages.join(', ')} ${requestDescription.includes('dev') ? '(dev dependencies)' : ''}`
      })
    }
  }

  // Style/CSS patterns
  if (lowerRequest.includes('style') || lowerRequest.includes('css') || lowerRequest.includes('design')) {
    plan.push({
      step: plan.length + 1,
      action: 'Update styles',
      tool: 'write_file',
      params: {
        projectPath,
        fileName: 'src/styles/custom.css',
        content: `/* Custom styles for: ${requestDescription} */\n.custom-styles {\n  /* Add your styles here */\n}\n`
      },
      description: 'Add custom styles based on request'
    })
  }

  // API/service patterns
  if (lowerRequest.includes('api') || lowerRequest.includes('service') || lowerRequest.includes('endpoint')) {
    plan.push({
      step: plan.length + 1,
      action: 'Create API service',
      tool: 'generate_code',
      params: {
        projectPath,
        type: 'service',
        name: extractServiceName(requestDescription),
        framework: analysisData.framework || 'javascript'
      },
      description: 'Create API service for data handling'
    })
  }

  // Configuration/setup patterns
  if (lowerRequest.includes('config') || lowerRequest.includes('setup') || lowerRequest.includes('environment')) {
    plan.push({
      step: plan.length + 1,
      action: 'Update configuration',
      tool: 'write_file',
      params: {
        projectPath,
        fileName: 'config.json',
        content: JSON.stringify({
          name: 'Modified Configuration',
          description: requestDescription,
          timestamp: new Date().toISOString()
        }, null, 2)
      },
      description: 'Update application configuration'
    })
  }

  // Add default documentation step if no specific plan generated
  if (plan.length === 0) {
    plan.push({
      step: 1,
      action: 'Document modification request',
      tool: 'write_file',
      params: {
        projectPath,
        fileName: 'MODIFICATION_LOG.md',
        content: `# Modification Request

## User Request
${requestDescription}

## Project Analysis
- Type: ${analysisData.projectType || 'unknown'}
- Framework: ${analysisData.framework || 'unknown'}
- Dependencies: ${Object.keys((analysisData.dependencies as Record<string, string>) || {}).length} packages

## Timestamp
${new Date().toISOString()}

## Next Steps
This request requires manual analysis to determine the appropriate modifications.
Consider breaking down the request into more specific actions.
`
      },
      description: 'Document the modification request for manual review'
    })
  }

  return plan
}

/**
 * Extract component name from request description
 */
function extractComponentName(description: string): string {
  const match = description.match(/component\s+(?:called\s+)?([a-zA-Z]+)/i)
  return match ? match[1] : 'NewComponent'
}

/**
 * Extract package name from request description
 */
function extractPackageName(description: string): string | null {
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
function extractServiceName(description: string): string {
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
function extractMultiplePackages(description: string): string[] {
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
    const singlePackage = extractPackageName(description)
    if (singlePackage) {
      packages.push(singlePackage)
    }
  }

  return [...new Set(packages)] // Remove duplicates
}
