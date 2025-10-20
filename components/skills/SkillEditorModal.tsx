'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Progress, message, Input, Alert } from 'antd'
import { SaveOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import dynamic from 'next/dynamic'
import { useSkillGeneration } from './useSkillGeneration'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

// Dynamically import markdown editor (client-side only)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface SkillEditorModalProps {
  open: boolean
  fileName: string
  initialContent: string
  skillName: string
  skillDescription: string
  skipAIGeneration: boolean
  onClose: () => void
  onSaveSuccess: (data?: { name: string; skillPath: string; resourcesPath: string }) => void
}

export function SkillEditorModal({
  open,
  fileName,
  initialContent,
  skillName,
  skillDescription,
  skipAIGeneration,
  onClose,
  onSaveSuccess,
}: SkillEditorModalProps) {
  const [markdown, setMarkdown] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showRefineInput, setShowRefineInput] = useState(false)
  const [refinementInstructions, setRefinementInstructions] = useState('')

  const {
    markdown: generatedMarkdown,
    status,
    progress,
    generate,
    refine,
    isGenerating,
  } = useSkillGeneration({
    onComplete: (content) => {
      setMarkdown(content)
      validateContent(content)
      message.success('Skill generated successfully!')
    },
    onError: (error) => {
      message.error(error)
    },
  })

  // Update markdown when generation updates
  useEffect(() => {
    if (generatedMarkdown) {
      setMarkdown(generatedMarkdown)
      validateContent(generatedMarkdown)
    }
  }, [generatedMarkdown])

  // Auto-generate on mount if content is minimal (AI generation mode) and skipAIGeneration is false
  useEffect(() => {
    if (open && !skipAIGeneration && initialContent && initialContent.split('\n').length <= 3) {
      // Keep initial content visible while generating
      console.log('[SkillEditorModal] Starting auto-generation with initial content:', initialContent)
      // This looks like initial content from AI mode, trigger generation
      generate(skillName, skillDescription)
    } else if (open && skipAIGeneration) {
      // Import or paste mode - validate existing content
      validateContent(initialContent)
    }
  }, [open])

  const validateContent = (contentToValidate: string) => {
    // Validate YAML frontmatter
    const yamlMatch = contentToValidate.match(/^---\n([\s\S]*?)\n---/)

    if (!yamlMatch) {
      setValidationError('SKILL.md must start with YAML frontmatter (---\\n...\\n---)')
      return false
    }

    const yamlContent = yamlMatch[1]
    const nameMatch = yamlContent.match(/^name:\s*(.+)$/m)
    const descMatch = yamlContent.match(/^description:\s*(.+)$/m)

    if (!nameMatch || !nameMatch[1].trim()) {
      setValidationError('YAML frontmatter must include "name" field')
      return false
    }

    if (!descMatch || !descMatch[1].trim()) {
      setValidationError('YAML frontmatter must include "description" field')
      return false
    }

    const name = nameMatch[1].trim()
    const description = descMatch[1].trim()

    if (name.length > 64) {
      setValidationError('Skill name must be 64 characters or less')
      return false
    }

    if (description.length > 200) {
      setValidationError('Skill description must be 200 characters or less')
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSave = async () => {
    // Validate before saving
    if (!validateContent(markdown)) {
      message.error('Please fix validation errors before saving')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/skills/save', {
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
        throw new Error(data.error || 'Failed to save skill')
      }

      message.success(data.message || 'Skill saved successfully!')
      // Pass skill data to parent for resource modal
      onSaveSuccess({
        name: data.name || fileName,
        skillPath: data.skillPath,
        resourcesPath: data.resourcesPath,
      })
      onClose()
    } catch (error: any) {
      console.error('[SkillEditorModal] Save error:', error)
      message.error(error.message || 'Failed to save skill')
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
      title: 'Regenerate Skill?',
      content: 'This will replace the current content with a newly generated skill. Continue?',
      onOk: () => {
        generate(skillName, skillDescription)
      },
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setMarkdown(value)
      validateContent(value)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span>Edit Skill: {fileName}</span>
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
          disabled={isGenerating || !markdown || !!validationError}
        >
          Save Skill
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {validationError && (
          <Alert
            message="YAML Validation Error"
            description={validationError}
            type="error"
            showIcon
            closable
          />
        )}

        {!validationError && markdown && (
          <Alert
            message="YAML Validation Passed"
            description="Skill has valid YAML frontmatter with name and description"
            type="success"
            showIcon
            closable
          />
        )}

        {showRefineInput && (
          <div className="flex gap-2">
            <Input
              placeholder="E.g., 'Add more examples', 'Expand instructions section', 'Include error handling'"
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
                <div style={{ marginBottom: '12px' }}>Generating skill markdown...</div>
                <Progress percent={progress} size="small" style={{ width: 300 }} />
              </div>
            </div>
          )}
          <MDEditor
            value={markdown || ''}
            onChange={handleEditorChange}
            height={600}
            preview="live"
            hideToolbar={false}
            enableScroll={true}
            visibleDragbar={true}
          />
        </div>

        <div className="text-sm text-gray-500">
          <p className="font-semibold mb-2">SKILL.md Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Must start with YAML frontmatter (--- ... ---)</li>
            <li>Required fields: <code>name</code> (max 64 chars), <code>description</code> (max 200 chars)</li>
            <li>Description is critical - Claude uses it to determine when to load the skill</li>
            <li>Use progressive disclosure - start with essentials, then add details</li>
            <li>Can reference resource files in resources/ folder</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
