/**
 * Project Planning Service
 * AI-powered project planning and action generation
 */

import { AIService } from '@/lib/ai-service'
import { AIErrorHandler } from './AIErrorHandler'
import { AIPromptBuilder, ResponseParser, ValidationUtils } from '../utils'
import type { 
  AIProjectPlanResult, 
  WorkflowAction,
  ProjectAnalysisData
} from '@/types/mcp/ai-operations'

export class ProjectPlanningService {
  /**
   * Generate comprehensive project plan using AI analysis
   */
  static async generateProjectPlan(
    description: string,
    projectPath: string,
    projectName?: string
  ): Promise<AIProjectPlanResult> {
    // Validate environment
    const envValidation = ValidationUtils.validateEnvironment({ openaiKey: true })
    if (!envValidation.valid) {
      return AIErrorHandler.handleMissingAPIKey('AI planning')
    }

    // Validate inputs
    const validation = ValidationUtils.validateWorkflowContext({
      description,
      projectPath,
      projectName
    })
    if (!validation.valid) {
      return AIErrorHandler.createErrorResponse(`Validation failed: ${validation.errors.join(', ')}`)
    }

    try {
      // First analyze the project
      const analysis = await AIService.analyzeProjectRequest(description)

      // Then generate action plan
      const { actions, response } = await AIService.generateMCPActions(
        description,
        analysis,
        projectPath
      )

      // Map AI service actions to WorkflowAction format
      const workflowActions: WorkflowAction[] = actions.map((action, index) => ({
        step: index + 1,
        action: action.description,
        tool: action.tool,
        params: action.params,
        description: action.description
      }))

      return {
        success: true,
        message: 'Generated intelligent project plan using AI analysis',
        plan: {
          analysis: {
            projectType: analysis.projectType,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            features: analysis.features
          },
          actions: workflowActions,
          expectedOutcome: response,
          totalSteps: workflowActions.length,
          aiPowered: true
        }
      }
    } catch (error) {
      return AIErrorHandler.handleAnalysisError(error, 'AI project planning')
    }
  }

  /**
   * Generate modification plan for existing project
   */
  static async generateModificationPlan(
    requestDescription: string,
    analysisData: ProjectAnalysisData,
    projectPath: string,
    fastMode: boolean = false
  ): Promise<WorkflowAction[]> {
    console.log('[AI Planning] Generating modification plan...')

    // Check if Fast Mode is enabled - skip AI processing
    if (fastMode) {
      console.log('[Fast Mode] Skipping AI planning, using rule-based approach')
      return this.generateRuleBasedPlan(requestDescription, analysisData, projectPath)
    }

    // First try AI-powered planning if OpenAI API is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiPlan = await this.generateAIPoweredPlan(requestDescription, analysisData, projectPath)
        if (aiPlan.length > 0) {
          console.log(`[AI Planning] Successfully generated AI plan with ${aiPlan.length} steps`)
          return aiPlan
        }
      } catch (error) {
        console.log(`[AI Planning] AI planning failed, falling back to rule-based: ${error}`)
      }
    } else {
      console.log('[AI Planning] OpenAI API key not available, using rule-based planning')
    }

    // Fall back to rule-based planning
    console.log('[AI Planning] Using rule-based modification planning')
    return this.generateRuleBasedPlan(requestDescription, analysisData, projectPath)
  }

  /**
   * Generate AI-powered modification plan using OpenAI
   */
  private static async generateAIPoweredPlan(
    requestDescription: string,
    analysisData: ProjectAnalysisData,
    projectPath: string
  ): Promise<WorkflowAction[]> {
    const prompt = AIPromptBuilder.buildModificationPlanPrompt(
      requestDescription,
      analysisData,
      projectPath
    )

    try {
      // Use the ai library directly for this specific use case
      const { generateText } = await import('ai')
      const { openai } = await import('@ai-sdk/openai')

      const result = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt
      })

      // Parse the AI response
      return ResponseParser.parseModificationPlan(result.text)
    } catch (error) {
      console.log(`[AI Planning] Failed to parse AI response: ${error}`)
      throw error
    }
  }

  /**
   * Generate rule-based modification plan as fallback
   */
  private static generateRuleBasedPlan(
    requestDescription: string,
    analysisData: ProjectAnalysisData,
    projectPath: string
  ): WorkflowAction[] {
    const plan: WorkflowAction[] = []
    const lowerRequest = requestDescription.toLowerCase()

    // Component creation patterns
    if ((lowerRequest.includes('add') || lowerRequest.includes('create')) &&
        (lowerRequest.includes('component') || lowerRequest.includes('page'))) {
      plan.push({
        step: 1,
        action: 'Generate React component',
        tool: 'generate_code',
        params: {
          projectPath,
          type: 'component',
          name: ResponseParser.extractComponentName(requestDescription),
          framework: analysisData.framework || 'react'
        },
        description: 'Create new React component based on request'
      })
    }

    // Handle package installation requests
    const packageName = ResponseParser.extractPackageName(requestDescription)
    if (packageName || requestDescription.includes('install') || requestDescription.includes('add')) {
      const detectedPackages = packageName ? [packageName] : ResponseParser.extractMultiplePackages(requestDescription)

      if (detectedPackages.length > 0) {
        plan.push({
          step: plan.length + 1,
          action: 'Install packages',
          tool: 'add_packages',
          params: {
            projectPath,
            packages: detectedPackages,
            dev: requestDescription.includes('dev') || requestDescription.includes('development')
          },
          description: `Install ${detectedPackages.join(', ')} ${requestDescription.includes('dev') ? '(dev dependencies)' : ''}`
        })
      }
    }

    // Style/CSS patterns
    if (lowerRequest.includes('style') || lowerRequest.includes('css') || lowerRequest.includes('design')) {
      plan.push({
        step: plan.length + 1,
        action: 'Update styles',
        tool: 'write_file',
        params: {
          projectPath,
          fileName: 'src/styles/custom.css',
          content: `/* Custom styles for: ${requestDescription} */\n.custom-styles {\n  /* Add your styles here */\n}\n`
        },
        description: 'Add custom styles based on request'
      })
    }

    // API/service patterns
    if (lowerRequest.includes('api') || lowerRequest.includes('service') || lowerRequest.includes('endpoint')) {
      plan.push({
        step: plan.length + 1,
        action: 'Create API service',
        tool: 'generate_code',
        params: {
          projectPath,
          type: 'service',
          name: ResponseParser.extractServiceName(requestDescription),
          framework: analysisData.framework || 'javascript'
        },
        description: 'Create API service for data handling'
      })
    }

    // Configuration/setup patterns
    if (lowerRequest.includes('config') || lowerRequest.includes('setup') || lowerRequest.includes('environment')) {
      plan.push({
        step: plan.length + 1,
        action: 'Update configuration',
        tool: 'write_file',
        params: {
          projectPath,
          fileName: 'config.json',
          content: JSON.stringify({
            name: 'Modified Configuration',
            description: requestDescription,
            timestamp: new Date().toISOString()
          }, null, 2)
        },
        description: 'Update application configuration'
      })
    }

    // Add default documentation step if no specific plan generated
    if (plan.length === 0) {
      plan.push({
        step: 1,
        action: 'Document modification request',
        tool: 'write_file',
        params: {
          projectPath,
          fileName: 'MODIFICATION_LOG.md',
          content: this.generateDocumentationContent(requestDescription, analysisData)
        },
        description: 'Document the modification request for manual review'
      })
    }

    return plan
  }

  /**
   * Generate documentation content for fallback plan
   */
  private static generateDocumentationContent(
    requestDescription: string,
    analysisData: ProjectAnalysisData
  ): string {
    return `# Modification Request

## User Request
${requestDescription}

## Project Analysis
- Type: ${analysisData.projectType || 'unknown'}
- Framework: ${analysisData.framework || 'unknown'}
- Dependencies: ${Object.keys(analysisData.dependencies || {}).length} packages

## Timestamp
${new Date().toISOString()}

## Next Steps
This request requires manual analysis to determine the appropriate modifications.
Consider breaking down the request into more specific actions.
`
  }
}