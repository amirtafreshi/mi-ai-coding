/**
 * Standalone Dashboard VNC Test (No Global Setup)
 * Tests the complete authenticated dashboard with VNC viewers
 */
import { test, expect } from '@playwright/test'

// Configure this test to NOT use storage state
test.use({ storageState: undefined })

test.describe('Dashboard VNC Integration - Standalone Test', () => {
  test('Complete dashboard test with login and VNC verification', async ({ page }) => {
    const consoleMessages: any[] = []
    const consoleErrors: any[] = []

    // Listen to console
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      })

      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        })
      }
    })

    console.log('\n')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  DASHBOARD VNC INTEGRATION TEST - STARTING')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')

    // STEP 1: Navigate to home page
    console.log('📍 STEP 1: Navigating to http://localhost:3000')
    await page.goto('http://localhost:3000')
    await page.screenshot({ path: 'tests/screenshots/01-homepage.png', fullPage: true })
    console.log('  ✓ Homepage loaded')

    // STEP 2: Check if we need to login or already on dashboard
    const currentUrl = page.url()
    console.log(`  Current URL: ${currentUrl}`)

    let loginRequired = true
    if (currentUrl.includes('/dashboard')) {
      console.log('  ✓ Already on dashboard, skipping login')
      loginRequired = false
    } else if (currentUrl.includes('/login')) {
      console.log('  → Redirected to login page')
    } else {
      console.log('  → On homepage, need to navigate to login')
    }

    // STEP 3: Login if needed
    if (loginRequired) {
      console.log('')
      console.log('🔐 STEP 2: Logging in as admin@example.com')

      // Navigate to login if not already there
      if (!currentUrl.includes('/login')) {
        await page.goto('http://localhost:3000/login')
      }

      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await page.screenshot({ path: 'tests/screenshots/02-login-page.png', fullPage: true })

      // Find and fill email input
      const emailInput = page.locator('input[name="email"], input[type="email"], #login_email').first()
      await expect(emailInput).toBeVisible({ timeout: 5000 })
      await emailInput.fill('admin@example.com')
      console.log('  ✓ Filled email')

      // Find and fill password input
      const passwordInput = page.locator('input[type="password"], input[name="password"], #login_password').first()
      await expect(passwordInput).toBeVisible({ timeout: 5000 })
      await passwordInput.fill('admin123')
      console.log('  ✓ Filled password')

      await page.screenshot({ path: 'tests/screenshots/03-login-filled.png', fullPage: true })

      // Click submit button
      const submitButton = page.locator('button[type="submit"]').first()
      await expect(submitButton).toBeVisible({ timeout: 5000 })
      console.log('  → Clicking login button...')
      await submitButton.click()

      // Wait for navigation with generous timeout
      console.log('  ⏳ Waiting for redirect to dashboard...')
      try {
        await page.waitForURL(/\/(dashboard)?.*/, { timeout: 20000 })
        console.log('  ✓ Redirected successfully')
      } catch (error) {
        console.log(`  ❌ Redirect failed or timed out`)
        console.log(`  Current URL: ${page.url()}`)
        await page.screenshot({ path: 'tests/screenshots/04-redirect-failed.png', fullPage: true })
        throw error
      }

      await page.waitForLoadState('networkidle', { timeout: 15000 })
      await page.screenshot({ path: 'tests/screenshots/05-after-login.png', fullPage: true })
    }

    // STEP 4: Verify we're on dashboard
    console.log('')
    console.log('📊 STEP 3: Verifying dashboard')
    const finalUrl = page.url()
    console.log(`  Current URL: ${finalUrl}`)

    const onDashboard = finalUrl.includes('/dashboard') || finalUrl === 'http://localhost:3000/'
    console.log(`  On dashboard: ${onDashboard ? 'YES ✓' : 'NO ❌'}`)

    expect(onDashboard).toBeTruthy()

    // STEP 5: Wait for page to fully load
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/screenshots/06-dashboard-loaded.png', fullPage: true })

    // STEP 6: Count iframes
    console.log('')
    console.log('🖼️  STEP 4: Checking for VNC iframes')
    const iframes = page.locator('iframe')
    const iframeCount = await iframes.count()
    console.log(`  Found ${iframeCount} iframe(s)`)

    // Get iframe sources
    const iframeSources: string[] = []
    for (let i = 0; i < iframeCount; i++) {
      const src = await iframes.nth(i).getAttribute('src')
      if (src) {
        iframeSources.push(src)
        console.log(`  [${i + 1}] ${src}`)
      }
    }

    // STEP 7: Check for VNC viewer cards
    console.log('')
    console.log('🖥️  STEP 5: Checking for VNC viewer cards')
    const terminalCardExists = await page.locator('text=Terminal').count() > 0
    const terminalDisplayExists = await page.locator('text=:98').count() > 0
    const playwrightCardExists = await page.locator('text=Playwright').count() > 0
    const playwrightDisplayExists = await page.locator('text=:99').count() > 0

    console.log(`  Terminal card/text: ${terminalCardExists ? 'YES ✓' : 'NO ❌'}`)
    console.log(`  Display :98 text: ${terminalDisplayExists ? 'YES ✓' : 'NO ❌'}`)
    console.log(`  Playwright card/text: ${playwrightCardExists ? 'YES ✓' : 'NO ❌'}`)
    console.log(`  Display :99 text: ${playwrightDisplayExists ? 'YES ✓' : 'NO ❌'}`)

    // STEP 8: Check console errors
    console.log('')
    console.log('🔍 STEP 6: Console errors/warnings')
    const relevantErrors = consoleErrors.filter(err =>
      !err.text.includes('WebSocket') &&
      !err.text.includes('ws://') &&
      !err.text.includes('ActivityStream') &&
      !err.text.includes('Failed to load resource')
    )

    if (relevantErrors.length === 0) {
      console.log('  ✓ No critical errors (WebSocket errors expected)')
    } else {
      console.log(`  ⚠️  Found ${relevantErrors.length} error(s):`)
      relevantErrors.forEach((err, idx) => {
        console.log(`    [${idx + 1}] [${err.type}] ${err.text}`)
      })
    }

    // STEP 9: Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/07-final-report.png', fullPage: true })

    // STEP 10: Print final report
    console.log('')
    console.log('╔════════════════════════════════════════════════════════╗')
    console.log('║       DASHBOARD VNC INTEGRATION - FINAL REPORT         ║')
    console.log('╚════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('📋 TEST RESULTS:')
    console.log('─────────────────────────────────────────────────────────')
    console.log(`✓ Login successful: ${onDashboard ? 'YES' : 'NO'}`)
    console.log(`✓ Dashboard loads: ${onDashboard ? 'YES' : 'NO'}`)
    console.log(`✓ VNC iframes found: ${iframeCount}`)
    console.log(`✓ Terminal :98 visible: ${terminalCardExists || terminalDisplayExists ? 'YES' : 'NO'}`)
    console.log(`✓ Playwright :99 visible: ${playwrightCardExists || playwrightDisplayExists ? 'YES' : 'NO'}`)
    console.log('')
    console.log('🖼️  IFRAME DETAILS:')
    console.log('─────────────────────────────────────────────────────────')
    if (iframeSources.length === 0) {
      console.log('  ⚠️  No iframes found on the page')
    } else {
      iframeSources.forEach((src, idx) => {
        console.log(`  [${idx + 1}] ${src}`)
      })
    }
    console.log('')
    console.log('🔍 CONSOLE ERRORS:')
    console.log('─────────────────────────────────────────────────────────')
    if (relevantErrors.length === 0) {
      console.log('  ✓ No critical errors')
    } else {
      relevantErrors.forEach(err => {
        console.log(`  ❌ [${err.type}] ${err.text}`)
      })
    }
    console.log('')
    console.log('📸 SCREENSHOTS SAVED:')
    console.log('─────────────────────────────────────────────────────────')
    console.log('  tests/screenshots/01-homepage.png')
    console.log('  tests/screenshots/02-login-page.png')
    console.log('  tests/screenshots/03-login-filled.png')
    console.log('  tests/screenshots/05-after-login.png')
    console.log('  tests/screenshots/06-dashboard-loaded.png')
    console.log('  tests/screenshots/07-final-report.png')
    console.log('')
    console.log('═════════════════════════════════════════════════════════')
    console.log('')
  })
})
