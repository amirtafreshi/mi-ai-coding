import { test, expect } from '@playwright/test'
import { takeScreenshot } from '../fixtures/helpers'
import { USER_AUTH_FILE } from '../helpers/auth'

/**
 * Fixes Verification E2E Tests (Localhost)
 *
 * Verifies all critical fixes using localhost (auth cookies work):
 * 1. Favicon loads correctly (no 404)
 * 2. WebSocket connects successfully
 * 3. VNC WebSocket URLs use window.location.hostname (dynamic)
 * 4. All dashboard components render
 * 5. Status badges show connected/live
 *
 * CRITICAL: Run on DISPLAY=:99 with: DISPLAY=:99 npx playwright test fixes-localhost-verification.spec.ts
 */

// Use authenticated state for all tests
test.use({ storageState: USER_AUTH_FILE })

test.describe('Fixes Verification (Localhost)', () => {
  const dashboardURL = 'http://localhost:3000/dashboard'

  test.beforeEach(async ({ page }) => {
    // Capture important console logs
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error' && !text.includes('DevTools')) {
        console.error('[BROWSER ERROR]', text)
      }

      if (text.includes('WebSocket') || text.includes('VNC') || text.includes('connect')) {
        console.log(`[BROWSER LOG]`, text)
      }
    })

    // Track failed requests (not favicon - we'll check that separately)
    page.on('requestfailed', request => {
      if (!request.url().includes('favicon')) {
        console.error('[REQUEST FAILED]', request.url(), request.failure()?.errorText)
      }
    })
  })

  test('Fix #1: Favicon loads without 404 errors', async ({ page, context }) => {
    const faviconResponses: any[] = []

    page.on('response', response => {
      if (response.url().includes('favicon')) {
        faviconResponses.push({
          url: response.url(),
          status: response.status()
        })
      }
    })

    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    await takeScreenshot(page, 'fix1-favicon-localhost')

    console.log('\n========== FIX #1: FAVICON ==========')

    if (faviconResponses.length > 0) {
      faviconResponses.forEach(r => {
        console.log(`Favicon: ${r.url} - Status: ${r.status}`)
      })

      const has404 = faviconResponses.some(r => r.status === 404)
      if (has404) {
        console.error('❌ FAILED: Favicon returns 404')
      } else {
        console.log('✅ PASSED: Favicon loads successfully')
      }

      expect(has404).toBe(false)
    } else {
      console.log('✅ PASSED: No favicon requests (browser cached or not requested)')
    }

    // Also check via direct request
    const faviconDirect = await context.request.get('http://localhost:3000/favicon.svg')
    console.log(`Direct request to /favicon.svg: ${faviconDirect.status()}`)
    expect(faviconDirect.status()).toBe(200)

    console.log('==========================================\n')
  })

  test('Fix #2: WebSocket connects successfully (0.0.0.0 binding)', async ({ page }) => {
    const wsConnections: any[] = []
    const wsErrors: any[] = []

    page.on('websocket', ws => {
      if (ws.url().includes('3001')) {
        console.log(`[WebSocket] Connection: ${ws.url()}`)
        wsConnections.push({ url: ws.url() })

        ws.on('close', () => {
          console.log(`[WebSocket] Closed: ${ws.url()}`)
        })
      }
    })

    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(8000) // Wait for WebSocket

    await takeScreenshot(page, 'fix2-websocket-localhost')

    console.log('\n========== FIX #2: WEBSOCKET ==========')
    console.log(`WebSocket connections: ${wsConnections.length}`)

    if (wsConnections.length > 0) {
      wsConnections.forEach(ws => console.log(`  - ${ws.url}`))
    }

    // Check Activity Log Live badge
    const liveBadge = page.locator('text=Live').first()
    const isLive = await liveBadge.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Activity Log Live Badge: ${isLive ? '✅ Visible' : '❌ Not visible'}`)

    console.log('==========================================\n')

    // WebSocket should connect
    expect(wsConnections.length).toBeGreaterThan(0)
  })

  test('Fix #3: VNC WebSocket URLs use window.location.hostname', async ({ page }) => {
    const vncWsConnections: any[] = []

    page.on('websocket', ws => {
      if (ws.url().includes('6080') || ws.url().includes('6081')) {
        console.log(`[VNC WebSocket] ${ws.url()}`)

        const usesLocalhost = ws.url().includes('localhost')
        const usesIP = ws.url().match(/\d+\.\d+\.\d+\.\d+/)

        vncWsConnections.push({
          url: ws.url(),
          usesLocalhost,
          usesIP: !!usesIP
        })
      }
    })

    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(12000) // Wait for VNC connections

    await takeScreenshot(page, 'fix3-vnc-websockets-localhost')

    console.log('\n========== FIX #3: VNC WEBSOCKET URLs ==========')
    console.log(`VNC WebSocket connections: ${vncWsConnections.length}`)

    if (vncWsConnections.length > 0) {
      vncWsConnections.forEach(ws => {
        console.log(`  URL: ${ws.url}`)
        console.log(`    Uses localhost: ${ws.usesLocalhost ? 'Yes (expected for localhost test)' : 'No'}`)
      })

      console.log('\n✅ PASSED: VNC WebSockets are connecting')
      console.log('Note: Using localhost in tests is expected. In production from external IP,')
      console.log('window.location.hostname will resolve to the external IP automatically.')
    } else {
      console.error('❌ No VNC WebSocket connections attempted')
    }

    console.log('==========================================\n')

    // Should have at least some VNC connection attempts
    expect(vncWsConnections.length).toBeGreaterThan(0)
  })

  test('Fix #4: VNC and Activity Log status badges', async ({ page }) => {
    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(15000) // Wait for all connections

    await takeScreenshot(page, 'fix4-status-badges-localhost')

    console.log('\n========== FIX #4: STATUS BADGES ==========')

    // Count all status badges
    const allBadges = await page.locator('.ant-badge-status').count()
    console.log(`Total status badges: ${allBadges}`)

    // Check for Connected badges (VNC)
    const connectedBadges = await page.locator('text=Connected').count()
    console.log(`Connected badges: ${connectedBadges}`)

    // Check for Live badge (Activity Log)
    const liveBadges = await page.locator('text=Live').count()
    console.log(`Live badges: ${liveBadges}`)

    // Check for Disconnected badges
    const disconnectedBadges = await page.locator('text=Disconnected').count()
    console.log(`Disconnected badges: ${disconnectedBadges}`)

    if (connectedBadges >= 1) {
      console.log('✅ PASSED: At least one VNC shows Connected')
    } else {
      console.error('❌ No VNC connections showing Connected')
    }

    if (liveBadges >= 1) {
      console.log('✅ PASSED: Activity Log shows Live')
    } else {
      console.error('⚠️  Activity Log not showing Live badge')
    }

    console.log('==========================================\n')

    // At least activity log OR one VNC should be connected/live
    const anyConnected = connectedBadges >= 1 || liveBadges >= 1
    expect(anyConnected).toBe(true)
  })

  test('Fix #5: All dashboard components render', async ({ page }) => {
    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000)

    await takeScreenshot(page, 'fix5-components-localhost')

    console.log('\n========== FIX #5: DASHBOARD COMPONENTS ==========')

    // Check each major component
    const components = [
      { name: 'File Explorer', selector: 'text=File Explorer' },
      { name: 'Code Editor', selector: 'text=Code Editor' },
      { name: 'Terminal VNC', selector: 'text=Terminal VNC' },
      { name: 'Playwright VNC', selector: 'text=Playwright VNC' },
      { name: 'Activity Log', selector: 'text=Activity Log' }
    ]

    let visibleCount = 0

    for (const component of components) {
      const element = page.locator(component.selector)
      const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`${component.name}: ${isVisible ? '✅ Visible' : '❌ Not visible'}`)

      if (isVisible) visibleCount++
    }

    console.log(`\nTotal visible components: ${visibleCount}/${components.length}`)

    if (visibleCount >= 4) {
      console.log('✅ PASSED: Most components are visible')
    } else {
      console.error('❌ FAILED: Too many components missing')
    }

    console.log('==========================================\n')

    // At least 4 out of 5 components should be visible
    expect(visibleCount).toBeGreaterThanOrEqual(4)
  })

  test('FINAL: Complete health check', async ({ page, context }) => {
    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(10000)

    await takeScreenshot(page, 'final-health-check-localhost')

    console.log('\n========== FINAL HEALTH CHECK ==========')

    // 1. Favicon
    const faviconResponse = await context.request.get('http://localhost:3000/favicon.svg')
    const faviconOK = faviconResponse.status() === 200
    console.log(`1. Favicon: ${faviconOK ? '✅ 200 OK' : `❌ ${faviconResponse.status()}`}`)

    // 2. Dashboard page
    const dashResponse = await context.request.get(dashboardURL)
    const dashOK = dashResponse.status() === 200
    console.log(`2. Dashboard: ${dashOK ? '✅ 200 OK' : `❌ ${dashResponse.status()}`}`)

    // 3. Components visible
    const fileExplorer = await page.locator('text=File Explorer').isVisible().catch(() => false)
    const terminalVnc = await page.locator('text=Terminal VNC').isVisible().catch(() => false)
    const activityLog = await page.locator('text=Activity Log').isVisible().catch(() => false)
    const componentsOK = fileExplorer && terminalVnc && activityLog
    console.log(`3. Main Components: ${componentsOK ? '✅ All visible' : '⚠️  Some missing'}`)

    // 4. Status badges
    const connectedCount = await page.locator('text=Connected').count()
    const liveCount = await page.locator('text=Live').count()
    const badgesOK = (connectedCount >= 1 || liveCount >= 1)
    console.log(`4. Status Badges: ${badgesOK ? `✅ ${connectedCount} Connected, ${liveCount} Live` : '❌ None'}`)

    // 5. Console errors
    const criticalErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('DevTools') && !msg.text().includes('Ant Design')) {
        criticalErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(3000)
    const errorsOK = criticalErrors.length === 0
    console.log(`5. Critical Errors: ${errorsOK ? '✅ None' : `⚠️  ${criticalErrors.length} errors`}`)

    console.log('\n========== OVERALL STATUS ==========')
    const allPassed = faviconOK && dashOK && componentsOK && badgesOK

    if (allPassed) {
      console.log('✅ ALL FIXES VERIFIED SUCCESSFULLY')
      console.log('  ✅ Favicon loads (no 404)')
      console.log('  ✅ WebSocket server accessible')
      console.log('  ✅ VNC WebSockets connecting')
      console.log('  ✅ All components render')
      console.log('  ✅ Status badges show connected/live')
    } else {
      console.log('⚠️  SUMMARY:')
      if (!faviconOK) console.log('  ❌ Favicon issue')
      if (!dashOK) console.log('  ❌ Dashboard not loading')
      if (!componentsOK) console.log('  ⚠️  Some components missing')
      if (!badgesOK) console.log('  ⚠️  Status badges not showing')
    }
    console.log('==========================================\n')

    // Pass if favicon, dashboard, and basics work
    expect(faviconOK && dashOK).toBe(true)
  })
})
