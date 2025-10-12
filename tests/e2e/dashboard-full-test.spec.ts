import { test, expect } from '@playwright/test'

test.describe('Dashboard Full Authentication Flow E2E Test', () => {
  test('Complete flow: Login → Dashboard → VNC Viewers → Console Check', async ({ page }) => {
    const consoleMessages: any[] = []
    const consoleErrors: any[] = []

    // Listen to console from the start
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      })

      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        })
      }
    })

    // STEP 1: Navigate to home page
    console.log('Step 1: Navigating to http://localhost:3000')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Take screenshot of landing page
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/01-landing-page.png',
      fullPage: true
    })
    console.log('✓ Landing page loaded')

    // STEP 2: Click "Sign In" button to go to login
    console.log('Step 2: Clicking Sign In button')
    const signInButton = page.locator('text=Sign In').first()
    await signInButton.click()
    await page.waitForURL('**/login', { timeout: 10000 })
    await page.waitForTimeout(1000)

    // Take screenshot of login page
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/02-login-page.png',
      fullPage: true
    })
    console.log('✓ Login page loaded')

    // STEP 3: Fill in login credentials
    console.log('Step 3: Filling login form with admin@example.com / admin123')

    // Wait for form to be visible
    await page.waitForSelector('input[id="login_email"]', { timeout: 10000 })

    // Fill email
    await page.fill('input[id="login_email"]', 'admin@example.com')

    // Fill password
    await page.fill('input[id="login_password"]', 'admin123')

    // Take screenshot before submit
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/03-login-filled.png',
      fullPage: true
    })
    console.log('✓ Login form filled')

    // STEP 4: Submit login form
    console.log('Step 4: Submitting login form')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(2000)

    console.log('✓ Redirected to dashboard')

    // STEP 5: Verify we're on dashboard
    const currentUrl = page.url()
    const loginSuccessful = currentUrl.includes('/dashboard')
    console.log(`✓ Login successful: ${loginSuccessful}`)
    console.log(`  Current URL: ${currentUrl}`)

    // Take screenshot of dashboard
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/04-dashboard-loaded.png',
      fullPage: true
    })

    // STEP 6: Check for VNC viewer iframes
    console.log('Step 5: Checking for VNC viewer iframes')
    const iframes = page.locator('iframe')
    const iframeCount = await iframes.count()
    console.log(`✓ Found ${iframeCount} iframe(s)`)

    // Get iframe sources
    const iframeSources: string[] = []
    for (let i = 0; i < iframeCount; i++) {
      const src = await iframes.nth(i).getAttribute('src')
      if (src) {
        iframeSources.push(src)
        console.log(`  Iframe ${i + 1}: ${src}`)
      }
    }

    // STEP 7: Check for VNC cards
    console.log('Step 6: Checking for VNC viewer cards')
    const terminalCardVisible = await page.locator('text=Terminal').first().isVisible().catch(() => false)
    const playwrightCardVisible = await page.locator('text=Playwright').first().isVisible().catch(() => false)
    console.log(`  Terminal card visible: ${terminalCardVisible}`)
    console.log(`  Playwright card visible: ${playwrightCardVisible}`)

    // STEP 8: Wait a bit more for any delayed console messages
    await page.waitForTimeout(3000)

    // Take final screenshot
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/05-final-dashboard.png',
      fullPage: true
    })

    // STEP 9: Filter console errors (ignore WebSocket errors as expected)
    const relevantErrors = consoleErrors.filter(err =>
      !err.text.includes('WebSocket') &&
      !err.text.includes('ws://') &&
      !err.text.includes('wss://') &&
      !err.text.includes('ActivityStream') &&
      !err.text.includes('Failed to fetch') &&
      !err.text.toLowerCase().includes('websocket')
    )

    // Print comprehensive report
    console.log('\n')
    console.log('═══════════════════════════════════════════════════════════════════════════')
    console.log('                  DASHBOARD E2E TEST - COMPREHENSIVE REPORT                ')
    console.log('═══════════════════════════════════════════════════════════════════════════')
    console.log('')
    console.log('TEST RESULTS:')
    console.log('─────────────────────────────────────────────────────────────────────────')
    console.log(`  ✓ Login successful: ${loginSuccessful ? 'YES' : 'NO'}`)
    console.log(`  ✓ Dashboard loaded: ${loginSuccessful ? 'YES' : 'NO'}`)
    console.log(`  ✓ Current URL: ${currentUrl}`)
    console.log(`  ✓ VNC iframes found: ${iframeCount}`)
    console.log(`  ✓ Terminal card visible: ${terminalCardVisible ? 'YES' : 'NO'}`)
    console.log(`  ✓ Playwright card visible: ${playwrightCardVisible ? 'YES' : 'NO'}`)
    console.log('')
    console.log('IFRAME DETAILS:')
    console.log('─────────────────────────────────────────────────────────────────────────')
    if (iframeSources.length === 0) {
      console.log('  ⚠️  No iframes found on the page')
    } else {
      iframeSources.forEach((src, idx) => {
        console.log(`  [${idx + 1}] ${src}`)
      })
    }
    console.log('')
    console.log('CONSOLE ERRORS/WARNINGS:')
    console.log('─────────────────────────────────────────────────────────────────────────')
    console.log(`  Total console messages: ${consoleMessages.length}`)
    console.log(`  Total errors/warnings: ${consoleErrors.length}`)
    console.log(`  Filtered errors (excluding WebSocket): ${relevantErrors.length}`)
    console.log('')
    if (relevantErrors.length === 0) {
      console.log('  ✓ No critical errors (WebSocket reconnection attempts are expected)')
    } else {
      console.log('  Critical errors found:')
      relevantErrors.forEach((err, idx) => {
        console.log(`    ${idx + 1}. [${err.type.toUpperCase()}] ${err.text}`)
      })
    }
    console.log('')
    console.log('SCREENSHOTS SAVED:')
    console.log('─────────────────────────────────────────────────────────────────────────')
    console.log('  1. /home/master/projects/mi-ai-coding/test-screenshots/01-landing-page.png')
    console.log('  2. /home/master/projects/mi-ai-coding/test-screenshots/02-login-page.png')
    console.log('  3. /home/master/projects/mi-ai-coding/test-screenshots/03-login-filled.png')
    console.log('  4. /home/master/projects/mi-ai-coding/test-screenshots/04-dashboard-loaded.png')
    console.log('  5. /home/master/projects/mi-ai-coding/test-screenshots/05-final-dashboard.png')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════════════════════')
    console.log('')

    // Assertions for test pass/fail
    expect(loginSuccessful, 'Should be on dashboard after login').toBeTruthy()
    expect(iframeCount, 'Should have at least 1 iframe for VNC viewers').toBeGreaterThanOrEqual(1)
  })
})
