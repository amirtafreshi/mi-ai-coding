import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { refineDocument } from '@/lib/gemini'
import { z } from 'zod'

// Validation schema
const refineSchema = z.object({
  content: z.string().min(1),
  refinementInstructions: z.string().min(1).max(5000),
  fileType: z.enum(['agent', 'skill', 'file']),
  fileName: z.string().optional(),
})

// POST /api/document/refine - Refine any document with SSE streaming
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
    const validation = refineSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { content, refinementInstructions, fileType, fileName } = validation.data

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let refinedContent = ''

          console.log('[API /api/document/refine] Starting refinement:', {
            fileType,
            fileName,
            contentLength: content.length,
          })

          // Get async iterable from Gemini
          const streamIterator = await refineDocument(
            content,
            refinementInstructions,
            fileType,
            fileName
          )

          console.log('[API /api/document/refine] Got stream iterator, starting to iterate...')

          // Stream chunks
          let chunkCount = 0
          for await (const chunk of streamIterator) {
            refinedContent += chunk
            chunkCount++

            // Send chunk as SSE (only incremental content, not fullContent)
            // This prevents JSON parsing errors from very long strings
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk,
              currentLength: refinedContent.length, // Send length instead of full content for progress
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))

            // Log every 10 chunks
            if (chunkCount % 10 === 0) {
              console.log(
                '[API /api/document/refine] Sent chunk',
                chunkCount,
                'total length:',
                refinedContent.length
              )
            }
          }

          console.log(
            '[API /api/document/refine] Stream complete. Total chunks:',
            chunkCount,
            'final length:',
            refinedContent.length
          )

          // Clean up markdown code blocks if present (```markdown ... ``` or ```typescript ... ```)
          let cleanedContent = refinedContent.trim()
          const codeBlockRegex = /^```[a-zA-Z]*\n/
          if (codeBlockRegex.test(cleanedContent)) {
            cleanedContent = cleanedContent.replace(codeBlockRegex, '')
            cleanedContent = cleanedContent.replace(/\n```$/, '')
            console.log('[API /api/document/refine] Removed code block wrapper')
          }

          // Send completion event
          const completeData = JSON.stringify({
            type: 'complete',
            fullContent: cleanedContent,
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

          controller.close()
        } catch (error: any) {
          console.error('[API /api/document/refine] Error:', error)
          console.error('[API /api/document/refine] Error stack:', error.stack)

          // Send error event
          const errorData = JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to refine document',
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
    console.error('[API /api/document/refine] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
