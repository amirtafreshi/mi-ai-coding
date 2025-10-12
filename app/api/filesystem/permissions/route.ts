import { NextRequest, NextResponse } from 'next/server'
import { stat, chmod } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
        { error: 'Access to this path is not allowed' },
        { status: 403 }
      )
    }

    // Get file stats
    const stats = await stat(path)
    const mode = (stats.mode & parseInt('777', 8)).toString(8)

    // Get owner and group using stat command
    try {
      const { stdout } = await execAsync(`stat -c '%U:%G' "${path.replace(/"/g, '\\"')}"`)
      const [owner, group] = stdout.trim().split(':')

      return NextResponse.json({
        mode,
        owner,
        group,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime.toISOString(),
      })
    } catch (err) {
      // Fallback if stat command fails
      return NextResponse.json({
        mode,
        owner: 'unknown',
        group: 'unknown',
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime.toISOString(),
      })
    }
  } catch (error) {
    console.error('Error getting permissions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get permissions', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, mode } = body

    if (!path || !mode) {
      return NextResponse.json({ error: 'Path and mode are required' }, { status: 400 })
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

    // Validate mode (3-digit octal number)
    if (!/^[0-7]{3}$/.test(mode)) {
      return NextResponse.json({ error: 'Invalid permission mode' }, { status: 400 })
    }

    // Change permissions
    await chmod(path, parseInt(mode, 8))

    return NextResponse.json({ success: true, mode })
  } catch (error) {
    console.error('Error changing permissions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to change permissions', details: errorMessage },
      { status: 500 }
    )
  }
}
