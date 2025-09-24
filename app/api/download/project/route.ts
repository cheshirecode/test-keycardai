import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get('projectName')
    const zipPath = searchParams.get('zipPath')

    if (!projectName || !zipPath) {
      return NextResponse.json(
        { error: 'Missing projectName or zipPath parameter' },
        { status: 400 }
      )
    }

    // Security check: ensure the zip path is within /tmp directory
    if (!zipPath.startsWith('/tmp/') || !zipPath.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid zip path' },
        { status: 400 }
      )
    }

    // Check if file exists
    if (!fs.existsSync(zipPath)) {
      return NextResponse.json(
        { error: 'Zip file not found' },
        { status: 404 }
      )
    }

    // Read the zip file
    const fileBuffer = fs.readFileSync(zipPath)

    // Clean up the temporary file after sending
    fs.unlinkSync(zipPath)

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
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
