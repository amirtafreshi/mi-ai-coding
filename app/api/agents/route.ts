import { NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

interface Agent {
  id: string
  name: string
  purpose: string
  capabilities: string[]
  status: 'active' | 'idle' | 'busy'
}

export async function GET() {
  try {
    const agentsDir = path.join(process.cwd(), 'agents')
    const agentFolders = await readdir(agentsDir)

    const agents: Agent[] = []

    for (const folder of agentFolders) {
      try {
        const readmePath = path.join(agentsDir, folder, 'README.md')
        const content = await readFile(readmePath, 'utf-8')

        // Parse README to extract agent info
        const lines = content.split('\n')
        let name = folder
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        let purpose = ''
        const capabilities: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()

          if (line.startsWith('# ')) {
            name = line.replace('# ', '').trim()
          }

          if (line === '## Purpose' && lines[i + 1]) {
            purpose = lines[i + 1].trim()
          }

          if (line.startsWith('- **') && lines[i].includes(':')) {
            const capability = line
              .replace(/^- \*\*/, '')
              .split('**:')[0]
              .trim()
            if (capability) capabilities.push(capability)
          }
        }

        agents.push({
          id: folder,
          name,
          purpose: purpose || 'No description available',
          capabilities: capabilities.slice(0, 5), // Limit to 5
          status: 'idle',
        })
      } catch (error) {
        console.error(`Error reading agent ${folder}:`, error)
      }
    }

    return NextResponse.json({
      agents: agents.sort((a, b) => {
        // Orchestrating first, then alphabetically
        if (a.id === 'orchestrating') return -1
        if (b.id === 'orchestrating') return 1
        return a.name.localeCompare(b.name)
      }),
      count: agents.length,
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
