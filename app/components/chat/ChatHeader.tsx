/**
 * ChatHeader Component
 * Handles header controls, user profile, and mode toggles
 * Single responsibility: Header UI and controls
 */

import { UserProfile } from '@/components/user'
import { ChatHeaderProps } from '@/types'

export function ChatHeader({
  onToggleSidebar,
  isRepositoryMode,
  selectedRepository,
  currentProject,
  planningMode,
  setPlanningMode,
  isProfileInitialized,
  userProfile,
  messages,
  isLoading,
  clearChat,
  handleNewProject
}: ChatHeaderProps) {
  return (
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

        {/* Mobile: Second row for AI settings and status */}
        <div className="flex items-center justify-between sm:hidden">
          <div className="flex items-center space-x-2">
            {/* Planning Mode - Mobile */}
            <select
              value={planningMode}
              onChange={(e) => setPlanningMode(e.target.value as 'gemini' | 'openai' | 'manual')}
              className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              title="Select planning mode"
            >
              <option value="gemini">🤖 Gemini AI</option>
              <option value="openai">🤖 OpenAI</option>
              <option value="manual">⚙️ Manual</option>
            </select>

            <div className="relative group">
              <div className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute top-full right-0 mt-2 w-48 p-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] shadow-lg">
                <div className="relative">
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  <p className="relative">
                    <strong>Gemini AI:</strong> Free Google AI<br/>
                    <strong>OpenAI:</strong> Requires API key<br/>
                    <strong>Manual:</strong> Rule-based (fast)
                  </p>
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

            {/* Planning Mode Selector - Desktop */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 font-medium">Planning:</label>
              <select
                value={planningMode}
                onChange={(e) => setPlanningMode(e.target.value as 'gemini' | 'openai' | 'manual')}
                className="text-sm px-3 py-1 bg-gray-100 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                title="Select planning mode: AI (Gemini/OpenAI) or Manual (rule-based)"
              >
                <option value="gemini">🤖 Gemini AI (Free)</option>
                <option value="openai">🤖 OpenAI GPT</option>
                <option value="manual">⚙️ Manual (Rules)</option>
              </select>
              <div className="relative group">
                <div className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                {/* Tooltip positioned to avoid cutoff */}
                <div className="absolute top-full right-0 mt-2 w-64 p-3 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] shadow-lg">
                  <div className="relative">
                    {/* Arrow pointing up */}
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    <p className="relative">
                      <strong>Gemini AI:</strong> Uses Google&apos;s free Gemini 2.0 Flash model<br/>
                      <strong>OpenAI GPT:</strong> Uses OpenAI models (requires API key)<br/>
                      <strong>Manual:</strong> Rule-based planning without AI (fast, no API key needed)
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
  )
}
