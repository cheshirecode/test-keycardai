/**
 * ChatInputForm Component
 * Handles chat input form and submission
 * Single responsibility: Input form handling
 */

import { ChatInputFormProps } from './types/ChatTypes'

export function ChatInputForm({
  input,
  setInput,
  isLoading,
  isRepositoryMode,
  selectedRepository,
  isCreatingNewProject,
  handleSubmit
}: ChatInputFormProps) {
  return (
    <div className="border-t p-4">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRepositoryMode
            ? `Describe changes for ${selectedRepository?.name} (e.g., 'Add user authentication')`
            : isCreatingNewProject
              ? "Describe your new project (e.g., 'Create a React todo app with TypeScript')"
              : "Describe your project (e.g., 'Create a React app with authentication')"
          }
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Creating...' : 'Send'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        💡 Try: {isRepositoryMode
          ? `"Add authentication" or "Improve the UI design"`
          : isCreatingNewProject
            ? `"Create a Next.js todo app" or "Build a Node.js API with MongoDB"`
            : `"Create a Next.js app with TypeScript" or "Build a Node.js API"`
        }
      </p>
    </div>
  )
}
