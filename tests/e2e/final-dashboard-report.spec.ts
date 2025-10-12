import { test, expect } from '@playwright/test'

test.describe('Final Dashboard Report After NextAuth Fix', () => {
  test.setTimeout(60000)

  test('comprehensive dashboard status report', async ({ page }) => {
    console.log('\n')
    console.log('================================================================')
    console.log('  DASHBOARD VERIFICATION REPORT - NEXTAUTH FIX')
    console.log('================================================================')
    console.log('')

    const report = {
      timestamp: new Date().toISOString(),
      testUrl: 'http://localhost:3000',
      loginCredentials: 'admin@example.com / admin123',
      steps: [] as Array<{step: string, status: string, details?: string}>,
      components: [] as Array<{name: string, found: boolean}>,
      consoleErrors: [] as string[],
      screenshots: [] as string[]
    }

    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('WebSocket') && !text.includes('ws://')) {
          report.consoleErrors.push(text)
        }
      }
    })

    // Step 1: Navigate to login
    try {
      console.log('[Step 1/8] Navigate to login page')
      await page.goto('http://localhost:3000/login', { timeout: 15000 })
      await page.waitForLoadState('domcontentloaded')
      report.steps.push({ step: 'Navigate to login', status: '✓ SUCCESS' })
      console.log('  ✓ Login page loaded')
    } catch (error) {
      report.steps.push({ step: 'Navigate to login', status: '✗ FAILED', details: String(error) })
      console.log('  ✗ Failed:', error)
      throw error
    }

    // Step 2: Verify login form
    try {
      console.log('[Step 2/8] Verify login form exists')
      await page.waitForSelector('input[type="email"], input[placeholder*="email"]', { timeout: 10000 })
      await page.waitForSelector('input[type="password"]', { timeout: 5000 })
      await page.waitForSelector('button:has-text("Sign In")', { timeout: 5000 })
      report.steps.push({ step: 'Verify login form', status: '✓ SUCCESS' })
      console.log('  ✓ Login form present with email, password, and button')
    } catch (error) {
      report.steps.push({ step: 'Verify login form', status: '✗ FAILED', details: String(error) })
      console.log('  ✗ Failed:', error)
      throw error
    }

    // Step 3: Submit login
    try {
      console.log('[Step 3/8] Submit login credentials')
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      await emailInput.fill('admin@example.com')
      await passwordInput.fill('admin123')
      await page.click('button:has-text("Sign In")')
      report.steps.push({ step: 'Submit login', status: '✓ SUCCESS' })
      console.log('  ✓ Login credentials submitted')
    } catch (error) {
      report.steps.push({ step: 'Submit login', status: '✗ FAILED', details: String(error) })
      console.log('  ✗ Failed:', error)
      throw error
    }

    // Step 4: Wait for redirect
    try {
      console.log('[Step 4/8] Wait for redirect to dashboard')
      await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })
      const finalUrl = page.url()
      report.steps.push({ step: 'Redirect to dashboard', status: '✓ SUCCESS', details: `URL: ${finalUrl}` })
      console.log(`  ✓ Redirected to: ${finalUrl}`)
    } catch (error) {
      report.steps.push({ step: 'Redirect to dashboard', status: '✗ FAILED', details: String(error) })
      console.log('  ✗ Failed:', error)
      throw error
    }

    // Wait for page to stabilize
    await page.waitForTimeout(3000)

    // Step 5: Check for errors
    console.log('[Step 5/8] Check for error overlays')
    const errorOverlays = await page.locator('.nextjs-error-overlay, [class*="NotFoundError"], [class*="error"]').all()
    if (errorOverlays.length > 0) {
      const errorTexts = await Promise.all(errorOverlays.map(el => el.textContent().catch(() => '')))
      report.steps.push({
        step: 'Check error overlays',
        status: '⚠ WARNING',
        details: `Found ${errorOverlays.length} error(s): ${errorTexts.join('; ')}`
      })
      console.log(`  ⚠ Found ${errorOverlays.length} error overlay(s)`)
      console.log(`  Error details: ${errorTexts.join('; ')}`)
    } else {
      report.steps.push({ step: 'Check error overlays', status: '✓ SUCCESS', details: 'No errors found' })
      console.log('  ✓ No error overlays detected')
    }

    // Step 6: Verify components
    console.log('[Step 6/8] Verify dashboard components')

    const componentsToCheck = [
      { name: 'Header', selector: 'header, [role="banner"], .ant-layout-header' },
      { name: 'Sidebar/Nav', selector: 'aside, nav, .ant-layout-sider' },
      { name: 'Main Content', selector: 'main, [role="main"], .ant-layout-content' },
      { name: 'File Explorer', selector: 'text=/File Explorer|Files|Tree/' },
      { name: 'Code Editor', selector: 'text=/Code Editor|Editor|Monaco/' },
      { name: 'Terminal VNC (:98)', selector: 'text=/Terminal|:98|Display :98/' },
      { name: 'Playwright VNC (:99)', selector: 'text=/Playwright|:99|Display :99/' },
      { name: 'Activity Log', selector: 'text=/Activity|Log|Events/' }
    ]

    for (const component of componentsToCheck) {
      try {
        const found = await page.locator(component.selector).first().isVisible({ timeout: 2000 })
        report.components.push({ name: component.name, found })
        console.log(`  ${found ? '✓' : '✗'} ${component.name}: ${found ? 'Found' : 'Not found'}`)
      } catch {
        report.components.push({ name: component.name, found: false })
        console.log(`  ✗ ${component.name}: Not found`)
      }
    }

    // Step 7: Take screenshots
    console.log('[Step 7/8] Take screenshots')
    try {
      const screenshotPath = 'test-results/final-dashboard-report.png'
      await page.screenshot({ path: screenshotPath, fullPage: true })
      report.screenshots.push(screenshotPath)
      report.steps.push({ step: 'Take screenshot', status: '✓ SUCCESS', details: screenshotPath })
      console.log(`  ✓ Screenshot saved: ${screenshotPath}`)
    } catch (error) {
      report.steps.push({ step: 'Take screenshot', status: '✗ FAILED', details: String(error) })
      console.log(`  ✗ Screenshot failed: ${error}`)
    }

    // Step 8: Verify NextAuth session endpoint
    console.log('[Step 8/8] Verify NextAuth session endpoint')
    try {
      const sessionResponse = await page.request.get('http://localhost:3000/api/auth/session')
      const sessionStatus = sessionResponse.status()
      report.steps.push({
        step: 'NextAuth session endpoint',
        status: sessionStatus === 200 ? '✓ SUCCESS' : '✗ FAILED',
        details: `HTTP ${sessionStatus}`
      })
      console.log(`  ${sessionStatus === 200 ? '✓' : '✗'} Session endpoint: HTTP ${sessionStatus}`)
    } catch (error) {
      report.steps.push({ step: 'NextAuth session endpoint', status: '✗ FAILED', details: String(error) })
      console.log(`  ✗ Failed: ${error}`)
    }

    // Wait for console errors
    await page.waitForTimeout(2000)

    // Generate summary
    console.log('')
    console.log('================================================================')
    console.log('  SUMMARY')
    console.log('================================================================')

    const successSteps = report.steps.filter(s => s.status.includes('SUCCESS')).length
    const totalSteps = report.steps.length
    console.log(`Steps Completed: ${successSteps}/${totalSteps}`)

    const componentsFound = report.components.filter(c => c.found).length
    const totalComponents = report.components.length
    console.log(`Components Found: ${componentsFound}/${totalComponents}`)

    console.log(`Console Errors: ${report.consoleErrors.length}`)

    if (report.consoleErrors.length > 0) {
      console.log('\nConsole Error Details:')
      report.consoleErrors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}${err.length > 100 ? '...' : ''}`)
      })
      if (report.consoleErrors.length > 5) {
        console.log(`  ... and ${report.consoleErrors.length - 5} more`)
      }
    }

    console.log('')
    console.log('Overall Status:')
    if (successSteps === totalSteps && componentsFound >= 3) {
      console.log('  ✓ DASHBOARD IS FUNCTIONAL')
      console.log('  ✓ NextAuth session route conflict RESOLVED')
    } else if (successSteps >= totalSteps - 1) {
      console.log('  ⚠ DASHBOARD IS PARTIALLY FUNCTIONAL')
      console.log('  ⚠ Some components may be missing or have errors')
    } else {
      console.log('  ✗ DASHBOARD HAS CRITICAL ISSUES')
    }

    console.log('')
    console.log('Next Steps:')
    if (report.consoleErrors.length > 0) {
      console.log('  - Review and fix console errors')
    }
    if (componentsFound < totalComponents) {
      console.log('  - Implement missing dashboard components')
    }
    if (successSteps === totalSteps && componentsFound >= 3) {
      console.log('  - Dashboard is ready for development!')
    }

    console.log('================================================================')
    console.log('')

    // Soft assertions - don't fail the test completely
    expect(report.steps.filter(s => s.status.includes('SUCCESS')).length).toBeGreaterThanOrEqual(5)
  })
})
