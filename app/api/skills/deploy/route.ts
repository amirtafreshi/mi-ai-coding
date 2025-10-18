import { NextRequest, NextResponse } from 'next/server'
import { cp, mkdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skillName, projectPath } = await request.json()

    if (!skillName || !projectPath) {
      return NextResponse.json(
        { error: 'skillName and projectPath are required' },
        { status: 400 }
      )
    }

    // Source: /home/master/projects/skills/{skillName}/
    const sourcePath = join('/home/master/projects/skills', skillName)

    // Destination: {projectPath}/.claude/skills/{skillName}/
    const destPath = join(projectPath, '.claude', 'skills', skillName)

    // Ensure destination directory exists
    await mkdir(dirname(destPath), { recursive: true })

    // Copy skill folder recursively (includes SKILL.md and resources/)
    await cp(sourcePath, destPath, { recursive: true })

    // Read SKILL.md to get skill details for logging
    const skillMdPath = join(destPath, 'SKILL.md')
    const skillContent = await readFile(skillMdPath, 'utf-8')

    // Extract skill name from YAML frontmatter
    const nameMatch = skillContent.match(/^name:\s*(.+)$/m)
    const displayName = nameMatch ? nameMatch[1].trim() : skillName

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        agent: 'skills-manager',
        action: 'deploy_skill',
        details: `Deployed skill "${displayName}" to ${projectPath}`,
        level: 'info',
      }
    })

    return NextResponse.json({
      success: true,
      message: `Skill "${displayName}" deployed successfully!`,
      sourcePath,
      destPath
    })
  } catch (error: any) {
    console.error('Error deploying skill:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deploy skill' },
      { status: 500 }
    )
  }
}
