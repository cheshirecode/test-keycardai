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
      })
    }

    // Fetch all repository data in parallel
    const [repoResult, languagesResult, topicsResult, readmeResult] = await Promise.allSettled([
      githubService.getRepository(owner, repo),
      githubService.getRepositoryLanguages(owner, repo),
      githubService.getRepositoryTopics(owner, repo),
      githubService.getRepositoryReadme(owner, repo)
    ])

    const data: Record<string, unknown> = {}

    // Process repository basic info
    if (repoResult.status === 'fulfilled' && repoResult.value.success && repoResult.value.repository) {
      const repoData = repoResult.value.repository as Record<string, unknown>
      data.stars = repoData.stargazers_count as number
      data.forks = repoData.forks_count as number
      data.openIssues = repoData.open_issues_count as number
      data.size = repoData.size as number // Size in KB
      const license = repoData.license as Record<string, unknown> | null
      data.license = license?.name as string || license?.spdx_id as string
      data.defaultBranch = repoData.default_branch as string
    }

    // Process languages
    if (languagesResult.status === 'fulfilled' && languagesResult.value.success && languagesResult.value.languages) {
      data.languages = languagesResult.value.languages
      
      // Calculate language percentages
      const totalBytes = Object.values(languagesResult.value.languages).reduce((a, b) => (a as number) + (b as number), 0) as number
      if (totalBytes > 0) {
        data.languagesPercentages = Object.entries(languagesResult.value.languages).reduce((acc, [lang, bytes]) => {
          acc[lang] = Math.round((bytes as number / totalBytes) * 100)
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Process topics
    if (topicsResult.status === 'fulfilled' && topicsResult.value.success && topicsResult.value.topics) {
      data.topics = topicsResult.value.topics
    }

    // Process README
    if (readmeResult.status === 'fulfilled' && readmeResult.value.success && readmeResult.value.readme) {
      data.readme = readmeResult.value.readme
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Failed to fetch repository details:', error)
    return NextResponse.json({
      success: false,
      message: `Failed to fetch repository details: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}
