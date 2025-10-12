'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { message, Modal } from 'antd'

const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000 // Show warning 2 minutes before timeout

export function IdleTimeout() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }

    // Update last activity time
    lastActivityRef.current = Date.now()

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      Modal.warning({
        title: 'Session Expiring Soon',
        content: 'Your session will expire in 2 minutes due to inactivity. Move your mouse or press any key to stay logged in.',
        okText: 'Stay Logged In',
        onOk: () => {
          resetTimer()
        },
      })
    }, IDLE_TIMEOUT - WARNING_TIME)

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      console.log('[IdleTimeout] Session expired due to inactivity')
      message.warning('Your session has expired due to inactivity. Please log in again.')

      // Sign out without clearing VNC sessions
      await signOut({ redirect: false })

      // Redirect to login with return URL
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    }, IDLE_TIMEOUT)
  }

  useEffect(() => {
    // Only set up idle timeout for authenticated users
    if (status !== 'authenticated') {
      return
    }

    console.log('[IdleTimeout] Setting up 30-minute idle timeout')

    // Start the timer
    resetTimer()

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Throttle activity detection to avoid excessive resets
    let throttleTimer: NodeJS.Timeout | null = null
    const handleActivity = () => {
      if (!throttleTimer) {
        resetTimer()
        throttleTimer = setTimeout(() => {
          throttleTimer = null
        }, 1000) // Throttle to once per second
      }
    }

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [status, router])

  // Check session on mount and after inactivity
  useEffect(() => {
    const checkSession = async () => {
      if (status === 'unauthenticated') {
        console.log('[IdleTimeout] Session is unauthenticated, redirecting to login')
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      }
    }

    checkSession()
  }, [status, router])

  // Check for session invalidation (logged in from another device)
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return

    const user = session.user as any
    const currentSessionToken = user.sessionToken

    const checkSessionValidity = async () => {
      try {
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()

        // If session is invalid (token doesn't match), user logged in from another device
        if (!data.valid) {
          console.log('[IdleTimeout] Session invalidated - user logged in from another device')
          message.warning('This user has logged in from another device. You have been logged out.')
          await signOut({ redirect: false })
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
        }
      } catch (error) {
        console.error('[IdleTimeout] Error checking session validity:', error)
      }
    }

    // Check session validity every 10 seconds for faster detection
    const intervalId = setInterval(checkSessionValidity, 10000)

    return () => clearInterval(intervalId)
  }, [status, session, router])

  return null // This component doesn't render anything
}
