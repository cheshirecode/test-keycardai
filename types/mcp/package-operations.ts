/**
 * Package Management Types
 * Type definitions for npm package installation and management
 */

import { MCPBaseResult, MCPProjectPathParams } from './base-types'

// Package Operation Parameters
export interface PackageParams extends MCPProjectPathParams {
  packages: string[]
  dev?: boolean
}

export interface UpdatePackagesParams extends MCPProjectPathParams {
  packages?: string[]
}

// Package Operation Results
export interface PackageResult extends MCPBaseResult {
  installedPackages?: string[]
  failedPackages?: string[]
  output?: string
}

// Package Operations Interface
export interface PackageOperations {
  add_packages: (params: PackageParams) => Promise<PackageResult>
  remove_packages: (params: PackageParams) => Promise<PackageResult>
  update_packages: (params: UpdatePackagesParams) => Promise<PackageResult>
}
