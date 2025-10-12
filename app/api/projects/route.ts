import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PROJECTS_DIR = '/home/master/projects'

// GET /api/projects - List all projects in /home/master/projects/
export async function GET(request: NextRequest) {
  try {
    const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })

    const projects = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(PROJECTS_DIR, entry.name)
        const agentsPath = path.join(projectPath, '.claude', 'agents')

        // Check if .claude/agents directory exists
        let hasAgentsFolder = false
        try {
          const stat = await fs.stat(agentsPath)
          hasAgentsFolder = stat.isDirectory()
        } catch {
          hasAgentsFolder = false
        }

        projects.push({
          name: entry.name,
          path: projectPath,
          agentsPath,
          hasAgentsFolder,
        })
      }
    }

    return NextResponse.json({
      projects: projects.sort((a, b) => a.name.localeCompare(b.name)),
    })
  } catch (error) {
    console.error('[API /api/projects] Error listing projects:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}
