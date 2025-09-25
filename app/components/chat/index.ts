// Main chat interface
export { ChatInterface } from './ChatInterface'

// Extracted components
export { ChatHeader } from './ChatHeader'
export { ChatMessageList } from './ChatMessageList'
export { ChatMessageItem } from './ChatMessageItem'
export { ChatInputForm } from './ChatInputForm'
export { ChatQuickStart } from './ChatQuickStart'
export { ChatMobileAccordion } from './ChatMobileAccordion'

// Supporting hooks
export { useChatLayout } from './hooks/useChatLayout'
export { useChatScrolling } from './hooks/useChatScrolling'
export { useChatMessages } from './hooks/useChatMessages'

// Types - now centralized in @/types
export type {
  ChatInterfaceProps,
  ChatHeaderProps,
  ChatMessageListProps,
  ChatMessageItemProps,
  ChatInputFormProps,
  ChatQuickStartProps,
  ChatMobileAccordionProps,
  ChatLayoutState,
  ChatScrollingState
} from '@/types'
