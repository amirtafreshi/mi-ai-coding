import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, content } = body

    if (!path || content === undefined) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 })
    }

    // Security: Only allow access to safe directories
    const allowedPaths = [
      '/',
      '/home',
      '/home/master',
      '/home/master/projects',
    ]

    const isAllowed = allowedPaths.some(allowed =>
      path === allowed || path.startsWith(allowed + '/')
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Access to this path is not allowed' },
        { status: 403 }
      )
    }

    // Ensure directory exists
    const dir = dirname(path)
    await mkdir(dir, { recursive: true })

    // Write file
    await writeFile(path, content, 'utf-8')

    return NextResponse.json({ success: true, path })
  } catch (error) {
    console.error('Error writing file:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to write file', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Update existing file (same as POST for now)
  return POST(request)
}
