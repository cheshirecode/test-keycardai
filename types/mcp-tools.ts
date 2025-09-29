/**
 * Type-safe MCP Tools Interface
 * Defines the exact shape of all MCP tool functions with their parameters and return types
 */

// Type definitions for AI Operations
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
  aiProvider?: 'openai' | 'gemini'
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

// Type definitions for File Management
export interface ReadFileParams {
  projectPath: string
  filePath: string
}

export interface UpdateFileParams {
  projectPath: string
  filePath: string
  content: string
}

export interface DeleteFileParams {
  projectPath: string
  filePath: string
}

export interface SearchFileParams {
  projectPath: string
  pattern: string
  filePattern?: string
  searchContent?: boolean
}

export interface FileOperationResult {
  success: boolean
  message: string
  content?: string
  matches?: Array<{
    filePath: string
    lineNumber?: number
    line?: string
  }>
}

// Type definitions for Package Management
export interface PackageParams {
  projectPath: string
  packages: string[]
  dev?: boolean
}

export interface UpdatePackagesParams {
  projectPath: string
  packages?: string[]
}

export interface PackageResult {
  success: boolean
  message: string
  installedPackages?: string[]
  failedPackages?: string[]
  output?: string
}

// Type definitions for Development Tools
export interface RunScriptParams {
  projectPath: string
  script: string
  args?: string[]
}

export interface CleanupProcessesParams {
  projectPath?: string
  ports?: number[]
  killNodeProcesses?: boolean
  cleanBuildArtifacts?: boolean
}

export interface DevelopmentResult {
  success: boolean
  message: string
  output?: string
  error?: string
}

// Type definitions for Repository Management
export interface ListRepositoriesParams {
  owner?: string
  nameFilter?: string
  type?: 'all' | 'public' | 'private'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
}

export interface DeleteRepositoryParams {
  owner: string
  repo: string
}

export interface GetRepositoryParams {
  owner: string
  repo: string
}

export interface LegacyRepositoryResult {
  success: boolean
  message: string
  repositories?: Array<{
    id: string
    name: string
    fullName: string
    url: string
    description: string | null
    private: boolean
    createdAt: string
    updatedAt: string
    isScaffoldedProject: boolean
  }>
  owner?: string
  total?: number
}

export interface DeleteRepositoryResult {
  success: boolean
  message: string
}

export interface GetRepositoryResult {
  success: boolean
  message: string
  repository?: {
    id: string
    name: string
    fullName: string
    url: string
    description: string | null
    private: boolean
    createdAt: string
    updatedAt: string
    isScaffoldedProject: boolean
  }
}

export interface ProcessCleanupResult {
  success: boolean
  message: string
  killedProcesses?: Array<{
    pid: number
    command: string
    port: number
  }>
  clearedPaths?: string[]
  error?: string
}

// AI Result Types
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

/**
 * Complete typed interface for all MCP tools
 */
export interface MCPTools {
  // AI Operations
  analyze_project_request: (params: AnalyzeProjectParams) => Promise<AIAnalysisResult>
  generate_project_plan: (params: GenerateProjectPlanParams) => Promise<AIProjectPlanResult>
  intelligent_project_setup: (params: IntelligentProjectSetupParams) => Promise<{
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
  }>
  create_project_with_ai: (params: CreateProjectWithAIParams) => Promise<AIProjectResult>
  analyze_and_optimize: (params: AnalyzeAndOptimizeParams) => Promise<{
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
  }>
  analyze_existing_project: (params: AnalyzeExistingProjectParams) => Promise<ContextualProjectResult>
  generate_modification_plan: (params: GenerateModificationPlanParams) => Promise<ContextualProjectResult>

  // File Management
  read_file: (params: ReadFileParams) => Promise<FileOperationResult>
  update_file: (params: UpdateFileParams) => Promise<FileOperationResult>
  delete_file: (params: DeleteFileParams) => Promise<FileOperationResult>
  search_files: (params: SearchFileParams) => Promise<FileOperationResult>

  // Package Management
  add_packages: (params: PackageParams) => Promise<PackageResult>
  remove_packages: (params: PackageParams) => Promise<PackageResult>
  update_packages: (params: UpdatePackagesParams) => Promise<PackageResult>

  // Development Tools
  run_script: (params: RunScriptParams) => Promise<DevelopmentResult>
  cleanup_processes: (params: CleanupProcessesParams) => Promise<ProcessCleanupResult>
  safe_cleanup: (params?: { projectPath?: string }) => Promise<ProcessCleanupResult>

  // Repository Management
  list_repositories: (params: ListRepositoriesParams) => Promise<LegacyRepositoryResult>
  delete_repository: (params: DeleteRepositoryParams) => Promise<DeleteRepositoryResult>
  get_repository: (params: GetRepositoryParams) => Promise<GetRepositoryResult>
  validate_repository_permissions: (params: { owner: string }) => Promise<{
    success: boolean
    message: string
    canDelete: boolean
    githubOwner?: string
    authenticatedUser?: string
  }>

  // Git Operations
  git_log: (params: { path: string; limit?: number }) => Promise<{
    success: boolean
    message: string
    commits?: Array<{
      hash: string
      author: string
      email: string
      date: string
      timestamp: number
      message: string
      subject: string
      body: string
    }>
  }>
  
  // GitHub Operations
  github_get_commits: (params: { owner: string; repo: string; limit?: number }) => Promise<{
    success: boolean
    message: string
    commits?: Array<{
      hash: string
      author: string
      email: string
      date: string
      timestamp: number
      message: string
      subject: string
      body: string
    }>
  }>

  // Project Management (additional tools that may exist)
  // [key: string]: (params: unknown) => Promise<unknown>
}

/**
 * Type-safe parameter extraction for MCP tools
 */
export type MCPToolParams<K extends keyof MCPTools> = Parameters<MCPTools[K]>[0]

/**
 * Type-safe return type extraction for MCP tools
 */
export type MCPToolResult<K extends keyof MCPTools> = Awaited<ReturnType<MCPTools[K]>>

/**
 * Union type of all valid MCP tool names
 */
export type MCPToolName = keyof MCPTools

/**
 * Type guard to check if a string is a valid MCP tool name
 */
export function isValidMCPTool(tool: string): tool is Extract<MCPToolName, string> {
  const validTools: string[] = [
    'analyze_project_request',
    'generate_project_plan',
    'intelligent_project_setup',
    'create_project_with_ai',
    'analyze_and_optimize',
    'analyze_existing_project',
    'generate_modification_plan',
    'read_file',
    'update_file',
    'delete_file',
    'search_files',
    'add_packages',
    'remove_packages',
    'update_packages',
    'run_script',
    'cleanup_processes',
    'safe_cleanup',
    'list_repositories',
    'delete_repository',
    'get_repository',
    'validate_repository_permissions',
    'git_log',
    'github_get_commits'
  ]

  return validTools.includes(tool)
}

/**
 * Validation result for MCP operations
 */
export interface MCPValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Enhanced MCP Request with type safety
 */
export interface TypedMCPRequest<K extends MCPToolName = MCPToolName> {
  method: K
  params: MCPToolParams<K>
  id: string | number
}

/**
 * Enhanced MCP Response with type safety
 */
export interface TypedMCPResponse<K extends MCPToolName = MCPToolName> {
  result?: MCPToolResult<K>
  error?: {
    code: number
    message: string
    data?: unknown
  }
  id: string | number
}
