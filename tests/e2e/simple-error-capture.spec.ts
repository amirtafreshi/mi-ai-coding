import { test, chromium } from '@playwright/test'

test('Capture dashboard errors with screenshots', async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })

  const page = await context.newPage()

  const logs: string[] = []
  const errors: string[] = []

  // Capture console
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`
    logs.push(text)
    console.log(text)
  })

  // Capture errors
  page.on('pageerror', error => {
    const text = `[PAGE ERROR] ${error.message}\n${error.stack || ''}`
    errors.push(text)
    console.log(text)
  })

  try {
    // 1. Go to landing page
    console.log('\n=== STEP 1: Navigate to landing page ===')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '/tmp/step-01-landing-page.png', fullPage: true })
    console.log('Screenshot: step-01-landing-page.png')

    // 2. Click Sign In button
    console.log('\n=== STEP 2: Click Sign In button ===')
    await page.click('text=Sign In')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '/tmp/step-02-login-modal.png', fullPage: true })
    console.log('Screenshot: step-02-login-modal.png')

    // 3. Fill login form
    console.log('\n=== STEP 3: Fill login form ===')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.screenshot({ path: '/tmp/step-03-filled-form.png', fullPage: true })
    console.log('Screenshot: step-03-filled-form.png')

    // 4. Submit form
    console.log('\n=== STEP 4: Submit login form ===')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 30000 })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: '/tmp/step-04-dashboard-initial.png', fullPage: true })
    console.log('Screenshot: step-04-dashboard-initial.png')

    // 5. Wait for components to load
    console.log('\n=== STEP 5: Wait for components to load ===')
    await page.waitForTimeout(5000)
    await page.screenshot({ path: '/tmp/step-05-dashboard-loaded.png', fullPage: true })
    console.log('Screenshot: step-05-dashboard-loaded.png')

    // 6. Check for error overlays
    console.log('\n=== STEP 6: Check for error overlays ===')

    // Next.js error overlay
    const nextjsOverlay = await page.locator('[data-nextjs-dialog-overlay]').count()
    if (nextjsOverlay > 0) {
      console.log('FOUND: Next.js error overlay!')
      await page.screenshot({ path: '/tmp/step-06-nextjs-error-overlay.png', fullPage: true })
      const errorText = await page.locator('[data-nextjs-dialog-overlay]').allTextContents()
      console.log('Error text:', errorText)
    }

    // Ant Design notifications
    const antNotifications = await page.locator('.ant-notification').count()
    if (antNotifications > 0) {
      console.log('FOUND: Ant Design notifications!')
      await page.screenshot({ path: '/tmp/step-06-ant-notifications.png', fullPage: true })
    }

    // React error boundaries
    const reactErrors = await page.locator('text=/error|warning|failed/i').count()
    console.log(`Found ${reactErrors} elements with error-related text`)

    // 7. Take final screenshot
    await page.screenshot({ path: '/tmp/step-07-final-state.png', fullPage: true })
    console.log('Screenshot: step-07-final-state.png')

    // 8. Get page HTML to check for error text
    const html = await page.content()

    if (html.includes('You are calling notice in render')) {
      console.log('\n⚠️ FOUND IN HTML: "You are calling notice in render"')
    }

    if (html.includes('message handler took')) {
      console.log('\n⚠️ FOUND IN HTML: "message handler took"')
    }

    // Generate report
    console.log('\n\n================================')
    console.log('=== ERROR INVESTIGATION REPORT ===')
    console.log('================================\n')

    console.log(`Total Console Logs: ${logs.length}`)
    console.log(`Total Page Errors: ${errors.length}`)

    console.log('\n--- Console Errors ---')
    const consoleErrors = logs.filter(l => l.includes('[error]'))
    consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`))

    console.log('\n--- Console Warnings ---')
    const consoleWarnings = logs.filter(l => l.includes('[warning]'))
    consoleWarnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`))

    console.log('\n--- Page Errors ---')
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`))

    console.log('\n--- Screenshots ---')
    console.log('1. /tmp/step-01-landing-page.png')
    console.log('2. /tmp/step-02-login-modal.png')
    console.log('3. /tmp/step-03-filled-form.png')
    console.log('4. /tmp/step-04-dashboard-initial.png')
    console.log('5. /tmp/step-05-dashboard-loaded.png')
    console.log('6. /tmp/step-06-*-overlay.png (if errors found)')
    console.log('7. /tmp/step-07-final-state.png')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    await page.screenshot({ path: '/tmp/step-ERROR-failed.png', fullPage: true })
    throw error
  } finally {
    await browser.close()
  }
})
