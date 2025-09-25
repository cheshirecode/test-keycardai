/**
 * ChatMessageList Component
 * Renders the main chat content area with messages and commits
 * Single responsibility: Message list rendering and organization
 */

import { ChatMessageItem } from './ChatMessageItem'
import { ChatQuickStart } from './ChatQuickStart'
import { ChatMessageListProps } from './types/ChatTypes'

export function ChatMessageList({
  messages,
  commits,
  isLoading,
  isRepositoryMode,
  selectedRepository,
  isCreatingNewProject,
  quickStartOptions,
  handleQuickStart,
  messagesEndRef
}: ChatMessageListProps) {
  // Show quick start when no messages or commits
  if (messages.length === 0 && commits.length === 0) {
    return (
      <ChatQuickStart
        quickStartOptions={quickStartOptions}
        handleQuickStart={handleQuickStart}
        isLoading={isLoading}
        isRepositoryMode={isRepositoryMode}
        selectedRepository={selectedRepository}
        isCreatingNewProject={isCreatingNewProject}
      />
    )
  }

  return (
    <div className="space-y-4 min-h-full">
      {/* Show commit history for repositories with no regular messages */}
      {messages.length === 0 && commits.length > 0 && (
        <div className="space-y-4">
          {/* Coming soon note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📝 <strong>Chat log is coming, stay tuned!</strong> Below you can see the commit history formatted as conversation messages.
            </p>
          </div>

          {/* Quick start options for scaffolded projects */}
          {isRepositoryMode && selectedRepository && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  🔧 Ready to modify &ldquo;{selectedRepository.name}&rdquo;?
                </h3>
                <p className="text-sm text-gray-600">
                  Tell me what changes you&apos;d like to make, or try one of these quick options:
                </p>
                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {quickStartOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleQuickStart(option)}
                      className="p-3 text-left bg-white hover:bg-blue-50 text-blue-800 rounded-lg transition-colors text-sm border border-blue-200 hover:border-blue-300"
                      disabled={isLoading}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render commits as messages */}
          {commits.map((commit, index) => {
            const isFirstCommit = index === 0
            return (
              <div key={commit.hash} className="flex justify-start">
                <div className="max-w-[85%] space-y-3">
                  {/* First commit gets special treatment as scaffolding request */}
                  {isFirstCommit && (
                    <div className="space-y-2">
                      {/* Chain of Thought for scaffolding */}
                      <details className="group" open>
                        <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-blue-50 transition-colors border border-blue-200 min-w-0">
                          🤔 <span className="text-blue-700 font-medium min-w-[120px] inline-block">AI Reasoning</span>
                          <span className="text-gray-500 text-xs">Project Scaffolding</span>
                        </summary>
                        <div className="mt-2 p-3 bg-blue-50 rounded-md text-xs text-blue-900 border-l-4 border-blue-400">
                          <div className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                            💭 <span>Project Scaffolding Analysis</span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed bg-white p-2 rounded border">
                            {`Initial project setup detected. This appears to be the foundational commit that established the project structure.

Analysis:
- Repository: ${selectedRepository?.name}
- Author: ${commit.author}
- Initial commit suggests this was a scaffolding request to create the project foundation
- Project type likely determined from commit content and structure`}
                          </div>
                        </div>
                      </details>

                      {/* MCP Logs for scaffolding */}
                      <details className="group">
                        <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-green-50 transition-colors border border-green-200 min-w-0">
                          🛠️ <span className="text-green-700 font-medium min-w-[120px] inline-block">MCP Tool Logs</span>
                          <span className="text-gray-500 text-xs">Scaffolding Operations</span>
                        </summary>
                        <div className="mt-2 p-3 bg-green-50 rounded-md text-xs border-l-4 border-green-400">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-green-800">
                              <span className="font-medium">🏗️ Project Scaffolding</span>
                              <span className="text-xs opacity-75">{new Date(commit.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="bg-white p-2 rounded border text-green-900">
                              <pre className="text-xs">Initial project structure created via scaffolding tools</pre>
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Commit message as assistant response */}
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="prose prose-sm max-w-none">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {isFirstCommit ? '🏗️' : '📝'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {isFirstCommit ? 'Project Scaffolding' : 'Commit'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(commit.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <strong>{commit.subject}</strong>
                            {commit.body && (
                              <div className="mt-2 whitespace-pre-wrap text-gray-600">
                                {commit.body}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>👤 {commit.author}</span>
                            <span>🔗 {commit.hash.substring(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Regular messages */}
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[85%]">
            <div className="text-sm font-medium mb-1">🤖 Agent</div>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">Analyzing your request...</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Using AI to understand and plan your project
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
