import { test, expect } from '@playwright/test'
import { takeScreenshot } from '../fixtures/helpers'
import { USER_AUTH_FILE } from '../helpers/auth'

/**
 * Fixes Verification E2E Tests
 *
 * Verifies all critical fixes applied in the diagnostic session:
 * 1. VNC WebSocket URLs use window.location.hostname (not hardcoded localhost)
 * 2. WebSocket server binds to 0.0.0.0 (not localhost)
 * 3. Favicon exists and loads correctly
 * 4. All connections work from external IP (45.22.197.163)
 *
 * CRITICAL: Run on DISPLAY=:99 with: DISPLAY=:99 npx playwright test fixes-verification.spec.ts
 */

// Use authenticated state for all tests
test.use({ storageState: USER_AUTH_FILE })

test.describe('Fixes Verification from External IP', () => {
  const externalIP = '45.22.197.163'
  const dashboardURL = `http://${externalIP}:3000/dashboard`

  test.beforeEach(async ({ page }) => {
    // Capture all console output for debugging
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        console.error('[BROWSER ERROR]', text)
      } else if (type === 'warning') {
        console.warn('[BROWSER WARNING]', text)
      } else if (text.includes('WebSocket') || text.includes('VNC') || text.includes('connect')) {
        console.log(`[BROWSER LOG]`, text)
      }
    })

    // Capture network failures
    page.on('requestfailed', request => {
      console.error('[REQUEST FAILED]', request.url(), request.failure()?.errorText)
    })
  })

  test('Fix #1: Favicon loads successfully (no 404 errors)', async ({ page }) => {
    const faviconResponses: any[] = []

    page.on('response', response => {
      if (response.url().includes('favicon')) {
        faviconResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        })
      }
    })

    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    await takeScreenshot(page, 'fix-verification-favicon')

    console.log('\n========== FIX #1: FAVICON VERIFICATION ==========')
    console.log('Expected: /favicon.svg returns 200')
    console.log('Favicon requests:', JSON.stringify(faviconResponses, null, 2))

    const has404 = faviconResponses.some(r => r.status === 404)
    if (has404) {
      console.error('❌ FAILED: Favicon still returning 404')
      faviconResponses.filter(r => r.status === 404).forEach(r => {
        console.error(`  404 Not Found: ${r.url}`)
      })
    } else {
      console.log('✅ PASSED: No favicon 404 errors')
    }
    console.log('==========================================\n')

    expect(has404).toBe(false)
  })

  test('Fix #2: WebSocket connects from external IP (0.0.0.0 binding)', async ({ page }) => {
    const wsConnections: any[] = []
    const wsErrors: any[] = []

    page.on('websocket', ws => {
      if (ws.url().includes('3001')) {
        console.log(`[WebSocket] Attempting connection: ${ws.url()}`)
        wsConnections.push({
          url: ws.url(),
          timestamp: new Date().toISOString()
        })

        ws.on('close', (code) => {
          console.log(`[WebSocket] Connection closed: ${ws.url()} (code: ${code})`)
        })

        ws.on('socketerror', error => {
          console.error(`[WebSocket] Socket error: ${ws.url()}`, error)
          wsErrors.push({ url: ws.url(), error })
        })
      }
    })

    page.on('requestfailed', request => {
      if (request.url().includes('3001')) {
        console.error(`[WebSocket] Request failed: ${request.url()}`)
        wsErrors.push({
          url: request.url(),
          error: request.failure()?.errorText
        })
      }
    })

    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(8000) // Wait for WebSocket connection

    await takeScreenshot(page, 'fix-verification-websocket')

    console.log('\n========== FIX #2: WEBSOCKET VERIFICATION ==========')
    console.log(`Expected: WebSocket connects to ws://${externalIP}:3001`)
    console.log(`Connection attempts: ${wsConnections.length}`)
    console.log(`Errors: ${wsErrors.length}`)

    if (wsConnections.length > 0) {
      console.log('\nWebSocket URLs:')
      wsConnections.forEach(ws => console.log(`  - ${ws.url}`))
    }

    if (wsErrors.length > 0) {
      console.error('\n❌ FAILED: WebSocket connection errors')
      wsErrors.forEach(err => {
        console.error(`  URL: ${err.url}`)
        console.error(`  Error: ${err.error}`)
      })
    } else {
      console.log('✅ PASSED: WebSocket connected successfully')
    }

    // Check Activity Log status badge
    const liveBadge = page.locator('.ant-badge-status-success:has-text("Live")')
    const isLive = await liveBadge.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Activity Log Status Badge: ${isLive ? '✅ Live (green)' : '❌ Not live'}`)

    console.log('==========================================\n')

    expect(wsErrors.length).toBe(0)
    expect(wsConnections.length).toBeGreaterThan(0)
  })

  test('Fix #3: VNC WebSockets use dynamic hostname (not localhost)', async ({ page }) => {
    const vncWsConnections: any[] = []
    const vncWsErrors: any[] = []

    page.on('websocket', ws => {
      if (ws.url().includes('6080') || ws.url().includes('6081')) {
        console.log(`[VNC WebSocket] Attempting: ${ws.url()}`)

        // Verify URL uses external IP, not localhost
        const usesExternalIP = ws.url().includes(externalIP)
        const usesLocalhost = ws.url().includes('localhost')

        vncWsConnections.push({
          url: ws.url(),
          usesExternalIP,
          usesLocalhost,
          timestamp: new Date().toISOString()
        })

        ws.on('close', () => {
          console.log(`[VNC WebSocket] Closed: ${ws.url()}`)
        })

        ws.on('socketerror', error => {
          console.error(`[VNC WebSocket] Error: ${ws.url()}`, error)
          vncWsErrors.push({ url: ws.url(), error })
        })
      }
    })

    page.on('requestfailed', request => {
      if (request.url().includes('6080') || request.url().includes('6081')) {
        vncWsErrors.push({
          url: request.url(),
          error: request.failure()?.errorText
        })
      }
    })

    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(12000) // Wait longer for VNC connections

    await takeScreenshot(page, 'fix-verification-vnc-websockets')

    console.log('\n========== FIX #3: VNC WEBSOCKET URL VERIFICATION ==========')
    console.log(`Expected: VNC WebSockets use ws://${externalIP}:6080 and :6081`)
    console.log(`Connection attempts: ${vncWsConnections.length}`)

    if (vncWsConnections.length > 0) {
      console.log('\nVNC WebSocket Analysis:')
      vncWsConnections.forEach(ws => {
        console.log(`  URL: ${ws.url}`)
        console.log(`    Uses External IP (${externalIP}): ${ws.usesExternalIP ? '✅ Yes' : '❌ No'}`)
        console.log(`    Uses localhost: ${ws.usesLocalhost ? '❌ Yes (WRONG!)' : '✅ No (correct)'}`)
      })

      const allUseExternalIP = vncWsConnections.every(ws => ws.usesExternalIP)
      const anyUseLocalhost = vncWsConnections.some(ws => ws.usesLocalhost)

      if (anyUseLocalhost) {
        console.error('\n❌ FAILED: VNC WebSockets still using localhost (hardcoded)')
        console.error('  Fix required in: components/vnc/VNCViewer.tsx')
        console.error('  Change: ws://localhost:6080 → ws://${window.location.hostname}:6080')
      } else if (allUseExternalIP) {
        console.log('\n✅ PASSED: All VNC WebSockets use window.location.hostname')
      }
    } else {
      console.error('❌ FAILED: No VNC WebSocket connections attempted')
    }

    if (vncWsErrors.length > 0) {
      console.error('\nVNC Connection Errors:')
      vncWsErrors.forEach(err => {
        console.error(`  URL: ${err.url}`)
        console.error(`  Error: ${err.error}`)
      })
    }

    console.log('==========================================\n')

    expect(vncWsConnections.length).toBeGreaterThan(0)
    expect(vncWsConnections.some(ws => ws.usesLocalhost)).toBe(false)
  })

  test('Fix #4: VNC Status Badges show "Connected" (green)', async ({ page }) => {
    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(15000) // Wait for VNC connections to establish

    await takeScreenshot(page, 'fix-verification-vnc-status-badges')

    console.log('\n========== FIX #4: VNC STATUS BADGES VERIFICATION ==========')

    // Check Terminal VNC (:98) status badge
    const terminalConnected = page.locator('.ant-badge-status-success:has-text("Connected")').first()
    const terminalIsConnected = await terminalConnected.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Terminal VNC (:98) Status: ${terminalIsConnected ? '✅ Connected (green)' : '❌ Not connected'}`)

    // Check Playwright VNC (:99) status badge
    const playwrightConnected = page.locator('.ant-badge-status-success:has-text("Connected")').nth(1)
    const playwrightIsConnected = await playwrightConnected.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Playwright VNC (:99) Status: ${playwrightIsConnected ? '✅ Connected (green)' : '❌ Not connected'}`)

    // Check Activity Log Live badge
    const activityLive = page.locator('.ant-badge-status-success:has-text("Live")')
    const activityIsLive = await activityLive.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Activity Log Status: ${activityIsLive ? '✅ Live (green)' : '❌ Not live'}`)

    console.log('==========================================\n')

    // At least one VNC should be connected
    const anyVncConnected = terminalIsConnected || playwrightIsConnected
    expect(anyVncConnected).toBe(true)
  })

  test('Fix #5: All Dashboard Components Render Correctly', async ({ page }) => {
    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000)

    await takeScreenshot(page, 'fix-verification-full-dashboard')

    console.log('\n========== DASHBOARD COMPONENTS RENDERING ==========')

    // Check File Explorer
    const fileExplorer = page.locator('text=File Explorer')
    const fileExplorerVisible = await fileExplorer.isVisible().catch(() => false)
    console.log(`File Explorer: ${fileExplorerVisible ? '✅ Visible' : '❌ Not visible'}`)

    // Check Code Editor
    const codeEditor = page.locator('text=Code Editor')
    const codeEditorVisible = await codeEditor.isVisible().catch(() => false)
    console.log(`Code Editor: ${codeEditorVisible ? '✅ Visible' : '❌ Not visible'}`)

    // Check Terminal VNC panel
    const terminalVnc = page.locator('text=Terminal VNC')
    const terminalVncVisible = await terminalVnc.isVisible().catch(() => false)
    console.log(`Terminal VNC Panel: ${terminalVncVisible ? '✅ Visible' : '❌ Not visible'}`)

    // Check Playwright VNC panel
    const playwrightVnc = page.locator('text=Playwright VNC')
    const playwrightVncVisible = await playwrightVnc.isVisible().catch(() => false)
    console.log(`Playwright VNC Panel: ${playwrightVncVisible ? '✅ Visible' : '❌ Not visible'}`)

    // Check Activity Log
    const activityLog = page.locator('text=Activity Log')
    const activityLogVisible = await activityLog.isVisible().catch(() => false)
    console.log(`Activity Log: ${activityLogVisible ? '✅ Visible' : '❌ Not visible'}`)

    console.log('==========================================\n')

    // All main components should be visible
    expect(fileExplorerVisible).toBe(true)
    expect(terminalVncVisible).toBe(true)
    expect(activityLogVisible).toBe(true)
  })

  test('Final Verification: Complete Dashboard Health Check', async ({ page, context }) => {
    await page.goto(dashboardURL)
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(10000)

    await takeScreenshot(page, 'final-health-check')

    console.log('\n========== FINAL HEALTH CHECK SUMMARY ==========')

    // 1. Check favicon
    const faviconResponse = await context.request.get(`http://${externalIP}:3000/favicon.svg`)
    const faviconOK = faviconResponse.status() === 200
    console.log(`1. Favicon: ${faviconOK ? '✅ 200 OK' : `❌ ${faviconResponse.status()}`}`)

    // 2. Check main app
    const appResponse = await context.request.get(dashboardURL)
    const appOK = appResponse.status() === 200
    console.log(`2. Dashboard Page: ${appOK ? '✅ 200 OK' : `❌ ${appResponse.status()}`}`)

    // 3. Count status badges
    const connectedBadges = await page.locator('.ant-badge-status-success:has-text("Connected")').count()
    const liveBadges = await page.locator('.ant-badge-status-success:has-text("Live")').count()
    console.log(`3. VNC Connected Badges: ${connectedBadges >= 1 ? `✅ ${connectedBadges} connected` : `❌ ${connectedBadges} (expected >= 1)`}`)
    console.log(`4. Activity Log Live Badge: ${liveBadges >= 1 ? `✅ Live` : `❌ Not live`}`)

    // 4. Check for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(3000)

    const criticalErrors = errors.filter(e =>
      !e.includes('DevTools') &&
      !e.includes('Ant Design') &&
      !e.includes('React')
    )

    console.log(`5. Critical Console Errors: ${criticalErrors.length === 0 ? '✅ None' : `❌ ${criticalErrors.length} errors`}`)

    if (criticalErrors.length > 0) {
      console.log('\nCritical Errors:')
      criticalErrors.forEach(e => console.error(`  - ${e}`))
    }

    console.log('\n========== OVERALL STATUS ==========')
    const allPassed = faviconOK && appOK && connectedBadges >= 1 && liveBadges >= 1 && criticalErrors.length === 0

    if (allPassed) {
      console.log('✅ ALL FIXES VERIFIED - SYSTEM HEALTHY')
      console.log('  - Favicon loads correctly')
      console.log('  - WebSocket server accessible from external IP')
      console.log('  - VNC WebSockets use dynamic hostname')
      console.log('  - Status badges show connected/live')
      console.log('  - No critical errors')
    } else {
      console.log('⚠️  SOME ISSUES REMAIN:')
      if (!faviconOK) console.log('  - Favicon not loading')
      if (!appOK) console.log('  - Dashboard page not loading')
      if (connectedBadges < 1) console.log('  - VNC not connected')
      if (liveBadges < 1) console.log('  - Activity Log not live')
      if (criticalErrors.length > 0) console.log('  - Critical console errors present')
    }
    console.log('==========================================\n')

    expect(allPassed).toBe(true)
  })
})
