'use client'

import { useEffect } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface UserModalProps {
  open: boolean
  editingUser: User | null
  onCancel: () => void
  onSuccess: () => void
}

interface FormValues {
  email: string
  name: string
  password?: string
  role: 'admin' | 'user' | 'viewer' | 'developer'
}

export function UserModal({
  open,
  editingUser,
  onCancel,
  onSuccess,
}: UserModalProps) {
  const [form] = Form.useForm<FormValues>()
  const isEditing = !!editingUser

  useEffect(() => {
    if (open && editingUser) {
      form.setFieldsValue({
        email: editingUser.email,
        name: editingUser.name || '',
        role: editingUser.role as 'admin' | 'user' | 'viewer',
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, editingUser, form])

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = isEditing ? `/api/users/${editingUser.id}` : '/api/users'
      const method = isEditing ? 'PUT' : 'POST'

      // Don't send password if it's empty during edit
      const body = { ...values }
      if (isEditing && (!body.password || body.password.trim() === '')) {
        delete body.password
      }

      console.log('[UserModal] Submitting:', { url, method, body, isEditing })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      console.log('[UserModal] Response:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.log('[UserModal] Error response:', error)

        // Handle validation errors with detailed messages
        if (error.details && Array.isArray(error.details)) {
          const validationMessages = error.details
            .map((issue: any) => `${issue.path?.join('.')}: ${issue.message}`)
            .join(', ')
          message.error(`Validation failed: ${validationMessages}`)
        } else {
          message.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} user`)
        }
        return
      }

      const data = await response.json()
      message.success(data.message || `User ${isEditing ? 'updated' : 'created'} successfully`)
      form.resetFields()
      onSuccess()
    } catch (error: any) {
      message.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} user`)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={isEditing ? 'Edit User' : 'Add New User'}
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      okText={isEditing ? 'Update' : 'Create'}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input placeholder="user@example.com" autoComplete="email" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input name!' }]}
        >
          <Input placeholder="John Doe" />
        </Form.Item>

        <Form.Item
          name="password"
          label={isEditing ? 'Password (leave blank to keep current)' : 'Password'}
          rules={[
            {
              required: !isEditing,
              message: 'Please input password!',
            },
            {
              validator: (_, value) => {
                if (value && value.trim().length > 0 && value.length < 6) {
                  return Promise.reject('Password must be at least 6 characters!')
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <Input.Password
            placeholder="••••••••"
            autoComplete={isEditing ? 'new-password' : 'new-password'}
          />
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select role!' }]}
          initialValue="user"
        >
          <Select
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Developer', value: 'developer' },
              { label: 'User', value: 'user' },
              { label: 'Viewer', value: 'viewer' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
