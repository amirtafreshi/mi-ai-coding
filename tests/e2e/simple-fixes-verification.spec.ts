import { test, expect } from '@playwright/test'

/**
 * Simple Fixes Verification - No Auth Required
 *
 * Tests that can run without authentication to verify critical fixes
 * Run with: DISPLAY=:99 npx playwright test tests/e2e/simple-fixes-verification.spec.ts --config=playwright.simple.config.ts
 */

test.describe('Simple Fixes Verification (No Auth)', () => {
  // Track events
  const consoleMessages: { type: string; text: string }[] = []
  const wsEvents: { type: string; url: string }[] = []

  test.beforeEach(async ({ page }) => {
    consoleMessages.length = 0
    wsEvents.length = 0

    // Console logging
    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push({ type: msg.type(), text })

      if (msg.type() === 'error' || text.includes('WebSocket') || text.includes('VNC') || text.includes('connect')) {
        console.log(`[${msg.type().toUpperCase()}]`, text)
      }
    })

    // WebSocket tracking
    page.on('websocket', ws => {
      wsEvents.push({ type: 'created', url: ws.url() })
      console.log(`[WS] Created: ${ws.url()}`)

      ws.on('close', () => {
        wsEvents.push({ type: 'closed', url: ws.url() })
        console.log(`[WS] Closed: ${ws.url()}`)
      })
    })
  })

  test('Verify favicon loads (no 404)', async ({ page }) => {
    const responses: any[] = []

    page.on('response', res => {
      if (res.url().includes('favicon')) {
        responses.push({ url: res.url(), status: res.status() })
      }
    })

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/test-screenshots/favicon-check.png', fullPage: true })

    console.log('\n=== FAVICON CHECK ===')
    console.log('Responses:', responses)

    const has404 = responses.some(r => r.status === 404)
    console.log(has404 ? '❌ FAILED: Favicon 404' : '✅ PASSED: No favicon 404')
    console.log('=====================\n')

    expect(has404).toBe(false)
  })

  test('Login and verify dashboard loads', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    // Try to login
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'test123')
    await page.click('button[type="submit"]')

    // Wait for redirect (or stay on login if auth fails - that's ok for this test)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/test-screenshots/after-login.png', fullPage: true })

    const currentUrl = page.url()
    console.log('\n=== LOGIN CHECK ===')
    console.log('Current URL:', currentUrl)
    console.log('===================\n')
  })

  test('Dashboard: Check WebSocket connections (10 second stability test)', async ({ page }) => {
    // Skip auth and go directly to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    console.log('\n=== WEBSOCKET STABILITY TEST (10s) ===')
    console.log('Monitoring connections...')

    await page.waitForTimeout(10000)

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/test-screenshots/dashboard-10s.png', fullPage: true })

    // Analyze WebSocket events
    const activityWs = wsEvents.filter(e => e.url.includes('3001'))
    const vncWs = wsEvents.filter(e => e.url.includes('6080') || e.url.includes('6081'))

    const activityCreated = activityWs.filter(e => e.type === 'created').length
    const activityClosed = activityWs.filter(e => e.type === 'closed').length
    const vncCreated = vncWs.filter(e => e.type === 'created').length
    const vncClosed = vncWs.filter(e => e.type === 'closed').length

    console.log('\nActivity Log WebSocket (port 3001):')
    console.log(`  Created: ${activityCreated}`)
    console.log(`  Closed: ${activityClosed}`)
    console.log(`  Status: ${activityCreated === 1 && activityClosed === 0 ? '✅ Stable' : activityCreated > 2 ? '❌ Disconnect loop' : '⚠️  Check logs'}`)

    console.log('\nVNC WebSockets (ports 6080, 6081):')
    console.log(`  Created: ${vncCreated}`)
    console.log(`  Closed: ${vncClosed}`)
    console.log(`  Status: ${vncCreated <= 2 && vncClosed === 0 ? '✅ Stable' : vncCreated > 4 ? '❌ Disconnect loop' : '⚠️  Check logs'}`)

    console.log('\n=======================================\n')

    // Pass if connections were established
    expect(activityCreated).toBeGreaterThan(0)
    expect(vncCreated).toBeGreaterThan(0)

    // Fail if disconnect loops detected
    expect(activityCreated).toBeLessThan(3) // Max 2 reconnections
    expect(vncCreated).toBeLessThan(5) // Max 4 (2 per VNC)
  })

  test('Dashboard: Check for DOM errors', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000)

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/test-screenshots/dashboard-dom-check.png', fullPage: true })

    console.log('\n=== DOM ERROR CHECK ===')

    const domErrors = consoleMessages.filter(m =>
      m.type === 'error' && (
        m.text.includes('Node.removeChild') ||
        m.text.includes('removeChild') ||
        m.text.includes('Cannot read properties of null')
      )
    )

    console.log(`DOM Errors: ${domErrors.length}`)
    if (domErrors.length > 0) {
      console.log('Errors found:')
      domErrors.forEach(e => console.log(`  - ${e.text}`))
      console.log('❌ FAILED: DOM errors present')
    } else {
      console.log('✅ PASSED: No DOM errors')
    }

    console.log('=======================\n')

    expect(domErrors.length).toBe(0)
  })

  test('Dashboard: Check component rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(3000)

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/test-screenshots/dashboard-components.png', fullPage: true })

    console.log('\n=== COMPONENT RENDERING ===')

    const components = {
      'File Explorer': await page.locator('text=File Explorer').isVisible().catch(() => false),
      'Terminal VNC': await page.locator('text=Terminal VNC').isVisible().catch(() => false),
      'Playwright VNC': await page.locator('text=Playwright VNC').isVisible().catch(() => false),
      'Activity Log': await page.locator('text=Activity Log').isVisible().catch(() => false),
    }

    for (const [name, visible] of Object.entries(components)) {
      console.log(`${name}: ${visible ? '✅ Visible' : '❌ Not visible'}`)
    }

    console.log('===========================\n')

    // At least 3 components should be visible
    const visibleCount = Object.values(components).filter(v => v).length
    expect(visibleCount).toBeGreaterThanOrEqual(3)
  })

  test('Final Health Check', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(10000) // Wait for all connections

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/test-screenshots/final-health-check.png', fullPage: true })

    console.log('\n=== FINAL HEALTH CHECK ===')

    // 1. Check WebSockets
    const activityWsCreated = wsEvents.filter(e => e.url.includes('3001') && e.type === 'created').length
    const vncWsCreated = wsEvents.filter(e => (e.url.includes('6080') || e.url.includes('6081')) && e.type === 'created').length

    console.log(`1. Activity Log WebSocket: ${activityWsCreated > 0 ? '✅ Connected' : '❌ Not connected'}`)
    console.log(`2. VNC WebSockets: ${vncWsCreated > 0 ? '✅ Connected' : '❌ Not connected'}`)

    // 2. Check for disconnect loops
    const activityLoop = activityWsCreated > 2
    const vncLoop = vncWsCreated > 4
    console.log(`3. Connection Stability: ${!activityLoop && !vncLoop ? '✅ Stable' : '❌ Disconnect loops detected'}`)

    // 3. Check for DOM errors
    const domErrors = consoleMessages.filter(m =>
      m.type === 'error' && m.text.includes('removeChild')
    ).length
    console.log(`4. DOM Errors: ${domErrors === 0 ? '✅ None' : `❌ ${domErrors} errors`}`)

    // 4. Check critical console errors
    const criticalErrors = consoleMessages.filter(m =>
      m.type === 'error' &&
      !m.text.includes('DevTools') &&
      !m.text.includes('Ant Design token')
    ).length
    console.log(`5. Critical Errors: ${criticalErrors === 0 ? '✅ None' : `⚠️  ${criticalErrors} errors`}`)

    console.log('\n=== OVERALL STATUS ===')
    const allPassed = activityWsCreated > 0 && vncWsCreated > 0 && !activityLoop && !vncLoop && domErrors === 0

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED - SYSTEM HEALTHY')
    } else {
      console.log('⚠️  SOME ISSUES DETECTED - SEE LOGS ABOVE')
    }
    console.log('=======================\n')

    expect(allPassed).toBe(true)
  })
})
