'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { ProjectPreview } from '@/components/project'
import { RepositoryPreview } from '@/components/repository'
import { useRepositoryState, useRepositoryCreation } from '@/hooks/useRepositoryAtoms'
import { UserProfile } from '@/components/user'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRepositoryCommits } from '@/hooks/useRepositoryCommits'
import { useAtom } from 'jotai'
import { isFastModeAtom } from '@/store/aiRequestStore'

interface ChatInterfaceProps {
  onToggleSidebar?: () => void
}

export function ChatInterface({ onToggleSidebar }: ChatInterfaceProps = {}) {
  const [input, setInput] = useState('')
  const [isFastMode, setIsFastMode] = useAtom(isFastModeAtom)
  const [mobileExpandedPanel, setMobileExpandedPanel] = useState<'chat' | 'preview' | null>('chat')
  const { messages, isLoading, currentProject, sendMessage, clearChat } = useChat(isFastMode)
  const { selectedRepository, isRepositoryMode } = useRepositoryState()
  const { isCreatingNewProject, startNewProject } = useRepositoryCreation()
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

  // Handle new project creation with simplified state management
  const handleNewProject = useCallback(() => {
    console.log('🚀 New Project clicked - starting clean project flow')

    // Clear chat first
    clearChat()

    // Use the simplified new project flow from Jotai atoms
    startNewProject()

    // Focus on input after a brief delay
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      if (input) {
        input.focus()
        console.log('🎯 Input focused successfully')
      }
    }, 100)

    console.log('✅ New Project flow completed')
  }, [clearChat, startNewProject])


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
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b px-3 sm:px-4 py-3 md:py-4 overflow-visible">
        <div className="max-w-7xl mx-auto relative">
          {/* Main header row */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="min-w-0 flex-1 mr-3 flex items-center">
              {/* Mobile sidebar toggle */}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="mr-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md lg:hidden"
                  aria-label="Open sidebar"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">🚀 Project Scaffolder</h1>
                <p className="text-xs md:text-sm text-gray-600 truncate hidden sm:block">
                  {isRepositoryMode && selectedRepository
                    ? `Modifying: ${selectedRepository.name}`
                    : 'Create GitHub projects with natural language'
                  }
                </p>
              </div>
            </div>

            {/* Mobile: Only essential buttons */}
            <div className="flex items-center space-x-2 sm:hidden">
              {/* New Project Button - Mobile compact */}
              <button
                onClick={(e) => {
                  console.log('🖱️ New Project button clicked - event triggered')
                  e.preventDefault()
                  e.stopPropagation()
                  handleNewProject()
                }}
                className="px-2 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
                disabled={false}
                title="Create a new project"
              >
                + New
              </button>

              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  disabled={isLoading}
                  title="Clear current conversation"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Second row for Fast Mode and status */}
          <div className="flex items-center justify-between sm:hidden">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFastMode}
                  onChange={(e) => setIsFastMode(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                />
                <span className="text-xs text-gray-700 font-medium">Fast Mode</span>
              </label>
              <div className="relative group">
                <div className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute top-full right-0 mt-2 w-48 p-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] shadow-lg">
                  <div className="relative">
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    <p className="relative">Fast Mode skips AI processing and uses rule-based planning.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile status indicator */}
            {currentProject && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-emerald-700 truncate max-w-20">{currentProject.name}</span>
              </div>
            )}
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div></div> {/* Spacer */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Current Project Indicator */}
              {currentProject && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-emerald-700">{currentProject.name}</span>
                  <span className="text-emerald-600">({currentProject.template})</span>
                </div>
              )}

              {/* New Project Button */}
              <button
                onClick={(e) => {
                  console.log('🖱️ New Project button clicked - event triggered')
                  e.preventDefault()
                  e.stopPropagation()
                  handleNewProject()
                }}
                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
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
                  {/* Tooltip positioned to avoid cutoff */}
                  <div className="absolute top-full right-0 mt-2 w-56 sm:w-64 p-3 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] shadow-lg">
                    <div className="relative">
                      {/* Arrow pointing up */}
                      <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                      <p className="relative">
                        Skips AI processing due to time constraints and complexity of implementing API key rotation. Uses rule-based planning instead.
                      </p>
                    </div>
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

              {/* Clear Chat - Desktop only */}
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop: Traditional grid layout */}
        <div className="hidden lg:flex flex-1 min-h-0 h-full">
          <div className="flex-1 grid grid-cols-2 gap-0 min-h-0 h-full">
            {/* Chat Panel - Desktop */}
            <div className="flex flex-col bg-white border-r border-gray-200 min-h-0 overflow-hidden">
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
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

            {/* Project Preview Panel - Desktop */}
            <div className="bg-white flex flex-col min-h-0 h-full overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isRepositoryMode ? 'Repository Details' : 'Project Preview'}
                </h2>
              </div>
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
            </div>
          </div>
        </div>

        {/* Mobile: Accordion layout */}
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
                  {/* Copy the chat content from desktop version */}
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
                                <div className="mb-3">
                                  <details className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <summary className="cursor-pointer text-green-800 font-medium text-sm">
                                      📁 View Project Structure
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                      <div className="flex items-start gap-2">
                                        <div className="text-green-700 text-xs font-medium bg-green-200 px-2 py-1 rounded">
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
                                    </div>
                                  </div>
                                  <div className="bg-white p-3 rounded border">
                                    <p className="text-sm text-gray-700 mb-2">
                                      {isFirstCommit
                                        ? `✅ Successfully created "${selectedRepository?.name}" project with initial structure and configuration.`
                                        : `✅ ${commit.message || 'Project updated successfully.'}`
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
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
      </div>
    </div>
  )
}
