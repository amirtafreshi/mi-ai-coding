'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Progress, message, Input } from 'antd'
import { SaveOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import dynamic from 'next/dynamic'
import { useAgentGeneration } from './useAgentGeneration'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

// Dynamically import markdown editor (client-side only)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface AgentEditorModalProps {
  open: boolean
  fileName: string
  initialContent: string
  agentName: string
  agentDescription: string
  onClose: () => void
  onSaveSuccess?: () => void
  skipAIGeneration?: boolean  // New prop to skip auto-generation
}

export function AgentEditorModal({
  open,
  fileName,
  initialContent,
  agentName,
  agentDescription,
  onClose,
  onSaveSuccess,
  skipAIGeneration = false,
}: AgentEditorModalProps) {
  const [markdown, setMarkdown] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [showRefineInput, setShowRefineInput] = useState(false)
  const [refinementInstructions, setRefinementInstructions] = useState('')

  const {
    markdown: generatedMarkdown,
    status,
    progress,
    generate,
    refine,
    isGenerating,
  } = useAgentGeneration({
    onComplete: (content) => {
      setMarkdown(content)
      message.success('Agent generated successfully!')
    },
    onError: (error) => {
      message.error(error)
    },
  })

  // Update markdown when generation updates
  useEffect(() => {
    if (generatedMarkdown) {
      setMarkdown(generatedMarkdown)
    }
  }, [generatedMarkdown])

  // Auto-generate on mount if content is minimal (AI generation mode) and skipAIGeneration is false
  useEffect(() => {
    if (open && !skipAIGeneration && initialContent && initialContent.split('\n').length <= 3) {
      // Keep initial content visible while generating
      console.log('[AgentEditorModal] Starting auto-generation with initial content:', initialContent)
      // This looks like initial content from AI mode, trigger generation
      generate(agentName, agentDescription)
    }
  }, [open])

  const handleSave = async () => {
    if (!markdown || !markdown.trim()) {
      message.error('Agent content cannot be empty')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/agents/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          content: markdown,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save agent')
      }

      message.success(data.message || 'Agent saved successfully!')
      onSaveSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('[AgentEditorModal] Save error:', error)
      message.error(error.message || 'Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  const handleRefine = () => {
    if (!refinementInstructions.trim()) {
      message.warning('Please enter refinement instructions')
      return
    }

    refine(markdown, refinementInstructions)
    setRefinementInstructions('')
    setShowRefineInput(false)
  }

  const handleRegenerate = () => {
    Modal.confirm({
      title: 'Regenerate Agent?',
      content: 'This will replace the current content with a newly generated agent. Continue?',
      onOk: () => {
        generate(agentName, agentDescription)
      },
    })
  }

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span>Edit Agent: {fileName}</span>
          {isGenerating && (
            <div className="flex items-center gap-2 ml-4">
              <Progress
                percent={progress}
                size="small"
                status="active"
                style={{ width: 200 }}
              />
              <span className="text-sm text-gray-500">Generating...</span>
            </div>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width="90%"
      style={{ top: 20, maxWidth: 1400 }}
      footer={[
        <Button
          key="refine"
          icon={<ThunderboltOutlined />}
          onClick={() => setShowRefineInput(!showRefineInput)}
          disabled={isGenerating || !markdown}
        >
          Refine with AI
        </Button>,
        <Button
          key="regenerate"
          icon={<ReloadOutlined />}
          onClick={handleRegenerate}
          disabled={isGenerating}
        >
          Regenerate
        </Button>,
        <Button key="cancel" onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          disabled={isGenerating || !markdown}
        >
          Save Agent
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {showRefineInput && (
          <div className="flex gap-2">
            <Input
              placeholder="E.g., 'Add more examples', 'Expand security section', 'Include error handling'"
              value={refinementInstructions}
              onChange={(e) => setRefinementInstructions(e.target.value)}
              onPressEnter={handleRefine}
              autoFocus
            />
            <Button type="primary" onClick={handleRefine} disabled={isGenerating}>
              Apply
            </Button>
            <Button onClick={() => setShowRefineInput(false)}>Cancel</Button>
          </div>
        )}

        <div data-color-mode="light" style={{ position: 'relative' }}>
          {isGenerating && !markdown && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                zIndex: 10,
                fontSize: '16px',
                color: '#666'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '12px' }}>Generating agent markdown...</div>
                <Progress percent={progress} size="small" style={{ width: 300 }} />
              </div>
            </div>
          )}
          <MDEditor
            value={markdown || ''}
            onChange={(value) => setMarkdown(value || '')}
            height={600}
            preview="live"
            hideToolbar={false}
            enableScroll={true}
            visibleDragbar={true}
          />
        </div>

        <div className="text-sm text-gray-500">
          💡 Tips: Use the preview pane to see how your agent will render. Click "Refine with AI" to improve specific sections.
        </div>
      </div>
    </Modal>
  )
}
