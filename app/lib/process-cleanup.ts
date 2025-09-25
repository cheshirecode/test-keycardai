import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { CONFIG } from './config'

/**
 * Process Cleanup Utilities
 * Handles cleanup of Node.js and Next.js processes before starting new builds/dev servers
 */

export interface ProcessCleanupResult {
  success: boolean
  message: string
  killedProcesses?: Array<{
    pid: number
    command: string
    port?: number
  }>
  clearedPaths?: string[]
  error?: string
}

/**
 * Kill processes by port number
 */
export async function killProcessByPort(port: number): Promise<ProcessCleanupResult> {
  try {
    const processes: Array<{ pid: number; command: string; port: number }> = []
    
    // Find processes using the port
    try {
      const lsofOutput = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim()
      if (lsofOutput) {
        const pids = lsofOutput.split('\n').map(pid => parseInt(pid.trim())).filter(pid => !isNaN(pid))
        
        for (const pid of pids) {
          try {
            // Get process command
            const psOutput = execSync(`ps -p ${pid} -o command=`, { encoding: 'utf8' }).trim()
            processes.push({ pid, command: psOutput, port })
            
            // Kill the process
            process.kill(pid, 'SIGTERM')
            
            // Wait a bit, then force kill if still running
            setTimeout(() => {
              try {
                process.kill(pid, 'SIGKILL')
              } catch {
                // Process already dead
              }
            }, CONFIG.TIMEOUTS.PROCESS_KILL)
          } catch {
            // Process might already be dead or inaccessible
          }
        }
      }
    } catch {
      // No processes found on this port
    }

    return {
      success: true,
      message: processes.length > 0 
        ? `Killed ${processes.length} process(es) on port ${port}`
        : `No processes found on port ${port}`,
      killedProcesses: processes
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to kill processes on port ${port}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Kill Node.js and Next.js processes by name/pattern
 */
export async function killNodeProcesses(patterns: string[] = ['node', 'next']): Promise<ProcessCleanupResult> {
  try {
    const processes: Array<{ pid: number; command: string }> = []
    
    for (const pattern of patterns) {
      try {
        // Find processes matching the pattern
        const pgrepOutput = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' }).trim()
        if (pgrepOutput) {
          const pids = pgrepOutput.split('\n').map(pid => parseInt(pid.trim())).filter(pid => !isNaN(pid))
          
          for (const pid of pids) {
            try {
              // Get process command to verify it's what we want to kill
              const psOutput = execSync(`ps -p ${pid} -o command=`, { encoding: 'utf8' }).trim()
              
              // Only kill if it's actually a Node.js/Next.js process and not this current process
              if (psOutput.includes('node') && pid !== process.pid && !psOutput.includes('process-cleanup')) {
                processes.push({ pid, command: psOutput })
                
                // Kill the process
                process.kill(pid, 'SIGTERM')
                
                // Wait a bit, then force kill if still running
                setTimeout(() => {
                  try {
                    process.kill(pid, 'SIGKILL')
                  } catch {
                    // Process already dead
                  }
                }, 2000)
              }
            } catch {
              // Process might already be dead or inaccessible
            }
          }
        }
      } catch {
        // No processes found for this pattern
      }
    }

    return {
      success: true,
      message: processes.length > 0 
        ? `Killed ${processes.length} Node.js process(es)`
        : 'No Node.js processes found to kill',
      killedProcesses: processes
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to kill Node.js processes',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clean up build artifacts and temporary files
 */
export async function cleanupBuildArtifacts(projectPath: string): Promise<ProcessCleanupResult> {
  try {
    const clearedPaths: string[] = []
    
    // Common build/cache directories to clean
    const dirsToClean = [
      '.next',
      'dist',
      'build',
      'out',
      '.turbo',
      'node_modules/.cache',
      '.cache'
    ]
    
    for (const dir of dirsToClean) {
      const fullPath = path.join(projectPath, dir)
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true })
          clearedPaths.push(fullPath)
        } catch (error) {
          console.warn(`Failed to remove ${fullPath}:`, error)
        }
      }
    }
    
    // Clean up lock files if needed (optional)
    const lockFiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ]
    
    for (const lockFile of lockFiles) {
      const fullPath = path.join(projectPath, lockFile)
      if (fs.existsSync(fullPath)) {
        // Only remove if we're doing a fresh install
        // clearedPaths.push(fullPath)
      }
    }

    return {
      success: true,
      message: clearedPaths.length > 0 
        ? `Cleaned ${clearedPaths.length} build artifact(s)`
        : 'No build artifacts found to clean',
      clearedPaths
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to clean build artifacts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Comprehensive cleanup before starting new build/dev server
 */
export async function fullProcessCleanup(options: {
  projectPath?: string
  ports?: number[]
  killNodeProcesses?: boolean
  cleanBuildArtifacts?: boolean
} = {}): Promise<ProcessCleanupResult> {
  try {
    const results: ProcessCleanupResult[] = []
    
    // Default ports to clean (Next.js dev server, common ports)
    const portsToClean = options.ports || [...CONFIG.PORTS.DEV_SERVERS]
    
    // Kill processes on specified ports
    for (const port of portsToClean) {
      const result = await killProcessByPort(port)
      results.push(result)
    }
    
    // Kill Node.js processes if requested
    if (options.killNodeProcesses) {
      const result = await killNodeProcesses()
      results.push(result)
    }
    
    // Clean build artifacts if project path provided
    if (options.projectPath && options.cleanBuildArtifacts) {
      const result = await cleanupBuildArtifacts(options.projectPath)
      results.push(result)
    }
    
    // Aggregate results
    const allKilledProcesses = results.flatMap(r => r.killedProcesses || [])
    const allClearedPaths = results.flatMap(r => r.clearedPaths || [])
    const hasErrors = results.some(r => !r.success)
    
    return {
      success: !hasErrors,
      message: `Cleanup completed: ${allKilledProcesses.length} processes killed, ${allClearedPaths.length} paths cleaned`,
      killedProcesses: allKilledProcesses,
      clearedPaths: allClearedPaths,
      error: hasErrors ? 'Some cleanup operations failed' : undefined
    }
  } catch (error) {
    return {
      success: false,
      message: 'Full process cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Safe process cleanup that won't kill the current process
 */
export async function safeProcessCleanup(projectPath?: string): Promise<ProcessCleanupResult> {
  return fullProcessCleanup({
    projectPath,
    ports: [...CONFIG.PORTS.DEV_SERVERS],
    killNodeProcesses: false, // Safer to not kill all Node processes
    cleanBuildArtifacts: !!projectPath
  })
}
