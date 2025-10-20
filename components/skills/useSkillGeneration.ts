import { useState, useCallback } from 'react'

export type GenerationMode = 'generate' | 'refine'
export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'

interface UseSkillGenerationOptions {
  onComplete?: (markdown: string) => void
  onError?: (error: string) => void
}

export function useSkillGeneration(options: UseSkillGenerationOptions = {}) {
  const [markdown, setMarkdown] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const generate = useCallback(
    async (name: string, description: string) => {
      console.log('[useSkillGeneration] Starting generation for:', name)
      setStatus('generating')
      setError(null)
      // Don't clear markdown immediately - let it show during generation
      setProgress(0)

      try {
        const response = await fetch('/api/skills/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
            mode: 'generate',
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
        let fullMarkdown = ''
        let buffer = '' // Buffer to accumulate incomplete lines

        console.log('[useSkillGeneration] Starting to read stream...')

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[useSkillGeneration] Stream done')
            break
          }

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
                  fullMarkdown += data.content
                  setMarkdown(fullMarkdown)
                  // Estimate progress (rough estimate based on char count)
                  const estimatedTotal = 2000
                  const newProgress = Math.min(95, (fullMarkdown.length / estimatedTotal) * 100)
                  setProgress(newProgress)
                  console.log('[useSkillGeneration] Received chunk, total length:', fullMarkdown.length, 'progress:', newProgress)
                } else if (data.type === 'complete') {
                  fullMarkdown = data.fullContent
                  setMarkdown(fullMarkdown)
                  setProgress(100)
                  setStatus('complete')
                  console.log('[useSkillGeneration] Generation complete, final length:', fullMarkdown.length)
                  options.onComplete?.(fullMarkdown)
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (parseError: any) {
                console.warn('[useSkillGeneration] Skipping malformed SSE line (will retry if incomplete):', parseError.message)
                // Don't log the full line to avoid console spam, just skip it
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[useSkillGeneration] Error:', err)
        setError(err.message || 'Failed to generate skill')
        setStatus('error')
        options.onError?.(err.message)
      }
    },
    [options]
  )

  const refine = useCallback(
    async (existingMarkdown: string, refinementInstructions: string) => {
      setStatus('generating')
      setError(null)
      setProgress(0)

      try {
        const response = await fetch('/api/skills/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'refinement', // Not used for refine mode
            description: refinementInstructions,
            mode: 'refine',
            existingMarkdown,
            refinementInstructions,
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
        let fullMarkdown = ''
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
                  fullMarkdown += data.content
                  setMarkdown(fullMarkdown)
                  const estimatedTotal = 2000
                  setProgress(Math.min(95, (fullMarkdown.length / estimatedTotal) * 100))
                } else if (data.type === 'complete') {
                  fullMarkdown = data.fullContent
                  setMarkdown(fullMarkdown)
                  setProgress(100)
                  setStatus('complete')
                  options.onComplete?.(fullMarkdown)
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (parseError: any) {
                console.warn('[useSkillGeneration] Skipping malformed SSE line (will retry if incomplete):', parseError.message)
                // Don't log the full line to avoid console spam, just skip it
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[useSkillGeneration] Error:', err)
        setError(err.message || 'Failed to refine skill')
        setStatus('error')
        options.onError?.(err.message)
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setMarkdown('')
    setStatus('idle')
    setError(null)
    setProgress(0)
  }, [])

  return {
    markdown,
    status,
    error,
    progress,
    generate,
    refine,
    reset,
    isGenerating: status === 'generating',
    isComplete: status === 'complete',
    isError: status === 'error',
  }
}
