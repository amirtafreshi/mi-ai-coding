import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { path } = await request.json()

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Security: Prevent directory traversal
    const allowedPaths = ['/', '/home', '/home/master', '/home/master/projects']
    const isAllowed = allowedPaths.some(allowed =>
      path === allowed || path.startsWith(allowed + '/')
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Access to this directory is not allowed' },
        { status: 403 }
      )
    }

    // Delete the file
    await unlink(path)

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        agent: 'file-explorer',
        action: 'delete_file',
        details: `Deleted file: ${path}`,
        level: 'warning',
      }
    })

    return NextResponse.json({
      success: true,
      path,
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
