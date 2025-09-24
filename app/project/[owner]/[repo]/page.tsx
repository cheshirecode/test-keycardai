import React from 'react'
import { MainLayout } from '@/components/layout'
import { ChatInterface } from '@/components/chat'
import { RepositoryPageWrapper } from './RepositoryPageWrapper'

interface ProjectPageProps {
  params: {
    owner: string
    repo: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <RepositoryPageWrapper owner={params.owner} repo={params.repo}>
      <MainLayout>
        <ChatInterface />
      </MainLayout>
    </RepositoryPageWrapper>
  )
}
