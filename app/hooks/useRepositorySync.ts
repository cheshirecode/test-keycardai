/**
 * Repository Synchronization - REFACTORED to eliminate circular dependencies
 *
 * @deprecated This file is maintained for backward compatibility during migration.
 * New code should use useRepositoryManager() which includes URL synchronization.
 * 
 * BREAKING CHANGE: Removed direct atom imports and mixed concerns.
 * URL synchronization is now handled by useUrlSync() with dependency injection.
 */

'use client'

// useRepositoryManager import removed - no longer needed

/**
 * @deprecated Use useRepositoryManager() instead
 * Hook to synchronize repository selection with URL changes
 * 
 * This hook is now a no-op wrapper around useRepositoryManager()
 * which includes proper URL synchronization without circular dependencies.
 */
export function useRepositorySync() {
  // The new useRepositoryManager() includes URL synchronization
  // through useUrlSync() with proper dependency injection
  
  // This hook no longer needs to do anything explicit
  // URL sync is handled automatically by the repository workflow
  
  console.log('🔄 useRepositorySync: Using new decoupled architecture')
}