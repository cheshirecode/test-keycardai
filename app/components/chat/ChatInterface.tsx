'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { ProjectPreview } from '@/components/project'
import { RepositoryPreview } from '@/components/repository'
import { useRepository } from '@/contexts/RepositoryContext'
import { UserProfile } from '@/components/user'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRepositoryCommits } from '@/hooks/useRepositoryCommits'
import { useAtom } from 'jotai'
import { isFastModeAtom } from '@/store/aiRequestStore'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [isFastMode, setIsFastMode] = useAtom(isFastModeAtom)
  const { messages, isLoading, currentProject, sendMessage, clearChat } = useChat(isFastMode)
  const {
    selectedRepository,
    isRepositoryMode,
    navigateToHome,
    clearAllRepositoryData,
    setIsCreatingNewProject,
    isCreatingNewProject
  } = useRepository()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // User profile integration with localStorage
  const [userProfile, , isProfileInitialized] = useLocalStorage('userProfile', {
    name: '',
    email: ''
  })

  // Use shared hook for repository commits
  const { commits: rawCommits } = useRepositoryCommits(
    selectedRepository,
    10,
    isRepositoryMode && !!selectedRepository
  )

  // Sort commits chronologically (oldest first for chat display)
  const commits = useMemo(() => {
    return [...rawCommits].reverse()
  }, [rawCommits])

  // Handle new project creation with proper state management
  const handleNewProject = useCallback(() => {
    console.log('🚀 New Project clicked - Current state:', { 
      currentProject: !!currentProject, 
      isCreatingNewProject, 
      isRepositoryMode,
      isLoading,
      selectedRepository: !!selectedRepository,
      messagesLength: messages.length 
    })

    // If we're in loading state, we should still proceed to interrupt the current operation
    if (isLoading) {
      console.log('⚠️ New Project clicked during loading - proceeding to interrupt current operation')
    }

    // Clear chat and current project FIRST
    clearChat()

    // Clear all repository-related state but preserve the creating flag
    clearAllRepositoryData(true)

    // Set flag to indicate new project creation AFTER clearing
    setIsCreatingNewProject(true)

    // Navigate to home immediately - the state updates should be synchronous enough
    navigateToHome()

    // Use setTimeout only for focus and final state check
    setTimeout(() => {
      console.log('📍 After navigation and state updates - Final state check')

      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      input?.focus()
    }, 100)
  }, [setIsCreatingNewProject, clearAllRepositoryData, clearChat, navigateToHome, currentProject, isCreatingNewProject, isRepositoryMode, isLoading, selectedRepository, messages.length])


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input.trim())
    setInput('')
  }

  const quickStartOptions = isRepositoryMode ? [
    'Add authentication to this project',
    'Add a database integration',
    'Improve the UI/UX design',
    'Add testing framework',
    'Optimize performance'
  ] : [
    'Create a React TypeScript app',
    'Create a Next.js fullstack project',
    'Create a Node.js API',
    'Build a dashboard with Next.js'
  ]

  const handleQuickStart = (option: string) => {
    if (!isLoading) {
      sendMessage(option)
    }
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 Project Scaffolder</h1>
            <p className="text-gray-600">
              {isRepositoryMode && selectedRepository
                ? `Modifying: ${selectedRepository.name}`
                : 'Create projects with natural language'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Current Project Indicator */}
            {currentProject && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-emerald-700">{currentProject.name}</span>
                <span className="text-emerald-600">({currentProject.template})</span>
              </div>
            )}

            {/* New Project Button - Always visible */}
            <button
              onClick={handleNewProject}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              disabled={false}
              title="Create a new project (interrupts current operation)"
            >
              + New Project
            </button>

            {/* Fast Mode Toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer" title="Fast Mode: Skip AI processing and use rule-based planning. Useful for demonstrations and when API keys are not available due to time constraints and complexity of implementing API key rotation.">
                <input
                  type="checkbox"
                  checked={isFastMode}
                  onChange={(e) => setIsFastMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 font-medium">Fast Mode</span>
              </label>
              <div className="relative group">
                <div className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  Skips AI processing due to time constraints and complexity of implementing API key rotation. Uses rule-based planning instead.
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="hidden md:block">
              {isProfileInitialized && (
                <UserProfile
                  name={userProfile.name}
                  email={userProfile.email}
                />
              )}
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                disabled={isLoading}
                title="Clear current conversation"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">
          {/* Chat Panel */}
          <div className="flex flex-col bg-white border-r border-gray-200 min-h-0">
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
              {messages.length === 0 && commits.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isRepositoryMode
                        ? '🔧 Project Modification Mode'
                        : isCreatingNewProject
                          ? '✨ New Project Creation Mode'
                          : '👋 Welcome to Project Scaffolder'
                      }
                    </h2>
                    <p className="text-gray-600">
                      {isRepositoryMode
                        ? `I can help you modify and improve "${selectedRepository?.name}". Tell me what changes you'd like to make!`
                        : isCreatingNewProject
                          ? '🚀 Ready to create your new project! Describe what you want to build and I\'ll scaffold it for you.'
                          : 'I can help you create new projects quickly. Just describe what you want to build!'
                      }
                    </p>

                    {/* New Project Mode Indicator */}
                    {isCreatingNewProject && !isRepositoryMode && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          🎯 <strong>New Project Mode Active!</strong> Type your project description below to get started.
                        </p>
                      </div>
                    )}

                    {/* Chat log coming soon note for repository mode */}
                    {isRepositoryMode && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
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
              ) : (
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
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] space-y-3 ${message.role === 'user' ? '' : ''}`}>
                        {/* Debugging & Transparency Section - Show FIRST for agent messages */}
                        {message.role === 'assistant' && (message.chainOfThought || message.mcpLogs) && (
                          <div className="space-y-2">
                            {/* Chain of Thought Section */}
                            {message.chainOfThought && (
                              <details className="group" open>
                                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-blue-50 transition-colors border border-blue-200 min-w-0">
                                  🤔 <span className="text-blue-700 font-medium min-w-[120px] inline-block">AI Reasoning</span>
                                  <span className="text-gray-500 text-xs">Chain of Thought</span>
                                </summary>
                                <div className="mt-2 p-3 bg-blue-50 rounded-md text-xs text-blue-900 border-l-4 border-blue-400">
                                  <div className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                                    💭 <span>How I&apos;m thinking about this...</span>
                                  </div>
                                  <div className="whitespace-pre-wrap leading-relaxed bg-white p-2 rounded border">
                                    {message.chainOfThought}
                                  </div>
                                </div>
                              </details>
                            )}

                            {/* MCP Logs Section */}
                            {message.mcpLogs && message.mcpLogs.length > 0 && (
                              <details className="group" open>
                                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-green-50 transition-colors border border-green-200 min-w-0">
                                  🔧 <span className="text-green-700 font-medium min-w-[120px] inline-block">MCP Server Logs</span>
                                  <span className="text-gray-500 text-xs">({message.mcpLogs.length} entries)</span>
                                </summary>
                                <div className="mt-2 p-3 bg-green-50 rounded-md text-xs border-l-4 border-green-400">
                                  <div className="font-medium text-green-800 mb-2 flex items-center gap-1">
                                    🔍 <span>Tool execution logs...</span>
                                  </div>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {message.mcpLogs.map((log, index) => (
                                      <div key={index} className={`p-2 rounded border text-xs ${
                                        log.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                        log.type === 'request' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                        log.type === 'response' ? 'bg-green-50 border-green-200 text-green-800' :
                                        'bg-gray-50 border-gray-200 text-gray-800'
                                      }`}>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium flex items-center gap-1">
                                            {log.type === 'error' ? '❌' :
                                             log.type === 'request' ? '📤' :
                                             log.type === 'response' ? '📥' : 'ℹ️'}
                                            {log.tool && `${log.tool}`}
                                            <span className="text-xs opacity-75">({log.type})</span>
                                          </span>
                                          <span className="text-xs opacity-60">
                                            {log.duration && `${log.duration}ms`}
                                          </span>
                                        </div>
                                        <div className="text-xs">
                                          {log.message}
                                          {log.data !== undefined && (
                                            <details className="mt-1">
                                              <summary className="cursor-pointer opacity-75 hover:opacity-100">
                                                📋 Data
                                              </summary>
                                              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                                                {JSON.stringify(log.data, null, 2)}
                                              </pre>
                                            </details>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </details>
                            )}
                          </div>
                        )}

                        {/* Main Message Content */}
                        <div
                          className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {message.role === 'user' ? 'You' : '🤖 Agent'}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-75 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
              )}
            </div>

            {/* Input Form */}
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
          </div>

          {/* Project Preview Panel */}
          <div className="bg-white flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {isRepositoryMode ? 'Repository Details' : 'Project Preview'}
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
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
          </div>
        </div>
      </div>
    </div>
  )
}
