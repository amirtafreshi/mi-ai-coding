'use client'

import { Refine } from '@refinedev/core'
import routerProvider from '@refinedev/nextjs-router'
import { App as AntdApp, ConfigProvider } from 'antd'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, Suspense } from 'react'

interface RefineProviderProps {
  children: ReactNode
}

export function RefineProvider({ children }: RefineProviderProps) {
  return (
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <AntdApp>
          <Suspense fallback={<div>Loading...</div>}>
            <Refine
              routerProvider={routerProvider}
              resources={[
                {
                  name: 'files',
                  list: '/files',
                  create: '/files/create',
                  edit: '/files/edit/:id',
                  show: '/files/show/:id',
                },
                {
                  name: 'activity',
                  list: '/activity',
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              {children}
            </Refine>
          </Suspense>
        </AntdApp>
      </ConfigProvider>
    </SessionProvider>
  )
}
