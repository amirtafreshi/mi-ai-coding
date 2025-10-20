import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper to validate YAML frontmatter in SKILL.md
function validateSkillMarkdown(content: string): { valid: boolean; error?: string; name?: string; description?: string } {
  // Check for YAML frontmatter
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)

  if (!yamlMatch) {
    return { valid: false, error: 'SKILL.md must start with YAML frontmatter (---\\n...\\n---)' }
  }

  const yamlContent = yamlMatch[1]

  // Extract name and description
  const nameMatch = yamlContent.match(/^name:\s*(.+)$/m)
  const descMatch = yamlContent.match(/^description:\s*(.+)$/m)

  if (!nameMatch || !nameMatch[1].trim()) {
    return { valid: false, error: 'YAML frontmatter must include "name" field' }
  }

  if (!descMatch || !descMatch[1].trim()) {
    return { valid: false, error: 'YAML frontmatter must include "description" field' }
  }

  const name = nameMatch[1].trim()
  const description = descMatch[1].trim()

  // Validate length limits
  if (name.length > 64) {
    return { valid: false, error: 'Skill name must be 64 characters or less' }
  }

  if (description.length > 200) {
    return { valid: false, error: 'Skill description must be 200 characters or less' }
  }

  return { valid: true, name, description }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName, content, resources } = await request.json()

    console.log('[API /api/skills/save] Received request:', { fileName, contentLength: content?.length, resourcesCount: resources?.length })

    if (!fileName || !content) {
      return NextResponse.json({ error: 'fileName and content are required' }, { status: 400 })
    }

    // Validate SKILL.md content
    const validation = validateSkillMarkdown(content)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Determine save location based on current context
    // Skills should be saved to either:
    // 1. /home/master/projects/skills/{skill-name}/SKILL.md (master skills)
    // 2. /home/master/projects/{project}/.claude/skills/{skill-name}/SKILL.md (project skills)

    // For now, save to master skills by default
    // The UI should pass a 'targetPath' parameter for project-specific skills
    const basePath = '/home/master/projects/skills'

    // Extract skill name from fileName (remove .md extension if present)
    const skillName = fileName.replace(/\.md$/, '')
    const skillPath = join(basePath, skillName)
    const skillFilePath = join(skillPath, 'SKILL.md')

    // Create skill directory
    await mkdir(skillPath, { recursive: true })

    // Write SKILL.md file
    await writeFile(skillFilePath, content, 'utf-8')

    // Always create resources directory
    const resourcesPath = join(skillPath, 'resources')
    await mkdir(resourcesPath, { recursive: true })

    // Write resource files if provided
    if (resources && Array.isArray(resources) && resources.length > 0) {
      for (const resource of resources) {
        if (resource.fileName && resource.content) {
          const resourceFilePath = join(resourcesPath, resource.fileName)
          await writeFile(resourceFilePath, resource.content, 'utf-8')
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        agent: 'skills-manager',
        action: 'create_skill',
        details: `Created skill: ${validation.name} at ${skillPath}`,
        level: 'info',
      }
    })

    console.log('[API /api/skills/save] Skill saved successfully:', { name: validation.name, path: skillFilePath })

    return NextResponse.json({
      success: true,
      message: `Skill "${validation.name}" saved successfully!`,
      path: skillFilePath,
      skillPath: skillPath,
      resourcesPath: resourcesPath,
      skillName,
      name: validation.name,
      description: validation.description
    })
  } catch (error) {
    console.error('Error saving skill:', error)
    return NextResponse.json(
      { error: 'Failed to save skill' },
      { status: 500 }
    )
  }
}
