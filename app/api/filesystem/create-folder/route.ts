import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { path, name } = await request.json()

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

    // Create the folder
    await mkdir(path, { recursive: true })

    // Check if this is a new project folder in /home/master/projects
    // If so, automatically create .claude directory structure
    const projectsPath = '/home/master/projects'
    const isProjectFolder = path.startsWith(projectsPath + '/') &&
                           path.split('/').length === projectsPath.split('/').length + 1

    if (isProjectFolder) {
      // Create .claude directory structure for new projects
      const claudeDir = `${path}/.claude`
      const agentsDir = `${claudeDir}/agents`
      const skillsDir = `${claudeDir}/skills`

      await mkdir(agentsDir, { recursive: true })
      await mkdir(skillsDir, { recursive: true })

      console.log(`[create-folder] Created .claude structure for project: ${path}`)
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        agent: 'file-explorer',
        action: 'create_folder',
        details: `Created folder: ${path}${isProjectFolder ? ' (with .claude structure)' : ''}`,
        level: 'info',
      }
    })

    return NextResponse.json({
      success: true,
      path,
      name,
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
