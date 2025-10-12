'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Space, Card, Badge, App, Modal } from 'antd'
import { CopyOutlined, SnippetsOutlined, ReloadOutlined, DesktopOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'

interface VNCViewerProps {
  display: ':98' | ':99'
  port: number
  title: string
}

export function VNCViewer({ display, port, title }: VNCViewerProps) {
  const { message } = App.useApp()
  const canvasRef = useRef<HTMLDivElement>(null)
  const fullscreenCanvasRef = useRef<HTMLDivElement>(null)
  const rfbRef = useRef<any>(null)
  const rfbFullscreenRef = useRef<any>(null)
  const isConnectingRef = useRef(false) // Guard to prevent double connection in Strict Mode
  const isMountedRef = useRef(false) // Track if component is mounted
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenConnected, setFullscreenConnected] = useState(false)
  const [fullscreenLoading, setFullscreenLoading] = useState(false)

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true
    let rfb: any = null

    // Patch Node.prototype.removeChild to suppress noVNC DOM errors
    const originalRemoveChild = Node.prototype.removeChild
    const patchedRemoveChild = function(this: Node, child: Node) {
      try {
        // Only call removeChild if the child is actually a child of this node
        if (this.contains(child)) {
          return originalRemoveChild.call(this, child)
        } else {
          console.warn('[VNCViewer] Attempted to remove child that is not a child of this node - suppressed')
          return child
        }
      } catch (err) {
        console.warn('[VNCViewer] removeChild error suppressed:', err)
        return child
      }
    }

    // Apply patch
    Node.prototype.removeChild = patchedRemoveChild as any

    // Suppress noVNC's "Node.removeChild" errors globally for this component
    const handleError = (event: ErrorEvent) => {
      const errorMsg = event.error?.message || event.message || ''
      if (errorMsg.includes('removeChild') || errorMsg.includes('Node') || errorMsg.includes('not a child')) {
        console.warn('[VNCViewer] Suppressed error:', errorMsg)
        event.preventDefault()
        event.stopPropagation()
        return true
      }
    }

    // Also handle unhandledrejection for promise-based errors
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || ''
      if (typeof reason === 'string' && (reason.includes('removeChild') || reason.includes('not a child'))) {
        console.warn('[VNCViewer] Suppressed rejection:', reason)
        event.preventDefault()
        return true
      }
    }

    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleError, true) // Use capture phase
      window.addEventListener('unhandledrejection', handleRejection as any)
    }
    const errorListenerCleanup = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleError, true)
        window.removeEventListener('unhandledrejection', handleRejection as any)
      }
      // Restore original removeChild
      Node.prototype.removeChild = originalRemoveChild
    }

    // Suppress noVNC TLS warnings in development (non-HTTPS)
    const originalWarn = console.warn
    const originalError = console.error
    console.warn = (...args: any[]) => {
      if (args[0]?.toString().includes('noVNC requires a secure context')) return
      originalWarn.apply(console, args)
    }
    console.error = (...args: any[]) => {
      if (args[0]?.toString().includes('noVNC requires a secure context')) return
      originalError.apply(console, args)
    }
    const consoleCleanup = () => {
      console.warn = originalWarn
      console.error = originalError
    }

    const connectVNC = async () => {
      // Prevent double connection - check if already connected with same display
      if (rfbRef.current) {
        console.log(`VNC ${display}: Already connected, reusing existing connection`)
        return
      }

      if (isConnectingRef.current) {
        console.log(`VNC ${display}: Connection in progress, skipping duplicate mount`)
        return
      }

      if (!canvasRef.current) {
        console.warn(`VNC ${display}: Canvas ref not available`)
        return
      }

      isConnectingRef.current = true

      try {
        setLoading(true)
        setError(null)
        setConnectionStatus('connecting')

        // Dynamically import RFB to avoid SSR issues (using novnc-next for Next.js compatibility)
        const RFB = (await import('novnc-next')).default

        // Safely clear existing VNC canvas to prevent DOM manipulation conflicts
        // Use replaceChildren() instead of innerHTML to avoid React conflicts
        if (canvasRef.current && isMountedRef.current) {
          try {
            canvasRef.current.replaceChildren()
          } catch (err) {
            console.warn(`VNC ${display}: Error clearing canvas (non-fatal):`, err)
            // Continue anyway - this is not critical
          }
        }

        // Check if component is still mounted before proceeding
        if (!isMountedRef.current) {
          console.log(`VNC ${display}: Component unmounted during connection setup`)
          isConnectingRef.current = false
          return
        }

        // Create WebSocket URL - use current hostname for external access
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        const wsUrl = `ws://${hostname}:${port}`
        console.log(`VNC ${display}: Connecting to ${wsUrl}`)

        // Create RFB connection
        rfb = new RFB(canvasRef.current, wsUrl, {
          credentials: { password: '' },
          shared: true,
          repeaterID: '',
          wsProtocols: ['binary'],
        })

        // Store reference for cleanup
        rfbRef.current = rfb

        // Connection event handlers
        rfb.addEventListener('connect', () => {
          if (!isMountedRef.current) return
          console.log(`VNC ${display}: Connected successfully`)
          setConnected(true)
          setLoading(false)
          setConnectionStatus('connected')
          isConnectingRef.current = false
          message.success(`Connected to VNC ${display}`)
        })

        rfb.addEventListener('disconnect', (e: any) => {
          if (!isMountedRef.current) return
          console.log(`VNC ${display}: Disconnected`, e.detail)
          setConnected(false)
          setLoading(false)
          setConnectionStatus('disconnected')
          isConnectingRef.current = false

          if (e.detail.clean) {
            console.log(`VNC ${display}: Clean disconnect`)
            // Don't show message for intentional disconnects (component unmount)
          } else {
            const errorMsg = `VNC connection lost: ${e.detail.reason || 'Unknown error'}`
            setError(errorMsg)
            message.error(errorMsg)
          }
        })

        rfb.addEventListener('credentialsrequired', () => {
          if (!isMountedRef.current) return
          console.log(`VNC ${display}: Credentials required`)
          setError('VNC credentials required (not implemented)')
          message.warning('VNC server requires authentication')
          isConnectingRef.current = false
        })

        rfb.addEventListener('securityfailure', (e: any) => {
          if (!isMountedRef.current) return
          console.error(`VNC ${display}: Security failure:`, e.detail)
          setError(`Security failure: ${e.detail.reason}`)
          message.error('VNC authentication failed')
          isConnectingRef.current = false
        })

        // Scaling and quality settings
        rfb.scaleViewport = true
        rfb.resizeSession = false
        rfb.showDotCursor = true
        rfb.qualityLevel = 6
        rfb.compressionLevel = 2

      } catch (err) {
        console.error(`VNC ${display}: Error connecting:`, err)
        const errorMsg = err instanceof Error ? err.message : 'Failed to connect to VNC'
        if (isMountedRef.current) {
          setError(errorMsg)
          setLoading(false)
          setConnectionStatus('disconnected')
          message.error(errorMsg)
        }
        isConnectingRef.current = false
      }
    }

    connectVNC()

    // Cleanup function - properly disconnect VNC when component unmounts
    return () => {
      console.log(`VNC ${display}: Cleanup function called`)
      isMountedRef.current = false
      errorListenerCleanup()
      consoleCleanup()

      // Disconnect RFB connection
      if (rfbRef.current) {
        try {
          console.log(`VNC ${display}: Disconnecting RFB`)
          rfbRef.current.disconnect()
        } catch (err) {
          console.warn(`VNC ${display}: Error during disconnect:`, err)
        }
        rfbRef.current = null
      }

      // Clear canvas safely without triggering React errors
      if (canvasRef.current) {
        try {
          canvasRef.current.replaceChildren()
        } catch (err) {
          console.warn(`VNC ${display}: Error clearing canvas during cleanup:`, err)
        }
      }

      isConnectingRef.current = false
    }
  }, [display, port]) // Include deps so React knows these are stable

  // Effect to handle fullscreen VNC connection
  useEffect(() => {
    if (!isFullscreen) {
      // Cleanup fullscreen connection when modal closes
      if (rfbFullscreenRef.current) {
        try {
          console.log(`VNC ${display}: Disconnecting fullscreen RFB`)
          rfbFullscreenRef.current.disconnect()
        } catch (err) {
          console.warn(`VNC ${display}: Error disconnecting fullscreen:`, err)
        }
        rfbFullscreenRef.current = null
      }
      setFullscreenConnected(false)
      setFullscreenLoading(false)
      return
    }

    // Connect fullscreen VNC
    const connectFullscreenVNC = async () => {
      if (!fullscreenCanvasRef.current) {
        console.warn(`VNC ${display}: Fullscreen canvas ref not available`)
        return
      }

      if (rfbFullscreenRef.current) {
        console.log(`VNC ${display}: Fullscreen already connected`)
        return
      }

      setFullscreenLoading(true)

      try {
        // Dynamically import RFB
        const RFB = (await import('novnc-next')).default

        // Clear fullscreen canvas
        if (fullscreenCanvasRef.current) {
          try {
            fullscreenCanvasRef.current.replaceChildren()
          } catch (err) {
            console.warn(`VNC ${display}: Error clearing fullscreen canvas:`, err)
          }
        }

        // Create WebSocket URL
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        const wsUrl = `ws://${hostname}:${port}`
        console.log(`VNC ${display}: Connecting fullscreen to ${wsUrl}`)

        // Create RFB connection for fullscreen
        const rfbFullscreen = new RFB(fullscreenCanvasRef.current, wsUrl, {
          credentials: { password: '' },
          shared: true,
          repeaterID: '',
          wsProtocols: ['binary'],
        })

        rfbFullscreenRef.current = rfbFullscreen

        // Connection event handlers
        rfbFullscreen.addEventListener('connect', () => {
          console.log(`VNC ${display}: Fullscreen connected`)
          setFullscreenConnected(true)
          setFullscreenLoading(false)
          message.success('Fullscreen VNC connected')
        })

        rfbFullscreen.addEventListener('disconnect', (e: any) => {
          console.log(`VNC ${display}: Fullscreen disconnected`, e.detail)
          setFullscreenConnected(false)
          setFullscreenLoading(false)
          if (!e.detail.clean) {
            message.error('Fullscreen VNC disconnected')
          }
        })

        // Scaling and quality settings
        rfbFullscreen.scaleViewport = true
        rfbFullscreen.resizeSession = false
        rfbFullscreen.showDotCursor = true
        rfbFullscreen.qualityLevel = 6
        rfbFullscreen.compressionLevel = 2

      } catch (err) {
        console.error(`VNC ${display}: Error connecting fullscreen:`, err)
        setFullscreenLoading(false)
        message.error('Failed to connect fullscreen VNC')
      }
    }

    connectFullscreenVNC()
  }, [isFullscreen, display, port])

  const handleCopyFromVNC = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        message.error('Clipboard API not available. This feature requires HTTPS or localhost.')
        console.error('navigator.clipboard not available:', { clipboard: navigator.clipboard })
        return
      }

      const response = await fetch('/api/vnc/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display }),
      })

      if (response.ok) {
        const data = await response.json()
        if (!data.text || data.text.trim() === '') {
          message.warning('VNC clipboard is empty. Copy some text in the VNC display first.')
        } else {
          await navigator.clipboard.writeText(data.text)
          message.success(`Copied ${data.text.length} characters from VNC to clipboard`)
        }
      } else {
        const error = await response.json()
        console.error('Copy error response:', error)

        // Provide more helpful error messages
        if (response.status === 401) {
          message.error('Unauthorized. Please log in again.')
        } else if (error.error?.includes('target STRING not available')) {
          message.warning('VNC clipboard is empty. Copy some text in the VNC display first.')
        } else {
          message.error(error.error || 'Failed to copy from VNC')
        }
      }
    } catch (error) {
      console.error('Error copying from VNC:', error)
      message.error('Failed to copy from VNC. Check console for details.')
    }
  }

  const handlePasteToVNC = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
        message.error('Clipboard API not available. This feature requires HTTPS or localhost.')
        console.error('navigator.clipboard not available:', { clipboard: navigator.clipboard })
        return
      }

      const text = await navigator.clipboard.readText()

      if (!text || text.trim() === '') {
        message.warning('Your clipboard is empty. Copy some text first.')
        return
      }

      const response = await fetch('/api/vnc/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display, text }),
      })

      if (response.ok) {
        const data = await response.json()
        message.success(`Pasted ${data.length} characters to VNC ${display}`)
      } else {
        const error = await response.json()
        console.error('Paste error response:', error)

        if (response.status === 401) {
          message.error('Unauthorized. Please log in again.')
        } else {
          message.error(error.error || 'Failed to paste to VNC')
        }
      }
    } catch (error) {
      console.error('Error pasting to VNC:', error)

      // Check if it's a clipboard permission error
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        message.error('Clipboard access denied. Please grant clipboard permissions.')
      } else {
        message.error('Failed to paste to VNC. Check console for details.')
      }
    }
  }

  const handleReconnect = () => {
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect()
      } catch (err) {
        console.error('Error disconnecting before reconnect:', err)
      }
      rfbRef.current = null
    }

    // Trigger reconnection by forcing re-render
    setLoading(true)
    setConnectionStatus('connecting')
    message.info('Reconnecting to VNC...')

    // The useEffect will handle reconnection
    window.location.reload()
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge status="success" text="Connected" />
      case 'connecting':
        return <Badge status="processing" text="Connecting..." />
      case 'disconnected':
        return <Badge status="error" text="Disconnected" />
      default:
        return <Badge status="default" text="Unknown" />
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Card
      title={
        <Space>
          {title}
          {getStatusBadge()}
        </Space>
      }
      className="h-full flex flex-col"
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      extra={
        <Space>
          <Button
            size="small"
            icon={<FullscreenOutlined />}
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            Fullscreen
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopyFromVNC}
            disabled={!connected}
            title="Copy from VNC clipboard"
          >
            Copy
          </Button>
          <Button
            size="small"
            icon={<SnippetsOutlined />}
            onClick={handlePasteToVNC}
            disabled={!connected}
            title="Paste to VNC clipboard"
          >
            Paste
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReconnect}
            loading={loading}
            title="Reconnect to VNC"
          />
        </Space>
      }
    >
      <div
        className="vnc-container bg-black rounded flex-1 relative overflow-hidden flex items-center justify-center"
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      >
        {loading && !connected && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-75 z-10">
            <div className="text-center">
              <ReloadOutlined className="text-4xl mb-2 animate-spin" />
              <p className="text-lg">Connecting to VNC {display}...</p>
              <p className="text-sm opacity-70">Port: {port}</p>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black">
            <div className="text-center max-w-md p-4">
              <DesktopOutlined className="text-6xl mb-4 opacity-30" />
              <p className="text-lg mb-2">Connection Error</p>
              <p className="text-sm opacity-70 mb-4">{error}</p>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReconnect}
                type="primary"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal with its own VNC connection */}
      <Modal
        title={
          <Space>
            {title}
            <Badge
              status={fullscreenConnected ? "success" : (fullscreenLoading ? "processing" : "error")}
              text={fullscreenConnected ? "Connected" : (fullscreenLoading ? "Connecting..." : "Disconnected")}
            />
          </Space>
        }
        open={isFullscreen}
        onCancel={toggleFullscreen}
        width="100%"
        style={{ top: 0, maxWidth: '100vw', padding: 0 }}
        styles={{ body: { height: 'calc(100vh - 110px)', padding: 0 } }}
        footer={
          <Space>
            <Button icon={<FullscreenExitOutlined />} onClick={toggleFullscreen}>
              Exit Fullscreen
            </Button>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyFromVNC}
              disabled={!fullscreenConnected}
            >
              Copy
            </Button>
            <Button
              icon={<SnippetsOutlined />}
              onClick={handlePasteToVNC}
              disabled={!fullscreenConnected}
            >
              Paste
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReconnect}
              loading={loading}
            >
              Reconnect
            </Button>
          </Space>
        }
      >
        <div
          className="vnc-container bg-black w-full h-full relative"
          ref={fullscreenCanvasRef}
          style={{ minHeight: 'calc(100vh - 110px)' }}
        >
          {fullscreenLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-75 z-10">
              <div className="text-center">
                <ReloadOutlined className="text-4xl mb-2 animate-spin" />
                <p className="text-lg">Connecting to VNC {display}...</p>
              </div>
            </div>
          )}
          {!fullscreenConnected && !fullscreenLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black">
              <div className="text-center max-w-md p-4">
                <DesktopOutlined className="text-6xl mb-4 opacity-30" />
                <p className="text-lg mb-2">Connection Error</p>
                <p className="text-sm opacity-70 mb-4">Failed to connect fullscreen VNC</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  )
}
