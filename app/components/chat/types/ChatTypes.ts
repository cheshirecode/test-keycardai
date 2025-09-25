/**
 * Shared types for Chat components
 * Centralized type definitions for the refactored chat interface
 */

import { Message, ProjectInfo, Repository } from '@/types'

export interface ChatInterfaceProps {
  onToggleSidebar?: () => void
}

export interface ChatHeaderProps {
  onToggleSidebar?: () => void
  isRepositoryMode: boolean
  selectedRepository: Repository | null
  currentProject: ProjectInfo | null
  isFastMode: boolean
  setIsFastMode: (value: boolean) => void
  isProfileInitialized: boolean
  userProfile: { name: string; email: string }
  messages: Message[]
  isLoading: boolean
  clearChat: () => void
  handleNewProject: () => void
}

export interface ChatMessageListProps {
  messages: Message[]
  commits: Array<{
    hash: string
    author: string
    timestamp: number
    subject: string
    body?: string
    message?: string
  }>
  isLoading: boolean
  isRepositoryMode: boolean
  selectedRepository: Repository | null
  isCreatingNewProject: boolean
  quickStartOptions: string[]
  handleQuickStart: (option: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export interface ChatMessageItemProps {
  message: Message
}

export interface ChatInputFormProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  isRepositoryMode: boolean
  selectedRepository: Repository | null
  isCreatingNewProject: boolean
  handleSubmit: (e: React.FormEvent) => void
}

export interface ChatQuickStartProps {
  quickStartOptions: string[]
  handleQuickStart: (option: string) => void
  isLoading: boolean
  isRepositoryMode: boolean
  selectedRepository: Repository | null
  isCreatingNewProject: boolean
}

export interface ChatMobileAccordionProps {
  mobileExpandedPanel: 'chat' | 'preview' | null
  setMobileExpandedPanel: (panel: 'chat' | 'preview' | null) => void
  messages: Message[]
  commits: Array<{
    hash: string
    author: string
    timestamp: number
    subject: string
    body?: string
    message?: string
  }>
  isLoading: boolean
  isRepositoryMode: boolean
  selectedRepository: Repository | null
  isCreatingNewProject: boolean
  currentProject: ProjectInfo | null
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export interface ChatLayoutState {
  mobileExpandedPanel: 'chat' | 'preview' | null
  setMobileExpandedPanel: (panel: 'chat' | 'preview' | null) => void
}

export interface ChatScrollingState {
  messagesEndRef: React.RefObject<HTMLDivElement>
  scrollToBottom: () => void
}
