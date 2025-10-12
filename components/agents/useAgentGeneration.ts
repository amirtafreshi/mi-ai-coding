import { useState, useCallback } from 'react'

export type GenerationMode = 'generate' | 'refine'
export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'

interface UseAgentGenerationOptions {
  onComplete?: (markdown: string) => void
  onError?: (error: string) => void
}

export function useAgentGeneration(options: UseAgentGenerationOptions = {}) {
  const [markdown, setMarkdown] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const generate = useCallback(
    async (name: string, description: string) => {
      console.log('[useAgentGeneration] Starting generation for:', name)
      setStatus('generating')
      setError(null)
      // Don't clear markdown immediately - let it show during generation
      // setMarkdown('') // REMOVED: This was causing the editor to be empty
      setProgress(0)

      try {
        const response = await fetch('/api/agents/generate', {
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

        console.log('[useAgentGeneration] Starting to read stream...')

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[useAgentGeneration] Stream done')
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'chunk') {
                  fullMarkdown = data.fullContent
                  setMarkdown(fullMarkdown)
                  // Estimate progress (rough estimate based on char count)
                  const estimatedTotal = 2000
                  const newProgress = Math.min(95, (fullMarkdown.length / estimatedTotal) * 100)
                  setProgress(newProgress)
                  console.log('[useAgentGeneration] Received chunk, total length:', fullMarkdown.length, 'progress:', newProgress)
                } else if (data.type === 'complete') {
                  fullMarkdown = data.fullContent
                  setMarkdown(fullMarkdown)
                  setProgress(100)
                  setStatus('complete')
                  console.log('[useAgentGeneration] Generation complete, final length:', fullMarkdown.length)
                  options.onComplete?.(fullMarkdown)
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (parseError: any) {
                console.error('[useAgentGeneration] Failed to parse SSE data:', line, parseError)
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[useAgentGeneration] Error:', err)
        setError(err.message || 'Failed to generate agent')
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
        const response = await fetch('/api/agents/generate', {
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

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'chunk') {
                fullMarkdown = data.fullContent
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
            }
          }
        }
      } catch (err: any) {
        console.error('[useAgentGeneration] Error:', err)
        setError(err.message || 'Failed to refine agent')
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
