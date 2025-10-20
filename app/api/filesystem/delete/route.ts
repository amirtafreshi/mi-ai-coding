import { NextRequest, NextResponse } from 'next/server'
import { unlink, rmdir, stat } from 'fs/promises'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { path } = await request.json()

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    // Get file/folder stats to determine type
    let stats
    try {
      stats = await stat(path)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'File or folder not found' },
        { status: 404 }
      )
    }

    // Delete based on type
    if (stats.isDirectory()) {
      // Delete directory (only if empty, use rmdir)
      // For recursive deletion, would need to use rm from fs/promises with recursive option
      // But for now, safer to only delete empty directories
      try {
        await rmdir(path)
        console.log(`[API /api/filesystem/delete] Deleted directory: ${path}`)
      } catch (error: any) {
        if (error.code === 'ENOTEMPTY') {
          return NextResponse.json(
            { error: 'Directory is not empty' },
            { status: 400 }
          )
        }
        throw error
      }
    } else {
      // Delete file
      await unlink(path)
      console.log(`[API /api/filesystem/delete] Deleted file: ${path}`)
    }

    return NextResponse.json({
      success: true,
      message: `${stats.isDirectory() ? 'Directory' : 'File'} deleted successfully`,
      path,
    })
  } catch (error: any) {
    console.error('[API /api/filesystem/delete] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete' },
      { status: 500 }
    )
  }
}
