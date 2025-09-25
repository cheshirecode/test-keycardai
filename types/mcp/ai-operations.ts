/**
 * AI Operations Types
 * Type definitions for AI-powered project analysis and creation
 */

import { MCPBaseResult } from './base-types'

// AI Operation Parameters
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
  fastMode?: boolean
}

export interface CreateProjectWithAIParams {
  description: string
  projectPath?: string
  projectName?: string
  fastMode?: boolean
  existingRepository?: {
    name: string
    fullName: string
    url: string
    description?: string
  }
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

export interface GenerateModificationPlanParams {
  projectPath: string
  requestDescription: string
  analysisData?: unknown
  fastMode?: boolean
}

// AI Result Types
export interface AIAnalysisResult extends MCPBaseResult {
  analysis?: {
    projectType: string
    features: string[]
    confidence: number
    reasoning: string
    recommendedName?: string
    aiPowered: boolean
  } | null
}

export interface AIProjectPlanResult extends MCPBaseResult {
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

export interface AIProjectResult extends MCPBaseResult {
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

export interface ContextualProjectResult extends MCPBaseResult {
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

export interface IntelligentProjectSetupResult extends MCPBaseResult {
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
}

export interface AnalyzeAndOptimizeResult extends MCPBaseResult {
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
}

// AI Operations Interface
export interface AIOperations {
  analyze_project_request: (params: AnalyzeProjectParams) => Promise<AIAnalysisResult>
  generate_project_plan: (params: GenerateProjectPlanParams) => Promise<AIProjectPlanResult>
  intelligent_project_setup: (params: IntelligentProjectSetupParams) => Promise<IntelligentProjectSetupResult>
  create_project_with_ai: (params: CreateProjectWithAIParams) => Promise<AIProjectResult>
  analyze_and_optimize: (params: AnalyzeAndOptimizeParams) => Promise<AnalyzeAndOptimizeResult>
  analyze_existing_project: (params: AnalyzeExistingProjectParams) => Promise<ContextualProjectResult>
  generate_modification_plan: (params: GenerateModificationPlanParams) => Promise<ContextualProjectResult>
}
