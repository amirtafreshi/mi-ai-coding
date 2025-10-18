'use client'

import { useState } from 'react'
import { Modal, Tabs, Form, Input, Button, message, Checkbox } from 'antd'
import { ThunderboltOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons'

interface CreateSkillModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (fileName: string, content: string, skipAIGeneration: boolean) => void
  onPasteSaved?: () => void  // Callback for paste mode direct save
}

type CreationMethod = 'ai' | 'paste' | 'import'

export function CreateSkillModal({
  open,
  onClose,
  onSuccess,
  onPasteSaved,
}: CreateSkillModalProps) {
  const [activeMethod, setActiveMethod] = useState<CreationMethod>('ai')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleAIGenerate = async (values: any) {
    console.log('[CreateSkillModal] handleAIGenerate called with values:', values)
    const { name, description } = values

    // Sanitize file name (skills use folder names)
    const fileName = name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    console.log('[CreateSkillModal] Generated fileName:', fileName)
    // Pass to parent (editor modal will handle generation) - skipAI = false for AI mode
    onSuccess(fileName, `# ${name}\n\n${description}`, false)
    form.resetFields()
  }

  const handlePaste = async (values: any) {
    console.log('[CreateSkillModal] handlePaste called with values:', values)
    const { name, markdown } = values

    if (!markdown || !markdown.trim()) {
      message.error('Please paste skill markdown')
      return
    }

    // Validate YAML frontmatter
    const yamlMatch = markdown.match(/^---\n([\s\S]*?)\n---/)
    if (!yamlMatch) {
      message.error('SKILL.md must start with YAML frontmatter (---\\n...\\n---)')
      return
    }

    const yamlContent = yamlMatch[1]
    const nameMatch = yamlContent.match(/^name:\s*(.+)$/m)
    const descMatch = yamlContent.match(/^description:\s*(.+)$/m)

    if (!nameMatch || !descMatch) {
      message.error('YAML frontmatter must include "name" and "description" fields')
      return
    }

    // Sanitize file name
    const fileName = name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    console.log('[CreateSkillModal] Saving skill directly:', fileName)

    // Save directly without opening editor
    setLoading(true)
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
      form.resetFields()
      onClose()
      // Notify parent to refresh file list (doesn't open editor)
      if (onPasteSaved) {
        onPasteSaved()
      }
    } catch (error: any) {
      console.error('[CreateSkillModal] Save error:', error)
      message.error(error.message || 'Failed to save skill')
    } finally {
      setLoading(false)
    }
  }

  const handleImportUrl = async (values: any) {
    const { name, url } = values

    setLoading(true)
    try {
      const response = await fetch('/api/skills/import-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import skill')
      }

      // Use imported name or provided name
      const fileName = name || data.fileName

      console.log('[CreateSkillModal] Imported skill, opening editor:', fileName)
      // Pass to parent to open editor with imported content
      onSuccess(fileName, data.content, true) // skipAI = true for import mode
      form.resetFields()
    } catch (error: any) {
      console.error('[CreateSkillModal] Import error:', error)
      message.error(error.message || 'Failed to import skill')
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'ai',
      label: (
        <span>
          <ThunderboltOutlined /> AI Generate
        </span>
      ),
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAIGenerate}
        >
          <Form.Item
            label="Skill Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a skill name' }]}
          >
            <Input placeholder="e.g., Document Analyzer, Code Reviewer" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please describe what this skill does' }]}
            extra="Describe what this skill does and when Claude should use it (this becomes the YAML description)"
          >
            <Input.TextArea
              rows={4}
              placeholder="e.g., Analyzes documents for key insights, summarizes content, and extracts action items. Use when user needs document analysis or summarization."
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Generate Skill with AI
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'paste',
      label: (
        <span>
          <FileTextOutlined /> Paste
        </span>
      ),
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePaste}
        >
          <Form.Item
            label="Skill Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a skill name' }]}
          >
            <Input placeholder="e.g., my-skill" />
          </Form.Item>

          <Form.Item
            label="SKILL.md Content"
            name="markdown"
            rules={[{ required: true, message: 'Please paste skill markdown' }]}
            extra="Must include YAML frontmatter with name and description"
          >
            <Input.TextArea
              rows={12}
              placeholder={`---\nname: my-skill\ndescription: What this skill does and when to use it\n---\n\n# My Skill\n\n## Instructions\n...`}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Save Skill
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'import',
      label: (
        <span>
          <LinkOutlined /> Import URL
        </span>
      ),
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleImportUrl}
        >
          <Form.Item
            label="Skill Name (optional)"
            name="name"
            extra="Leave empty to use the name from the imported SKILL.md"
          >
            <Input placeholder="e.g., my-skill" />
          </Form.Item>

          <Form.Item
            label="URL"
            name="url"
            rules={[
              { required: true, message: 'Please enter a URL' },
              { type: 'url', message: 'Please enter a valid URL' }
            ]}
            extra="Direct link to SKILL.md file (e.g., GitHub raw URL)"
          >
            <Input
              placeholder="https://raw.githubusercontent.com/.../SKILL.md"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Import Skill
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <Modal
      title="Create New Skill"
      open={open}
      onCancel={() => {
        onClose()
        form.resetFields()
      }}
      footer={null}
      width={600}
    >
      <Tabs
        activeKey={activeMethod}
        onChange={(key) => setActiveMethod(key as CreationMethod)}
        items={tabItems}
      />
    </Modal>
  )
}
