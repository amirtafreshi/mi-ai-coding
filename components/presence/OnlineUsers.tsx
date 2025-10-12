'use client'

import { useEffect, useState } from 'react'
import { Avatar, Badge, Tooltip, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useSession } from 'next-auth/react'

interface OnlineUser {
  id: string
  email: string
  name: string | null
  role: string
}

export function OnlineUsers() {
  const { data: session, status } = useSession()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (status !== 'authenticated') return

    // Send presence heartbeat every 30 seconds
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
        })
      } catch (error) {
        console.error('[OnlineUsers] Failed to send heartbeat:', error)
      }
    }

    // Fetch online users list
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/api/presence')
        const data = await response.json()
        setOnlineUsers(data.users || [])
      } catch (error) {
        console.error('[OnlineUsers] Failed to fetch online users:', error)
      }
    }

    // Initial heartbeat and fetch
    sendHeartbeat()
    fetchOnlineUsers()

    // Set up intervals
    const heartbeatInterval = setInterval(sendHeartbeat, 30000) // 30 seconds
    const fetchInterval = setInterval(fetchOnlineUsers, 10000) // 10 seconds

    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(fetchInterval)
    }
  }, [status])

  if (status !== 'authenticated' || onlineUsers.length === 0) {
    return null
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#ff4d4f' // red
      case 'developer':
        return '#1890ff' // blue
      case 'user':
        return '#52c41a' // green
      default:
        return '#8c8c8c' // gray
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'developer':
        return 'Developer'
      case 'user':
        return 'User'
      default:
        return role
    }
  }

  return (
    <Space size="small" className="mr-2">
      <span className="text-xs text-gray-500 hidden lg:inline">
        Online ({onlineUsers.length}):
      </span>
      <Avatar.Group
        max={{
          count: 5,
          style: { color: '#f56a00', backgroundColor: '#fde3cf' }
        }}
      >
        {onlineUsers.map((user) => (
          <Tooltip
            key={user.id}
            title={
              <div>
                <div className="font-semibold">{user.name || user.email}</div>
                <div className="text-xs">{user.email}</div>
                <div className="text-xs mt-1">
                  <Badge
                    color={getRoleColor(user.role)}
                    text={getRoleBadge(user.role)}
                  />
                </div>
              </div>
            }
            placement="bottom"
          >
            <Badge dot status="success" offset={[-5, 30]}>
              <Avatar
                style={{ backgroundColor: getRoleColor(user.role) }}
                icon={<UserOutlined />}
                size="default"
              >
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </Avatar>
            </Badge>
          </Tooltip>
        ))}
      </Avatar.Group>
    </Space>
  )
}
