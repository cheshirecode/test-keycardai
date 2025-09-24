import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'

export async function GET(request: NextRequest) {
  try {
    console.log('[Download API] Processing download request...')
    
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get('projectName')
    const zipPath = searchParams.get('zipPath')

    console.log(`[Download API] Project: ${projectName}, Path: ${zipPath}`)

    if (!projectName || !zipPath) {
      console.error('[Download API] Missing parameters')
      return NextResponse.json(
        { error: 'Missing projectName or zipPath parameter' },
        { status: 400 }
      )
    }

    // Security check: ensure the zip path is within /tmp directory
    if (!zipPath.startsWith('/tmp/') || !zipPath.endsWith('.zip')) {
      console.error('[Download API] Invalid zip path security check failed')
      return NextResponse.json(
        { error: 'Invalid zip path' },
        { status: 400 }
      )
    }

    // Check if file exists
    if (!fs.existsSync(zipPath)) {
      console.error(`[Download API] Zip file not found: ${zipPath}`)
      
      // Check if /tmp directory exists
      const tmpExists = fs.existsSync('/tmp')
      console.error(`[Download API] /tmp directory exists: ${tmpExists}`)
      
      if (tmpExists) {
        try {
          const tmpContents = fs.readdirSync('/tmp')
          console.error(`[Download API] /tmp contents: ${tmpContents.join(', ')}`)
        } catch (dirError) {
          console.error(`[Download API] Cannot read /tmp directory: ${dirError}`)
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Zip file not found',
          details: `File ${zipPath} does not exist`,
          tmpExists: tmpExists
        },
        { status: 404 }
      )
    }

    console.log('[Download API] Reading zip file...')
    // Read the zip file
    const fileBuffer = fs.readFileSync(zipPath)
    console.log(`[Download API] File read successfully, size: ${fileBuffer.length} bytes`)

    // Clean up the temporary file after sending
    try {
      fs.unlinkSync(zipPath)
      console.log('[Download API] Temporary file cleaned up')
    } catch (cleanupError) {
      console.warn('[Download API] Failed to cleanup temporary file:', cleanupError)
      // Don't fail the request if cleanup fails
    }

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}.zip"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('[Download API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
