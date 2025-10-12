'use client'

import { Layout } from 'antd'
import { ReactNode, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { IdleTimeout } from '../auth/IdleTimeout'

const { Content } = Layout

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Start collapsed

  return (
    <Layout className="min-h-screen">
      <IdleTimeout />
      <Header />
      <Layout>
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
        <Content className="bg-white h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
