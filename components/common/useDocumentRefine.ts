import { useState, useCallback } from 'react'

export type DocumentType = 'agent' | 'skill' | 'file'
export type RefineStatus = 'idle' | 'refining' | 'complete' | 'error'

interface UseDocumentRefineOptions {
  onComplete?: (refinedContent: string) => void
  onError?: (error: string) => void
}

interface UseDocumentRefineReturn {
  refinedContent: string
  status: RefineStatus
  progress: number
  error: string | null
  refine: (content: string, instructions: string, fileType: DocumentType, fileName?: string) => Promise<void>
  isRefining: boolean
}

export function useDocumentRefine(options: UseDocumentRefineOptions = {}): UseDocumentRefineReturn {
  const [refinedContent, setRefinedContent] = useState('')
  const [status, setStatus] = useState<RefineStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const refine = useCallback(
    async (
      content: string,
      instructions: string,
      fileType: DocumentType,
      fileName?: string
    ) => {
      setStatus('refining')
      setError(null)
      setProgress(0)
      setRefinedContent('')

      try {
        const response = await fetch('/api/document/refine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            refinementInstructions: instructions,
            fileType,
            fileName,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = '' // Buffer to accumulate incomplete lines

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Split by newlines, but keep the last incomplete line in the buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue // Skip empty lines

            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim()
                if (!jsonStr) continue // Skip if no JSON data

                const data = JSON.parse(jsonStr)

                if (data.type === 'chunk') {
                  // Accumulate content incrementally
                  fullContent += data.content
                  setRefinedContent(fullContent)
                  const estimatedTotal = 2000
                  setProgress(Math.min(95, (fullContent.length / estimatedTotal) * 100))
                } else if (data.type === 'complete') {
                  fullContent = data.fullContent
                  setRefinedContent(fullContent)
                  setProgress(100)
                  setStatus('complete')
                  options.onComplete?.(fullContent)
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (parseError: any) {
                console.warn(
                  '[useDocumentRefine] Skipping malformed SSE line (will retry if incomplete):',
                  parseError.message
                )
                // Don't log the full line to avoid console spam, just skip it
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[useDocumentRefine] Error:', err)
        setError(err.message || 'Failed to refine document')
        setStatus('error')
        options.onError?.(err.message)
      }
    },
    [options]
  )

  return {
    refinedContent,
    status,
    progress,
    error,
    refine,
    isRefining: status === 'refining',
  }
}
