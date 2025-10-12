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
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    const file = await prisma.file.findUnique({
      where: { path },
      select: {
        id: true,
        name: true,
        path: true,
        content: true,
        size: true,
        mimeType: true,
        updatedAt: true,
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        agent: 'file-api',
        action: 'read_file',
        details: `Read file: ${path}`,
        level: 'info',
      }
    }).catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({
      success: true,
      content: file.content,
      file: {
        id: file.id,
        name: file.name,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        updatedAt: file.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}
