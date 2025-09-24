import React from 'react'
import { ChatInterface } from '@/components/chat'
import { MainLayout } from '@/components/layout'

export default function Home() {
  return (
    <MainLayout>
      <ChatInterface />
    </MainLayout>
  )
}