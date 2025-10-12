'use client'

import { Layout, Typography, Space, Avatar, Dropdown, Badge } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { OnlineUsers } from '@/components/presence/OnlineUsers'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout
const { Title, Text } = Typography

export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'logout') {
      await signOut({ redirect: false })
      router.push('/login')
    } else if (key === 'settings') {
      // TODO: Navigate to settings page
      console.log('Navigate to settings')
    }
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="py-2">
          <div className="font-semibold">{session?.user?.name || 'User'}</div>
          <div className="text-xs text-gray-500">{session?.user?.email}</div>
          {session?.user && (session.user as any)?.role && (
            <Badge
              count={(session.user as any).role}
              style={{ backgroundColor: '#52c41a', marginTop: 4 }}
            />
          )}
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  return (
    <AntHeader className="flex items-center justify-between px-2 sm:px-4 md:px-6 bg-white shadow-md">
      <Space align="center" className="flex-shrink min-w-0">
        <Title
          level={3}
          className="m-0 text-sm sm:text-base md:text-xl lg:text-2xl whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ color: '#1677ff', marginBottom: 0 }}
        >
          MI AI Coding Platform
        </Title>
      </Space>
      <Space size="small" className="flex-shrink-0">
        {status === 'authenticated' && (
          <>
            {/* Hide OnlineUsers on mobile */}
            <div className="hidden sm:inline-block">
              <OnlineUsers />
            </div>
            <Text className="hidden lg:inline-block text-sm" style={{ color: '#595959' }}>
              Welcome, {session?.user?.name || session?.user?.email}
            </Text>
            <Dropdown
              menu={{ items: menuItems, onClick: handleMenuClick }}
              placement="bottomRight"
            >
              <Avatar
                size="large"
                icon={<UserOutlined />}
                className="cursor-pointer bg-blue-500"
              >
                {session?.user?.name?.[0]?.toUpperCase()}
              </Avatar>
            </Dropdown>
          </>
        )}
      </Space>
    </AntHeader>
  )
}
