import * as fs from 'fs'
import * as path from 'path'
import { RepositoryTools } from '@/lib/repository-tools'
import { execSync } from 'child_process'
import { templates } from '@/lib/templates'

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

  install_dependencies: async (params: { path: string; packages?: string[] }) => {
    try {
      const command = params.packages
        ? `npm install ${params.packages.join(' ')}`
        : 'npm install'

      execSync(command, { cwd: params.path })
      return { success: true, message: 'Dependencies installed' }
    } catch (error) {
      throw new Error(`Package installation failed: ${error}`)
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
        let fileContent = content
        if (params.projectName) {
          fileContent = content.replace(/react-ts-app|nextjs-fullstack-app|node-api/g, params.projectName)
        }

        fs.writeFileSync(fullPath, fileContent)
      }

      // Update package.json with dependencies
      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

        // Add dependencies
        packageJson.dependencies = packageJson.dependencies || {}
        template.dependencies.forEach(dep => {
          packageJson.dependencies[dep] = 'latest'
        })

        // Add devDependencies
        packageJson.devDependencies = packageJson.devDependencies || {}
        template.devDependencies.forEach(dep => {
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
  }
}
