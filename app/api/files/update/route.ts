import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
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
    const { path, content } = body

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: 'Path and content are required' },
        { status: 400 }
      )
    }

    const file = await prisma.file.update({
      where: { path },
      data: {
        content,
        size: content.length,
        updatedAt: new Date(),
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        agent: 'file-api',
        action: 'update_file',
        details: `Updated file: ${path} (${content.length} bytes)`,
        level: 'info',
      }
    }).catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({
      id: file.id,
      path: file.path,
      updated: true,
      success: true,
    })
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}
