import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
    const path = searchParams.get('path') || '/'

    // Normalize path
    const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '')

    // Get direct children only (not all descendants)
    // For files: match exact parent directory
    const files = await prisma.file.findMany({
      where: {
        path: {
          startsWith: normalizedPath === '/' ? '/' : `${normalizedPath}/`,
        },
      },
      select: {
        id: true,
        name: true,
        path: true,
        size: true,
        mimeType: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Filter to only direct children (not nested descendants)
    const directFiles = files.filter(file => {
      const relativePath = file.path.substring(normalizedPath.length + 1)
      return relativePath && !relativePath.includes('/')
    })

    // Get direct child folders
    const folders = await prisma.folder.findMany({
      where: {
        parentId: normalizedPath,
      },
      select: {
        id: true,
        name: true,
        path: true,
        parentId: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        agent: 'file-api',
        action: 'list_files',
        details: `Listed files and folders in path: ${normalizedPath}`,
        level: 'info',
      }
    }).catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({
      files: directFiles.map((file) => ({ ...file, type: 'file' })),
      folders: folders.map((folder) => ({ ...folder, type: 'folder' })),
    })
  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}
