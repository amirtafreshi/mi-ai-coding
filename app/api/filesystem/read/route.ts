import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
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
        { error: 'Access to this file is not allowed' },
        { status: 403 }
      )
    }

    // Read file content
    const content = await readFile(path, 'utf-8')

    return NextResponse.json({ path, content })
  } catch (error) {
    console.error('Error reading file:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to read file', details: errorMessage },
      { status: 500 }
    )
  }
}
