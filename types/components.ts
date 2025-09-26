/**
 * Component Types
 * Centralized type definitions for React components
 */

import { ReactNode } from 'react'
import { Message, ProjectInfo, Repository } from './index'

// Layout Components
export interface MainLayoutProps {
  children: ReactNode
}

// Chat Components
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
  inputRef?: React.RefObject<HTMLInputElement>
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
  inputRef?: React.RefObject<HTMLInputElement>
  quickStartOptions: string[]
  handleQuickStart: (option: string) => void
}

export interface ChatLayoutState {
  mobileExpandedPanel: 'chat' | 'preview' | null
  setMobileExpandedPanel: (panel: 'chat' | 'preview' | null) => void
}

export interface ChatScrollingState {
  messagesEndRef: React.RefObject<HTMLDivElement>
  scrollToBottom: () => void
}

// Project Components
export interface ProjectSidebarProps {
  selectedRepository?: Repository | null
  onRepositorySelect: (repository: Repository | null) => void
  isRepositoryMode: boolean
  setIsRepositoryMode: (mode: boolean) => void
  newlyCreatedRepository?: string | null
  setNewlyCreatedRepository: (repoName: string | null) => void
}

export interface ProjectPreviewProps {
  project: ProjectInfo
}

export interface RepositoryItemProps {
  repository: Repository
  isSelected: boolean
  isNew: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  canDelete: boolean
}

// Repository Components
export interface RepositoryPreviewProps {
  repository: Repository
}

export interface RepositoryPageWrapperProps {
  owner: string
  repo: string
}

export interface ProjectPageProps {
  params: Promise<{
    owner: string
    repo: string
  }>
}

// User Components
export interface UserProfileProps {
  name: string
  email: string
  avatar?: string
}

// Provider Components
export interface JotaiProviderProps {
  children: ReactNode
}

export interface SWRProviderProps {
  children: ReactNode
}

// Monitoring Components
export interface PerformanceMonitorProps {
  componentName: string
  threshold?: number // ms
  children: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}
