/**
 * File Operations Types
 * Type definitions for file system operations and file management
 */

import { MCPBaseResult, MCPProjectPathParams } from './base-types'

// File Operation Parameters
export interface ReadFileParams extends MCPProjectPathParams {
  filePath: string
}

export interface UpdateFileParams extends MCPProjectPathParams {
  filePath: string
  content: string
}

export interface DeleteFileParams extends MCPProjectPathParams {
  filePath: string
}

export interface SearchFileParams extends MCPProjectPathParams {
  pattern: string
  filePattern?: string
  searchContent?: boolean
}

// File Operation Results
export interface FileOperationResult extends MCPBaseResult {
  content?: string
  matches?: Array<{
    filePath: string
    lineNumber?: number
    line?: string
  }>
}

// File Operations Interface
export interface FileOperations {
  read_file: (params: ReadFileParams) => Promise<FileOperationResult>
  update_file: (params: UpdateFileParams) => Promise<FileOperationResult>
  delete_file: (params: DeleteFileParams) => Promise<FileOperationResult>
  search_files: (params: SearchFileParams) => Promise<FileOperationResult>
}
