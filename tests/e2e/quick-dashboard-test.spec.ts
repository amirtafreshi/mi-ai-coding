import { test, expect } from '@playwright/test'

test.describe('Quick Dashboard Verification', () => {
  test.setTimeout(60000) // 1 minute timeout

  test('complete dashboard verification after NextAuth fix', async ({ page }) => {
    const results = {
      loginSuccess: false,
      dashboardLoaded: false,
      noErrorOverlay: false,
      headerVisible: false,
      componentCount: 0,
      consoleErrors: [] as string[]
    }

    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore expected WebSocket errors
        if (!text.includes('WebSocket') && !text.includes('ws://')) {
          results.consoleErrors.push(text)
        }
      }
    })

    try {
      // Step 1: Navigate to login
      console.log('1. Navigating to login page...')
      await page.goto('http://localhost:3000/login', { timeout: 15000 })
      await page.waitForSelector('input[type="email"], input[placeholder*="email"]', { timeout: 10000 })

      // Step 2: Login
      console.log('2. Logging in...')
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first()
      const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first()
      await emailInput.fill('admin@example.com')
      await passwordInput.fill('admin123')
      await page.click('button:has-text("Sign In")')

      // Step 3: Wait for dashboard
      console.log('3. Waiting for dashboard...')
      await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })
      results.loginSuccess = true
      results.dashboardLoaded = true

      await page.waitForTimeout(2000) // Wait for components to render

      // Step 4: Check for error overlay
      console.log('4. Checking for error overlay...')
      const errorOverlay = await page.locator('.nextjs-error-overlay, [class*="error"]').count()
      results.noErrorOverlay = errorOverlay === 0

      // Step 5: Verify header
      console.log('5. Verifying header...')
      const header = page.locator('header, [role="banner"], .ant-layout-header')
      results.headerVisible = await header.first().isVisible().catch(() => false)

      // Step 6: Count components
      console.log('6. Counting visible components...')
      const components = [
        'text=/File Explorer|Files/',
        'text=/Code Editor|Editor/',
        'text=/Terminal|:98/',
        'text=/Playwright|:99/',
        'text=/Activity|Log/',
        'aside, nav'
      ]

      for (const selector of components) {
        const visible = await page.locator(selector).first().isVisible().catch(() => false)
        if (visible) results.componentCount++
      }

      // Step 7: Take screenshot
      console.log('7. Taking screenshot...')
      await page.screenshot({
        path: 'test-results/quick-dashboard-verification.png',
        fullPage: true
      })

      // Print results
      console.log('\n========================================')
      console.log('DASHBOARD VERIFICATION RESULTS')
      console.log('========================================')
      console.log('Login Success:', results.loginSuccess ? '✓' : '✗')
      console.log('Dashboard Loaded:', results.dashboardLoaded ? '✓' : '✗')
      console.log('No Error Overlay:', results.noErrorOverlay ? '✓' : '✗')
      console.log('Header Visible:', results.headerVisible ? '✓' : '✗')
      console.log('Visible Components:', results.componentCount, '/ 6')
      console.log('Console Errors:', results.consoleErrors.length)

      if (results.consoleErrors.length > 0) {
        console.log('\nConsole Errors:')
        results.consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`))
      }

      console.log('\nScreenshot saved to: test-results/quick-dashboard-verification.png')
      console.log('========================================\n')

      // Assertions
      expect(results.loginSuccess, 'Login should succeed').toBe(true)
      expect(results.dashboardLoaded, 'Dashboard should load').toBe(true)
      expect(results.noErrorOverlay, 'No error overlay should be present').toBe(true)
      expect(results.headerVisible, 'Header should be visible').toBe(true)
      expect(results.componentCount, 'At least 3 components should be visible').toBeGreaterThanOrEqual(3)

    } catch (error) {
      console.error('Test failed:', error)

      // Take screenshot on failure
      await page.screenshot({
        path: 'test-results/quick-dashboard-verification-FAILED.png',
        fullPage: true
      })

      throw error
    }
  })

  test('verify NextAuth session endpoint works', async ({ page }) => {
    console.log('\n========================================')
    console.log('NextAuth Session Endpoint Check')
    console.log('========================================')

    const response = await page.goto('http://localhost:3000/api/auth/session')
    const status = response?.status()
    const body = await response?.text()

    console.log('Status:', status)
    console.log('Response:', body)
    console.log('NextAuth Session Endpoint:', status === 200 ? '✓ Working' : '✗ Failed')
    console.log('========================================\n')

    expect(status).toBe(200)
  })
})
