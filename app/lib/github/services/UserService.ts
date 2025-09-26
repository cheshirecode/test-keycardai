/**
 * User Service
 * Handles GitHub user and organization operations
 */

import type {
  IUserService,
  IGitHubAPIClient,
  IGitHubAuthService,
  IGitHubErrorHandler,
  AuthResult,
  APIResponse,
  UserData
} from '@/types/github'

export class UserService implements IUserService {
  constructor(
    private apiClient: IGitHubAPIClient,
    private authService: IGitHubAuthService,
    private errorHandler: IGitHubErrorHandler
  ) {}

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResult> {
    return this.authService.getAuthenticatedUser()
  }

  /**
   * Get user information by username
   */
  async getUser(username: string): Promise<AuthResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<UserData>(`/users/${username}`)

      if (response.success && response.data) {
        return {
          success: true,
          message: `User information retrieved for ${username}`,
          user: response.data,
          data: response.data
        }
      }

      return {
        success: false,
        message: response.message || `User ${username} not found`,
        user: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get user')
      return {
        success: false,
        message: errorResponse.message,
        user: undefined,
        data: undefined
      }
    }
  }

  /**
   * Check if a user exists
   */
  async checkUserExists(username: string): Promise<APIResponse<boolean>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get(`/users/${username}`)

      return {
        success: true,
        message: response.success 
          ? `User ${username} exists`
          : `User ${username} does not exist`,
        data: response.success
      }
    } catch (error) {
      // For user existence check, 404 is expected for non-existent users
      const apiError = error as { status?: number }
      if (apiError.status === 404) {
        return {
          success: true,
          message: `User ${username} does not exist`,
          data: false
        }
      }

      const errorResponse = this.errorHandler.handleAPIError(error, 'Check user existence')
      return {
        success: false,
        message: errorResponse.message,
        data: false
      }
    }
  }

  /**
   * Get organization information
   */
  async getOrganization(orgName: string): Promise<AuthResult> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get<UserData>(`/orgs/${orgName}`)

      if (response.success && response.data) {
        return {
          success: true,
          message: `Organization information retrieved for ${orgName}`,
          user: response.data,
          data: response.data
        }
      }

      return {
        success: false,
        message: response.message || `Organization ${orgName} not found`,
        user: undefined,
        data: undefined
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get organization')
      return {
        success: false,
        message: errorResponse.message,
        user: undefined,
        data: undefined
      }
    }
  }

  /**
   * Check if an organization exists
   */
  async checkOrganizationExists(orgName: string): Promise<APIResponse<boolean>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const response = await this.apiClient.get(`/orgs/${orgName}`)

      return {
        success: true,
        message: response.success 
          ? `Organization ${orgName} exists`
          : `Organization ${orgName} does not exist`,
        data: response.success
      }
    } catch (error) {
      // For organization existence check, 404 is expected for non-existent orgs
      const apiError = error as { status?: number }
      if (apiError.status === 404) {
        return {
          success: true,
          message: `Organization ${orgName} does not exist`,
          data: false
        }
      }

      const errorResponse = this.errorHandler.handleAPIError(error, 'Check organization existence')
      return {
        success: false,
        message: errorResponse.message,
        data: false
      }
    }
  }

  /**
   * Check if authenticated user is a member of an organization
   */
  async checkOrganizationMembership(orgName: string): Promise<APIResponse<boolean>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      // Get authenticated user first
      const authUser = await this.authService.getAuthenticatedUser()
      if (!authUser.success || !authUser.user) {
        return {
          success: false,
          message: 'Cannot verify authenticated user'
        }
      }

      // Check membership
      const response = await this.apiClient.get(`/orgs/${orgName}/members/${authUser.user.login}`)

      return {
        success: true,
        message: response.success 
          ? `User is a member of organization ${orgName}`
          : `User is not a member of organization ${orgName}`,
        data: response.success
      }
    } catch (error) {
      // For membership check, 404 means not a member (or private membership)
      const apiError = error as { status?: number }
      if (apiError.status === 404) {
        return {
          success: true,
          message: `User is not a member of organization ${orgName}`,
          data: false
        }
      }

      const errorResponse = this.errorHandler.handleAPIError(error, 'Check organization membership')
      return {
        success: false,
        message: errorResponse.message,
        data: false
      }
    }
  }

  /**
   * Get user's public repositories count
   */
  async getUserRepositoryCount(username: string): Promise<APIResponse<number>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const userResponse = await this.apiClient.get<{ public_repos: number }>(`/users/${username}`)

      if (userResponse.success && userResponse.data) {
        return {
          success: true,
          message: `Repository count retrieved for ${username}`,
          data: userResponse.data.public_repos
        }
      }

      return {
        success: false,
        message: userResponse.message || `Failed to get repository count for ${username}`
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get user repository count')
      return {
        success: false,
        message: errorResponse.message,
        data: 0
      }
    }
  }

  /**
   * Get organization's public repositories count
   */
  async getOrganizationRepositoryCount(orgName: string): Promise<APIResponse<number>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      const orgResponse = await this.apiClient.get<{ public_repos: number }>(`/orgs/${orgName}`)

      if (orgResponse.success && orgResponse.data) {
        return {
          success: true,
          message: `Repository count retrieved for organization ${orgName}`,
          data: orgResponse.data.public_repos
        }
      }

      return {
        success: false,
        message: orgResponse.message || `Failed to get repository count for organization ${orgName}`
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Get organization repository count')
      return {
        success: false,
        message: errorResponse.message,
        data: 0
      }
    }
  }

  /**
   * Validate if user can perform actions under a specific owner
   */
  async validateUserPermissions(owner: string): Promise<APIResponse<{
    canCreate: boolean
    canDelete: boolean
    ownerType: 'user' | 'organization' | 'unknown'
  }>> {
    if (!this.apiClient.isClientAvailable()) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    try {
      // Get authenticated user
      const authUser = await this.authService.getAuthenticatedUser()
      if (!authUser.success || !authUser.user) {
        return {
          success: false,
          message: 'Cannot verify authenticated user'
        }
      }

      // Check owner type
      const ownerType = await this.authService.checkOwnerType(owner)
      if (!ownerType.success) {
        return {
          success: false,
          message: ownerType.message
        }
      }

      let canCreate = false
      let canDelete = false

      if (ownerType.type === 'user') {
        // Can create/delete under own user account
        canCreate = canDelete = (authUser.user.login === owner)
      } else if (ownerType.type === 'organization') {
        // Check organization membership for creation rights
        const membership = await this.checkOrganizationMembership(owner)
        canCreate = membership.success && (membership.data || false)
        // Deletion rights typically require admin access (simplified to membership for now)
        canDelete = canCreate
      }

      return {
        success: true,
        message: `Permissions validated for owner ${owner}`,
        data: {
          canCreate,
          canDelete,
          ownerType: ownerType.type || 'unknown'
        }
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleAPIError(error, 'Validate user permissions')
      return {
        success: false,
        message: errorResponse.message,
        data: {
          canCreate: false,
          canDelete: false,
          ownerType: 'unknown' as const
        }
      }
    }
  }
}
