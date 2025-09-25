import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { CONFIG } from '@/lib/config'

export interface PackageParams {
  projectPath: string
  packages: string[]
  dev?: boolean
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
}

export interface PackageInfoParams {
  projectPath: string
  packageName?: string
}

export interface PackageResult {
  success: boolean
  message: string
  packageManager?: string
  packages?: string[]
  info?: {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    outdated?: Record<string, { current: string; wanted: string; latest: string }>
  }
  error?: string
}

/**
 * Package Management Module
 * Handles adding, removing, and updating packages in projects
 */
export const packageManagement = {
  /**
   * Add packages to the project
   */
  add_packages: async (params: PackageParams): Promise<PackageResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'No package.json found. Initialize the project first.'
        }
      }

      const packageManager = params.packageManager || detectPackageManager(params.projectPath)
      const devFlag = params.dev ? (packageManager === 'npm' ? '--save-dev' : '-D') : ''
      
      let command: string
      switch (packageManager) {
        case 'yarn':
          command = `yarn add ${devFlag} ${params.packages.join(' ')}`
          break
        case 'pnpm':
          command = `pnpm add ${devFlag} ${params.packages.join(' ')}`
          break
        case 'bun':
          command = `bun add ${devFlag} ${params.packages.join(' ')}`
          break
        default:
          command = `npm install ${devFlag} ${params.packages.join(' ')}`
      }

      try {
        execSync(command, {
          cwd: params.projectPath,
          stdio: 'pipe',
          timeout: CONFIG.TIMEOUTS.SCRIPT_EXECUTION
        })

        return {
          success: true,
          message: `Successfully added packages: ${params.packages.join(', ')}`,
          packageManager,
          packages: params.packages
        }
      } catch {
        // In serverless environments, package installation might fail
        // In that case, we can update package.json manually
        return await addPackagesManually(params)
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to add packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Remove packages from the project
   */
  remove_packages: async (params: PackageParams): Promise<PackageResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'No package.json found.'
        }
      }

      const packageManager = params.packageManager || detectPackageManager(params.projectPath)
      
      let command: string
      switch (packageManager) {
        case 'yarn':
          command = `yarn remove ${params.packages.join(' ')}`
          break
        case 'pnpm':
          command = `pnpm remove ${params.packages.join(' ')}`
          break
        case 'bun':
          command = `bun remove ${params.packages.join(' ')}`
          break
        default:
          command = `npm uninstall ${params.packages.join(' ')}`
      }

      try {
        execSync(command, {
          cwd: params.projectPath,
          stdio: 'pipe',
          timeout: 30000
        })

        return {
          success: true,
          message: `Successfully removed packages: ${params.packages.join(', ')}`,
          packageManager,
          packages: params.packages
        }
      } catch {
        // Fallback to manual removal
        return await removePackagesManually(params)
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Update packages in the project
   */
  update_packages: async (params: { projectPath: string; packages?: string[]; packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun' }): Promise<PackageResult> => {
    try {
      if (!fs.existsSync(params.projectPath)) {
        return {
          success: false,
          message: `Project directory not found: ${params.projectPath}`
        }
      }

      const packageManager = params.packageManager || detectPackageManager(params.projectPath)
      
      let command: string
      if (params.packages && params.packages.length > 0) {
        // Update specific packages
        switch (packageManager) {
          case 'yarn':
            command = `yarn upgrade ${params.packages.join(' ')}`
            break
          case 'pnpm':
            command = `pnpm update ${params.packages.join(' ')}`
            break
          case 'bun':
            command = `bun update ${params.packages.join(' ')}`
            break
          default:
            command = `npm update ${params.packages.join(' ')}`
        }
      } else {
        // Update all packages
        switch (packageManager) {
          case 'yarn':
            command = 'yarn upgrade'
            break
          case 'pnpm':
            command = 'pnpm update'
            break
          case 'bun':
            command = 'bun update'
            break
          default:
            command = 'npm update'
        }
      }

      try {
        execSync(command, {
          cwd: params.projectPath,
          stdio: 'pipe',
          timeout: CONFIG.TIMEOUTS.PACKAGE_INSTALL
        })

        const updateTarget = params.packages?.length ? params.packages.join(', ') : 'all packages'
        return {
          success: true,
          message: `Successfully updated ${updateTarget}`,
          packageManager,
          packages: params.packages
        }
      } catch (execError) {
        return {
          success: false,
          message: `Package update failed in serverless environment. Updates will be applied during next build.`,
          packageManager,
          error: execError instanceof Error ? execError.message : 'Unknown error'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Get package information and check for outdated packages
   */
  get_package_info: async (params: PackageInfoParams): Promise<PackageResult> => {
    try {
      const packageJsonPath = path.join(params.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: 'No package.json found.'
        }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const packageManager = detectPackageManager(params.projectPath)

      let outdated: Record<string, { current: string; wanted: string; latest: string }> = {}

      // Try to get outdated package info
      try {
        let command: string
        switch (packageManager) {
          case 'yarn':
            command = 'yarn outdated --json'
            break
          case 'pnpm':
            command = 'pnpm outdated --format json'
            break
          default:
            command = 'npm outdated --json'
        }

        const result = execSync(command, {
          cwd: params.projectPath,
          stdio: 'pipe',
          timeout: 30000
        })

        // Parse outdated packages (format varies by package manager)
        const outdatedData = JSON.parse(result.toString())
        if (packageManager === 'npm') {
          outdated = outdatedData
        }
        // Handle other package managers' formats as needed
      } catch {
        // Outdated check failed, continue without it
      }

      return {
        success: true,
        message: `Package information retrieved for ${packageJson.name || 'project'}`,
        packageManager,
        info: {
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
          outdated: Object.keys(outdated).length > 0 ? outdated : undefined
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to get package info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Detect the package manager used in the project
 */
function detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' | 'bun' {
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn'
  }
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) {
    return 'bun'
  }
  return 'npm'
}

/**
 * Manually add packages to package.json when command execution fails
 */
async function addPackagesManually(params: PackageParams): Promise<PackageResult> {
  try {
    const packageJsonPath = path.join(params.projectPath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const targetSection = params.dev ? 'devDependencies' : 'dependencies'
    if (!packageJson[targetSection]) {
      packageJson[targetSection] = {}
    }

    // Add packages with "latest" version
    for (const pkg of params.packages) {
      packageJson[targetSection][pkg] = 'latest'
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    return {
      success: true,
      message: `Packages added to package.json: ${params.packages.join(', ')}. Install will happen during build.`,
      packages: params.packages
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to update package.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Manually remove packages from package.json when command execution fails
 */
async function removePackagesManually(params: PackageParams): Promise<PackageResult> {
  try {
    const packageJsonPath = path.join(params.projectPath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Remove from both dependencies and devDependencies
    for (const pkg of params.packages) {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        delete packageJson.dependencies[pkg]
      }
      if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
        delete packageJson.devDependencies[pkg]
      }
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    return {
      success: true,
      message: `Packages removed from package.json: ${params.packages.join(', ')}`,
      packages: params.packages
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to update package.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
