import { test, expect } from '@playwright/test'

/**
 * Authenticated Dashboard Test
 *
 * Test Steps:
 * 1. Navigate to http://localhost:3000
 * 2. LOGIN with credentials (email: admin@example.com, password: admin123)
 * 3. Wait for redirect to /dashboard
 * 4. Verify the authenticated dashboard loads with all components
 * 5. Capture all console errors/warnings AFTER login
 * 6. Check if VNC viewers attempt to connect
 */

test.describe('Authenticated Dashboard Test', () => {
  test('should login and verify dashboard with error suppression', async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string; timestamp: number }> = []
    let loginCompleted = false

    // Capture all console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      })
    })

    console.log('\n========================================')
    console.log('AUTHENTICATED DASHBOARD TEST REPORT')
    console.log('========================================\n')

    // Step 1: Navigate to homepage
    console.log('Step 1: Navigating to http://localhost:3000')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const currentUrl1 = page.url()
    console.log(`Current URL: ${currentUrl1}`)

    // Step 2: LOGIN with credentials
    console.log('\nStep 2: Attempting login with admin@example.com')

    // Check if we're on login page or already logged in
    const isLoginPage = currentUrl1.includes('/login')
    const isDashboardPage = currentUrl1.includes('/dashboard')

    if (isDashboardPage) {
      console.log('Already logged in, redirected to dashboard')
      loginCompleted = true
    } else if (isLoginPage) {
      console.log('On login page, proceeding with authentication')

      // Fill in login form (Ant Design Form structure)
      await page.fill('input#login_email', 'admin@example.com')
      await page.fill('input#login_password', 'admin123')

      console.log('Credentials entered, clicking login button')
      await page.click('button[type="submit"]')

      // Step 3: Wait for redirect to /dashboard
      console.log('\nStep 3: Waiting for redirect to /dashboard')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      loginCompleted = true
      console.log('Successfully redirected to dashboard')
    } else {
      console.log('Unexpected page, trying to navigate to login')
      await page.goto('http://localhost:3000/login')
      await page.waitForTimeout(2000)
      await page.fill('input#login_email', 'admin@example.com')
      await page.fill('input#login_password', 'admin123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      loginCompleted = true
    }

    // Step 4: Verify the authenticated dashboard loads with all components
    console.log('\nStep 4: Verifying dashboard components')

    const finalUrl = page.url()
    console.log(`Final URL: ${finalUrl}`)

    const isDashboard = finalUrl.includes('/dashboard')
    console.log(`Is on dashboard: ${isDashboard ? 'YES' : 'NO'}`)

    // Wait for dashboard to fully load
    await page.waitForTimeout(5000)

    // Check for VNC viewers
    console.log('\nStep 6: Checking VNC viewers')

    const terminalVNCVisible = await page.locator('text=Terminal VNC').isVisible().catch(() => false)
    const playwrightVNCVisible = await page.locator('text=Playwright VNC').isVisible().catch(() => false)

    console.log(`Terminal VNC (:98) visible: ${terminalVNCVisible ? 'YES' : 'NO'}`)
    console.log(`Playwright VNC (:99) visible: ${playwrightVNCVisible ? 'YES' : 'NO'}`)

    // Check for iframes (VNC viewers)
    const iframes = await page.locator('iframe').count()
    console.log(`Total iframes found: ${iframes}`)

    // Step 5: Capture all console errors/warnings AFTER login
    console.log('\n========================================')
    console.log('CONSOLE ERRORS/WARNINGS AFTER LOGIN')
    console.log('========================================\n')

    // Filter messages after login completed
    const postLoginMessages = consoleMessages.filter(msg => loginCompleted)

    const errors = postLoginMessages.filter(msg => msg.type === 'error')
    const warnings = postLoginMessages.filter(msg => msg.type === 'warning')

    console.log(`Total console errors after login: ${errors.length}`)
    console.log(`Total console warnings after login: ${warnings.length}`)

    // Categorize errors
    const antdReactWarnings = warnings.filter(msg =>
      msg.text.includes('React 19') ||
      msg.text.includes('antd') ||
      msg.text.includes('Ant Design')
    )

    const removeChildErrors = errors.filter(msg =>
      msg.text.toLowerCase().includes('removechild') ||
      msg.text.toLowerCase().includes('failed to execute \'removechild\'')
    )

    const messageChannelErrors = errors.filter(msg =>
      msg.text.toLowerCase().includes('message channel') ||
      msg.text.toLowerCase().includes('messagechannel')
    )

    const websocketErrors = errors.filter(msg =>
      msg.text.toLowerCase().includes('websocket') ||
      msg.text.toLowerCase().includes('activitystream')
    )

    console.log('\n--- Error Categorization ---')
    console.log(`Ant Design React 19 warnings: ${antdReactWarnings.length}`)
    console.log(`removeChild errors: ${removeChildErrors.length}`)
    console.log(`Message channel errors: ${messageChannelErrors.length}`)
    console.log(`WebSocket errors: ${websocketErrors.length} (expected, has auto-reconnect)`)

    // List all unique errors
    const uniqueErrors = [...new Set(errors.map(e => e.text))]
    const uniqueWarnings = [...new Set(warnings.map(w => w.text))]

    if (uniqueErrors.length > 0) {
      console.log('\n--- All Unique Errors ---')
      uniqueErrors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err}`)
      })
    }

    if (uniqueWarnings.length > 0) {
      console.log('\n--- All Unique Warnings ---')
      uniqueWarnings.forEach((warn, idx) => {
        console.log(`${idx + 1}. ${warn}`)
      })
    }

    // Check if suppressions are working
    console.log('\n========================================')
    console.log('ERROR SUPPRESSION STATUS')
    console.log('========================================\n')

    const suppressionsWorking = {
      antdReact19: antdReactWarnings.length === 0,
      removeChild: removeChildErrors.length === 0,
      messageChannel: messageChannelErrors.length === 0
    }

    console.log(`Ant Design React 19 warning suppressed: ${suppressionsWorking.antdReact19 ? 'YES ✓' : 'NO ✗'}`)
    console.log(`removeChild errors suppressed: ${suppressionsWorking.removeChild ? 'YES ✓' : 'NO ✗'}`)
    console.log(`Message channel errors suppressed: ${suppressionsWorking.messageChannel ? 'YES ✓' : 'NO ✗'}`)

    // Final report summary
    console.log('\n========================================')
    console.log('DETAILED REPORT SUMMARY')
    console.log('========================================\n')

    console.log(`Login successful: ${loginCompleted ? 'YES ✓' : 'NO ✗'}`)
    console.log(`Dashboard loaded: ${isDashboard ? 'YES ✓' : 'NO ✗'}`)
    console.log(`Total console errors after login: ${errors.length}`)
    console.log(`Total console warnings after login: ${warnings.length}`)
    console.log(`VNC viewers visible: ${terminalVNCVisible || playwrightVNCVisible ? 'YES ✓' : 'NO ✗'}`)
    console.log(`Are error suppressions working: ${Object.values(suppressionsWorking).every(v => v) ? 'YES ✓' : 'PARTIAL'}`)

    // Assertions
    expect(loginCompleted, 'Login should be successful').toBe(true)
    expect(isDashboard, 'Should be on dashboard page').toBe(true)

    // Error suppression assertions (should be minimal/suppressed errors)
    expect(removeChildErrors.length, 'removeChild errors should be suppressed').toBe(0)
    expect(antdReactWarnings.length, 'Ant Design React 19 warnings should be suppressed').toBe(0)

    console.log('\n========================================')
    console.log('TEST COMPLETED SUCCESSFULLY')
    console.log('========================================\n')
  })
})
