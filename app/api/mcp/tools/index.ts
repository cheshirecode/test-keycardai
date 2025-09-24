import * as fs from 'fs'
import * as path from 'path'
import archiver from 'archiver'
import { RepositoryTools } from '../../../../lib/repository-tools'
import { GitHubService, GitHubRepoConfig } from '../../../../lib/github-service'
import { execSync } from 'child_process'
import { templates } from '../../../../lib/templates'
import { AIService } from '../../../../lib/ai-service'

export const mcpTools = {
  create_directory: async (params: { path: string }) => {
    try {
      fs.mkdirSync(params.path, { recursive: true })
      return { success: true, path: params.path }
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`)
    }
  },

  write_file: async (params: { path: string; content: string }) => {
    try {
      const dir = path.dirname(params.path)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(params.path, params.content)
      return { success: true, path: params.path }
    } catch (error) {
      throw new Error(`Failed to write file: ${error}`)
    }
  },

  git_init: async (params: { path: string }) => {
    try {
      const result = await RepositoryTools.initRepository(params.path)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        repoUrl: result.repoUrl,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository initialization failed: ${error}`)
    }
  },

  git_add_commit: async (params: { path: string; message: string }) => {
    try {
      const result = await RepositoryTools.addAndCommit(params.path, params.message)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository commit failed: ${error}`)
    }
  },

  git_status: async (params: { path: string }) => {
    try {
      const status = await RepositoryTools.getStatus(params.path)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: true,
        status,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository status failed: ${error}`)
    }
  },

  git_create_branch: async () => {
    try {
      const result = await RepositoryTools.createBranch()
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository branch creation failed: ${error}`)
    }
  },

  git_set_remote: async () => {
    try {
      const result = await RepositoryTools.setRemoteOrigin()
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository remote setup failed: ${error}`)
    }
  },

  git_configure_user: async (params: { path: string; name?: string; email?: string }) => {
    try {
      // Use provided parameters or fall back to environment variables
      const name = params.name || process.env.GIT_USER_NAME
      const email = params.email || process.env.GIT_USER_EMAIL

      if (!name || !email) {
        throw new Error('Git user name and email are required. Provide them as parameters or set GIT_USER_NAME and GIT_USER_EMAIL environment variables.')
      }

      const result = await RepositoryTools.configureUser(name, email)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository user configuration failed: ${error}`)
    }
  },

  git_history: async () => {
    try {
      const history = await RepositoryTools.getCommitHistory()
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: true,
        history,
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository history failed: ${error}`)
    }
  },

  git_configure_user_from_env: async () => {
    try {
      const name = process.env.GIT_USER_NAME
      const email = process.env.GIT_USER_EMAIL

      if (!name || !email) {
        throw new Error('GIT_USER_NAME and GIT_USER_EMAIL environment variables are required but not set.')
      }

      const result = await RepositoryTools.configureUser(name, email)
      const githubAvailable = RepositoryTools.isGitHubAvailable()

      return {
        success: result.success,
        message: result.message,
        source: 'environment_variables',
        githubAvailable,
        method: 'github_api'
      }
    } catch (error) {
      throw new Error(`Repository user configuration from environment failed: ${error}`)
    }
  },

  // AI-Powered Planning and Decision Tools
  analyze_project_request: async (params: { description: string }) => {
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

  generate_project_plan: async (params: {
    description: string;
    projectPath: string;
    projectName?: string
  }) => {
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

  intelligent_project_setup: async (params: {
    description: string;
    projectPath: string;
    autoExecute?: boolean
  }) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured. AI-powered setup requires OPENAI_API_KEY.',
          steps: []
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

      const executionResults = []

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
          recommendedName: analysis.projectName
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
        steps: []
      }
    }
  },

  // Server-side only AI-powered project creation (secure)
  create_project_with_ai: async (params: {
    description: string;
    projectPath?: string;
    projectName?: string;
  }) => {
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
      const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

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
      const executionResults = []
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
      const repositoryUrl = await RepositoryTools.getRepositoryUrl(projectPath)

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

  // Enhanced AI analysis with project optimization recommendations
  analyze_and_optimize: async (params: {
    description: string;
    projectType?: string;
    includeOptimization?: boolean;
  }) => {
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

      let optimization = null
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
  },

  install_dependencies: async (params: { path: string; packages?: string[] }) => {
    try {
      // Check if the project directory exists
      if (!fs.existsSync(params.path)) {
        console.warn(`Project directory does not exist: ${params.path}`)
        return {
          success: true,
          message: 'Dependencies skipped: project directory does not exist (will be installed during build)',
          skipped: true,
          reason: 'directory_not_found'
        }
      }

      // Check if package.json exists
      const packageJsonPath = path.join(params.path, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        console.warn(`package.json not found in: ${params.path}`)
        return {
          success: true,
          message: 'Dependencies skipped: no package.json found (will be installed during build)',
          skipped: true,
          reason: 'no_package_json'
        }
      }

      // In Vercel serverless environment, npm install might fail due to permissions
      // Instead of failing, we'll skip it and let it install during build
    try {
      const command = params.packages
          ? `cd "${params.path}" && npm install ${params.packages.join(' ')}`
          : `cd "${params.path}" && npm install`

        execSync(command, {
          cwd: params.path,
          timeout: 30000, // 30 second timeout
          stdio: 'pipe' // Reduce output
        })

        return { success: true, message: 'Dependencies installed successfully' }
      } catch (execError) {
        console.warn(`npm install failed in serverless environment: ${execError}`)
        // In Vercel, npm install will happen during build anyway
        return {
          success: true,
          message: 'Dependencies installation skipped (will be handled during build process)',
          skipped: true,
          reason: 'serverless_environment',
          originalError: execError instanceof Error ? execError.message : 'Unknown error'
        }
      }
    } catch (error) {
      console.error('Package installation error:', error)
      return {
        success: false,
        message: `Package installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  get_project_templates: async () => {
    const templateList = Object.values(templates).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      files: Object.keys(template.files)
    }))
    return { templates: templateList }
  },

  setup_project_from_template: async (params: {
    projectPath: string;
    templateId: string;
    projectName?: string
  }) => {
    try {
      const template = templates[params.templateId]
      if (!template) {
        throw new Error(`Template not found: ${params.templateId}`)
      }

      // Create project directory
      fs.mkdirSync(params.projectPath, { recursive: true })

      // Write all template files
      for (const [filePath, content] of Object.entries(template.files)) {
        const fullPath = path.join(params.projectPath, filePath)
        const dir = path.dirname(fullPath)
        fs.mkdirSync(dir, { recursive: true })

        // Replace project name placeholder if provided
        let fileContent = content as string
        if (params.projectName) {
          fileContent = (content as string).replace(/react-ts-app|nextjs-fullstack-app|node-api/g, params.projectName)
        }

        fs.writeFileSync(fullPath, fileContent)
      }

      // Update package.json with dependencies
      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

        // Add dependencies
        packageJson.dependencies = packageJson.dependencies || {}
        template.dependencies.forEach((dep: string) => {
          packageJson.dependencies[dep] = 'latest'
        })

        // Add devDependencies
        packageJson.devDependencies = packageJson.devDependencies || {}
        template.devDependencies.forEach((dep: string) => {
          packageJson.devDependencies[dep] = 'latest'
        })

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      }

      return {
        success: true,
        message: `Project created from template: ${template.name}`,
        template: template.name,
        filesCreated: Object.keys(template.files).length
      }
    } catch (error) {
      throw new Error(`Failed to create project from template: ${error}`)
    }
  },

  download_project_zip: async (params: { projectPath: string; projectName?: string }) => {
    try {
      // Check if project directory exists
      if (!fs.existsSync(params.projectPath)) {
        throw new Error(`Project directory not found: ${params.projectPath}`)
      }

      // Get project name from directory or parameter
      const projectName = params.projectName || path.basename(params.projectPath)

      // Collect file data
      const files: { path: string; content: string }[] = []

      const collectFiles = (dirPath: string, relativePath = '') => {
        const items = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const item of items) {
          // Skip common directories that shouldn't be in the zip
          if (item.name === '.git' || item.name === 'node_modules' || item.name === '.next' || item.name === 'dist' || item.name === 'build') {
            continue
          }

          const fullPath = path.join(dirPath, item.name)
          const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name

          if (item.isDirectory()) {
            collectFiles(fullPath, itemRelativePath)
          } else {
            try {
              const content = fs.readFileSync(fullPath, 'utf8')
              files.push({
                path: itemRelativePath,
                content: content
              })
            } catch (error) {
              console.warn(`Skipping file ${itemRelativePath}: ${error}`)
            }
          }
        }
      }

      collectFiles(params.projectPath)

      // Ensure /tmp directory exists (Vercel compatibility)
      const tmpDir = '/tmp'
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      // Create actual zip file and return download URL
      const zipPath = path.join(tmpDir, `${projectName}-${Date.now()}.zip`)

      try {
        // Create the zip file
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        // Handle archiver warnings
        archive.on('warning', (err: { code?: string; message?: string }) => {
          if (err.code === 'ENOENT') {
            console.warn('Archiver warning:', err)
          } else {
            throw err
          }
        })

        // Handle archiver errors
        archive.on('error', (err: { code?: string; message?: string }) => {
          throw err
        })

        archive.pipe(output)

        // Add files to archive
        for (const file of files) {
          archive.append(file.content, { name: file.path })
        }

        await new Promise<void>((resolve, reject) => {
          output.on('close', () => resolve())
          output.on('error', reject)
          archive.on('error', reject)
          archive.finalize()
        })

        // Verify the file was created
        if (!fs.existsSync(zipPath)) {
          throw new Error('Zip file was not created successfully')
        }

        return {
          success: true,
          message: `Project ${projectName} compressed successfully`,
          projectName: projectName,
          fileCount: files.length,
          totalSize: fs.statSync(zipPath).size,
          files: files.map(f => f.path),
          downloadUrl: `/api/download/project?projectName=${encodeURIComponent(projectName)}&zipPath=${encodeURIComponent(zipPath)}`
        }
      } catch (zipError) {
        // Clean up on error
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath)
        }
        throw zipError
      }
    } catch (error) {
      console.error('Download zip error:', error)
      return {
        success: false,
        message: `Failed to create zip: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  create_github_branch: async (params: { projectPath: string; projectName?: string; branchPrefix?: string }) => {
    try {
      console.log('[GitHub Branch] Starting GitHub branch creation process...')

      const githubService = new GitHubService()
      if (!githubService.isGitHubAvailable()) {
        console.log('[GitHub Branch] GitHub token not available')
        return {
          success: false,
          message: 'GitHub token not available. Please set GITHUB_TOKEN environment variable to create branches.'
        }
      }

      console.log('[GitHub Branch] Authenticating with GitHub...')
      const user = await githubService.getAuthenticatedUser()
      if (!user.success || !user.user) {
        console.error('[GitHub Branch] Authentication failed:', user.message)
        return {
          success: false,
          message: user.message || 'Failed to authenticate with GitHub. Please check your GITHUB_TOKEN.'
        }
      }

      console.log(`[GitHub Branch] Authenticated as: ${user.user.login}`)

      const projectName = params.projectName || path.basename(params.projectPath)
      const branchPrefix = params.branchPrefix || 'temp'
      const timestamp = Date.now()
      const tempRepoName = `${branchPrefix}-${projectName}-${timestamp}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-')

      // Check if project directory exists
      if (!fs.existsSync(params.projectPath)) {
        const errorMsg = `Project directory not found: ${params.projectPath}`
        console.error('[GitHub Branch]', errorMsg)
        throw new Error(errorMsg)
      }

      console.log(`[GitHub Branch] Collecting files from: ${params.projectPath}`)
      // Collect all files from the project
      const files = GitHubService.collectFilesFromDirectory(params.projectPath)
      console.log(`[GitHub Branch] Collected ${files.length} files`)

      if (files.length === 0) {
        return {
          success: false,
          message: 'No files found in project directory to upload to GitHub.'
        }
      }

      // Create repository
      console.log(`[GitHub Branch] Creating repository: ${tempRepoName}`)
      const createRepoResult = await githubService.createRepository({
        owner: user.user.login,
        repo: tempRepoName,
        description: `Generated project: ${projectName}`,
        private: false
      })

      if (!createRepoResult.success) {
        console.error('[GitHub Branch] Repository creation failed:', createRepoResult.message)
        return {
          success: false,
          message: `Failed to create repository: ${createRepoResult.message}`
        }
      }

      console.log(`[GitHub Branch] Repository created: ${createRepoResult.url}`)

      // Configure repository for commits
      const repoConfig: GitHubRepoConfig = {
        owner: user.user.login,
        repo: tempRepoName
      }

      // Commit all files to the repository
      console.log('[GitHub Branch] Committing files to repository...')
      const commitResult = await githubService.commitFiles(
        repoConfig,
        files,
        `Generated project: ${projectName}`
      )

      if (!commitResult.success) {
        console.error('[GitHub Branch] Commit failed:', commitResult.message)
        return {
          success: false,
          message: `Repository created but file upload failed: ${commitResult.message}`
        }
      }

      console.log('[GitHub Branch] Files committed successfully')

      return {
        success: true,
        message: `GitHub repository '${tempRepoName}' created successfully with ${files.length} files`,
        repositoryName: tempRepoName,
        repositoryUrl: createRepoResult.url,
        fileCount: files.length,
        owner: user.user.login
      }
    } catch (error) {
      console.error('[GitHub Branch] Error:', error)
      return {
        success: false,
        message: `Failed to create GitHub repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
