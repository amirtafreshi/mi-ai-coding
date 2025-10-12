'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Select, Space, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import { UserTable } from '@/components/users/UserTable'
import { UserModal } from '@/components/users/UserModal'

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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Check if current user is admin
  const isAdmin = (session?.user as any)?.role === 'admin'

  useEffect(() => {
    if (session) {
      loadUsers()
    }
  }, [session, pagination.page, pagination.limit, searchTerm, roleFilter])

  const loadUsers = async () => {
    if (!isAdmin) {
      message.error('Admin access required')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (roleFilter && roleFilter !== 'all') {
        params.append('role', roleFilter)
      }

      const response = await fetch(`/api/users?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error loading users:', error)
      message.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingUser(null)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    setEditingUser(null)
    loadUsers()
  }

  const handleDelete = () => {
    loadUsers()
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination({ ...pagination, page: 1 })
  }

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    setPagination({ ...pagination, page: 1 })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, page, limit: pageSize })
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card
        title="User Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Input
              placeholder="Search by email or name"
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              style={{ width: 150 }}
              options={[
                { label: 'All Roles', value: 'all' },
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
                { label: 'Viewer', value: 'viewer' },
              ]}
            />
          </Space>

          <UserTable
            users={users}
            loading={loading}
            onEdit={handleEditUser}
            onDelete={handleDelete}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: handlePaginationChange,
            }}
          />
        </Space>
      </Card>

      <UserModal
        open={modalOpen}
        editingUser={editingUser}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
