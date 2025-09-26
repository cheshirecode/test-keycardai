/**
 * GitHub Authentication Service
 * Handles authentication, user validation, and owner type detection
 */

import type { 
  IGitHubAuthService, 
  IGitHubAPIClient,
  AuthResult, 
  OwnerTypeResult, 
  AccessResult,
  UserData
} from '@/types/github'

export class GitHubAuthService implements IGitHubAuthService {
  private userCache: Map<string, UserData> = new Map()
  private ownerTypeCache: Map<string, 'user' | 'organization'> = new Map()

  constructor(private apiClient: IGitHubAPIClient) {}

  /**
   * Validate GitHub token by attempting to get authenticated user
   */
  async validateToken(): Promise<AuthResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<UserData>('/user')
      
      if (response.success && response.data) {
        // Cache the authenticated user
        this.userCache.set('authenticated', response.data)
        
        return {
          success: true,
          message: 'Token validation successful',
          user: response.data,
          data: response.data
        }
      }

      return {
        success: false,
        message: response.message || 'Token validation failed'
      }
    } catch (error) {
      return {
        success: false,
        message: `Token validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser(): Promise<AuthResult> {
    // Check cache first
    const cachedUser = this.userCache.get('authenticated')
    if (cachedUser) {
      return {
        success: true,
        message: 'Retrieved authenticated user from cache',
        user: cachedUser,
        data: cachedUser
      }
    }

    // Validate token (which will cache the user)
    return this.validateToken()
  }

  /**
   * Check if owner is a user or organization
   */
  async checkOwnerType(owner: string): Promise<OwnerTypeResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    // Check cache first
    const cachedType = this.ownerTypeCache.get(owner)
    if (cachedType) {
      return {
        success: true,
        message: `Owner '${owner}' is a ${cachedType}`,
        type: cachedType
      }
    }

    try {
      // First try to get as organization
      const orgResponse = await this.apiClient.get(`/orgs/${owner}`)
      
      if (orgResponse.success) {
        this.ownerTypeCache.set(owner, 'organization')
        return {
          success: true,
          message: `Owner '${owner}' is an organization`,
          type: 'organization'
        }
      }

      // If organization check fails, try as user
      const userResponse = await this.apiClient.get(`/users/${owner}`)
      
      if (userResponse.success) {
        this.ownerTypeCache.set(owner, 'user')
        return {
          success: true,
          message: `Owner '${owner}' is a user`,
          type: 'user'
        }
      }

      return {
        success: false,
        message: `Owner '${owner}' not found or inaccessible`
      }
    } catch (error) {
      return {
        success: false,
        message: `Error checking owner type: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Validate repository access for the authenticated user
   */
  async validateRepositoryAccess(owner: string, repo: string): Promise<AccessResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get(`/repos/${owner}/${repo}`)
      
      if (response.success && response.data) {
        const repoData = response.data as { 
          permissions?: { 
            admin?: boolean
            push?: boolean
            pull?: boolean
          }
        }

        const permissions = repoData.permissions
        let permission: 'read' | 'write' | 'admin' = 'read'

        if (permissions?.admin) {
          permission = 'admin'
        } else if (permissions?.push) {
          permission = 'write'
        }

        return {
          success: true,
          message: `Access validated for ${owner}/${repo}`,
          hasAccess: true,
          permission
        }
      }

      return {
        success: false,
        message: `Repository ${owner}/${repo} not found or inaccessible`,
        hasAccess: false
      }
    } catch (error) {
      return {
        success: false,
        message: `Error validating repository access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        hasAccess: false
      }
    }
  }

  /**
   * Check if authenticated user can create repositories under the specified owner
   */
  async canCreateRepository(owner: string): Promise<AccessResult> {
    const authUser = await this.getAuthenticatedUser()
    if (!authUser.success || !authUser.user) {
      return {
        success: false,
        message: 'Cannot verify authenticated user',
        hasAccess: false
      }
    }

    const ownerType = await this.checkOwnerType(owner)
    if (!ownerType.success) {
      return {
        success: false,
        message: ownerType.message,
        hasAccess: false
      }
    }

    if (ownerType.type === 'user') {
      // Can only create under own user account
      const canCreate = authUser.user.login === owner
      return {
        success: true,
        message: canCreate 
          ? `Can create repository under user '${owner}'`
          : `Cannot create repository under user '${owner}' - not authenticated user`,
        hasAccess: canCreate,
        permission: canCreate ? 'admin' : undefined
      }
    }

    if (ownerType.type === 'organization') {
      // Check organization membership and permissions
      try {
        const memberResponse = await this.apiClient.get(`/orgs/${owner}/members/${authUser.user.login}`)
        
        return {
          success: true,
          message: memberResponse.success 
            ? `Can create repository under organization '${owner}'`
            : `Cannot create repository under organization '${owner}' - not a member`,
          hasAccess: memberResponse.success,
          permission: memberResponse.success ? 'write' : undefined
        }
      } catch (error) {
        return {
          success: false,
          message: `Error checking organization membership: ${error instanceof Error ? error.message : 'Unknown error'}`,
          hasAccess: false
        }
      }
    }

    return {
      success: false,
      message: `Unknown owner type for '${owner}'`,
      hasAccess: false
    }
  }

  /**
   * Clear authentication cache
   */
  clearCache(): void {
    this.userCache.clear()
    this.ownerTypeCache.clear()
  }
}
