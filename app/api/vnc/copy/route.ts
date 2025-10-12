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
    const { display } = body

    if (!display || (display !== ':98' && display !== ':99')) {
      return NextResponse.json(
        { error: 'Valid display parameter is required (:98 or :99)' },
        { status: 400 }
      )
    }

    // Execute xclip to get clipboard content from VNC display
    // Use timeout to prevent xclip from hanging (known xclip behavior)
    const command = `timeout 2 xclip -o -selection clipboard -display ${display}`
    const { stdout, stderr } = await execAsync(command)

    if (stderr && !stderr.includes('target STRING not available')) {
      console.error('xclip stderr:', stderr)
    }

    const clipboardText = stdout || ''

    // Log activity to database
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        agent: 'vnc-clipboard',
        action: 'copy_from_vnc',
        details: `User ${session.user.email} copied ${clipboardText.length} characters from VNC display ${display}`,
        level: 'info',
      }
    })

    return NextResponse.json({
      text: clipboardText,
      display,
    })
  } catch (error) {
    console.error('Error copying from VNC:', error)

    // Determine if clipboard is empty or there's a real error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isEmptyClipboard = errorMessage.includes('target STRING not available')

    // Log error to database if user is authenticated
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            agent: 'vnc-clipboard',
            action: 'copy_from_vnc_error',
            details: `Failed to copy from VNC: ${errorMessage}`,
            level: isEmptyClipboard ? 'info' : 'error',
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    // Return appropriate error message
    if (isEmptyClipboard) {
      return NextResponse.json(
        { error: 'target STRING not available', text: '' },
        { status: 200 } // Not really an error, just empty clipboard
      )
    }

    return NextResponse.json(
      { error: 'Failed to copy from VNC. Ensure xclip is installed and VNC is running.' },
      { status: 500 }
    )
  }
}
