'use client'

import { useState } from 'react'
import { Table, Tag, Space, Button, Popconfirm, message } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  _count?: {
    activityLogs: number
  }
}

interface UserTableProps {
  users: User[]
  loading: boolean
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  pagination: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
}

const roleColors: Record<string, string> = {
  admin: 'red',
  user: 'blue',
  viewer: 'green',
}

export function UserTable({
  users,
  loading,
  onEdit,
  onDelete,
  pagination,
}: UserTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (userId: string, userEmail: string) => {
    setDeletingId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      message.success(`User ${userEmail} deleted successfully`)
      onDelete(userId)
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user')
      console.error('Error deleting user:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      width: '25%',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null) => name || '-',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      width: '20%',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>
          {role.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
        { text: 'Viewer', value: 'viewer' },
      ],
      onFilter: (value, record) => record.role === value,
      width: '15%',
    },
    {
      title: 'Activity Logs',
      key: 'activityLogs',
      render: (_, record) => record._count?.activityLogs || 0,
      sorter: (a, b) => (a._count?.activityLogs || 0) - (b._count?.activityLogs || 0),
      width: '10%',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      width: '15%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete User"
            description={`Are you sure you want to delete ${record.email}?`}
            onConfirm={() => handleDelete(record.id, record.email)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: '15%',
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: pagination.onChange,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} users`,
      }}
      scroll={{ x: 1000 }}
    />
  )
}
