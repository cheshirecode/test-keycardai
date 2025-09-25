import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const owner = searchParams.get('owner')
    const nameFilter = searchParams.get('nameFilter')
    const type = searchParams.get('type') as 'all' | 'public' | 'private' | undefined
    const sort = searchParams.get('sort') as 'created' | 'updated' | 'pushed' | 'full_name' | undefined
    const direction = searchParams.get('direction') as 'asc' | 'desc' | undefined

    const githubService = new GitHubService()

    // First, determine the effective owner (GITHUB_OWNER env var or authenticated user)
    let effectiveOwner: string | null = owner
    if (!effectiveOwner) {
      effectiveOwner = process.env.GITHUB_OWNER || null
      
      // If no GITHUB_OWNER is set, fall back to authenticated user
      if (!effectiveOwner) {
        const userResult = await githubService.getAuthenticatedUser()
        if (userResult.success && userResult.user) {
          effectiveOwner = userResult.user.login
        } else {
          return NextResponse.json({
            success: false,
            message: 'Unable to determine GitHub owner'
          }, { status: 400 })
        }
      }
    }

    const result = await githubService.listRepositories({
      owner: effectiveOwner || undefined,
      nameFilter: nameFilter || undefined,
      type,
      sort: sort || 'updated',
      direction: direction || 'desc'
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 })
    }

    // Filter for repositories that might be scaffolded projects
    // Look for repositories with names that match project patterns or have specific metadata
    const scaffoldedProjects = result.repositories?.map(repo => ({
      id: repo.full_name,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.url,
      description: repo.description,
      private: repo.private,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      isScaffoldedProject: isScaffoldedProject(repo.name, repo.description)
    })) || []

    return NextResponse.json({
      success: true,
      repositories: scaffoldedProjects,
      owner: effectiveOwner,
      total: scaffoldedProjects.length
    })

  } catch (error) {
    console.error('Failed to list repositories:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Determines if a repository is likely a scaffolded project
 * Based on naming patterns and description content
 */
function isScaffoldedProject(name: string, description: string | null): boolean {
  // Check for common project prefixes/patterns
  const projectPatterns = [
    /^project-/i,
    /^my-project-/i,      // Match "my-project-..." pattern
    /^scaffolded-/i,
    /^generated-/i,
    /-project$/i,
    /-app$/i,
    /-demo$/i,
    /project.*\d{13}/i    // Match project names with timestamps
  ]

  const nameMatches = projectPatterns.some(pattern => pattern.test(name))
  
  // Check description for scaffolding indicators
  const descriptionMatches = description ? 
    /generated project|scaffolded|auto-generated|created by/i.test(description) : 
    false

  return nameMatches || descriptionMatches
}

export async function DELETE(request: NextRequest) {
  try {
    const { owner, repo } = await request.json()

    if (!owner || !repo) {
      return NextResponse.json({
        success: false,
        message: 'Owner and repository name are required'
      }, { status: 400 })
    }

    const githubService = new GitHubService()
    const result = await githubService.deleteRepository(owner, repo)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message
    })

  } catch (error) {
    console.error('Failed to delete repository:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
