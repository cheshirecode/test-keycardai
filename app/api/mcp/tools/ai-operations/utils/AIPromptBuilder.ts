/**
 * AI Prompt Builder
 * Utilities for constructing AI prompts
 */

import type { AIAnalysisData } from '@/types/mcp/ai-operations'

export class AIPromptBuilder {
  /**
   * Build project analysis prompt
   */
  static buildAnalysisPrompt(description: string): string {
    return `Analyze this project request and determine the project type, features, and confidence level:

Project Description: ${description}

Please provide:
1. Project type (e.g., "React Application", "Next.js Application", "Express API")
2. Key features that should be included
3. Confidence level (0-1) in your analysis
4. Reasoning for your decisions
5. Recommended project name

Focus on identifying the most appropriate technology stack and architecture.`
  }

  /**
   * Build contextual analysis prompt for existing projects
   */
  static buildContextualAnalysisPrompt(
    description: string,
    projectType: string,
    framework: string,
    dependencies: string[],
    structure: string[]
  ): string {
    return `Existing Project Context:
- Type: ${projectType}
- Framework: ${framework}
- Dependencies: ${dependencies.join(', ')}
- Structure: ${structure.slice(0, 10).join(', ')}${structure.length > 10 ? '...' : ''}

User Request: ${description}

Please analyze how to implement this request in the context of the existing project.`
  }

  /**
   * Build modification planning prompt
   */
  static buildModificationPlanPrompt(
    requestDescription: string,
    analysisData: Record<string, unknown>,
    projectPath: string
  ): string {
    return `You are an expert software architect and developer. Based on the following project analysis and user request, generate a detailed step-by-step modification plan.

PROJECT ANALYSIS:
- Type: ${analysisData.projectType || 'unknown'}
- Framework: ${analysisData.framework || 'unknown'}
- Structure: ${JSON.stringify(analysisData.structure || [])}
- Dependencies: ${JSON.stringify(analysisData.dependencies || {})}
- Recommendations: ${JSON.stringify(analysisData.recommendations || [])}

USER REQUEST:
${requestDescription}

PROJECT PATH: ${projectPath}

Available MCP tools:
- generate_code: Create new files/components
- add_packages: Install npm packages
- write_file: Create/update specific files
- create_directory: Create new directories
- run_script: Execute npm scripts or commands

Generate a JSON array of modification steps. Each step should have:
{
  "step": number,
  "action": "brief action name",
  "tool": "mcp_tool_name",
  "params": { tool_specific_parameters },
  "description": "detailed description of what this step does"
}

Focus on:
1. Installing any required dependencies first
2. Creating necessary directory structure
3. Generating/modifying code files
4. Running any build/setup commands
5. Ensuring compatibility with existing project structure

Respond with ONLY the JSON array, no other text.`
  }

  /**
   * Build repository modification prompt
   */
  static buildRepositoryModificationPrompt(
    description: string,
    repository: { name: string; url: string; description?: string }
  ): string {
    return `REPOSITORY MODIFICATION REQUEST:
Repository: ${repository.name}
URL: ${repository.url}
Description: ${repository.description || 'No description'}

User Request: ${description}

This is a modification to an existing repository, NOT a new project creation. Please analyze what changes need to be made to the existing codebase.`
  }

  /**
   * Build chain of thought summary
   */
  static buildChainOfThought(
    analysis: AIAnalysisData,
    actions: Array<{ description: string }>,
    repositoryUrl: string | null,
    projectPath: string,
    modelUsed: string
  ): string {
    return [
      `🤖 AI Analysis: ${analysis.reasoning}`,
      `📊 Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
      `📁 Project Type: ${analysis.projectType}`,
      ...(analysis.features && analysis.features.length > 0 ? [`✨ Detected Features: ${analysis.features.join(', ')}`] : []),
      '🔄 Execution Plan:',
      ...actions.map((action, index) => `  ${index + 1}. ${action.description}`),
      repositoryUrl ? `🔗 Repository: ${repositoryUrl}` : '',
      `📂 Project Path: ${projectPath}`,
      `✅ Total Steps: ${actions.length}`,
      `🤖 AI Model: ${modelUsed}`
    ].filter(Boolean).join('\n')
  }

  /**
   * Build fast mode response
   */
  static buildFastModeResponse(projectName: string): {
    analysis: {
      projectType: string
      confidence: number
      reasoning: string
      features: string[]
      recommendedName: string
    }
    plannedActions: string[]
    executionSteps: Array<{
      step: number
      action: string
      tool: string
      success: boolean
      result: string
      timestamp: string
    }>
  } {
    return {
      analysis: {
        projectType: 'web-application',
        confidence: 0.8,
        reasoning: 'Fast Mode: Rule-based analysis based on common patterns',
        features: ['typescript', 'react', 'modern-tooling'],
        recommendedName: projectName
      },
      plannedActions: [
        'Create project structure',
        'Install basic dependencies',
        'Setup configuration files'
      ],
      executionSteps: [
        {
          step: 1,
          action: 'Create directory structure',
          tool: 'rule-based',
          success: true,
          result: 'Directory structure created',
          timestamp: new Date().toISOString()
        },
        {
          step: 2,
          action: 'Install basic dependencies',
          tool: 'rule-based',
          success: true,
          result: 'Dependencies configured',
          timestamp: new Date().toISOString()
        },
        {
          step: 3,
          action: 'Setup configuration',
          tool: 'rule-based',
          success: true,
          result: 'Configuration files created',
          timestamp: new Date().toISOString()
        }
      ]
    }
  }
}