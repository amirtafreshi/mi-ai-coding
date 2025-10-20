import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateSkillMarkdown, refineSkillMarkdown } from '@/lib/gemini'
import { z } from 'zod'

// Validation schema
const generateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  mode: z.enum(['generate', 'refine']).default('generate'),
  existingMarkdown: z.string().optional(),
  refinementInstructions: z.string().optional(),
})

// POST /api/skills/generate - Generate skill with SSE streaming
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = generateSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { name, description, mode, existingMarkdown, refinementInstructions } = validation.data

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let markdown = ''

          console.log('[API /api/skills/generate] Starting generation:', { name, mode })

          // Get async iterable from Gemini
          const streamIterator = mode === 'refine' && existingMarkdown && refinementInstructions
            ? await refineSkillMarkdown(existingMarkdown, refinementInstructions)
            : await generateSkillMarkdown(name, description)

          console.log('[API /api/skills/generate] Got stream iterator, starting to iterate...')

          // Stream chunks
          let chunkCount = 0
          for await (const chunk of streamIterator) {
            markdown += chunk
            chunkCount++

            // Send chunk as SSE (only incremental content, not fullContent)
            // This prevents JSON parsing errors from very long strings
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk,
              currentLength: markdown.length // Send length instead of full content for progress
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))

            // Log every 10 chunks
            if (chunkCount % 10 === 0) {
              console.log('[API /api/skills/generate] Sent chunk', chunkCount, 'total length:', markdown.length)
            }
          }

          console.log('[API /api/skills/generate] Stream complete. Total chunks:', chunkCount, 'final length:', markdown.length)

          // Clean up markdown code blocks if present (```markdown ... ```)
          let cleanedMarkdown = markdown.trim()
          if (cleanedMarkdown.startsWith('```markdown') || cleanedMarkdown.startsWith('```')) {
            cleanedMarkdown = cleanedMarkdown.replace(/^```(?:markdown)?\n/, '')
            cleanedMarkdown = cleanedMarkdown.replace(/\n```$/, '')
            console.log('[API /api/skills/generate] Removed markdown code block wrapper')
          }

          // Send completion event
          const completeData = JSON.stringify({
            type: 'complete',
            fullContent: cleanedMarkdown
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

          controller.close()
        } catch (error: any) {
          console.error('[API /api/skills/generate] Error:', error)
          console.error('[API /api/skills/generate] Error stack:', error.stack)

          // Send error event
          const errorData = JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to generate skill'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('[API /api/skills/generate] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
