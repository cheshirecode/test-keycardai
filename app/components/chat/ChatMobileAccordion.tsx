/**
 * ChatMobileAccordion Component
 * Handles mobile accordion layout for chat and preview panels
 * Single responsibility: Mobile responsive layout
 */

// Import components for mobile layout
import { ProjectPreview } from '@/components/project'
import { RepositoryPreview } from '@/components/repository'
import { ChatMobileAccordionProps } from '@/types'

export function ChatMobileAccordion({
  mobileExpandedPanel,
  setMobileExpandedPanel,
  messages,
  commits,
  isLoading,
  isRepositoryMode,
  selectedRepository,
  isCreatingNewProject,
  currentProject,
  input,
  setInput,
  handleSubmit,
  messagesEndRef,
  inputRef,
  quickStartOptions,
  handleQuickStart
}: ChatMobileAccordionProps) {
  // Mobile accordion component for responsive layout

  return (
    <div className="flex flex-col flex-1 min-h-0 lg:hidden">
      {/* Chat Section */}
      <div className={`bg-white border-b border-gray-200 transition-all duration-300 flex flex-col ${
        mobileExpandedPanel === 'chat'
          ? 'flex-1 min-h-0'
          : 'flex-none'
      }`}>
        {/* Chat Header */}
        <button
          onClick={() => setMobileExpandedPanel(
            mobileExpandedPanel === 'chat' ? null : 'chat'
          )}
          className="w-full p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900">💬 Chat</h2>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {messages.length}
              </span>
            )}
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                mobileExpandedPanel === 'chat' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Chat Content */}
        {mobileExpandedPanel === 'chat' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
              {/* Mobile simplified message rendering */}
              {messages.length === 0 && commits.length === 0 ? (
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

                  {/* Quick Start Options */}
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
              ) : (
                <div className="space-y-4">
                  {/* Render repository commits if available */}
                  {commits.map((commit, index) => {
                    const isFirstCommit = index === 0

                    return (
                      <div key={commit.hash} className="flex justify-start">
                        <div className="max-w-full w-full">
                          {/* Repository commit as user message */}
                          <div className="flex justify-end mb-3">
                            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-sm">
                              <p className="text-sm">
                                {isFirstCommit
                                  ? `Create "${selectedRepository?.name}" project`
                                  : commit.message || 'Update project'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Commit details collapsible */}
                          {isFirstCommit && (
                            <div className="mb-3 space-y-2">
                              {/* Chat Log Disclaimer - First */}
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  📝 <strong>Chat log is coming, stay tuned!</strong> Below you can see the commit history formatted as conversation messages.
                                </p>
                              </div>

                              {/* Quick Actions Section - Second */}
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

                              <details className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <summary className="cursor-pointer text-green-800 font-medium text-sm">
                                  📁 View Project Structure
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <div className="flex flex-col gap-2">
                                    <div className="text-green-700 text-xs font-medium bg-green-200 px-2 py-1 rounded break-words">
                                      <span className="font-medium">🏗️ Project Scaffolding</span>
                                      <span className="block text-xs opacity-75 mt-1">{new Date(commit.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded border text-green-900 overflow-hidden">
                                      <pre className="text-xs whitespace-pre-wrap break-words max-w-full overflow-hidden">Initial project structure created via scaffolding tools</pre>
                                    </div>
                                  </div>
                                </div>
                              </details>

                              {/* Agent Chain of Thought Section - Third */}
                              <details className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <summary className="cursor-pointer text-purple-800 font-medium text-sm">
                                  🧠 Agent Chain of Thought
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <div className="bg-white p-2 rounded border text-purple-900 overflow-hidden">
                                    <div className="text-xs space-y-2">
                                      <div className="break-words">
                                        <span className="font-medium block">1. Project Analysis:</span>
                                        <span className="text-purple-700">Analyzed user requirements and selected appropriate template</span>
                                      </div>
                                      <div className="break-words">
                                        <span className="font-medium block">2. Structure Planning:</span>
                                        <span className="text-purple-700">Designed file structure based on best practices</span>
                                      </div>
                                      <div className="break-words">
                                        <span className="font-medium block">3. Implementation:</span>
                                        <span className="text-purple-700">Generated files, configured dependencies, and initialized repository</span>
                                      </div>
                                      <div className="break-words">
                                        <span className="font-medium block">4. Verification:</span>
                                        <span className="text-purple-700">Validated project structure and repository creation</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </details>

                              {/* MCP Logs Section - Last */}
                              <details className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <summary className="cursor-pointer text-blue-800 font-medium text-sm">
                                  🔧 MCP Operation Logs
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <div className="bg-white p-2 rounded border text-blue-900 overflow-hidden">
                                    <div className="text-xs space-y-1">
                                      <div className="flex flex-col gap-1">
                                        <span className="font-medium">📦 File Operations:</span>
                                        <span className="text-blue-700 break-all">✓ Created project structure</span>
                                        <span className="text-blue-700 break-all">✓ Generated configuration files</span>
                                        <span className="text-blue-700 break-all">✓ Initialized git repository</span>
                                      </div>
                                      <div className="flex flex-col gap-1 mt-2">
                                        <span className="font-medium">🌐 GitHub Operations:</span>
                                        <span className="text-blue-700 break-all">✓ Repository created successfully</span>
                                        <span className="text-blue-700 break-all">✓ Initial commit pushed</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}


                  {/* Render chat messages */}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isRepositoryMode
                      ? `Describe changes for ${selectedRepository?.name}...`
                      : isCreatingNewProject
                        ? "Describe your new project..."
                        : "Describe the project you want to create..."
                    }
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium"
                  >
                    {isLoading ? '...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className={`bg-white transition-all duration-300 flex flex-col ${
        mobileExpandedPanel === 'preview'
          ? 'flex-1 min-h-0'
          : 'flex-none'
      }`}>
        {/* Preview Header */}
        <button
          onClick={() => setMobileExpandedPanel(
            mobileExpandedPanel === 'preview' ? null : 'preview'
          )}
          className="w-full p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {isRepositoryMode ? '🔧 Repository Details' : '📁 Project Preview'}
          </h2>
          <div className="flex items-center space-x-2">
            {(currentProject || selectedRepository) && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {isRepositoryMode ? 'Repository' : 'Project'}
              </span>
            )}
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                mobileExpandedPanel === 'preview' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Preview Content */}
        {mobileExpandedPanel === 'preview' && (
          <div className="flex-1 px-4 pb-4 overflow-y-auto min-h-0">
            {isRepositoryMode && selectedRepository ? (
              <RepositoryPreview repository={selectedRepository} />
            ) : currentProject ? (
              <ProjectPreview project={currentProject} />
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">{isRepositoryMode ? '🔧' : '📁'}</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">
                      {isRepositoryMode ? 'Select a repository to modify' : 'No project created yet'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {isRepositoryMode
                        ? 'Choose a repository from the sidebar to start making modifications'
                        : 'Start a conversation to create your first project'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
