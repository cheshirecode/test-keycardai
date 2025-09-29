import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, message: 'Owner and repository name are required' },
        { status: 400 }
      )
    }

    const githubService = new GitHubService()

    if (!githubService.isGitHubAvailable()) {
      return NextResponse.json({
        success: false,
        message: 'GitHub API not available - missing token'
      }, { status: 503 })
    }

    // Get repository info and default branch
    const repoInfo = await githubService.getRepositoryInfo({ owner, repo })
    if (!repoInfo.success || !repoInfo.info) {
      return NextResponse.json({
        success: false,
        message: `Failed to get repository info: ${repoInfo.message}`
      }, { status: 404 })
    }

    // Download repository as zip archive using GitHub API
    const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${repoInfo.info.defaultBranch || 'main'}`

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Project-Scaffolder'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    // Get the response as array buffer
    const buffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Return the zip file directly
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${repo}.zip"`,
        'Content-Length': uint8Array.length.toString()
      }
    })

  } catch (error) {
    console.error('[Repository Download API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to download repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
