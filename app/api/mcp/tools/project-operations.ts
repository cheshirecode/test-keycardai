import * as fs from 'fs'
import * as path from 'path'
import archiver from 'archiver'
import { execSync } from 'child_process'
import { templates } from '../../../../src/lib/templates'

export interface InstallDependenciesParams {
  path: string
  packages?: string[]
}

export interface SetupProjectFromTemplateParams {
  projectPath: string
  templateId: string
  projectName?: string
}

export interface DownloadProjectZipParams {
  projectPath: string
  projectName?: string
}

export interface ProjectTemplateInfo {
  id: string
  name: string
  description: string
  files: string[]
}

export interface InstallDependenciesResult {
  success: boolean
  message: string
  skipped?: boolean
  reason?: string
  originalError?: string
  error?: string
}

export interface TemplateSetupResult {
  success: boolean
  message: string
  template: string
  filesCreated: number
}

export interface ProjectZipResult {
  success: boolean
  message: string
  projectName?: string
  fileCount?: number
  totalSize?: number
  files?: string[]
  downloadUrl?: string
  error?: string
}

/**
 * Project Operations Module
 * Handles project-level operations like dependency management, templates, and project packaging
 */
export const projectOperations = {
  /**
   * Installs npm dependencies for a project
   */
  install_dependencies: async (params: InstallDependenciesParams): Promise<InstallDependenciesResult> => {
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

  /**
   * Gets a list of available project templates
   */
  get_project_templates: async (): Promise<{ templates: ProjectTemplateInfo[] }> => {
    const templateList = Object.values(templates).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      files: Object.keys(template.files)
    }))
    return { templates: templateList }
  },

  /**
   * Creates a project from a predefined template
   */
  setup_project_from_template: async (params: SetupProjectFromTemplateParams): Promise<TemplateSetupResult> => {
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

  /**
   * Creates a downloadable ZIP archive of a project
   */
  download_project_zip: async (params: DownloadProjectZipParams): Promise<ProjectZipResult> => {
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
  }
}
