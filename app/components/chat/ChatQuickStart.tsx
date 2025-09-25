/**
 * ChatQuickStart Component
 * Renders quick start options and welcome states
 * Single responsibility: Quick start UI and interactions
 */

import { ChatQuickStartProps } from '@/types'

export function ChatQuickStart({
  quickStartOptions,
  handleQuickStart,
  isLoading,
  isRepositoryMode,
  selectedRepository,
  isCreatingNewProject
}: ChatQuickStartProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
      <div className="space-y-2 w-full">
        <h2 className="text-xl font-semibold text-gray-900 text-center mx-auto">
          {isRepositoryMode
            ? '🔧 Project Modification Mode'
            : isCreatingNewProject
              ? '✨ New Project Creation Mode'
              : '👋 Welcome to Project Scaffolder'
          }
        </h2>
        <p className="text-gray-600 text-center mx-auto max-w-md">
          {isRepositoryMode
            ? `I can help you modify and improve "${selectedRepository?.name}". Tell me what changes you'd like to make!`
            : isCreatingNewProject
              ? '🚀 Ready to create your new project! Describe what you want to build and I\'ll scaffold it for you.'
              : 'I can help you create new projects quickly. Just describe what you want to build!'
          }
        </p>

        {/* New Project Mode Indicator */}
        {isCreatingNewProject && !isRepositoryMode && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-green-800 text-center">
              🎯 <strong>New Project Mode Active!</strong> Type your project description below to get started.
            </p>
          </div>
        )}

        {/* Chat log coming soon note for repository mode */}
        {isRepositoryMode && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-blue-800 text-center">
              📝 <strong>Chat log is coming, stay tuned!</strong> Soon you&apos;ll see the full conversation history integrated with git commits.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 w-full max-w-sm">
        <p className="text-sm font-medium text-gray-700">Quick Start:</p>
        {quickStartOptions.map((option) => (
          <button
            key={option}
            onClick={() => handleQuickStart(option)}
            className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors text-sm"
            disabled={isLoading}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
