import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/home/master/projects'

    // Security: Prevent directory traversal attacks
    // Only allow access to safe directories
    const allowedPaths = [
      '/',
      '/home',
      '/home/master',
      '/home/master/projects',
    ]

    // Check if path starts with an allowed path or is a subdirectory
    const isAllowed = allowedPaths.some(allowed =>
      path === allowed || path.startsWith(allowed + '/')
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Access to this directory is not allowed' },
        { status: 403 }
      )
    }

    // Read directory contents
    const entries = await readdir(path, { withFileTypes: true })

    // Get stats for each entry
    const entriesWithStats = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(path, entry.name)
        try {
          const stats = await stat(fullPath)

          // Check if directory contains SKILL.md (for skill folder detection)
          let hasSkillMd = false
          if (entry.isDirectory()) {
            const skillMdPath = join(fullPath, 'SKILL.md')
            try {
              await access(skillMdPath, constants.F_OK)
              hasSkillMd = true
            } catch {
              // SKILL.md doesn't exist, that's fine
            }
          }

          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            size: stats.size,
            modified: stats.mtime.toISOString(),
            path: fullPath,
            hasSkillMd, // Add this flag for skill folder detection
          }
        } catch (err) {
          // Skip files we can't access
          return null
        }
      })
    )

    // Filter out nulls and sort: directories first, then files
    const validEntries = entriesWithStats
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })

    return NextResponse.json({
      path,
      entries: validEntries,
      count: validEntries.length,
    })
  } catch (error) {
    console.error('Error browsing filesystem:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to read directory', details: errorMessage },
      { status: 500 }
    )
  }
}
