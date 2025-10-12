import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

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
    const { display, text } = body

    if (!display || (display !== ':98' && display !== ':99')) {
      return NextResponse.json(
        { error: 'Valid display parameter is required (:98 or :99)' },
        { status: 400 }
      )
    }

    if (text === undefined || text === null) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      )
    }

    // Escape text for shell command
    const escapedText = text.replace(/'/g, "'\\''")

    // Copy text to clipboard using xclip with timeout
    const clipboardCommand = `timeout 5 bash -c "echo '${escapedText}' | xclip -selection clipboard -display ${display}"`
    await execAsync(clipboardCommand)

    // Type the text using xdotool with timeout
    const typeCommand = `timeout 10 bash -c "DISPLAY=${display} xdotool type --clearmodifiers '${escapedText}'"`
    await execAsync(typeCommand)

    // Log activity to database
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        agent: 'vnc-clipboard',
        action: 'paste_to_vnc',
        details: `User ${session.user.email} pasted ${text.length} characters to VNC display ${display}`,
        level: 'info',
      }
    })

    return NextResponse.json({
      success: true,
      display,
      length: text.length,
    })
  } catch (error) {
    console.error('Error pasting to VNC:', error)

    // Log error to database if user is authenticated
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            agent: 'vnc-clipboard',
            action: 'paste_to_vnc_error',
            details: `Failed to paste to VNC: ${error instanceof Error ? error.message : 'Unknown error'}`,
            level: 'error',
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to paste to VNC. Ensure xclip and xdotool are installed and VNC is running.' },
      { status: 500 }
    )
  }
}
