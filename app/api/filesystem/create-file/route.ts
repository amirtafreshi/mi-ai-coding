import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { path, name, content = '' } = await request.json()

    if (!path || !name) {
      return NextResponse.json({ error: 'Path and name are required' }, { status: 400 })
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

    // Create the file
    await writeFile(path, content, 'utf8')

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        agent: 'file-explorer',
        action: 'create_file',
        details: `Created file: ${path}`,
        level: 'info',
      }
    })

    return NextResponse.json({
      success: true,
      path,
      name,
    })
  } catch (error) {
    console.error('Error creating file:', error)
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}
