import * as fs from 'fs'
import * as path from 'path'
import { GitTools } from '@/lib/git-tools'
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
      await GitTools.initRepository(params.path)
      return { success: true, message: 'Git repository initialized' }
    } catch (error) {
      throw new Error(`Git init failed: ${error}`)
    }
  },

  git_add_commit: async (params: { path: string; message: string }) => {
    try {
      await GitTools.addAndCommit(params.path, params.message)
      return { success: true, message: `Committed: ${params.message}` }
    } catch (error) {
      throw new Error(`Git commit failed: ${error}`)
    }
  },

  git_status: async (params: { path: string }) => {
    try {
      const status = await GitTools.getStatus(params.path)
      return { success: true, status }
    } catch (error) {
      throw new Error(`Git status failed: ${error}`)
    }
  },

  git_create_branch: async (params: { path: string; branchName: string }) => {
    try {
      await GitTools.createBranch(params.path, params.branchName)
      return { success: true, message: `Created branch: ${params.branchName}` }
    } catch (error) {
      throw new Error(`Branch creation failed: ${error}`)
    }
  },

  git_set_remote: async (params: { path: string; remoteUrl: string }) => {
    try {
      await GitTools.setRemoteOrigin(params.path, params.remoteUrl)
      return { success: true, message: `Set remote origin: ${params.remoteUrl}` }
    } catch (error) {
      throw new Error(`Set remote failed: ${error}`)
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

      await GitTools.configureUser(params.path, name, email)
      return { success: true, message: `Configured git user: ${name} <${email}>` }
    } catch (error) {
      throw new Error(`Git user configuration failed: ${error}`)
    }
  },

  git_history: async (params: { path: string; limit?: number }) => {
    try {
      const history = await GitTools.getCommitHistory(params.path, params.limit || 10)
      return { success: true, history }
    } catch (error) {
      throw new Error(`Git history failed: ${error}`)
    }
  },

  git_configure_user_from_env: async (params: { path: string }) => {
    try {
      const name = process.env.GIT_USER_NAME
      const email = process.env.GIT_USER_EMAIL

      if (!name || !email) {
        throw new Error('GIT_USER_NAME and GIT_USER_EMAIL environment variables are required but not set.')
      }

      await GitTools.configureUser(params.path, name, email)
      return {
        success: true,
        message: `Configured git user from environment: ${name} <${email}>`,
        source: 'environment_variables'
      }
    } catch (error) {
      throw new Error(`Git user configuration from environment failed: ${error}`)
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
