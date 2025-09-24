'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { ProjectPreview } from '@/components/ProjectPreview'
import { useRepository } from '@/contexts/RepositoryContext'
import { RepositoryPreview } from '@/components/RepositoryPreview'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, isLoading, currentProject, sendMessage, clearChat } = useChat()
  const { selectedRepository, isRepositoryMode } = useRepository()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const quickStartOptions = [
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
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Chat Panel */}
      <div className="flex flex-col w-full lg:w-1/2 xl:w-2/5 bg-white border-r border-slate-200">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Project Scaffolder</h1>
              <p className="text-sm text-slate-600 mt-1">
                {isRepositoryMode ? `Working with ${selectedRepository?.name}` : 'AI-powered project creation'}
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              {/* Repository Indicator */}
              {isRepositoryMode && selectedRepository && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium">
                  <div className="w-1.5 h-1.5 bg-violet-500"></div>
                  <span>{selectedRepository.name}</span>
                </div>
              )}

              {/* Current Project Indicator */}
              {!isRepositoryMode && currentProject && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                  <div className="w-1.5 h-1.5 bg-emerald-500"></div>
                  <span>{currentProject.name}</span>
                </div>
              )}

              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                  disabled={isLoading}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-6 py-6 max-w-6xl mx-auto w-full">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Panel */}
            <div className="flex flex-col bg-white rounded-lg shadow-sm border">
              <div className="p-4 max-h-[70vh] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col justify-center min-h-[500px] space-y-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 mx-auto flex items-center justify-center text-white text-2xl font-bold">
                      AI
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Welcome to Project Scaffolder
                      </h2>
                      <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                        Describe your project in natural language and I&apos;ll create it for you with all the necessary files, dependencies, and configuration.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700 text-center">Quick Start Templates</p>
                    <div className="grid gap-3">
                      {quickStartOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleQuickStart(option)}
                          className="p-4 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all text-sm font-medium text-slate-700 hover:text-slate-900 group"
                          disabled={isLoading}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 min-h-full">
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
                                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-blue-50 transition-colors border border-blue-200">
                                  🤔 <span className="text-blue-700 font-medium">AI Reasoning</span>
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
                                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-green-50 transition-colors border border-green-200">
                                  🔧 <span className="text-green-700 font-medium">MCP Server Logs</span>
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
                          className={`p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-900 border border-slate-200'
                          }`}
                        >
                          <div className="text-xs font-semibold mb-2 opacity-75">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-60 mt-3">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-900 p-4 border border-slate-200 max-w-[85%]">
                        <div className="text-xs font-semibold mb-2 opacity-75">AI Assistant</div>
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-blue-600"></div>
                          <span className="text-slate-700 text-sm">Analyzing your request...</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Using AI to understand and plan your project
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
        </div>

        {/* Input Form */}
        <div className="flex-shrink-0 border-t border-slate-200 p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentProject
                  ? `Modify ${currentProject.name} (e.g., 'add jotai', 'create component')`
                  : "Describe your project (e.g., 'Create a React app with authentication')"
                }
                className="flex-1 px-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isLoading ? 'Creating...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              💡 Try: &quot;Create a Next.js app with TypeScript&quot; or &quot;Build a Node.js API&quot;
            </p>
          </form>
        </div>
      </div>

          {/* Project Preview Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            {isRepositoryMode && selectedRepository ? (
              <RepositoryPreview repository={selectedRepository} />
            ) : currentProject ? (
              <ProjectPreview project={currentProject} />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📁</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">No project created yet</p>
                    <p className="text-gray-500 text-sm">Start a conversation to create your first project</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
