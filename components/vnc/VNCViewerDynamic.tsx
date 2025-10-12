'use client'

import dynamic from 'next/dynamic'
import { Spin } from 'antd'

interface VNCViewerProps {
  display: ':98' | ':99'
  port: number
  title: string
}

/**
 * Dynamic wrapper for VNCViewer to avoid SSR issues
 *
 * Solution: Using novnc-next package instead of @novnc/novnc
 * - novnc-next is a fork specifically designed for Next.js/SSR compatibility
 * - No top-level await issues (resolved by bundling with Babel)
 * - Dynamic import still used for optimal loading
 *
 * The VNC component works perfectly in dev mode, build, and runtime.
 */
export const VNCViewerDynamic = dynamic<VNCViewerProps>(
  () => import('./VNCViewer').then(mod => ({ default: mod.VNCViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading VNC Viewer...</p>
        </div>
      </div>
    ),
  }
)
