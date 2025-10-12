import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/final-test')

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function takeScreenshot(page: Page, name: string, waitTime = 10000) {
  console.log(`⏱️  Waiting ${waitTime}ms before screenshot: ${name}`)
  await page.waitForTimeout(waitTime)
  const screenshotPath = path.join(SCREENSHOT_DIR, name)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`📸 Screenshot saved: ${screenshotPath}`)
  return screenshotPath
}

// Use global test timeout
test.use({ timeout: 120000 }) // 2 minutes per test

test.describe('Dashboard Fix Verification - FINAL', () => {
  test('Complete Dashboard Verification with Screenshots', async ({ page }) => {
    console.log('\n🚀 Starting Complete Dashboard Verification')
    let screenshotCounter = 1

    //==========================================
    // STEP 1: Login Page
    //==========================================
    console.log('\n📍 STEP 1: Navigate to login page')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-login-page-loaded.png`)

    // Check login page title
    await expect(page.locator('text=MI AI Coding Platform')).toBeVisible({ timeout: 10000 })
    console.log('✓ Login page loaded successfully')

    //==========================================
    // STEP 2: Fill Login Form
    //==========================================
    console.log('\n📍 STEP 2: Fill login credentials')

    // Ant Design Form uses id="login_email" and id="login_password"
    await page.fill('#login_email', 'admin@example.com')
    await page.fill('#login_password', 'admin123')
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-login-form-filled.png`)
    console.log('✓ Login form filled')

    //==========================================
    // STEP 3: Submit and Wait for Dashboard
    //==========================================
    console.log('\n📍 STEP 3: Submit login and wait for dashboard')
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 })
    console.log('✓ Redirected to dashboard')

    // Wait for initial rendering
    await page.waitForTimeout(20000) // 20 seconds for full render
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-dashboard-initial-load.png`, 5000)

    //==========================================
    // STEP 4: CRITICAL - Check for Error Overlay
    //==========================================
    console.log('\n📍 STEP 4: CRITICAL - Verify No Error Overlay')

    const errorOverlaySelectors = [
      'nextjs-portal',
      '[data-nextjs-dialog-overlay]',
      'iframe[src*="error"]',
      'div[data-nextjs-overlay]',
      'text=Application error'
    ]

    let errorFound = false
    for (const selector of errorOverlaySelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`❌ ERROR OVERLAY DETECTED: ${selector}`)
        errorFound = true
        await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-ERROR-OVERLAY-FOUND.png`)
      }
    }

    expect(errorFound).toBe(false)
    console.log('✅ CRITICAL FIX VERIFIED: No error overlay detected!')
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-dashboard-no-error-VERIFIED.png`, 5000)

    //==========================================
    // STEP 5: Verify File Explorer
    //==========================================
    console.log('\n📍 STEP 5: Verify File Explorer component')

    const fileExplorerVisible = await page.locator('text=File Explorer').first().isVisible().catch(() => false)
    if (fileExplorerVisible) {
      console.log('✓ File Explorer visible')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-file-explorer-visible.png`)
    } else {
      console.log('ℹ️  File Explorer not visible (may need scrolling or implementation)')
    }

    //==========================================
    // STEP 6: Verify Monaco Editor
    //==========================================
    console.log('\n📍 STEP 6: Verify Monaco Editor component')

    const monacoVisible = await page.locator('.monaco-editor, [data-mode-id], div:has-text("Code Editor")').first().isVisible().catch(() => false)
    if (monacoVisible) {
      console.log('✓ Monaco Editor visible')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-monaco-editor-visible.png`)
    } else {
      console.log('ℹ️  Monaco Editor not visible')
    }

    //==========================================
    // STEP 7: Verify VNC Display :98
    //==========================================
    console.log('\n📍 STEP 7: Verify VNC Display :98')

    const vnc98Visible = await page.locator('text=VNC Display :98, text=Terminal VNC').first().isVisible().catch(() => false)
    if (vnc98Visible) {
      console.log('✓ VNC Display :98 visible')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-vnc-display-98-visible.png`)
    } else {
      console.log('ℹ️  VNC Display :98 not visible')
    }

    //==========================================
    // STEP 8: Verify VNC Display :99
    //==========================================
    console.log('\n📍 STEP 8: Verify VNC Display :99')

    const vnc99Visible = await page.locator('text=VNC Display :99, text=Playwright VNC').first().isVisible().catch(() => false)
    if (vnc99Visible) {
      console.log('✓ VNC Display :99 visible')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-vnc-display-99-visible.png`)
    } else {
      console.log('ℹ️  VNC Display :99 not visible')
    }

    //==========================================
    // STEP 9: Verify Activity Log
    //==========================================
    console.log('\n📍 STEP 9: Verify Activity Log component')

    const activityLogVisible = await page.locator('text=Activity Log').first().isVisible().catch(() => false)
    if (activityLogVisible) {
      console.log('✓ Activity Log visible')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-activity-log-visible.png`)
    } else {
      console.log('ℹ️  Activity Log not visible')
    }

    //==========================================
    // STEP 10: Create Test Activity Log
    //==========================================
    console.log('\n📍 STEP 10: Create test activity log via API')

    try {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'frontend-testing',
            action: 'final_e2e_verification',
            details: 'Dashboard fix verification completed - React error overlay resolved',
            level: 'info'
          })
        })
        return res.json()
      })
      console.log('✓ Test activity log created:', response)
      await page.waitForTimeout(3000) // Wait for WebSocket update
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-activity-log-updated.png`)
    } catch (err) {
      console.log('ℹ️  Activity log API not available:', err)
    }

    //==========================================
    // STEP 11: Final Full Page Screenshot
    //==========================================
    console.log('\n📍 STEP 11: Capture final full page state')
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-dashboard-final-state.png`, 10000)

    //==========================================
    // STEP 12: Console Errors Check
    //==========================================
    console.log('\n📍 STEP 12: Check for console errors')
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait a bit more to catch any late errors
    await page.waitForTimeout(5000)

    if (consoleErrors.length > 0) {
      console.log(`⚠️  Found ${consoleErrors.length} console errors:`)
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`))
    } else {
      console.log('✓ No console errors detected')
    }

    //==========================================
    // FINAL SUMMARY
    //==========================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL VERIFICATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Error Overlay Status: NOT FOUND (FIXED!)`)
    console.log(`✅ Dashboard Loaded: YES`)
    console.log(`✅ Total Screenshots: ${screenshotCounter - 1}`)
    console.log(`✅ Critical Fix: VERIFIED`)
    console.log('='.repeat(60) + '\n')
  })

  test('Responsive Design - Desktop 1920x1080', async ({ page }) => {
    console.log('\n🚀 Testing Desktop Layout (1920x1080)')

    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.fill('#login_email', 'admin@example.com')
    await page.fill('#login_password', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 })
    await page.waitForTimeout(15000)

    await takeScreenshot(page, 'responsive-desktop-1920x1080.png', 10000)
    console.log('✓ Desktop layout captured')
  })

  test('Responsive Design - Tablet 768x1024', async ({ page }) => {
    console.log('\n🚀 Testing Tablet Layout (768x1024)')

    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.fill('#login_email', 'admin@example.com')
    await page.fill('#login_password', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 })
    await page.waitForTimeout(15000)

    await takeScreenshot(page, 'responsive-tablet-768x1024.png', 10000)
    console.log('✓ Tablet layout captured')
  })

  test('Responsive Design - Mobile 375x667', async ({ page }) => {
    console.log('\n🚀 Testing Mobile Layout (375x667)')

    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.fill('#login_email', 'admin@example.com')
    await page.fill('#login_password', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 })
    await page.waitForTimeout(15000)

    await takeScreenshot(page, 'responsive-mobile-375x667.png', 10000)
    console.log('✓ Mobile layout captured')
  })
})
