import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { path, type, content = '', name } = body

    if (!path || !type || !name) {
      return NextResponse.json(
        { error: 'Path, type, and name are required' },
        { status: 400 }
      )
    }

    if (type === 'file') {
      // Create a new file
      const file = await prisma.file.create({
        data: {
          path,
          name,
          content,
          size: content.length,
          mimeType: getMimeType(name),
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          agent: 'file-api',
          action: 'create_file',
          details: `Created file: ${path}`,
          level: 'info',
        }
      }).catch(err => console.error('Failed to log activity:', err))

      return NextResponse.json({
        id: file.id,
        path: file.path,
        type: 'file',
        created: true,
      })
    } else if (type === 'folder') {
      // Create a new folder
      const parentPath = path.substring(0, path.lastIndexOf('/')) || null
      const folder = await prisma.folder.create({
        data: {
          path,
          name,
          parentId: parentPath,
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          agent: 'file-api',
          action: 'create_folder',
          details: `Created folder: ${path}`,
          level: 'info',
        }
      }).catch(err => console.error('Failed to log activity:', err))

      return NextResponse.json({
        id: folder.id,
        path: folder.path,
        type: 'folder',
        created: true,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "file" or "folder"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating file/folder:', error)
    return NextResponse.json(
      { error: 'Failed to create file/folder' },
      { status: 500 }
    )
  }
}

function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    ts: 'text/typescript',
    tsx: 'text/typescript',
    js: 'text/javascript',
    jsx: 'text/javascript',
    json: 'application/json',
    md: 'text/markdown',
    css: 'text/css',
    html: 'text/html',
    txt: 'text/plain',
    py: 'text/x-python',
    sh: 'text/x-sh',
  }
  return mimeTypes[extension || ''] || 'text/plain'
}
