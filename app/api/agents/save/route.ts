import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'

const AGENTS_DIR = '/home/master/projects/agents'

// Validation schema
const saveAgentSchema = z.object({
  fileName: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+\.md$/, 'Invalid file name format'),
  content: z.string().min(1).max(100000),
})

// POST /api/agents/save - Save agent with public permissions
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

    // Parse and validate request body
    const body = await request.json()
    const validation = saveAgentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { fileName, content } = validation.data

    // Ensure agents directory exists
    await fs.mkdir(AGENTS_DIR, { recursive: true })

    const filePath = path.join(AGENTS_DIR, fileName)

    // Security check: Ensure path is within agents directory
    const resolvedPath = path.resolve(filePath)
    const resolvedAgentsDir = path.resolve(AGENTS_DIR)
    if (!resolvedPath.startsWith(resolvedAgentsDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Check if file already exists
    let fileExists = false
    try {
      await fs.access(filePath)
      fileExists = true
    } catch {
      fileExists = false
    }

    // Write the file
    await fs.writeFile(filePath, content, 'utf-8')

    // Set permissions to 644 (rw-r--r--)
    // Owner can read/write, everyone else can read
    await fs.chmod(filePath, 0o644)

    console.log(`[API /api/agents/save] Saved agent: ${fileName} with permissions 644`)

    return NextResponse.json({
      success: true,
      message: fileExists ? 'Agent updated successfully' : 'Agent created successfully',
      filePath,
      fileName,
    })
  } catch (error: any) {
    console.error('[API /api/agents/save] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save agent' },
      { status: 500 }
    )
  }
}
