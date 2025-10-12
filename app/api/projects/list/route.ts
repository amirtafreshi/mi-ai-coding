import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const projectsPath = '/home/master/projects'
    const entries = await readdir(projectsPath, { withFileTypes: true })

    // Filter for directories only, exclude common non-project folders
    const excludeFolders = ['agents', 'ssl', '.git', 'node_modules']
    const projects = entries
      .filter(entry =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        !excludeFolders.includes(entry.name)
      )
      .map(entry => ({
        name: entry.name,
        path: join(projectsPath, entry.name),
        agentPath: join(projectsPath, entry.name, '.claude', 'agents')
      }))

    return NextResponse.json({
      projects,
      masterAgentsPath: '/home/master/projects/agents'
    })
  } catch (error) {
    console.error('Error listing projects:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}
