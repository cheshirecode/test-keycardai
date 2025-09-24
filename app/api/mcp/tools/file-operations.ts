import * as fs from 'fs'
import * as path from 'path'

export interface CreateDirectoryParams {
  path: string
}

export interface WriteFileParams {
  path: string
  content: string
}

export interface FileOperationResult {
  success: boolean
  path: string
  message?: string
}

/**
 * File Operations Module
 * Handles basic file system operations like creating directories and writing files
 */
export const fileOperations = {
  /**
   * Creates a directory at the specified path
   */
  create_directory: async (params: CreateDirectoryParams): Promise<FileOperationResult> => {
    try {
      fs.mkdirSync(params.path, { recursive: true })
      return { success: true, path: params.path }
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`)
    }
  },

  /**
   * Writes content to a file, creating directories as needed
   */
  write_file: async (params: WriteFileParams): Promise<FileOperationResult> => {
    try {
      const dir = path.dirname(params.path)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(params.path, params.content)
      return { success: true, path: params.path }
    } catch (error) {
      throw new Error(`Failed to write file: ${error}`)
    }
  }
}
