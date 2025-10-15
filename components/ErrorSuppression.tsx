'use client'

import { useEffect } from 'react'

/**
 * Global error suppression for known harmless errors
 *
 * This component suppresses noVNC library errors that occur during
 * React's hot reload and component lifecycle, specifically DOM manipulation
 * errors that don't affect functionality.
 */
export function ErrorSuppression() {
  useEffect(() => {
    // Store original console methods
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    // Override console.error to filter known harmless errors
    console.error = (...args: any[]) => {
      const errorString = args.join(' ')

      // Suppress noVNC DOM manipulation errors
      if (
        errorString.includes('removeChild') ||
        errorString.includes('not a child of this node') ||
        errorString.includes('Node.removeChild')
      ) {
        return
      }

      // Suppress browser extension message channel errors (not our code)
      if (
        errorString.includes('message channel closed') ||
        errorString.includes('A listener indicated an asynchronous response')
      ) {
        return
      }

      // Suppress Ant Design React 19 warning (logged as error by Ant Design)
      if (
        errorString.includes('antd v5 support React is 16 ~ 18') ||
        errorString.includes('[antd: compatible]') ||
        errorString.includes('[antd: message]') ||
        errorString.includes('[antd: Modal]') ||
        errorString.includes('[antd: Avatar.Group]') ||
        errorString.includes('Static function can not consume context') ||
        errorString.includes('is deprecated')
      ) {
        return
      }

      // Suppress WebSocket connection errors (auto-reconnect handles them)
      if (
        errorString.includes('[ActivityStream] WebSocket error:') ||
        errorString.includes('WebSocket connection')
      ) {
        return
      }

      // Suppress VNC RFB disconnection errors (harmless cleanup warnings)
      if (
        errorString.includes('Tried changing state of a disconnected RFB object') ||
        errorString.includes('RFB object')
      ) {
        return
      }

      // Pass through all other errors
      originalConsoleError.apply(console, args)
    }

    // Override console.warn to filter Ant Design React 19 warning
    console.warn = (...args: any[]) => {
      const warnString = args.join(' ')

      // Suppress Ant Design React 19 compatibility warning (cosmetic only)
      if (
        warnString.includes('antd v5 support React is 16 ~ 18') ||
        warnString.includes('[antd: compatible]') ||
        warnString.includes('[antd: message]') ||
        warnString.includes('[antd: Modal]') ||
        warnString.includes('[antd: Avatar.Group]') ||
        warnString.includes('Static function can not consume context') ||
        warnString.includes('is deprecated')
      ) {
        return
      }

      // Pass through all other warnings
      originalConsoleWarn.apply(console, args)
    }

    // Global error event handler
    const handleError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || ''
      const errorStr = String(message).toLowerCase()

      // Suppress DOM manipulation errors (noVNC cleanup)
      if (
        errorStr.includes('removechild') ||
        errorStr.includes('not a child') ||
        errorStr.includes('node.removechild') ||
        errorStr.includes('message channel closed')
      ) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return false
      }
    }

    // Global unhandled rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '')

      if (
        reason.includes('removeChild') ||
        reason.includes('not a child') ||
        reason.includes('message channel closed') ||
        reason.includes('A listener indicated an asynchronous response')
      ) {
        event.preventDefault()
        return true
      }
    }

    // Register global handlers with capture phase
    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleRejection, true)

    // Cleanup on unmount
    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleRejection, true)
    }
  }, [])

  return null
}
