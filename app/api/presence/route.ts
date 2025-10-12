import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Store online users in memory (sessionToken -> user data)
const onlineUsers = new Map<string, {
  id: string
  email: string
  name: string | null
  role: string
  lastSeen: number
}>()

// Clean up stale users every 30 seconds
setInterval(() => {
  const now = Date.now()
  const timeout = 60000 // 1 minute timeout

  for (const [sessionToken, user] of onlineUsers.entries()) {
    if (now - user.lastSeen > timeout) {
      onlineUsers.delete(sessionToken)
      console.log(`[Presence] Removed stale user: ${user.email}`)
    }
  }
}, 30000)

// GET: Get list of online users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Map to array of unique users (by user ID)
    const uniqueUsers = new Map<string, typeof onlineUsers extends Map<string, infer T> ? T : never>()

    for (const user of onlineUsers.values()) {
      uniqueUsers.set(user.id, user)
    }

    const users = Array.from(uniqueUsers.values()).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }))

    return NextResponse.json({
      users,
      count: users.length,
    })
  } catch (error) {
    console.error('Error getting online users:', error)
    return NextResponse.json(
      { error: 'Failed to get online users' },
      { status: 500 }
    )
  }
}

// POST: Update user presence (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any

    // Get current session token from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { currentSessionToken: true }
    })

    if (!dbUser?.currentSessionToken) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    // Update presence
    onlineUsers.set(dbUser.currentSessionToken, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastSeen: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    )
  }
}
