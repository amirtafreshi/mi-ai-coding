/**
 * Simple Diagnostic Test - Manual Visual Inspection
 *
 * This test creates screenshots for manual inspection of the three issues
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'

const screenshotsDir = path.join(__dirname, '../../test-screenshots')

test.describe('Simple Visual Diagnostics', () => {
  test.setTimeout(60000)

  test('Capture Login and Dashboard - Desktop and Mobile', async ({ page }) => {
    console.log('\n========== CAPTURING SCREENSHOTS FOR MANUAL INSPECTION ==========\n')

    // 1. Login page desktop
    console.log('1. Navigating to login page (desktop)...')
    await page.goto('http://localhost:3000/login')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-01-login-desktop.png'),
      fullPage: true
    })
    console.log('✓ Saved: diag-01-login-desktop.png')

    // 2. Fill and submit login
    console.log('\n2. Logging in...')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-02-login-filled.png')
    })

    await page.click('button[type="submit"]')
    console.log('Waiting for dashboard...')

    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 })
      console.log('✓ Redirected to dashboard')
    } catch (e) {
      console.log('⚠ Dashboard redirect timeout, checking current URL...')
      console.log('Current URL:', page.url())
    }

    await page.waitForTimeout(3000) // Wait for hydration

    // 3. Dashboard desktop view
    console.log('\n3. Capturing dashboard (desktop 1920x1080)...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-03-dashboard-desktop.png'),
      fullPage: true
    })
    console.log('✓ Saved: diag-03-dashboard-desktop.png')

    // 4. Check header on desktop
    const desktopHeader = await page.locator('.ant-layout-header').boundingBox()
    const desktopAvatar = await page.locator('.ant-avatar').first().boundingBox()

    console.log('Desktop header box:', desktopHeader)
    console.log('Desktop avatar box:', desktopAvatar)

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-04-header-desktop.png'),
      clip: desktopHeader || undefined
    })

    // 5. Dashboard mobile view (375x667 - iPhone SE)
    console.log('\n4. Capturing dashboard (mobile 375x667)...')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-05-dashboard-mobile-full.png'),
      fullPage: true
    })
    console.log('✓ Saved: diag-05-dashboard-mobile-full.png')

    // 6. Check header on mobile
    const mobileHeader = await page.locator('.ant-layout-header').boundingBox()
    const mobileAvatar = await page.locator('.ant-avatar').first().boundingBox()

    console.log('Mobile header box:', mobileHeader)
    console.log('Mobile avatar box:', mobileAvatar)

    // Check if avatar is off-screen
    if (mobileAvatar) {
      const rightEdge = mobileAvatar.x + mobileAvatar.width
      const isOffScreen = rightEdge > 375
      console.log(`Mobile avatar right edge: ${rightEdge}px (viewport: 375px)`)
      console.log(`❌ ISSUE #2 BUG DETECTED: Avatar is ${isOffScreen ? 'OFF-SCREEN!' : 'visible'}`)
    }

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-06-header-mobile.png'),
      clip: mobileHeader || undefined
    })

    // 7. Check for VNC components
    console.log('\n5. Checking VNC components...')
    const vncVisible = await page.locator('.vnc-container').first().isVisible().catch(() => false)
    console.log('VNC container visible:', vncVisible)

    if (vncVisible) {
      const vncContainer = await page.locator('.vnc-container').first().boundingBox()
      const vncCanvas = await page.locator('.vnc-container canvas').first().boundingBox().catch(() => null)

      console.log('VNC container box:', vncContainer)
      console.log('VNC canvas box:', vncCanvas)

      if (vncContainer && vncCanvas) {
        const deadSpaceTop = vncCanvas.y - vncContainer.y
        const deadSpaceBottom = (vncContainer.y + vncContainer.height) - (vncCanvas.y + vncCanvas.height)
        const totalDeadSpace = deadSpaceTop + deadSpaceBottom

        console.log(`❌ ISSUE #3: VNC dead space = ${totalDeadSpace}px (${deadSpaceTop}px top, ${deadSpaceBottom}px bottom)`)

        if (totalDeadSpace > 20) {
          console.log('❌ ISSUE #3 BUG DETECTED: Excessive dead space!')
        }
      }

      await page.screenshot({
        path: path.join(screenshotsDir, 'diag-07-vnc-mobile.png'),
        fullPage: true
      })
    } else {
      console.log('⚠ VNC not found on page')
    }

    // 8. Switch back to desktop for VNC check
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)

    if (vncVisible) {
      await page.screenshot({
        path: path.join(screenshotsDir, 'diag-08-vnc-desktop.png'),
        fullPage: true
      })
    }

    console.log('\n========== DIAGNOSTIC SCREENSHOTS COMPLETE ==========')
    console.log('\nScreenshots saved in: test-screenshots/')
    console.log('\nManual inspection required for:')
    console.log('  ISSUE #1: Session logout (needs multi-tab test - see code)')
    console.log('  ISSUE #2: Mobile avatar visibility (check diag-06-header-mobile.png)')
    console.log('  ISSUE #3: VNC dead space (check diag-07-vnc-mobile.png and diag-08-vnc-desktop.png)')
  })

  test('Check Session Token Flow', async ({ page }) => {
    console.log('\n========== CHECKING SESSION TOKEN FLOW ==========\n')

    // Enable console monitoring
    const consoleLogs: string[] = []
    const networkRequests: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('[Auth]') || text.includes('[IdleTimeout]') || text.includes('session')) {
        consoleLogs.push(`[${msg.type()}] ${text}`)
        console.log(`[Console] ${text}`)
      }
    })

    page.on('request', request => {
      const url = request.url()
      if (url.includes('/api/auth') || url.includes('session')) {
        networkRequests.push(`[${request.method()}] ${url}`)
        console.log(`[Network] ${request.method()} ${url}`)
      }
    })

    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(15000) // Wait for session check (happens every 10s)

    console.log('\n=== Session Token Analysis ===')
    console.log('Console logs related to auth:', consoleLogs.length)
    console.log('Network requests to auth endpoints:', networkRequests.length)

    consoleLogs.forEach(log => console.log('  ', log))
    networkRequests.forEach(req => console.log('  ', req))

    await page.screenshot({
      path: path.join(screenshotsDir, 'diag-09-session-check.png'),
      fullPage: true
    })

    console.log('\n✓ Session token flow captured')
  })
})
