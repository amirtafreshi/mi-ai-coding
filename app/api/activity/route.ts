import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type declaration for global broadcast function
declare global {
  var broadcastActivity: ((log: any) => void) | undefined
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const agent = searchParams.get('agent')
    const level = searchParams.get('level')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}

    if (agent) {
      where.agent = agent
    }

    if (level) {
      where.level = level
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        agent: true,
        action: true,
        details: true,
        level: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      logs: logs.reverse(), // Return in chronological order
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent, action, details, level = 'info' } = body

    if (!agent || !action || !details) {
      return NextResponse.json(
        { error: 'Agent, action, and details are required' },
        { status: 400 }
      )
    }

    const log = await prisma.activityLog.create({
      data: {
        agent,
        action,
        details,
        level,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    // Broadcast to WebSocket clients if server is running
    if (global.broadcastActivity) {
      global.broadcastActivity({
        id: log.id,
        userId: log.userId,
        user: log.user,
        agent: log.agent,
        action: log.action,
        details: log.details,
        level: log.level as 'info' | 'warning' | 'error',
        createdAt: log.createdAt.toISOString(),
      })
    }

    return NextResponse.json({
      id: log.id,
      created: true,
    })
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    )
  }
}
