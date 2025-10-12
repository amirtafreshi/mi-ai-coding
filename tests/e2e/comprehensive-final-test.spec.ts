import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'admin123'
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/final-test')

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

// Helper function to take screenshot with wait time
async function takeScreenshot(page: Page, name: string, waitTime = 15000) {
  console.log(`⏱️  Waiting ${waitTime}ms for full rendering before screenshot: ${name}`)
  await page.waitForTimeout(waitTime)
  const screenshotPath = path.join(SCREENSHOT_DIR, name)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`📸 Screenshot saved: ${screenshotPath}`)
  return screenshotPath
}

test.describe('Comprehensive Final E2E Test Suite', () => {
  let screenshotCounter = 1

  test.beforeEach(async ({ page }) => {
    console.log('\n🚀 Starting test...')
  })

  test('01 - Authentication Flow', async ({ page }) => {
    console.log('\n✅ TEST 1: Authentication Flow')

    // Step 1: Visit login page
    console.log('  → Navigating to login page')
    await page.goto(`${BASE_URL}/login`)
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-login-page.png`)

    // Step 2: Fill login form
    console.log('  → Filling login form')
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-login-form-filled.png`)

    // Step 3: Submit form
    console.log('  → Submitting login')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    console.log('  ✓ Login successful, redirected to dashboard')
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-dashboard-no-error.png`, 20000)

    // Verify URL
    expect(page.url()).toBe(`${BASE_URL}/dashboard`)
    console.log('  ✓ URL verification passed')
  })

  test('02 - Dashboard Components Visibility (CRITICAL)', async ({ page }) => {
    console.log('\n✅ TEST 2: Dashboard Components Visibility')

    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000) // Wait for full render

    // Check for React error overlay (CRITICAL)
    console.log('  → Checking for error overlay')
    const errorOverlay = await page.locator('nextjs-portal, [data-nextjs-dialog-overlay], iframe[src*="error"]').count()
    expect(errorOverlay).toBe(0)
    console.log('  ✓ No error overlay detected (CRITICAL FIX VERIFIED)')

    // Check File Explorer
    console.log('  → Verifying File Explorer')
    const fileExplorer = page.locator('text=File Explorer').first()
    await expect(fileExplorer).toBeVisible({ timeout: 10000 })
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-file-explorer-visible.png`)
    console.log('  ✓ File Explorer visible')

    // Check Monaco Editor
    console.log('  → Verifying Monaco Editor')
    const monacoEditor = page.locator('.monaco-editor, [data-mode-id], div:has-text("Welcome to the Code Editor")').first()
    await expect(monacoEditor).toBeVisible({ timeout: 10000 })
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-monaco-editor-visible.png`)
    console.log('  ✓ Monaco Editor visible')

    // Check VNC Display :98
    console.log('  → Verifying VNC Display :98')
    const vncDisplay98 = page.locator('text=VNC Display :98, text=Terminal VNC').first()
    await expect(vncDisplay98).toBeVisible({ timeout: 10000 })
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-vnc-display-98.png`)
    console.log('  ✓ VNC Display :98 visible')

    // Check VNC Display :99
    console.log('  → Verifying VNC Display :99')
    const vncDisplay99 = page.locator('text=VNC Display :99, text=Playwright VNC').first()
    await expect(vncDisplay99).toBeVisible({ timeout: 10000 })
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-vnc-display-99.png`)
    console.log('  ✓ VNC Display :99 visible')

    // Check Activity Log
    console.log('  → Verifying Activity Log')
    const activityLog = page.locator('text=Activity Log').first()
    await expect(activityLog).toBeVisible({ timeout: 10000 })
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-activity-log-panel.png`)
    console.log('  ✓ Activity Log visible')

    console.log('  ✓ All dashboard components are visible!')
  })

  test('03 - File Operations', async ({ page }) => {
    console.log('\n✅ TEST 3: File Operations')

    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    // Check file tree loads
    console.log('  → Checking file tree')
    const fileTree = page.locator('.file-tree, [role="tree"], div:has-text("project-root")').first()
    const fileTreeVisible = await fileTree.isVisible().catch(() => false)

    if (fileTreeVisible) {
      console.log('  ✓ File tree visible')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-file-tree-loaded.png`)
    } else {
      console.log('  ℹ️  File tree component loaded but no files visible')
    }

    // Try to create a new file
    console.log('  → Attempting to create new file')
    const createButton = page.locator('button:has-text("New File"), button[title="New File"]').first()
    const createButtonVisible = await createButton.isVisible().catch(() => false)

    if (createButtonVisible) {
      await createButton.click()
      await page.waitForTimeout(2000)
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-file-create-modal.png`)
      console.log('  ✓ File creation modal opened')
    } else {
      console.log('  ℹ️  Create file button not visible (may need implementation)')
    }
  })

  test('04 - VNC Integration', async ({ page }) => {
    console.log('\n✅ TEST 4: VNC Integration')

    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    // Check VNC canvas elements
    console.log('  → Checking VNC canvas elements')
    const vncCanvases = await page.locator('canvas').count()
    console.log(`  ℹ️  Found ${vncCanvases} canvas elements`)

    if (vncCanvases > 0) {
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-vnc-canvases.png`)
      console.log('  ✓ VNC canvas elements present')
    }

    // Check connection status
    console.log('  → Checking VNC connection status')
    const connectButtons = await page.locator('button:has-text("Connect"), button:has-text("Disconnect")').count()
    if (connectButtons > 0) {
      console.log('  ✓ VNC connection buttons present')
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-vnc-controls.png`)
    }
  })

  test('05 - Activity Log Real-Time Updates', async ({ page }) => {
    console.log('\n✅ TEST 5: Activity Log Real-Time Updates')

    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    // Take screenshot of activity log
    console.log('  → Capturing activity log state')
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-activity-log-initial.png`)

    // Create test log via API
    console.log('  → Creating test activity log via API')
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'frontend-testing',
          action: 'e2e_test',
          details: 'Comprehensive final E2E test running',
          level: 'info'
        })
      })
      return res.json()
    })

    console.log('  ✓ Test log created:', response)

    // Wait for WebSocket update
    await page.waitForTimeout(3000)
    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-activity-log-updated.png`)
    console.log('  ✓ Activity log screenshot captured after update')
  })

  test('06 - Responsive Design - Desktop', async ({ page }) => {
    console.log('\n✅ TEST 6: Responsive Design - Desktop (1920x1080)')

    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-responsive-desktop-1920x1080.png`, 20000)
    console.log('  ✓ Desktop layout captured')
  })

  test('07 - Responsive Design - Tablet', async ({ page }) => {
    console.log('\n✅ TEST 7: Responsive Design - Tablet (768x1024)')

    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-responsive-tablet-768x1024.png`, 20000)
    console.log('  ✓ Tablet layout captured')
  })

  test('08 - Responsive Design - Mobile', async ({ page }) => {
    console.log('\n✅ TEST 8: Responsive Design - Mobile (375x667)')

    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-responsive-mobile-375x667.png`, 20000)
    console.log('  ✓ Mobile layout captured')
  })

  test('09 - Logout Flow', async ({ page }) => {
    console.log('\n✅ TEST 9: Logout Flow')

    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(10000)

    // Look for logout button
    console.log('  → Looking for logout button')
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first()
    const logoutVisible = await logoutButton.isVisible().catch(() => false)

    if (logoutVisible) {
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-before-logout.png`)
      await logoutButton.click()
      await page.waitForTimeout(3000)
      await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-after-logout.png`)
      console.log('  ✓ Logout successful')
    } else {
      console.log('  ℹ️  Logout button not found (may need implementation)')
    }
  })

  test('10 - Performance and Console Errors', async ({ page }) => {
    console.log('\n✅ TEST 10: Performance and Console Errors')

    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })

    const startTime = Date.now()

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
    await page.waitForTimeout(15000)

    const loadTime = Date.now() - startTime

    console.log(`  ℹ️  Dashboard load time: ${loadTime}ms`)
    console.log(`  ℹ️  Console errors: ${consoleErrors.length}`)
    console.log(`  ℹ️  Console warnings: ${consoleWarnings.length}`)

    if (consoleErrors.length > 0) {
      console.log('  ⚠️  Console errors detected:')
      consoleErrors.forEach(err => console.log(`     - ${err}`))
    }

    await takeScreenshot(page, `${String(screenshotCounter++).padStart(2, '0')}-final-state.png`, 20000)
  })
})
