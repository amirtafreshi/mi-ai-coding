'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, message, Spin, Alert } from 'antd'
import { SaveOutlined, ThunderboltOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'

interface SkillEditorModalProps {
  open: boolean
  fileName: string
  initialContent: string
  skillName: string
  skillDescription: string
  skipAIGeneration: boolean
  onClose: () => void
  onSaveSuccess: () => void
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
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (skipAIGeneration) {
        // Import or paste mode - content already provided
        setContent(initialContent)
        validateContent(initialContent)
      } else {
        // AI generation mode
        generateSkill()
      }
    }
  }, [open, skipAIGeneration, initialContent])

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

  const generateSkill = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/skills/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: skillName,
          description: skillDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate skill')
      }

      setContent(data.content)
      validateContent(data.content)
    } catch (error: any) {
      console.error('Error generating skill:', error)
      message.error(error.message || 'Failed to generate skill')
      // Set a basic template on error
      const fallbackContent = `---
name: ${fileName}
description: ${skillDescription.substring(0, 200)}
---

# ${skillName}

## Overview
${skillDescription}

## Instructions
1. [Add step-by-step instructions here]
2. [Be specific and actionable]
3. [Use progressive disclosure]

## When to Use
Claude should load this skill when [describe trigger conditions]

## Examples
\`\`\`
[Add concrete usage examples]
\`\`\`

## Guidelines
- [Best practice 1]
- [Best practice 2]
- [Common pitfall to avoid]

## Resources
- resources/examples.md - Example use cases
- resources/reference.md - Reference documentation
`
      setContent(fallbackContent)
      validateContent(fallbackContent)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    // Validate before saving
    if (!validateContent(content)) {
      message.error('Please fix validation errors before saving')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/skills/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save skill')
      }

      message.success(data.message || 'Skill saved successfully!')
      onSaveSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error saving skill:', error)
      message.error(error.message || 'Failed to save skill')
    } finally {
      setLoading(false)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value)
      validateContent(value)
    }
  }

  return (
    <Modal
      title={
        <span>
          <ThunderboltOutlined /> Edit Skill: {fileName}
        </span>
      }
      open={open}
      onCancel={onClose}
      width="80%"
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          disabled={!!validationError || generating}
        >
          Save Skill
        </Button>,
      ]}
    >
      {validationError && (
        <Alert
          message="YAML Validation Error"
          description={validationError}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {!validationError && (
        <Alert
          message="YAML Validation Passed"
          description="Skill has valid YAML frontmatter with name and description"
          type="success"
          showIcon
          className="mb-4"
        />
      )}

      {generating ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Generating skill with AI...</p>
        </div>
      ) : (
        <Editor
          height="60vh"
          defaultLanguage="markdown"
          value={content}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
        />
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <p className="font-semibold mb-2">SKILL.md Requirements:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Must start with YAML frontmatter (--- ... ---)</li>
          <li>Required fields: <code>name</code> (max 64 chars), <code>description</code> (max 200 chars)</li>
          <li>Description is critical - Claude uses it to determine when to load the skill</li>
          <li>Use progressive disclosure - start with essentials, then add details</li>
          <li>Can reference resource files in resources/ folder</li>
        </ul>
      </div>
    </Modal>
  )
}
