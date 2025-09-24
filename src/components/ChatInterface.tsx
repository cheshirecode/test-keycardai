'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { ProjectPreview } from '@/components/ProjectPreview'
import UserProfile from '@/components/UserProfile'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, isLoading, currentProject, sendMessage, clearChat } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Demo of extended functionality - user preferences stored locally
  const [userProfile, , isProfileInitialized] = useLocalStorage('userProfile', {
    name: 'Demo User',
    email: 'demo@example.com'
  })

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PS</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Project Scaffolder</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Current Project Indicator */}
              {currentProject && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-emerald-700">{currentProject.name}</span>
                  <span className="text-emerald-600">({currentProject.template})</span>
                </div>
              )}

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
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
          
          {/* Left Panel - Chat Interface */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 h-full flex flex-col overflow-hidden">
              
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    {/* Welcome Section */}
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Project Scaffolder</h2>
                        <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                          I can help you create new projects quickly. Just describe what you want to build!
                        </p>
                      </div>
                    </div>

                    {/* Quick Start Options */}
                    <div className="w-full max-w-md space-y-3">
                      <p className="text-sm font-medium text-slate-700 mb-4">Quick Start:</p>
                      <div className="grid gap-3">
                        {quickStartOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickStart(option)}
                            disabled={isLoading}
                            className="p-4 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                {option}
                              </span>
                              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-md' 
                            : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md'
                        } px-4 py-3 shadow-sm`}>
                          <div className="prose prose-sm max-w-none">
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className={`${i === 0 ? '' : 'mt-2'} ${message.role === 'user' ? 'text-white' : 'text-slate-900'}`}>
                                {line}
                              </p>
                            ))}
                          </div>
                          <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-sm text-slate-600">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200/60 p-6 bg-slate-50/50">
                <form onSubmit={handleSubmit} className="flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={currentProject 
                        ? `Modify ${currentProject.name} (e.g., 'add jotai', 'create component')`
                        : "Describe your project (e.g., 'Create a React app with authentication')"
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-900"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
                
                {/* Helpful Hint */}
                <div className="mt-3 flex items-center justify-center">
                  <p className="text-xs text-slate-500">
                    💡 Try: &quot;Create a Next.js app with TypeScript&quot; or &quot;Build a Node.js API&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Project Preview */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 h-full overflow-hidden">
              {currentProject ? (
                <ProjectPreview project={currentProject} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">Project Preview</h3>
                    <p className="text-slate-600 max-w-sm">
                      Your generated project will appear here with download options and repository details.
                    </p>
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