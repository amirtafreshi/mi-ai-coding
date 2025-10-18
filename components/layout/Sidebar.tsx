'use client'

import { Layout, Menu, Drawer } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserGuideModal } from './UserGuideModal'
import type { MenuProps } from 'antd'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [isMobile, setIsMobile] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    // Only show Users menu item to admin users
    ...(isAdmin ? [{
      key: 'users',
      icon: <UserOutlined />,
      label: 'Users',
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'user-guide',
      icon: <InfoCircleOutlined />,
      label: 'User Guide',
    },
  ]

  const handleMenuClick = (key: string) => {
    if (key === 'dashboard') {
      router.push('/dashboard')
    } else if (key === 'users') {
      router.push('/dashboard/users')
    } else if (key === 'user-guide') {
      setGuideModalOpen(true)
      return // Don't close drawer for modal
    }
    // Close drawer on mobile after navigation
    if (isMobile && !collapsed) {
      onCollapse(true)
    }
  }

  // Determine selected key based on current path
  const getSelectedKey = () => {
    if (pathname.includes('/users')) return 'users'
    return 'dashboard'
  }

  const menuContent = (
    <Menu
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
      className="border-none bg-transparent"
      onClick={({ key }) => handleMenuClick(key)}
    />
  )

  // Mobile: Drawer overlay
  if (isMobile) {
    return (
      <>
        <Drawer
          placement="left"
          onClose={() => onCollapse(true)}
          open={!collapsed}
          styles={{ body: { padding: 0 } }}
          width={250}
        >
          <div className="p-4">{menuContent}</div>
        </Drawer>

        {/* User Guide Modal */}
        <UserGuideModal open={guideModalOpen} onClose={() => setGuideModalOpen(false)} />
      </>
    )
  }

  // Desktop: Sidebar
  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        className="bg-gray-50"
        width={250}
        trigger={
          <div className="flex items-center justify-center h-full">
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        }
      >
        <div className="p-4">{menuContent}</div>
      </Sider>

      {/* User Guide Modal */}
      <UserGuideModal open={guideModalOpen} onClose={() => setGuideModalOpen(false)} />
    </>
  )
}
