import { test, expect } from '@playwright/test'
import { takeScreenshot } from '../fixtures/helpers'

/**
 * Dashboard Diagnostics E2E Tests
 *
 * Comprehensive test suite to diagnose and identify issues:
 * 1. Missing favicon (404)
 * 2. Ant Design v5 React 19 compatibility warnings
 * 3. WebSocket connection failure (port 3001)
 * 4. VNC connection failures (ports 6080, 6081)
 * 5. noVNC TLS warnings
 * 6. React DOM errors
 *
 * CRITICAL: Run on DISPLAY=:99 with: DISPLAY=:99 npx playwright test dashboard-diagnostics.spec.ts
 */

test.describe('Dashboard Diagnostics', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs and errors
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        console.error('[BROWSER ERROR]', text)
      } else if (type === 'warning') {
        console.warn('[BROWSER WARNING]', text)
      } else {
        console.log(`[BROWSER ${type.toUpperCase()}]`, text)
      }
    })

    // Capture network failures
    page.on('requestfailed', request => {
      console.error('[REQUEST FAILED]', request.url(), request.failure()?.errorText)
    })

    // Capture page errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error.message)
    })
  })

  test('Issue #1: Check favicon loading', async ({ page }) => {
    const responses: any[] = []

    // Capture all responses
    page.on('response', response => {
      if (response.url().includes('favicon')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        })
      }
    })

    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    // Take screenshot
    await takeScreenshot(page, 'favicon-check')

    // Find favicon responses
    const faviconRequests = responses.filter(r => r.url.includes('favicon'))

    console.log('\n========== FAVICON DIAGNOSTICS ==========')
    console.log('Favicon requests:', JSON.stringify(faviconRequests, null, 2))

    if (faviconRequests.length > 0) {
      faviconRequests.forEach(req => {
        if (req.status === 404) {
          console.error(`❌ ISSUE #1 CONFIRMED: Favicon not found at ${req.url}`)
          console.log('FIX: Add favicon files to /public directory:')
          console.log('  - /public/favicon.ico')
          console.log('  - /public/favicon-16x16.png')
          console.log('  - /public/favicon-32x32.png')
        } else {
          console.log(`✅ Favicon loaded successfully: ${req.url} (${req.status})`)
        }
      })
    } else {
      console.log('⚠️  No favicon requests detected')
    }
    console.log('==========================================\n')
  })

  test('Issue #2: Check for React 19 compatibility warnings', async ({ page }) => {
    const warnings: string[] = []
    const errors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'warning' && (text.includes('React') || text.includes('Ant Design'))) {
        warnings.push(text)
      }
      if (msg.type() === 'error' && (text.includes('React') || text.includes('Ant Design'))) {
        errors.push(text)
      }
    })

    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000) // Wait for any delayed console messages

    await takeScreenshot(page, 'react-warnings')

    console.log('\n========== REACT 19 COMPATIBILITY ==========')
    console.log(`Warnings detected: ${warnings.length}`)
    console.log(`Errors detected: ${errors.length}`)

    if (warnings.length > 0) {
      console.warn('⚠️  ISSUE #2 CONFIRMED: React/Ant Design warnings:')
      warnings.forEach((w, i) => console.warn(`  ${i + 1}. ${w}`))
      console.log('\nFIX OPTIONS:')
      console.log('  1. Wait for Ant Design v5.x to fully support React 19')
      console.log('  2. Use React 18 instead: npm install react@18 react-dom@18')
      console.log('  3. Suppress warnings (not recommended for production)')
    } else {
      console.log('✅ No React/Ant Design warnings detected')
    }

    if (errors.length > 0) {
      console.error('❌ React/Ant Design errors found:')
      errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`))
    }
    console.log('==========================================\n')
  })

  test('Issue #3: Check WebSocket connection (port 3001)', async ({ page }) => {
    const wsRequests: any[] = []
    const wsErrors: any[] = []

    page.on('websocket', ws => {
      console.log(`[WebSocket] Connection attempt: ${ws.url()}`)

      ws.on('close', () => {
        console.log(`[WebSocket] Closed: ${ws.url()}`)
      })

      ws.on('socketerror', error => {
        console.error(`[WebSocket] Error: ${ws.url()}`, error)
        wsErrors.push({ url: ws.url(), error })
      })

      wsRequests.push({ url: ws.url() })
    })

    page.on('requestfailed', request => {
      if (request.url().includes('3001')) {
        wsErrors.push({
          url: request.url(),
          error: request.failure()?.errorText
        })
      }
    })

    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000) // Wait for WebSocket connection attempts

    await takeScreenshot(page, 'websocket-check')

    console.log('\n========== WEBSOCKET DIAGNOSTICS (PORT 3001) ==========')
    console.log(`WebSocket connection attempts: ${wsRequests.length}`)
    console.log(`WebSocket errors: ${wsErrors.length}`)

    if (wsRequests.length > 0) {
      console.log('\nWebSocket URLs attempted:')
      wsRequests.forEach(ws => console.log(`  - ${ws.url}`))
    }

    if (wsErrors.length > 0) {
      console.error('\n❌ ISSUE #3 CONFIRMED: WebSocket connection failed')
      wsErrors.forEach(err => {
        console.error(`  URL: ${err.url}`)
        console.error(`  Error: ${err.error}`)
      })

      console.log('\nFIX: Start WebSocket server on port 3001')
      console.log('  Current command: npm run dev')
      console.log('  Expected: WebSocket server running on ws://45.22.197.163:3001')
      console.log('\nFile: /home/master/projects/mi-ai-coding/server.js (line 115)')
      console.log('  Issue: WebSocket server binds to "localhost" instead of "0.0.0.0"')
      console.log('  Fix: Change wsServer.listen(wsPort, ...) to bind to 0.0.0.0')
    } else {
      console.log('✅ WebSocket connection successful')
    }
    console.log('==========================================\n')
  })

  test('Issue #4: Check VNC WebSocket connections (ports 6080, 6081)', async ({ page }) => {
    const vncWsRequests: any[] = []
    const vncErrors: any[] = []

    page.on('websocket', ws => {
      if (ws.url().includes('6080') || ws.url().includes('6081')) {
        console.log(`[VNC WebSocket] Connection attempt: ${ws.url()}`)
        vncWsRequests.push({ url: ws.url(), timestamp: new Date().toISOString() })

        ws.on('close', () => {
          console.log(`[VNC WebSocket] Closed: ${ws.url()}`)
        })

        ws.on('socketerror', error => {
          console.error(`[VNC WebSocket] Error: ${ws.url()}`, error)
          vncErrors.push({ url: ws.url(), error })
        })
      }
    })

    page.on('requestfailed', request => {
      if (request.url().includes('6080') || request.url().includes('6081')) {
        vncErrors.push({
          url: request.url(),
          error: request.failure()?.errorText
        })
      }
    })

    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(10000) // Wait longer for VNC connections

    await takeScreenshot(page, 'vnc-connections-check')

    console.log('\n========== VNC WEBSOCKET DIAGNOSTICS (PORTS 6080, 6081) ==========')
    console.log(`VNC WebSocket connection attempts: ${vncWsRequests.length}`)
    console.log(`VNC connection errors: ${vncErrors.length}`)

    if (vncWsRequests.length > 0) {
      console.log('\nVNC WebSocket URLs attempted:')
      vncWsRequests.forEach(ws => console.log(`  - ${ws.url}`))
    }

    if (vncErrors.length > 0) {
      console.error('\n❌ ISSUE #4 CONFIRMED: VNC WebSocket connections failed')
      vncErrors.forEach(err => {
        console.error(`  URL: ${err.url}`)
        console.error(`  Error: ${err.error}`)
      })

      console.log('\nROOT CAUSE ANALYSIS:')
      console.log('  1. VNC WebSocket URLs use "localhost" instead of "45.22.197.163"')
      console.log('     File: /home/master/projects/mi-ai-coding/components/vnc/VNCViewer.tsx')
      console.log('     Issue: WebSocket connects to ws://localhost:6080/6081')
      console.log('     Fix: Use window.location.hostname for dynamic host')
      console.log('')
      console.log('  2. VNC websockify servers may not be running')
      console.log('     Check: ./scripts/start-vnc.sh')
      console.log('     Expected: websockify running on 0.0.0.0:6080 and 0.0.0.0:6081')
      console.log('     Verify: netstat -tulpn | grep -E "6080|6081"')
    } else {
      console.log('✅ VNC WebSocket connections successful')
    }
    console.log('==========================================\n')
  })

  test('Issue #5: Check for noVNC TLS warnings', async ({ page }) => {
    const tlsWarnings: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('TLS') || text.includes('secure context') || text.includes('noVNC')) {
        tlsWarnings.push(text)
      }
    })

    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000)

    await takeScreenshot(page, 'tls-warnings-check')

    console.log('\n========== noVNC TLS DIAGNOSTICS ==========')
    console.log(`TLS warnings detected: ${tlsWarnings.length}`)

    if (tlsWarnings.length > 0) {
      console.warn('⚠️  ISSUE #5 CONFIRMED: noVNC TLS warnings:')
      tlsWarnings.forEach((w, i) => console.warn(`  ${i + 1}. ${w}`))

      console.log('\nFIX: Enable HTTPS/TLS for production deployment')
      console.log('  Current: http://45.22.197.163:3000 (insecure)')
      console.log('  Required: https://yourdomain.com (secure)')
      console.log('\nSteps:')
      console.log('  1. Obtain SSL certificate (Let\'s Encrypt or commercial)')
      console.log('  2. Configure Nginx as reverse proxy with SSL')
      console.log('  3. Update NEXTAUTH_URL in .env to use https://')
      console.log('  4. Restart services with SSL enabled')
      console.log('\nRelated files:')
      console.log('  - /home/master/projects/mi-ai-coding/scripts/deploy.sh')
      console.log('  - Nginx configuration needed for SSL termination')
    } else {
      console.log('✅ No TLS warnings detected')
    }
    console.log('==========================================\n')
  })

  test('Issue #6: Check for React DOM errors', async ({ page }) => {
    const domErrors: string[] = []

    page.on('pageerror', error => {
      if (error.message.includes('removeChild') || error.message.includes('not a child')) {
        domErrors.push(error.message)
      }
    })

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (text.includes('removeChild') || text.includes('not a child')) {
          domErrors.push(text)
        }
      }
    })

    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(5000)

    await takeScreenshot(page, 'dom-errors-check')

    console.log('\n========== REACT DOM ERROR DIAGNOSTICS ==========')
    console.log(`DOM errors detected: ${domErrors.length}`)

    if (domErrors.length > 0) {
      console.error('❌ ISSUE #6 CONFIRMED: React DOM errors:')
      domErrors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`))

      console.log('\nLIKELY CAUSES:')
      console.log('  1. React 19 incompatibility with Ant Design v5')
      console.log('  2. Component mounting/unmounting race conditions')
      console.log('  3. Dynamic imports with SSR issues')
      console.log('\nFIX OPTIONS:')
      console.log('  1. Downgrade to React 18: npm install react@18 react-dom@18')
      console.log('  2. Wait for Ant Design v5.x patch for React 19 support')
      console.log('  3. Check component lifecycle in:')
      console.log('     - /home/master/projects/mi-ai-coding/components/vnc/VNCViewerDynamic.tsx')
      console.log('     - /home/master/projects/mi-ai-coding/components/activity-log/ActivityStream.tsx')
    } else {
      console.log('✅ No React DOM errors detected')
    }
    console.log('==========================================\n')
  })

  test('Full Dashboard Component Rendering', async ({ page }) => {
    await page.goto('http://45.22.197.163:3000/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    await page.waitForTimeout(3000)

    console.log('\n========== COMPONENT RENDERING STATUS ==========')

    // Check File Explorer
    const fileExplorer = page.locator('text=File Explorer')
    const fileExplorerVisible = await fileExplorer.isVisible().catch(() => false)
    console.log(`File Explorer: ${fileExplorerVisible ? '✅ Rendered' : '❌ Not found'}`)

    // Check Code Editor (Monaco)
    const monacoEditor = page.locator('.monaco-editor').first()
    const monacoVisible = await monacoEditor.isVisible({ timeout: 10000 }).catch(() => false)
    console.log(`Monaco Editor: ${monacoVisible ? '✅ Rendered' : '❌ Not found'}`)

    // Check Terminal VNC
    const terminalVnc = page.locator('text=Terminal VNC')
    const terminalVncVisible = await terminalVnc.isVisible().catch(() => false)
    console.log(`Terminal VNC (:98): ${terminalVncVisible ? '✅ Rendered' : '❌ Not found'}`)

    // Check Playwright VNC
    const playwrightVnc = page.locator('text=Playwright VNC')
    const playwrightVncVisible = await playwrightVnc.isVisible().catch(() => false)
    console.log(`Playwright VNC (:99): ${playwrightVncVisible ? '✅ Rendered' : '❌ Not found'}`)

    // Check Activity Log
    const activityLog = page.locator('text=Activity Log')
    const activityLogVisible = await activityLog.isVisible().catch(() => false)
    console.log(`Activity Log: ${activityLogVisible ? '✅ Rendered' : '❌ Not found'}`)

    // Check WebSocket status badge
    const wsStatus = page.locator('text=Disconnected, text=Live').first()
    const wsStatusText = await wsStatus.textContent().catch(() => null)
    console.log(`WebSocket Status: ${wsStatusText || 'Not found'}`)

    console.log('==========================================\n')

    await takeScreenshot(page, 'full-dashboard-render')

    // Verify at least the main containers are present
    expect(fileExplorerVisible || terminalVncVisible || activityLogVisible).toBeTruthy()
  })
})

test.describe('Server Status Verification', () => {
  test('Check if servers are accessible from browser', async ({ page, context }) => {
    console.log('\n========== SERVER ACCESSIBILITY CHECK ==========')

    const servers = [
      { name: 'Next.js App', url: 'http://45.22.197.163:3000' },
      { name: 'WebSocket (3001)', url: 'http://45.22.197.163:3001', isWebSocket: true },
      { name: 'VNC Playwright (6080)', url: 'http://45.22.197.163:6080', isWebSocket: true },
      { name: 'VNC Terminal (6081)', url: 'http://45.22.197.163:6081', isWebSocket: true },
    ]

    for (const server of servers) {
      try {
        if (server.isWebSocket) {
          // For WebSocket servers, just log that they need manual verification
          console.log(`${server.name}: ⚠️  Requires WebSocket connection (check VNC components)`)
        } else {
          const response = await context.request.get(server.url)
          const status = response.status()
          console.log(`${server.name}: ${status >= 200 && status < 400 ? '✅' : '❌'} Status ${status}`)
        }
      } catch (error) {
        console.error(`${server.name}: ❌ Error: ${error}`)
      }
    }

    console.log('==========================================\n')
  })
})
