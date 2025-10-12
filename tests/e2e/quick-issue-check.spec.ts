/**
 * Quick Issue Check - Without Global Setup
 *
 * Rapid diagnostic test for the three reported issues
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const LOGIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, '../../test-screenshots')
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

// Helper function to login
async function login(page: Page) {
  console.log('Navigating to login page...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })

  console.log('Filling login form...')
  await page.fill('[name="email"]', LOGIN_CREDENTIALS.email)
  await page.fill('[name="password"]', LOGIN_CREDENTIALS.password)

  console.log('Submitting login form...')
  await page.click('button[type="submit"]')

  console.log('Waiting for redirect to dashboard...')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await page.waitForTimeout(2000) // Extra wait for hydration
  console.log('✓ Login successful')
}

test.describe('Quick Issue Diagnostics', () => {
  test.setTimeout(180000)

  test('Issue #1: Dual Session Logout Test', async ({ browser }) => {
    console.log('\n========================================')
    console.log('ISSUE #1: SESSION LOGOUT PROBLEM')
    console.log('========================================\n')

    // Session 1: First login
    console.log('--- SESSION 1: First Login ---')
    const context1 = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    })
    const page1 = await context1.newPage()

    await login(page1)

    await page1.screenshot({
      path: path.join(screenshotsDir, 'issue1-step1-session1-logged-in.png'),
      fullPage: true
    })
    console.log('✓ Screenshot: Session 1 logged in')

    // Wait to ensure session is established
    await page1.waitForTimeout(3000)

    // Session 2: Second login with same credentials
    console.log('\n--- SESSION 2: Second Login (Same Credentials) ---')
    const context2 = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    })
    const page2 = await context2.newPage()

    await login(page2)

    await page2.screenshot({
      path: path.join(screenshotsDir, 'issue1-step2-session2-logged-in.png'),
      fullPage: true
    })
    console.log('✓ Screenshot: Session 2 logged in')

    // Wait for session check (IdleTimeout checks every 10 seconds)
    console.log('\n--- Waiting for Session Validation (20 seconds) ---')
    await page1.waitForTimeout(20000)

    // Check Session 1 status
    console.log('\n--- Checking Session 1 Status ---')
    const url1 = page1.url()
    const isLoggedIn1 = url1.includes('/dashboard')

    await page1.screenshot({
      path: path.join(screenshotsDir, 'issue1-step3-session1-final.png'),
      fullPage: true
    })

    console.log(`Session 1 URL: ${url1}`)
    console.log(`Session 1 logged in: ${isLoggedIn1}`)

    // Check Session 2 status
    console.log('\n--- Checking Session 2 Status ---')
    const url2 = page2.url()
    const isLoggedIn2 = url2.includes('/dashboard')

    await page2.screenshot({
      path: path.join(screenshotsDir, 'issue1-step4-session2-final.png'),
      fullPage: true
    })

    console.log(`Session 2 URL: ${url2}`)
    console.log(`Session 2 logged in: ${isLoggedIn2}`)

    console.log('\n========================================')
    console.log('ISSUE #1 RESULTS')
    console.log('========================================')
    console.log('EXPECTED:')
    console.log('  - Session 1 should be LOGGED OUT (redirected to /login)')
    console.log('  - Session 2 should be LOGGED IN (at /dashboard)')
    console.log('\nACTUAL:')
    console.log(`  - Session 1: ${isLoggedIn1 ? '❌ LOGGED IN (BUG!)' : '✓ LOGGED OUT (Expected)'}`)
    console.log(`  - Session 2: ${isLoggedIn2 ? '✓ LOGGED IN (Expected)' : '❌ LOGGED OUT (BUG!)'}`)

    if (!isLoggedIn1 && isLoggedIn2) {
      console.log('\n✓ Issue #1: WORKING AS EXPECTED')
    } else if (isLoggedIn1 && isLoggedIn2) {
      console.log('\n⚠ Issue #1: Session 1 not logged out - token validation may not be working')
    } else if (!isLoggedIn1 && !isLoggedIn2) {
      console.log('\n❌ Issue #1: BOTH SESSIONS LOGGED OUT - THIS IS THE BUG!')
    } else {
      console.log('\n⚠ Issue #1: Unexpected state')
    }

    console.log('\nCode to investigate:')
    console.log('  1. lib/auth.ts (JWT callback, lines 68-94)')
    console.log('  2. components/auth/IdleTimeout.tsx (session check, lines 122-149)')
    console.log('  3. app/api/auth/check-session/route.ts')

    await context1.close()
    await context2.close()
  })

  test('Issue #2: Mobile Header Avatar Visibility', async ({ page }) => {
    console.log('\n========================================')
    console.log('ISSUE #2: MOBILE HEADER AVATAR')
    console.log('========================================\n')

    await login(page)

    // Desktop test (baseline)
    console.log('--- Testing Desktop (1920x1080) ---')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(1000)

    const desktopAvatar = page.locator('.ant-avatar').first()
    const desktopVisible = await desktopAvatar.isVisible()
    const desktopBox = await desktopAvatar.boundingBox()

    console.log(`Desktop avatar visible: ${desktopVisible}`)
    console.log(`Desktop avatar position:`, desktopBox)

    await page.screenshot({
      path: path.join(screenshotsDir, 'issue2-step1-desktop.png')
    })

    // Mobile test (this is where the bug is)
    console.log('\n--- Testing Mobile (375x667) ---')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    const mobileAvatar = page.locator('.ant-avatar').first()
    const mobileVisible = await mobileAvatar.isVisible()
    const mobileBox = await mobileAvatar.boundingBox()

    console.log(`Mobile avatar visible: ${mobileVisible}`)
    console.log(`Mobile avatar position:`, mobileBox)

    let isOffScreen = false
    if (mobileBox) {
      const rightEdge = mobileBox.x + mobileBox.width
      isOffScreen = rightEdge > 375
      console.log(`Mobile avatar right edge: ${rightEdge}px (viewport: 375px)`)
      console.log(`Mobile avatar off-screen: ${isOffScreen}`)
    }

    await page.screenshot({
      path: path.join(screenshotsDir, 'issue2-step2-mobile.png')
    })

    // Get header layout info
    const headerInfo = await page.locator('.ant-layout-header').evaluate(el => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        padding: styles.padding,
        display: styles.display,
        justifyContent: styles.justifyContent,
        overflow: styles.overflow,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      }
    })

    console.log('\nHeader info:', JSON.stringify(headerInfo, null, 2))

    console.log('\n========================================')
    console.log('ISSUE #2 RESULTS')
    console.log('========================================')
    console.log('EXPECTED:')
    console.log('  - Avatar should be fully visible within viewport on mobile')
    console.log('\nACTUAL:')
    console.log(`  - Mobile avatar visible: ${mobileVisible ? '✓ Yes' : '❌ No'}`)
    console.log(`  - Mobile avatar off-screen: ${isOffScreen ? '❌ Yes (BUG!)' : '✓ No'}`)

    if (mobileVisible && !isOffScreen) {
      console.log('\n✓ Issue #2: WORKING AS EXPECTED')
    } else {
      console.log('\n❌ Issue #2: AVATAR IS OFF-SCREEN - THIS IS THE BUG!')
      console.log('\nCode to fix:')
      console.log('  - components/layout/Header.tsx (line 64)')
      console.log('  - Need to adjust responsive padding/spacing on mobile')
    }
  })

  test('Issue #3: VNC Dead Space Analysis', async ({ page }) => {
    console.log('\n========================================')
    console.log('ISSUE #3: VNC DEAD SPACE')
    console.log('========================================\n')

    await login(page)

    // Desktop test
    console.log('--- Testing Desktop VNC (1920x1080) ---')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(2000)

    // Find VNC container
    const vncContainer = page.locator('.vnc-container').first()
    const vncVisible = await vncContainer.isVisible({ timeout: 10000 }).catch(() => false)

    if (!vncVisible) {
      console.log('⚠ VNC container not found. Taking screenshot of dashboard...')
      await page.screenshot({
        path: path.join(screenshotsDir, 'issue3-no-vnc-found.png'),
        fullPage: true
      })
      console.log('VNC may not be rendered yet or not on dashboard. Check screenshot.')
      return
    }

    const containerBox = await vncContainer.boundingBox()
    const canvas = vncContainer.locator('canvas').first()
    const canvasVisible = await canvas.isVisible({ timeout: 5000 }).catch(() => false)
    const canvasBox = await canvas.boundingBox().catch(() => null)

    console.log('Desktop VNC container:', containerBox)
    console.log('Desktop VNC canvas:', canvasBox)

    let desktopDeadSpace = { top: 0, bottom: 0, total: 0 }
    if (containerBox && canvasBox) {
      desktopDeadSpace.top = canvasBox.y - containerBox.y
      desktopDeadSpace.bottom = (containerBox.y + containerBox.height) - (canvasBox.y + canvasBox.height)
      desktopDeadSpace.total = desktopDeadSpace.top + desktopDeadSpace.bottom
      console.log(`Desktop dead space: Top=${desktopDeadSpace.top}px, Bottom=${desktopDeadSpace.bottom}px, Total=${desktopDeadSpace.total}px`)
    }

    await page.screenshot({
      path: path.join(screenshotsDir, 'issue3-step1-desktop-vnc.png'),
      fullPage: true
    })

    // Mobile test
    console.log('\n--- Testing Mobile VNC (375x667) ---')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    const mobileContainerBox = await vncContainer.boundingBox()
    const mobileCanvasBox = await canvas.boundingBox().catch(() => null)

    console.log('Mobile VNC container:', mobileContainerBox)
    console.log('Mobile VNC canvas:', mobileCanvasBox)

    let mobileDeadSpace = { top: 0, bottom: 0, total: 0 }
    if (mobileContainerBox && mobileCanvasBox) {
      mobileDeadSpace.top = mobileCanvasBox.y - mobileContainerBox.y
      mobileDeadSpace.bottom = (mobileContainerBox.y + mobileContainerBox.height) - (mobileCanvasBox.y + mobileCanvasBox.height)
      mobileDeadSpace.total = mobileDeadSpace.top + mobileDeadSpace.bottom
      console.log(`Mobile dead space: Top=${mobileDeadSpace.top}px, Bottom=${mobileDeadSpace.bottom}px, Total=${mobileDeadSpace.total}px`)
    }

    await page.screenshot({
      path: path.join(screenshotsDir, 'issue3-step2-mobile-vnc.png'),
      fullPage: true
    })

    // Get VNC styles
    const vncStyles = await vncContainer.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        display: styles.display,
        padding: styles.padding,
        minHeight: styles.minHeight,
        height: styles.height,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent
      }
    })

    console.log('\nVNC container styles:', JSON.stringify(vncStyles, null, 2))

    console.log('\n========================================')
    console.log('ISSUE #3 RESULTS')
    console.log('========================================')
    console.log('EXPECTED:')
    console.log('  - Minimal dead space (< 10px for padding)')
    console.log('\nACTUAL Desktop:')
    console.log(`  - Dead space: ${desktopDeadSpace.total}px ${desktopDeadSpace.total > 20 ? '❌ EXCESSIVE (BUG!)' : '✓ OK'}`)
    console.log('\nACTUAL Mobile:')
    console.log(`  - Dead space: ${mobileDeadSpace.total}px ${mobileDeadSpace.total > 20 ? '❌ EXCESSIVE (BUG!)' : '✓ OK'}`)

    if (desktopDeadSpace.total > 20 || mobileDeadSpace.total > 20) {
      console.log('\n❌ Issue #3: EXCESSIVE DEAD SPACE - THIS IS THE BUG!')
      console.log('\nCode to fix:')
      console.log('  - components/vnc/VNCViewer.tsx (lines 387-417)')
      console.log('  - Remove minHeight or adjust container flex/alignment')
    } else {
      console.log('\n✓ Issue #3: WORKING AS EXPECTED')
    }
  })

  test('Generate Final Report', async () => {
    console.log('\n========================================')
    console.log('DIAGNOSTIC REPORT COMPLETE')
    console.log('========================================\n')

    console.log('📸 Screenshots saved in: test-screenshots/')
    console.log('\nAll screenshots:')

    const screenshots = fs.readdirSync(screenshotsDir)
      .filter(f => f.startsWith('issue'))
      .sort()

    screenshots.forEach(file => {
      console.log(`  - ${file}`)
    })

    console.log('\n========================================')
    console.log('NEXT STEPS')
    console.log('========================================')
    console.log('1. Review screenshots in test-screenshots/ directory')
    console.log('2. Check code locations mentioned in each issue')
    console.log('3. Apply fixes based on diagnostic results')
    console.log('\nView screenshots with VNC viewer at http://localhost:6080')
  })
})
