import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Validation schema
const importUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
})

// Whitelist of allowed domains
const ALLOWED_DOMAINS = [
  'github.com',
  'raw.githubusercontent.com',
  'gist.github.com',
  'gitlab.com',
  'bitbucket.org',
]

// POST /api/agents/import-url - Import agent from URL
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
    const validation = importUrlSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { url } = validation.data

    // Validate domain whitelist
    try {
      const urlObj = new URL(url)
      const isAllowed = ALLOWED_DOMAINS.some((domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )

      if (!isAllowed) {
        return NextResponse.json(
          { error: `Domain not allowed. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}` },
          { status: 403 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the content
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'MI-AI-Coding-Platform/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}` },
        { status: 502 }
      )
    }

    const content = await fetchResponse.text()

    // Basic validation that it looks like markdown
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'URL returned empty content' },
        { status: 400 }
      )
    }

    if (content.length > 100000) {
      return NextResponse.json(
        { error: 'Content too large (max 100KB)' },
        { status: 413 }
      )
    }

    return NextResponse.json({
      success: true,
      content,
      url,
    })
  } catch (error: any) {
    console.error('[API /api/agents/import-url] Error:', error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout while fetching URL' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to import from URL' },
      { status: 500 }
    )
  }
}
