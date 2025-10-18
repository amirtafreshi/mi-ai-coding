import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch content from URL
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''

    // Handle different content types
    if (contentType.includes('application/zip') || url.endsWith('.zip')) {
      // TODO: Handle ZIP files (extract and process)
      return NextResponse.json({
        error: 'ZIP file import not yet supported. Please use direct SKILL.md URLs for now.'
      }, { status: 400 })
    }

    // Assume it's a markdown file
    const content = await response.text()

    // Validate YAML frontmatter
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!yamlMatch) {
      return NextResponse.json({
        error: 'Invalid SKILL.md format. Must start with YAML frontmatter (---\\n...\\n---)'
      }, { status: 400 })
    }

    const yamlContent = yamlMatch[1]
    const nameMatch = yamlContent.match(/^name:\s*(.+)$/m)
    const descMatch = yamlContent.match(/^description:\s*(.+)$/m)

    if (!nameMatch || !descMatch) {
      return NextResponse.json({
        error: 'SKILL.md must include "name" and "description" fields in YAML frontmatter'
      }, { status: 400 })
    }

    const skillName = nameMatch[1].trim()
    const fileName = skillName.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    return NextResponse.json({
      success: true,
      fileName,
      content,
      skillName
    })
  } catch (error: any) {
    console.error('Error importing skill from URL:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import skill from URL' },
      { status: 500 }
    )
  }
}
