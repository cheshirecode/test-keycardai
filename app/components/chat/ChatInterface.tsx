'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { ProjectPreview } from '@/components/project'
import { RepositoryPreview } from '@/components/repository'
import { useRepositoryManager } from '@/hooks/composed/useRepositoryManager'
import { useAIManager } from '@/hooks/composed/useAIManager'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRepositoryCommits } from '@/hooks/useRepositoryCommits'

// Import new components
import { ChatHeader } from './ChatHeader'
import { ChatMessageList } from './ChatMessageList'
import { ChatInputForm } from './ChatInputForm'
import { ChatMobileAccordion } from './ChatMobileAccordion'

// Import hooks
import { useChatLayout } from './hooks/useChatLayout'
import { useChatScrolling } from './hooks/useChatScrolling'
import { useChatMessages } from './hooks/useChatMessages'

// Import types
import { ChatInterfaceProps } from '@/types'

export function ChatInterface({ onToggleSidebar }: ChatInterfaceProps = {}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Use new decoupled hooks - NO MORE DIRECT ATOM ACCESS!
  const { isFastMode, setIsFastMode } = useAIManager()
  const repositoryManager = useRepositoryManager()

  // Use extracted hooks
  const { mobileExpandedPanel, setMobileExpandedPanel } = useChatLayout()

  const { messages, isLoading, currentProject, sendMessage, clearChat } = useChat(isFastMode)
  const { selectedRepository, isRepositoryMode, isCreatingNewProject, startNewProject } = repositoryManager

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

  // Use extracted message processing hook
  const { commits, quickStartOptions } = useChatMessages({
    isRepositoryMode,
    rawCommits
  })

  // Use extracted scrolling hook
  const { messagesEndRef } = useChatScrolling(messages)

  // Reactive input focus when entering new project mode
  useEffect(() => {
    if (isCreatingNewProject && inputRef.current) {
      inputRef.current.focus()
      console.log('🎯 Input focused reactively for new project mode')
    }
  }, [isCreatingNewProject])

  // Handle new project creation with simplified state management
  const handleNewProject = useCallback(() => {
    console.log('🚀 New Project clicked - starting clean project flow')

    // Clear chat first
    clearChat()

    // Use the simplified new project flow from Jotai atoms
    // This will trigger the reactive focus effect above
    startNewProject()

    console.log('✅ New Project flow completed')
  }, [clearChat, startNewProject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input.trim())
    setInput('')
  }

  const handleQuickStart = (option: string) => {
    if (!isLoading) {
      sendMessage(option)
    }
  }

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Extracted Header Component */}
      <ChatHeader
        onToggleSidebar={onToggleSidebar}
        isRepositoryMode={isRepositoryMode}
        selectedRepository={selectedRepository}
        currentProject={currentProject}
        isFastMode={isFastMode}
        setIsFastMode={setIsFastMode}
        isProfileInitialized={isProfileInitialized}
        userProfile={userProfile}
        messages={messages}
        isLoading={isLoading}
        clearChat={clearChat}
        handleNewProject={handleNewProject}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop: Traditional grid layout */}
        <div className="hidden lg:flex flex-1 min-h-0 h-full">
          <div className="flex-1 grid grid-cols-2 gap-0 min-h-0 h-full">
            {/* Chat Panel - Desktop */}
            <div className="flex flex-col bg-white border-r border-gray-200 min-h-0 overflow-hidden">
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
                <ChatMessageList
                  messages={messages}
                  commits={commits}
                  isLoading={isLoading}
                  isRepositoryMode={isRepositoryMode}
                  selectedRepository={selectedRepository}
                  isCreatingNewProject={isCreatingNewProject}
                  quickStartOptions={quickStartOptions}
                  handleQuickStart={handleQuickStart}
                  messagesEndRef={messagesEndRef}
                />
            </div>

            {/* Input Form */}
              <ChatInputForm
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                isRepositoryMode={isRepositoryMode}
                selectedRepository={selectedRepository}
                isCreatingNewProject={isCreatingNewProject}
                handleSubmit={handleSubmit}
                inputRef={inputRef}
              />
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
        <ChatMobileAccordion
          mobileExpandedPanel={mobileExpandedPanel}
          setMobileExpandedPanel={setMobileExpandedPanel}
          messages={messages}
          commits={commits}
          isLoading={isLoading}
          isRepositoryMode={isRepositoryMode}
          selectedRepository={selectedRepository}
          isCreatingNewProject={isCreatingNewProject}
          currentProject={currentProject}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
        />
      </div>
    </div>
  )
}
