import React from 'react'
import { MainLayout } from '@/components/layout'
import { ChatInterface } from '@/components/chat'
import { RepositoryPageWrapper } from './RepositoryPageWrapper'

interface ProjectPageProps {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { owner, repo } = await params
  
  return (
    <RepositoryPageWrapper owner={owner} repo={repo}>
      <MainLayout>
        <ChatInterface />
      </MainLayout>
    </RepositoryPageWrapper>
  )
}
