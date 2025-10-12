'use client'

import { useState } from 'react'
import { Modal, Tabs, Form, Input, Button, message } from 'antd'
import { RobotOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons'

interface CreateAgentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (fileName: string, content: string, skipAIGeneration: boolean) => void
  onPasteSaved?: () => void  // New callback for paste mode direct save
}

type CreationMethod = 'ai' | 'paste' | 'import'

export function CreateAgentModal({
  open,
  onClose,
  onSuccess,
  onPasteSaved,
}: CreateAgentModalProps) {
  const [activeMethod, setActiveMethod] = useState<CreationMethod>('ai')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleAIGenerate = async (values: any) => {
    console.log('[CreateAgentModal] handleAIGenerate called with values:', values)
    const { name, description } = values

    // Sanitize file name
    const fileName = name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '.md'

    console.log('[CreateAgentModal] Generated fileName:', fileName)
    // Pass to parent (editor modal will handle generation) - skipAI = false for AI mode
    onSuccess(fileName, `# ${name}\n\n${description}`, false)
    form.resetFields()
  }

  const handlePaste = async (values: any) => {
    console.log('[CreateAgentModal] handlePaste called with values:', values)
    const { name, markdown } = values

    if (!markdown || !markdown.trim()) {
      message.error('Please paste agent markdown')
      return
    }

    // Sanitize file name
    const fileName = name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '.md'

    console.log('[CreateAgentModal] Saving agent directly:', fileName)

    // Save directly without opening editor
    setLoading(true)
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
      form.resetFields()
      onClose()
      // Notify parent to refresh file list (doesn't open editor)
      if (onPasteSaved) {
        onPasteSaved()
      }
    } catch (error: any) {
      console.error('[CreateAgentModal] Save error:', error)
      message.error(error.message || 'Failed to save agent')
    } finally {
      setLoading(false)
    }
  }

  const handleImportUrl = async (values: any) => {
    const { name, url } = values

    setLoading(true)
    try {
      const response = await fetch('/api/agents/import-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import from URL')
      }

      // Sanitize file name
      const fileName = name.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '.md'

      // Pass to parent - skipAI = true for Import mode (content already fetched)
      onSuccess(fileName, data.content, true)
      form.resetFields()
      message.success('Agent imported successfully')
    } catch (error: any) {
      console.error('[CreateAgentModal] Import error:', error)
      message.error(error.message || 'Failed to import from URL')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    console.log('[CreateAgentModal] handleSubmit called, activeMethod:', activeMethod)
    console.log('[CreateAgentModal] Form values:', form.getFieldsValue())

    try {
      // Define field names for each tab to validate only active tab fields
      let fieldNames: string[] = []

      if (activeMethod === 'ai') {
        fieldNames = ['name', 'description']
      } else if (activeMethod === 'paste') {
        fieldNames = ['name', 'markdown']
      } else if (activeMethod === 'import') {
        fieldNames = ['name', 'url']
      }

      console.log('[CreateAgentModal] Validating fields:', fieldNames)

      // Validate only the fields relevant to the active tab
      const values = await form.validateFields(fieldNames)
      console.log('[CreateAgentModal] Validation passed, values:', values)

      // Manually call the appropriate handler based on active tab
      if (activeMethod === 'ai') {
        await handleAIGenerate(values)
      } else if (activeMethod === 'paste') {
        await handlePaste(values)
      } else if (activeMethod === 'import') {
        await handleImportUrl(values)
      }
    } catch (error: any) {
      console.log('[CreateAgentModal] Validation failed:', error)
      if (error.errorFields) {
        console.log('[CreateAgentModal] Failed fields:', error.errorFields.map((f: any) => f.name[0]))
      }
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const tabItems = [
    {
      key: 'ai',
      label: (
        <span>
          <RobotOutlined /> AI Generate
        </span>
      ),
      children: (
        <Form
          form={form}
          name="ai-generate-form"
          layout="vertical"
          onFinish={handleAIGenerate}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Agent Name"
            rules={[
              { required: true, message: 'Please input agent name!' },
              { min: 3, message: 'Agent name must be at least 3 characters' },
              { max: 50, message: 'Agent name must be at most 50 characters' },
            ]}
          >
            <Input placeholder="e.g., debugging-specialist, code-reviewer" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Describe what this agent should do"
            rules={[
              { required: true, message: 'Please describe the agent!' },
              { min: 20, message: 'Description must be at least 20 characters' },
              { max: 1000, message: 'Description must be at most 1000 characters' },
            ]}
          >
            <Input.TextArea
              rows={6}
              placeholder="E.g., 'A debugging agent that analyzes stack traces, identifies root causes of errors, and suggests fixes with code examples. Specializes in JavaScript/TypeScript bugs.'"
            />
          </Form.Item>

          <div className="text-sm text-gray-500 mb-2">
            💡 Be specific about the agent's capabilities, tools, and workflow
          </div>
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
          name="paste-form"
          layout="vertical"
          onFinish={handlePaste}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Agent Name"
            rules={[
              { required: true, message: 'Please input agent name!' },
              { min: 3, message: 'Agent name must be at least 3 characters' },
              { max: 50, message: 'Agent name must be at most 50 characters' },
            ]}
          >
            <Input placeholder="e.g., debugging-specialist" />
          </Form.Item>

          <Form.Item
            name="markdown"
            label="Agent Markdown"
            rules={[
              { required: true, message: 'Please paste agent markdown!' },
              { min: 10, message: 'Markdown must be at least 10 characters' },
            ]}
          >
            <Input.TextArea
              rows={12}
              placeholder="Paste your agent markdown here..."
            />
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
          name="import-url-form"
          layout="vertical"
          onFinish={handleImportUrl}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Agent Name"
            rules={[
              { required: true, message: 'Please input agent name!' },
              { min: 3, message: 'Agent name must be at least 3 characters' },
              { max: 50, message: 'Agent name must be at most 50 characters' },
            ]}
          >
            <Input placeholder="e.g., debugging-specialist" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Import URL"
            rules={[
              { required: true, message: 'Please input URL!' },
              { type: 'url', message: 'Please enter a valid URL!' },
            ]}
          >
            <Input placeholder="https://raw.githubusercontent.com/..." />
          </Form.Item>

          <div className="text-sm text-gray-500 mb-2">
            ℹ️ Allowed domains: github.com, raw.githubusercontent.com, gist.github.com, gitlab.com, bitbucket.org
          </div>
        </Form>
      ),
    },
  ]

  return (
    <Modal
      title="Create New Agent"
      open={open}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="next"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {activeMethod === 'ai' ? 'Generate →' : activeMethod === 'paste' ? 'Save' : 'Next →'}
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeMethod}
        onChange={(key) => {
          console.log('[CreateAgentModal] Tab changed to:', key)
          setActiveMethod(key as CreationMethod)
          form.resetFields()
        }}
        items={tabItems}
      />
    </Modal>
  )
}
