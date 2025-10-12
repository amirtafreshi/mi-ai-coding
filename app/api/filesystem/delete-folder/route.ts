import { NextRequest, NextResponse } from 'next/server'
import { rm } from 'fs/promises'
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

    // Security: Prevent directory traversal and protect system folders
    const allowedPaths = ['/home/master/projects']
    const protectedPaths = ['/', '/home', '/home/master', '/etc', '/var', '/usr', '/bin', '/sbin']

    const isAllowed = allowedPaths.some(allowed =>
      path === allowed || path.startsWith(allowed + '/')
    )

    const isProtected = protectedPaths.some(protected =>
      path === protected || protected.startsWith(path + '/')
    )

    if (!isAllowed || isProtected) {
      return NextResponse.json(
        { error: 'Access to this directory is not allowed' },
        { status: 403 }
      )
    }

    // Delete the folder recursively
    await rm(path, { recursive: true, force: true })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        agent: 'file-explorer',
        action: 'delete_folder',
        details: `Deleted folder: ${path}`,
        level: 'warning',
      }
    })

    return NextResponse.json({
      success: true,
      path,
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
