// Main chat interface
export { ChatInterface } from './ChatInterface'

// Extracted components
export { ChatHeader } from './ChatHeader'
export { ChatMessageList } from './ChatMessageList'
export { ChatMessageItem } from './ChatMessageItem'
export { ChatInputForm } from './ChatInputForm'
export { ChatQuickStart } from './ChatQuickStart'
export { ChatMobileAccordion } from './ChatMobileAccordion'

// Supporting hooks - now centralized in app/hooks/chat
export { useChatLayout } from '@/hooks/chat/useChatLayout'
export { useChatScrolling } from '@/hooks/chat/useChatScrolling'
export { useChatMessages } from '@/hooks/chat/useChatMessages'

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
