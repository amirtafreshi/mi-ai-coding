import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Check if the current session is still valid
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ valid: false, reason: 'no_session' })
    }

    const user = session.user as any

    // Get user's current session token and last login time from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { currentSessionToken: true, lastLoginTime: true }
    })

    if (!dbUser) {
      return NextResponse.json({ valid: false, reason: 'user_not_found' })
    }

    // Check if this session is OLDER than the last login time
    // Only invalidate sessions that were created before the most recent login
    if (user.loginTime && dbUser.lastLoginTime) {
      const userLoginTime = Number(user.loginTime)
      const dbLoginTime = dbUser.lastLoginTime.getTime()

      // If this session's login time is older than the database login time,
      // it means the user logged in from another device
      if (userLoginTime < dbLoginTime) {
        console.log(`[check-session] Session invalidated for ${user.email}: session time ${new Date(userLoginTime).toISOString()} < db time ${new Date(dbLoginTime).toISOString()}`)
        return NextResponse.json({ valid: false, reason: 'logged_in_elsewhere' })
      }
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json(
      { valid: false, reason: 'error' },
      { status: 500 }
    )
  }
}
