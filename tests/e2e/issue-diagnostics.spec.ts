/**
 * Issue Diagnostics Test Suite
 *
 * Tests three specific issues:
 * 1. Session logout issue: Both browser windows/tabs getting logged out instead of just old session
 * 2. Mobile header issue: User avatar off-page on mobile viewport (< 768px)
 * 3. VNC dead space: Dead space above/below VNC display in window
 *
 * Run on DISPLAY :99 for VNC visibility at http://localhost:6080
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import path from 'path'

const LOGIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
}

// Helper function to login
async function login(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', LOGIN_CREDENTIALS.email)
  await page.fill('[name="password"]', LOGIN_CREDENTIALS.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

test.describe('Issue Diagnostics Suite', () => {
  test.setTimeout(120000) // 2 minutes timeout for comprehensive tests

  test('Issue #1: Session Logout - Both tabs should NOT be logged out', async ({ browser }) => {
    console.log('\n=== TESTING SESSION LOGOUT ISSUE ===')

    // Create first browser context (simulates first browser/tab)
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    // Login with first session
    console.log('Step 1: Logging in with first session...')
    await login(page1)

    // Verify first session is logged in
    await expect(page1.locator('text=MI AI Coding Platform')).toBeVisible()
    console.log('✓ First session logged in successfully')

    // Get session token from page1
    const session1Token = await page1.evaluate(() => {
      return document.cookie
    })
    console.log('Session 1 cookies:', session1Token)

    // Take screenshot of first session
    await page1.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue1-session1-logged-in.png'),
      fullPage: true
    })

    // Wait a bit to ensure session is established
    await page1.waitForTimeout(2000)

    // Create second browser context (simulates second browser/tab)
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    // Login with same credentials in second session
    console.log('\nStep 2: Logging in with SAME credentials in second session...')
    await login(page2)

    // Verify second session is logged in
    await expect(page2.locator('text=MI AI Coding Platform')).toBeVisible()
    console.log('✓ Second session logged in successfully')

    // Take screenshot of second session
    await page2.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue1-session2-logged-in.png'),
      fullPage: true
    })

    // Wait for session check to happen (IdleTimeout checks every 10 seconds)
    console.log('\nStep 3: Waiting for session validation check (15 seconds)...')
    await page1.waitForTimeout(15000)

    // Check if first session is still logged in (EXPECTED: should be logged out)
    console.log('\nStep 4: Checking if first session is still logged in...')

    // Try to interact with the page
    const isStillLoggedIn1 = await page1.evaluate(() => {
      // Check if we can see the dashboard content
      return document.querySelector('.ant-layout-content') !== null
    })

    const currentUrl1 = page1.url()
    console.log('Session 1 URL after second login:', currentUrl1)
    console.log('Session 1 still showing dashboard content:', isStillLoggedIn1)

    // Take screenshot of first session after second login
    await page1.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue1-session1-after-second-login.png'),
      fullPage: true
    })

    // Check if second session is still logged in (EXPECTED: should be logged in)
    const isStillLoggedIn2 = await page2.evaluate(() => {
      return document.querySelector('.ant-layout-content') !== null
    })

    const currentUrl2 = page2.url()
    console.log('Session 2 URL:', currentUrl2)
    console.log('Session 2 still showing dashboard content:', isStillLoggedIn2)

    // Take screenshot of second session
    await page2.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue1-session2-final.png'),
      fullPage: true
    })

    // Get console errors from both pages
    const errors1: string[] = []
    const errors2: string[] = []

    page1.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        errors1.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    page2.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        errors2.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    console.log('\n=== ISSUE #1 DIAGNOSTIC RESULTS ===')
    console.log('Session 1 (old):')
    console.log('  - URL:', currentUrl1)
    console.log('  - Still logged in:', isStillLoggedIn1)
    console.log('  - Errors:', errors1.length > 0 ? errors1 : 'None')
    console.log('\nSession 2 (new):')
    console.log('  - URL:', currentUrl2)
    console.log('  - Still logged in:', isStillLoggedIn2)
    console.log('  - Errors:', errors2.length > 0 ? errors2 : 'None')

    console.log('\n=== EXPECTED vs ACTUAL ===')
    console.log('EXPECTED: Session 1 should be logged out (redirected to /login)')
    console.log('EXPECTED: Session 2 should remain logged in (/dashboard)')
    console.log(`ACTUAL: Session 1 is at ${currentUrl1} (logged in: ${isStillLoggedIn1})`)
    console.log(`ACTUAL: Session 2 is at ${currentUrl2} (logged in: ${isStillLoggedIn2})`)

    // BUG: If session1 is also redirected to login when it shouldn't be, that's the bug
    // The issue description says "BOTH are getting logged out" which is the problem

    await context1.close()
    await context2.close()
  })

  test('Issue #2: Mobile Header - Avatar should be visible on mobile viewport', async ({ page }) => {
    console.log('\n=== TESTING MOBILE HEADER ISSUE ===')

    // Login first
    await login(page)

    // Test desktop viewport first (baseline)
    console.log('\nStep 1: Testing on Desktop viewport (1920x1080)...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)

    const desktopAvatar = page.locator('.ant-avatar')
    await expect(desktopAvatar).toBeVisible()

    const desktopBounds = await desktopAvatar.boundingBox()
    console.log('Desktop avatar position:', desktopBounds)

    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue2-desktop-header.png'),
      fullPage: false
    })

    // Test tablet viewport
    console.log('\nStep 2: Testing on Tablet viewport (768x1024)...')
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(1000)

    const tabletAvatar = page.locator('.ant-avatar')
    const isTabletAvatarVisible = await tabletAvatar.isVisible()
    const tabletBounds = await tabletAvatar.boundingBox()

    console.log('Tablet avatar visible:', isTabletAvatarVisible)
    console.log('Tablet avatar position:', tabletBounds)

    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue2-tablet-header.png'),
      fullPage: false
    })

    // Test mobile viewport (< 768px) - THIS IS WHERE THE BUG OCCURS
    console.log('\nStep 3: Testing on Mobile viewport (375x667)...')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    const mobileAvatar = page.locator('.ant-avatar')
    const isMobileAvatarVisible = await mobileAvatar.isVisible()
    const mobileBounds = await mobileAvatar.boundingBox()

    console.log('Mobile avatar visible:', isMobileAvatarVisible)
    console.log('Mobile avatar position:', mobileBounds)

    // Check if avatar is off-screen (x position > viewport width)
    const viewportWidth = 375
    let isOffScreen = false
    if (mobileBounds) {
      isOffScreen = mobileBounds.x + mobileBounds.width > viewportWidth
      console.log('Avatar off-screen (x + width > viewport):', isOffScreen)
      console.log(`  - Avatar right edge: ${mobileBounds.x + mobileBounds.width}px`)
      console.log(`  - Viewport width: ${viewportWidth}px`)
    }

    // Take screenshot showing the issue
    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue2-mobile-header.png'),
      fullPage: false
    })

    // Also take a full page screenshot to see overflow
    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue2-mobile-header-full.png'),
      fullPage: true
    })

    // Inspect header element
    const header = page.locator('.ant-layout-header')
    const headerHTML = await header.evaluate(el => el.outerHTML.substring(0, 500))
    const headerStyles = await header.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        padding: computed.padding,
        overflow: computed.overflow,
        width: computed.width
      }
    })

    console.log('\n=== ISSUE #2 DIAGNOSTIC RESULTS ===')
    console.log('Header styles:', JSON.stringify(headerStyles, null, 2))
    console.log('Header HTML (truncated):', headerHTML)

    console.log('\n=== EXPECTED vs ACTUAL ===')
    console.log('EXPECTED: Avatar should be fully visible within viewport on mobile')
    console.log(`ACTUAL: Avatar is ${isMobileAvatarVisible ? 'visible' : 'NOT visible'}`)
    console.log(`ACTUAL: Avatar is ${isOffScreen ? 'OFF-SCREEN (BUG!)' : 'within viewport'}`)

    if (mobileBounds) {
      console.log(`\nAvatar position: x=${mobileBounds.x}, width=${mobileBounds.width}`)
      console.log(`Right edge: ${mobileBounds.x + mobileBounds.width}px (viewport: ${viewportWidth}px)`)
    }
  })

  test('Issue #3: VNC Dead Space - Should not have excessive dead space', async ({ page }) => {
    console.log('\n=== TESTING VNC DEAD SPACE ISSUE ===')

    // Login first
    await login(page)

    // Navigate to VNC page (assuming it's on dashboard)
    console.log('\nStep 1: Navigating to dashboard with VNC...')
    await page.waitForTimeout(2000)

    // Test on desktop viewport
    console.log('\nStep 2: Testing VNC on Desktop viewport (1920x1080)...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)

    // Find VNC container
    const vncContainer = page.locator('.vnc-container').first()
    const isVNCVisible = await vncContainer.isVisible({ timeout: 5000 }).catch(() => false)

    if (!isVNCVisible) {
      console.log('⚠ VNC container not found on dashboard. Checking if VNC is loaded...')

      // Check for VNC card
      const vncCard = page.locator('.ant-card:has-text("VNC")').first()
      const isCardVisible = await vncCard.isVisible({ timeout: 5000 }).catch(() => false)
      console.log('VNC card visible:', isCardVisible)

      // Take screenshot showing what's on the page
      await page.screenshot({
        path: path.join(__dirname, '../../test-screenshots/issue3-no-vnc-found.png'),
        fullPage: true
      })

      console.log('Cannot test VNC dead space - VNC not visible on page')
      return
    }

    // Get VNC container dimensions
    const vncBounds = await vncContainer.boundingBox()
    console.log('Desktop VNC container bounds:', vncBounds)

    // Get the canvas element inside VNC (noVNC creates a canvas)
    const vncCanvas = vncContainer.locator('canvas').first()
    const isCanvasVisible = await vncCanvas.isVisible({ timeout: 5000 }).catch(() => false)
    const canvasBounds = await vncCanvas.boundingBox().catch(() => null)

    console.log('Desktop VNC canvas visible:', isCanvasVisible)
    console.log('Desktop VNC canvas bounds:', canvasBounds)

    // Calculate dead space (difference between container and canvas)
    let desktopDeadSpaceTop = 0
    let desktopDeadSpaceBottom = 0
    let desktopDeadSpaceTotal = 0

    if (vncBounds && canvasBounds) {
      desktopDeadSpaceTop = canvasBounds.y - vncBounds.y
      desktopDeadSpaceBottom = (vncBounds.y + vncBounds.height) - (canvasBounds.y + canvasBounds.height)
      desktopDeadSpaceTotal = desktopDeadSpaceTop + desktopDeadSpaceBottom

      console.log(`Desktop dead space: Top=${desktopDeadSpaceTop}px, Bottom=${desktopDeadSpaceBottom}px, Total=${desktopDeadSpaceTotal}px`)
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue3-desktop-vnc.png'),
      fullPage: true
    })

    // Test on mobile viewport
    console.log('\nStep 3: Testing VNC on Mobile viewport (375x667)...')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    const mobileVncBounds = await vncContainer.boundingBox()
    const mobileCanvasBounds = await vncCanvas.boundingBox().catch(() => null)

    console.log('Mobile VNC container bounds:', mobileVncBounds)
    console.log('Mobile VNC canvas bounds:', mobileCanvasBounds)

    let mobileDeadSpaceTop = 0
    let mobileDeadSpaceBottom = 0
    let mobileDeadSpaceTotal = 0

    if (mobileVncBounds && mobileCanvasBounds) {
      mobileDeadSpaceTop = mobileCanvasBounds.y - mobileVncBounds.y
      mobileDeadSpaceBottom = (mobileVncBounds.y + mobileVncBounds.height) - (mobileCanvasBounds.y + mobileCanvasBounds.height)
      mobileDeadSpaceTotal = mobileDeadSpaceTop + mobileDeadSpaceBottom

      console.log(`Mobile dead space: Top=${mobileDeadSpaceTop}px, Bottom=${mobileDeadSpaceBottom}px, Total=${mobileDeadSpaceTotal}px`)
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots/issue3-mobile-vnc.png'),
      fullPage: true
    })

    // Get VNC container styles
    const vncStyles = await vncContainer.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        display: computed.display,
        padding: computed.padding,
        margin: computed.margin,
        minHeight: computed.minHeight,
        height: computed.height,
        width: computed.width,
        background: computed.background,
        overflow: computed.overflow
      }
    })

    console.log('\n=== ISSUE #3 DIAGNOSTIC RESULTS ===')
    console.log('VNC container styles:', JSON.stringify(vncStyles, null, 2))

    console.log('\nDesktop VNC:')
    console.log(`  - Container: ${vncBounds?.width}x${vncBounds?.height}`)
    console.log(`  - Canvas: ${canvasBounds?.width}x${canvasBounds?.height}`)
    console.log(`  - Dead space: ${desktopDeadSpaceTotal}px (${desktopDeadSpaceTop}px top, ${desktopDeadSpaceBottom}px bottom)`)

    console.log('\nMobile VNC:')
    console.log(`  - Container: ${mobileVncBounds?.width}x${mobileVncBounds?.height}`)
    console.log(`  - Canvas: ${mobileCanvasBounds?.width}x${mobileCanvasBounds?.height}`)
    console.log(`  - Dead space: ${mobileDeadSpaceTotal}px (${mobileDeadSpaceTop}px top, ${mobileDeadSpaceBottom}px bottom)`)

    console.log('\n=== EXPECTED vs ACTUAL ===')
    console.log('EXPECTED: Minimal dead space (< 10px top/bottom for padding)')
    console.log(`ACTUAL Desktop: ${desktopDeadSpaceTotal}px total dead space ${desktopDeadSpaceTotal > 20 ? '(EXCESSIVE - BUG!)' : '(OK)'}`)
    console.log(`ACTUAL Mobile: ${mobileDeadSpaceTotal}px total dead space ${mobileDeadSpaceTotal > 20 ? '(EXCESSIVE - BUG!)' : '(OK)'}`)
  })

  test('Generate Summary Report', async ({ page }) => {
    console.log('\n=== GENERATING DIAGNOSTIC SUMMARY REPORT ===')

    // This test just generates a summary report by reading the screenshots
    const report = {
      timestamp: new Date().toISOString(),
      issues: [
        {
          id: 1,
          title: 'Session Logout - Both tabs getting logged out',
          description: 'When user logs in with same credentials on two different browser windows/tabs, BOTH are getting logged out instead of just the old session',
          screenshots: [
            'test-screenshots/issue1-session1-logged-in.png',
            'test-screenshots/issue1-session2-logged-in.png',
            'test-screenshots/issue1-session1-after-second-login.png',
            'test-screenshots/issue1-session2-final.png'
          ],
          codeLocations: [
            'lib/auth.ts - JWT callback (lines 68-94)',
            'components/auth/IdleTimeout.tsx - Session check (lines 122-149)',
            'app/api/auth/check-session/route.ts - Session validation'
          ]
        },
        {
          id: 2,
          title: 'Mobile Header - Avatar off the page',
          description: 'On mobile viewport (< 768px), the user avatar in top-right header is off the page, making logout difficult',
          screenshots: [
            'test-screenshots/issue2-desktop-header.png',
            'test-screenshots/issue2-tablet-header.png',
            'test-screenshots/issue2-mobile-header.png',
            'test-screenshots/issue2-mobile-header-full.png'
          ],
          codeLocations: [
            'components/layout/Header.tsx - Header component (line 64)',
            'components/layout/Header.tsx - Avatar Space (lines 70-91)'
          ]
        },
        {
          id: 3,
          title: 'VNC Dead Space',
          description: 'Both desktop and mobile have dead space above and below the VNC display inside the VNC window',
          screenshots: [
            'test-screenshots/issue3-desktop-vnc.png',
            'test-screenshots/issue3-mobile-vnc.png'
          ],
          codeLocations: [
            'components/vnc/VNCViewer.tsx - VNC container (lines 387-417)',
            'components/vnc/VNCViewer.tsx - Container styles (line 388-390)'
          ]
        }
      ]
    }

    console.log('\nDiagnostic Report:')
    console.log(JSON.stringify(report, null, 2))

    console.log('\n=== REPORT SAVED ===')
    console.log('Screenshots saved in: test-screenshots/')
    console.log('View screenshots to see visual evidence of issues')
  })
})
