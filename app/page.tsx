import React from 'react'
import { ChatInterface } from '@/components/ChatInterface'
import { MainLayout } from '@/components/MainLayout'

export default function Home() {
  return (
    <MainLayout>
      <ChatInterface />
    </MainLayout>
  )
}