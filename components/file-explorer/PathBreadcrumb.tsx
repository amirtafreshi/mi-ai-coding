'use client'

import { Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

interface PathBreadcrumbProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export function PathBreadcrumb({ currentPath, onNavigate }: PathBreadcrumbProps) {
  // Parse path into segments
  const segments = currentPath.split('/').filter(Boolean)

  // Create breadcrumb items
  const items = [
    {
      title: (
        <a onClick={() => onNavigate('/')}>
          <HomeOutlined />
        </a>
      ),
    },
    ...segments.map((segment, index) => {
      // Build path up to this segment
      const path = '/' + segments.slice(0, index + 1).join('/')

      const isLast = index === segments.length - 1

      return {
        title: isLast ? (
          <span style={{ color: '#000' }}>{segment}</span>
        ) : (
          <a onClick={() => onNavigate(path)}>{segment}</a>
        ),
      }
    }),
  ]

  return (
    <Breadcrumb
      items={items}
      style={{
        marginBottom: 12,
        padding: '8px 12px',
        background: '#f5f5f5',
        borderRadius: 4,
      }}
    />
  )
}
