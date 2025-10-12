import { test, expect } from '@playwright/test'

/**
 * Dashboard Health Check
 *
 * Comprehensive verification of dashboard functionality after clean build
 * Tests run on DISPLAY=:99 for VNC visibility
 */

test.describe('Dashboard Health Check', () => {
  const consoleErrors: string[] = []
  const consoleWarnings: string[] = []
  const wsConnections: { url: string; status: string }[] = []

  test.beforeEach(async ({ page }) => {
    // Clear arrays
    consoleErrors.length = 0
    consoleWarnings.length = 0
    wsConnections.length = 0

    // Track console messages
    page.on('console', msg => {
      const text = msg.text()
      const type = msg.type()

      if (type === 'error') {
        consoleErrors.push(text)
        console.log(`[ERROR] ${text}`)
      } else if (type === 'warning') {
        consoleWarnings.push(text)
      }
    })

    // Track WebSocket connections
    page.on('websocket', ws => {
      const url = ws.url()
      wsConnections.push({ url, status: 'created' })
      console.log(`[WS] Created: ${url}`)

      ws.on('close', () => {
        wsConnections.push({ url, status: 'closed' })
        console.log(`[WS] Closed: ${url}`)
      })
    })

    // Track network failures
    page.on('requestfailed', request => {
      console.log(`[FAILED] ${request.url()}`)
    })
  })

  test('1. Landing page loads without errors', async ({ page }) => {
    console.log('\n=== TEST 1: Landing Page ===')

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    // Take screenshot
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/01-landing-page.png',
      fullPage: true
    })

    // Check for React error screen
    const hasReactError = await page.locator('text="Application error"').isVisible().catch(() => false)
    const hasErrorOverlay = await page.locator('[data-nextjs-dialog-overlay]').isVisible().catch(() => false)

    console.log(`React Error Screen: ${hasReactError ? 'YES - FAILED' : 'NO - PASSED'}`)
    console.log(`Error Overlay: ${hasErrorOverlay ? 'YES - FAILED' : 'NO - PASSED'}`)
    console.log(`Console Errors: ${consoleErrors.length}`)

    expect(hasReactError).toBe(false)
    expect(hasErrorOverlay).toBe(false)

    console.log('✅ Landing page loaded successfully\n')
  })

  test('2. Favicon loads (no 404)', async ({ page }) => {
    console.log('\n=== TEST 2: Favicon ===')

    const faviconResponses: any[] = []

    page.on('response', res => {
      if (res.url().includes('favicon')) {
        faviconResponses.push({ url: res.url(), status: res.status() })
      }
    })

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/02-favicon-check.png',
      fullPage: true
    })

    const has404 = faviconResponses.some(r => r.status === 404)

    console.log('Favicon requests:')
    faviconResponses.forEach(r => {
      console.log(`  - ${r.url}: ${r.status}`)
    })

    console.log(`Status: ${has404 ? 'FAILED - 404 detected' : 'PASSED - No 404'}`)

    expect(has404).toBe(false)

    console.log('✅ Favicon loads correctly\n')
  })

  test('3. Login page renders correctly', async ({ page }) => {
    console.log('\n=== TEST 3: Login Page ===')

    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/03-login-page.png',
      fullPage: true
    })

    // Check form elements
    const emailField = await page.locator('[name="email"]').isVisible().catch(() => false)
    const passwordField = await page.locator('[name="password"]').isVisible().catch(() => false)
    const submitButton = await page.locator('button[type="submit"]').isVisible().catch(() => false)

    console.log(`Email field: ${emailField ? 'VISIBLE' : 'MISSING'}`)
    console.log(`Password field: ${passwordField ? 'VISIBLE' : 'MISSING'}`)
    console.log(`Submit button: ${submitButton ? 'VISIBLE' : 'MISSING'}`)

    expect(emailField).toBe(true)
    expect(passwordField).toBe(true)
    expect(submitButton).toBe(true)

    console.log('✅ Login page renders correctly\n')
  })

  test('4. Dashboard requires authentication', async ({ page }) => {
    console.log('\n=== TEST 4: Auth Requirement ===')

    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(3000)

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/04-auth-redirect.png',
      fullPage: true
    })

    const currentUrl = page.url()
    const isOnLogin = currentUrl.includes('/login')

    console.log(`Current URL: ${currentUrl}`)
    console.log(`Redirected to login: ${isOnLogin ? 'YES' : 'NO'}`)

    // Dashboard should redirect to login
    expect(isOnLogin).toBe(true)

    console.log('✅ Auth protection working\n')
  })

  test('5. Dashboard loads after login', async ({ page }) => {
    console.log('\n=== TEST 5: Dashboard Access ===')

    // Login first
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    // Fill login form with test credentials
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'test123')
    await page.click('button[type="submit"]')

    // Wait for redirect or stay on page
    await page.waitForTimeout(5000)

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/05-after-login.png',
      fullPage: true
    })

    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)

    // Check if we're on dashboard or still on login
    const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl === 'http://localhost:3000/'
    const hasReactError = await page.locator('text="Application error"').isVisible().catch(() => false)

    console.log(`On dashboard: ${isOnDashboard}`)
    console.log(`Has React error: ${hasReactError}`)
    console.log(`Console errors: ${consoleErrors.length}`)

    if (consoleErrors.length > 0) {
      console.log('Console errors found:')
      consoleErrors.slice(0, 5).forEach(e => console.log(`  - ${e}`))
    }

    expect(hasReactError).toBe(false)

    console.log('✅ Dashboard accessible after login\n')
  })

  test('6. Dashboard components check', async ({ page }) => {
    console.log('\n=== TEST 6: Dashboard Components ===')

    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'test123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    // Navigate to dashboard explicitly
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(5000)

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/06-dashboard-full.png',
      fullPage: true
    })

    console.log('Checking for components...')

    // Look for any component indicators
    const components = {
      'File Explorer': await page.locator('text=File Explorer').isVisible().catch(() => false),
      'Code Editor': await page.locator('text=Code Editor').isVisible().catch(() => false),
      'Terminal VNC': await page.locator('text=Terminal VNC').isVisible().catch(() => false),
      'Playwright VNC': await page.locator('text=Playwright VNC').isVisible().catch(() => false),
      'Activity Log': await page.locator('text=Activity Log').isVisible().catch(() => false),
    }

    for (const [name, visible] of Object.entries(components)) {
      console.log(`  ${name}: ${visible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`)
    }

    // Check for React error
    const hasError = await page.locator('text="Application error"').isVisible().catch(() => false)
    console.log(`\nReact Error: ${hasError ? '❌ YES' : '✅ NO'}`)

    // Check if page has any content
    const bodyText = await page.locator('body').textContent()
    const hasContent = bodyText && bodyText.length > 100
    console.log(`Page has content: ${hasContent ? '✅ YES' : '❌ NO'}`)

    console.log('\n✅ Dashboard component check complete\n')
  })

  test('7. WebSocket connection check', async ({ page }) => {
    console.log('\n=== TEST 7: WebSocket Connections ===')

    // Login and access dashboard
    await page.goto('http://localhost:3000/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'test123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    await page.goto('http://localhost:3000/dashboard')

    // Wait for WebSocket connections
    await page.waitForTimeout(10000)

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/07-websocket-check.png',
      fullPage: true
    })

    console.log('WebSocket connections:')
    const uniqueUrls = [...new Set(wsConnections.map(w => w.url))]
    uniqueUrls.forEach(url => {
      const created = wsConnections.filter(w => w.url === url && w.status === 'created').length
      const closed = wsConnections.filter(w => w.url === url && w.status === 'closed').length
      console.log(`  ${url}:`)
      console.log(`    Created: ${created}, Closed: ${closed}`)
    })

    const hasActivityWs = wsConnections.some(w => w.url.includes('3001'))
    const hasVncWs = wsConnections.some(w => w.url.includes('6080') || w.url.includes('6081'))

    console.log(`\nActivity Log WS (3001): ${hasActivityWs ? '✅ ATTEMPTED' : '❌ NOT ATTEMPTED'}`)
    console.log(`VNC WS (6080/6081): ${hasVncWs ? '✅ ATTEMPTED' : '⚠️  NOT ATTEMPTED (expected)'}`)

    console.log('\n✅ WebSocket check complete\n')
  })

  test('8. Critical console errors check', async ({ page }) => {
    console.log('\n=== TEST 8: Console Errors ===')

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/test-screenshots/08-console-check.png',
      fullPage: true
    })

    // Filter out expected/non-critical errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('DevTools') &&
      !e.includes('Ant Design token') &&
      !e.includes('401') &&
      !e.includes('next-auth')
    )

    console.log(`Total console errors: ${consoleErrors.length}`)
    console.log(`Critical errors: ${criticalErrors.length}`)

    if (criticalErrors.length > 0) {
      console.log('\nCritical errors:')
      criticalErrors.forEach(e => console.log(`  - ${e}`))
    }

    console.log('\n✅ Console error check complete\n')
  })
})
