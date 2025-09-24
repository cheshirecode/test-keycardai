'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '../../../lib/hooks/useChat'
import { ProjectPreview } from './ProjectPreview'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, isLoading, currentProject, sendMessage, clearChat } = useChat()
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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 Project Scaffolder</h1>
            <p className="text-gray-600">Create projects with natural language</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto w-full p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Panel */}
          <div className="flex flex-col bg-white rounded-lg shadow-sm border">
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      👋 Welcome to Project Scaffolder
                    </h2>
                    <p className="text-gray-600">
                      I can help you create new projects quickly. Just describe what you want to build!
                    </p>
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg ${
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

                        {/* Chain of Thought Section - Only for agent messages */}
                        {message.role === 'assistant' && message.chainOfThought && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-1">
                              🤔 <span className="text-gray-600">--- thinking ---</span>
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 border-l-2 border-gray-300">
                              <div className="whitespace-pre-wrap text-xs leading-relaxed">
                                {message.chainOfThought}
                              </div>
                            </div>
                          </details>
                        )}
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
                  placeholder="Describe your project (e.g., 'Create a React app with authentication')"
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
                💡 Try: &quot;Create a Next.js app with TypeScript&quot; or &quot;Build a Node.js API&quot;
              </p>
            </div>
          </div>

          {/* Project Preview Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Preview</h2>
            {currentProject ? (
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
