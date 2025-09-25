import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    if (!owner || !repo) {
      return NextResponse.json({
        success: false,
        message: 'Owner and repository name are required'
      }, { status: 400 })
    }

    const githubService = new GitHubService()
    
    // Get the repository directly from GitHub API
    const result = await githubService.getRepository(owner, repo)

    if (!result.success || !result.repository) {
      return NextResponse.json({
        success: false,
        message: result.message || `Repository ${owner}/${repo} not found`
      }, { status: 404 })
    }

    // Transform the GitHub repository data to our Repository type
    const repository = {
      id: result.repository.full_name as string,
      name: result.repository.name as string,
      fullName: result.repository.full_name as string,
      url: result.repository.url as string,
      description: result.repository.description as string | null,
      private: result.repository.private as boolean,
      createdAt: result.repository.created_at as string,
      updatedAt: result.repository.updated_at as string,
      isScaffoldedProject: true // Assume it's a scaffolded project if accessed directly
    }

    return NextResponse.json({
      success: true,
      repository
    })

  } catch (error) {
    console.error('Failed to get repository:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
