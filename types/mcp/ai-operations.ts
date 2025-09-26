/**
 * AI Operations Types
 * Type definitions for AI-powered project analysis and creation
 * 
 * CENTRALIZED TYPE DEFINITIONS - All AI operation types are defined here
 * to avoid duplication and ensure consistency across the codebase.
 */

import { MCPBaseResult } from './base-types'

// ============================================================================
// AI OPERATION PARAMETERS
// ============================================================================

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

// ============================================================================
// AI ANALYSIS AND WORKFLOW DATA TYPES
// ============================================================================

export interface AIAnalysisData {
  projectType: string
  confidence: number
  reasoning: string
  features: string[]
  projectName?: string
}

export interface AIOptimizationResult {
  recommendations: string[]
  reasoning: string
  aiPowered?: boolean
}

export interface AIExecutionStep {
  step: number
  action: string
  tool: string
  success: boolean
  result?: ExecutionResult
  error?: string
  timestamp: string
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface WorkflowContext {
  projectPath: string
  description: string
  fastMode?: boolean
  autoExecute?: boolean
  projectName?: string
  existingRepository?: {
    name: string
    url: string
    description?: string
  }
}

export interface WorkflowResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  executionSteps?: AIExecutionStep[]
  aiPowered: boolean
  llmUsed: string
}

export interface WorkflowAction {
  step: number
  action: string
  tool: string
  params: MCPToolParams | Record<string, unknown>
  description: string
}

export interface WorkflowExecutionContext {
  mcpTools: MCPToolRegistry
  abortController?: AbortController
  onProgress?: (step: number, total: number, description: string) => void
}

// ============================================================================
// MCP TOOL TYPES - Strongly typed tool definitions
// ============================================================================

/**
 * Generic MCP tool function type with proper parameter and result typing
 */
export interface MCPToolFunction<TParams = unknown, TResult = unknown> {
  (params: TParams): Promise<MCPToolResult<TResult>>
}

/**
 * Standardized MCP tool result wrapper
 */
export interface MCPToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    executionTime?: number
    toolVersion?: string
  }
}

/**
 * Generate code tool parameters (AI-specific)
 */
export interface AIGenerateCodeParams {
  type: 'component' | 'service' | 'utility' | 'test'
  name: string
  framework: string
  content?: string
  path?: string
  template?: string
}

/**
 * Add packages tool parameters
 */
export interface AddPackagesParams {
  packages: string[]
  dev?: boolean
  exact?: boolean
  registry?: string
}

/**
 * Write file tool parameters
 */
export interface WriteFileParams {
  path: string
  content: string
  encoding?: string
  createDirectories?: boolean
}

/**
 * Create directory tool parameters
 */
export interface CreateDirectoryParams {
  path: string
  recursive?: boolean
  mode?: number
}

/**
 * Run script tool parameters (AI-specific)
 */
export interface AIRunScriptParams {
  script: string
  cwd?: string
  env?: Record<string, string>
  timeout?: number
}

/**
 * Union type for all MCP tool parameters
 */
export type MCPToolParams = 
  | AIGenerateCodeParams 
  | AddPackagesParams 
  | WriteFileParams 
  | CreateDirectoryParams 
  | AIRunScriptParams

/**
 * Strongly-typed MCP tool registry with specific tool signatures
 */
export interface TypedMCPToolRegistry {
  generate_code: MCPToolFunction<AIGenerateCodeParams, { filePath: string; content: string }>
  add_packages: MCPToolFunction<AddPackagesParams, { installed: string[]; failed: string[] }>
  write_file: MCPToolFunction<WriteFileParams, { path: string; size: number }>
  create_directory: MCPToolFunction<CreateDirectoryParams, { path: string; created: boolean }>
  run_script: MCPToolFunction<AIRunScriptParams, { exitCode: number; output: string; error?: string }>
}

/**
 * Legacy MCP tool registry for backward compatibility
 * @deprecated Use TypedMCPToolRegistry for better type safety
 */
export interface MCPToolRegistry {
  [toolName: string]: (...args: unknown[]) => Promise<unknown>
}

// ============================================================================
// ANALYSIS DATA TYPES - Replace Record<string, unknown>
// ============================================================================

/**
 * Project analysis data structure - replaces Record<string, unknown>
 */
export interface ProjectAnalysisData {
  projectType: string
  framework: string
  structure: string[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  recommendations: string[]
  confidence: number
  reasoning: string
}

/**
 * Package.json data structure - replaces unknown for package parsing
 */
export interface PackageJsonData {
  name: string
  version?: string
  description?: string
  main?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  engines?: Record<string, string>
  keywords?: string[]
  author?: string | { name: string; email?: string }
  license?: string
}

/**
 * Project structure information
 */
export interface ProjectStructureInfo {
  files: string[]
  directories: string[]
  configFiles: string[]
  sourceFiles: string[]
  testFiles: string[]
  documentationFiles: string[]
}

// ============================================================================
// EXECUTION AND ERROR TYPES - Replace unknown types
// ============================================================================

/**
 * Generic execution result type - replaces unknown for results
 */
export interface ExecutionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  executionTime: number
  timestamp: string
}

/**
 * AI service response wrapper - replaces unknown for AI responses
 */
export interface AIServiceResponse<T = unknown> {
  success: boolean
  data: T
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  processingTime: number
}

/**
 * AI operations error context - replaces Record<string, unknown> for error handling
 */
export interface AIErrorContext {
  operation: string
  timestamp: string
  parameters?: Record<string, string | number | boolean>
  stackTrace?: string
  environment?: {
    nodeVersion: string
    platform: string
    memory: number
  }
}

/**
 * Tool execution error details
 */
export interface ToolExecutionError {
  toolName: string
  parameters: MCPToolParams
  error: string
  timestamp: string
  retryCount?: number
}

// ============================================================================
// WORKFLOW RESULT TYPES
// ============================================================================

export interface ProjectCreationWorkflowResult extends WorkflowResult {
  data?: {
    name: string
    path: string
    type: string
    description: string
    confidence: number
    reasoning: string
    features: string[]
    repositoryUrl?: string | null
    totalSteps: number
    createdAt: string
  }
  chainOfThought?: string
}

export interface ProjectModificationWorkflowResult extends WorkflowResult {
  data?: {
    projectType: string
    framework: string
    structure: string[]
    dependencies: Record<string, string>
    recommendations: string[]
    modificationPlan?: WorkflowAction[]
  }
}

export interface ProjectAnalysisWorkflowResult extends WorkflowResult {
  data?: {
    projectAnalysis: AIAnalysisData
    optimization: AIOptimizationResult | null
    processingTime: number
    modelUsed: string
  }
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
    actions: WorkflowAction[]
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
    executionSteps: AIExecutionStep[]
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
    modificationPlan?: WorkflowAction[]
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
  executionResults?: AIExecutionStep[] | null
  aiPowered: boolean
  llmUsed: string
}

export interface AnalyzeAndOptimizeResult extends MCPBaseResult {
  analysis?: {
    projectAnalysis: ProjectAnalysisData
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
