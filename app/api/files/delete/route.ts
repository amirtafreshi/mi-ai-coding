import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')
    const type = searchParams.get('type')

    if (!path || !type) {
      return NextResponse.json(
        { error: 'Path and type are required' },
        { status: 400 }
      )
    }

    if (type === 'file') {
      await prisma.file.delete({
        where: { path },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          agent: 'file-api',
          action: 'delete_file',
          details: `Deleted file: ${path}`,
          level: 'info',
        }
      }).catch(err => console.error('Failed to log activity:', err))

    } else if (type === 'folder') {
      // Delete folder and all its contents
      await prisma.folder.delete({
        where: { path },
      })

      // Also delete all files and subfolders in this path
      const deletedFiles = await prisma.file.deleteMany({
        where: {
          path: {
            startsWith: path,
          },
        },
      })

      const deletedFolders = await prisma.folder.deleteMany({
        where: {
          path: {
            startsWith: path,
          },
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          agent: 'file-api',
          action: 'delete_folder',
          details: `Deleted folder: ${path} (including ${deletedFiles.count} files and ${deletedFolders.count} subfolders)`,
          level: 'info',
        }
      }).catch(err => console.error('Failed to log activity:', err))

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "file" or "folder"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      path,
      deleted: true,
      success: true,
    })
  } catch (error) {
    console.error('Error deleting file/folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete file/folder' },
      { status: 500 }
    )
  }
}
