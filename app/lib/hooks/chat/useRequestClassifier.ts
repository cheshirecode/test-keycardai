import { useCallback } from 'react'

export type RequestType = 'new_project' | 'repository_modification' | 'project_modification'

export interface ClassificationResult {
  type: RequestType
  confidence: number
  reasoning: string
}

/**
 * Hook for classifying user requests
 * Single responsibility: Request type detection
 */
export function useRequestClassifier() {
  
  const classifyRequest = useCallback((
    content: string, 
    hasSelectedRepository: boolean, 
    hasCurrentProject: boolean
  ): ClassificationResult => {
    const lowerContent = content.toLowerCase()
    
    // Enhanced keyword detection
    const modificationKeywords = [
      'add', 'install', 'include', 'integrate', 'update', 'upgrade', 'modify', 'change',
      'remove', 'delete', 'uninstall', 'configure', 'setup', 'enable', 'disable',
      'implement', 'create component', 'create hook', 'create page', 'create util',
      'refactor', 'optimize', 'fix', 'debug', 'test', 'improve'
    ]
    
    const newProjectKeywords = [
      'create project', 'new project', 'build app', 'generate app', 'scaffold',
      'start new', 'make a', 'build a new', 'create a new'
    ]
    
    // Check for explicit new project intent
    const hasNewProjectIntent = newProjectKeywords.some(keyword =>
      lowerContent.includes(keyword)
    )
    
    // Check for modification intent
    const hasModificationIntent = modificationKeywords.some(keyword =>
      lowerContent.includes(keyword)
    )
    
    // Classification logic with confidence scoring
    if (hasNewProjectIntent) {
      return {
        type: 'new_project',
        confidence: 0.9,
        reasoning: 'Explicit new project keywords detected'
      }
    }
    
    if (hasSelectedRepository && hasModificationIntent) {
      return {
        type: 'repository_modification',
        confidence: 0.85,
        reasoning: 'Repository context + modification keywords'
      }
    }
    
    if (hasCurrentProject && hasModificationIntent) {
      return {
        type: 'project_modification',
        confidence: 0.8,
        reasoning: 'Project context + modification keywords'
      }
    }
    
    // Short commands are likely modifications if in context
    if (content.split(' ').length <= 3 && hasModificationIntent) {
      if (hasSelectedRepository) {
        return {
          type: 'repository_modification',
          confidence: 0.7,
          reasoning: 'Short modification command in repository context'
        }
      }
      if (hasCurrentProject) {
        return {
          type: 'project_modification',
          confidence: 0.7,
          reasoning: 'Short modification command in project context'
        }
      }
    }
    
    // Default to new project creation
    return {
      type: 'new_project',
      confidence: 0.6,
      reasoning: 'No clear modification context, defaulting to new project'
    }
  }, [])

  return {
    classifyRequest
  }
}
