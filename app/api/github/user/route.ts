import { NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github-service'

export async function GET() {
  try {
    const githubService = new GitHubService()

    if (!githubService.isGitHubAvailable()) {
      return NextResponse.json({
        success: false,
        message: 'GitHub API not available - missing token'
      })
    }

    const result = await githubService.getCurrentUser()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      })
    }

    return NextResponse.json({
      success: true,
      user: result.user
    })

  } catch (error) {
    console.error('Failed to fetch GitHub user:', error)
    return NextResponse.json({
      success: false,
      message: `Failed to fetch GitHub user: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}
