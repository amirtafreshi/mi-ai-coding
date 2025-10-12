import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const AGENTS_SOURCE_DIR = '/home/master/projects/agents'

// POST /api/agents/deploy - Deploy agent to a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentFileName, projectPath, overwrite = false } = body

    if (!agentFileName || !projectPath) {
      return NextResponse.json(
        { error: 'agentFileName and projectPath are required' },
        { status: 400 }
      )
    }

    // Validate agent file name (must be .md)
    if (!agentFileName.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Agent file must be a .md file' },
        { status: 400 }
      )
    }

    const sourcePath = path.join(AGENTS_SOURCE_DIR, agentFileName)
    const targetDir = path.join(projectPath, '.claude', 'agents')
    const targetPath = path.join(targetDir, agentFileName)

    // Check if source file exists
    try {
      await fs.access(sourcePath)
    } catch {
      return NextResponse.json(
        { error: `Agent file not found: ${agentFileName}` },
        { status: 404 }
      )
    }

    // Check if target already exists
    let fileExists = false
    try {
      await fs.access(targetPath)
      fileExists = true
    } catch {
      fileExists = false
    }

    if (fileExists && !overwrite) {
      return NextResponse.json(
        {
          error: 'Agent already exists in project',
          exists: true,
          targetPath,
        },
        { status: 409 }
      )
    }

    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true })

    // Copy the file
    await fs.copyFile(sourcePath, targetPath)

    // Set permissions to 644 (rw-r--r--)
    // Owner can read/write, everyone else can read
    await fs.chmod(targetPath, 0o644)

    console.log(`[API /api/agents/deploy] Deployed agent: ${agentFileName} to ${targetPath} with permissions 644`)

    return NextResponse.json({
      success: true,
      message: `Agent ${agentFileName} deployed successfully`,
      targetPath,
      overwritten: fileExists,
    })
  } catch (error) {
    console.error('[API /api/agents/deploy] Error deploying agent:', error)
    return NextResponse.json(
      { error: 'Failed to deploy agent' },
      { status: 500 }
    )
  }
}
