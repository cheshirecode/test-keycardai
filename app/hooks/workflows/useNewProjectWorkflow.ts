/**
 * New Project Workflow Hook
 * 
 * Handles the complete new project creation workflow.
 * Uses dependency injection to avoid circular dependencies.
 * 
 * Benefits:
 * - Single responsibility: new project workflow
 * - No circular dependencies
 * - Easy to test with mocked dependencies
 * - Clear workflow orchestration
 */

'use client'

import type { RepositoryActions } from '../core/useRepositoryActions'
import type { NavigationActions } from '../navigation/useNavigation'

export interface NewProjectWorkflowDependencies {
  repositoryActions: RepositoryActions
  navigation: NavigationActions
}

export interface NewProjectWorkflow {
  startNewProject: () => void
}

/**
 * New project workflow hook - accepts dependencies to avoid circular imports
 */
export function useNewProjectWorkflow(dependencies: NewProjectWorkflowDependencies): NewProjectWorkflow {
  const { repositoryActions, navigation } = dependencies

  const startNewProject = () => {
    console.log('🚀 Starting new project flow')

    // Clear all data but preserve the creating flag
    repositoryActions.clearAllRepositoryData(true)

    // Navigate to home
    navigation.navigateToHome()

    console.log('✅ New project flow initialized')
  }

  return { startNewProject }
}
