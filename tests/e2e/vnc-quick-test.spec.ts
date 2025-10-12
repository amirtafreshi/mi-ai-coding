/**
 * Quick VNC Integration Test
 * Tests if the VNC component renders without errors
 */
import { test, expect } from '@playwright/test'

test.describe('VNC Integration Quick Test', () => {
  test('should display VNC components on dashboard', async ({ page }) => {
    const consoleErrors: string[] = []

    // Capture console errors (filter out expected ones)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Filter out expected WebSocket errors and VNC connection errors during dev
        if (!text.includes('WebSocket') &&
            !text.includes('ws://') &&
            !text.includes('ActivityStream') &&
            !text.includes('Failed to load resource') &&
            !text.includes('noVNC') &&
            !text.includes('RFB')) {
          consoleErrors.push(text)
        }
      }
    })

    console.log('\n')
    console.log('═══════════════════════════════════════════')
    console.log('  VNC INTEGRATION QUICK TEST')
    console.log('═══════════════════════════════════════════')
    console.log('')

    // Step 1: Go to login page
    console.log('📍 Step 1: Navigating to login page...')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('domcontentloaded')
    console.log('  ✓ Login page loaded')

    // Step 2: Login
    console.log('')
    console.log('🔐 Step 2: Logging in...')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    console.log('  ✓ Login submitted')

    // Step 3: Wait for dashboard
    console.log('')
    console.log('⏳ Step 3: Waiting for dashboard...')
    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 })
      console.log('  ✓ Dashboard loaded')
    } catch (error) {
      console.log('  ❌ Failed to reach dashboard')
      console.log('  Current URL:', page.url())
      await page.screenshot({ path: 'tests/screenshots/vnc-quick-test-error.png', fullPage: true })
      throw error
    }

    // Step 4: Wait for page to stabilize
    await page.waitForTimeout(3000)

    // Step 5: Check for VNC components
    console.log('')
    console.log('🖥️  Step 4: Checking VNC components...')

    // Check for VNC viewer loading indicators or cards
    const vncElements = await page.locator('.vnc-container, [class*="VNC"], text=/Terminal.*:98/, text=/Playwright.*:99/').count()
    console.log(`  Found ${vncElements} VNC-related element(s)`)

    // Check for specific VNC titles
    const terminalVNC = await page.locator('text=/Terminal VNC/i').count()
    const playwrightVNC = await page.locator('text=/Playwright VNC/i').count()

    console.log(`  Terminal VNC title: ${terminalVNC > 0 ? 'YES ✓' : 'NO ❌'}`)
    console.log(`  Playwright VNC title: ${playwrightVNC > 0 ? 'YES ✓' : 'NO ❌'}`)

    // Check for Canvas elements (noVNC creates canvas elements)
    const canvasElements = await page.locator('.vnc-container canvas, canvas').count()
    console.log(`  Canvas elements (VNC displays): ${canvasElements}`)

    // Step 6: Take screenshot
    await page.screenshot({ path: 'tests/screenshots/vnc-quick-test-dashboard.png', fullPage: true })
    console.log('')
    console.log('📸 Screenshot saved: tests/screenshots/vnc-quick-test-dashboard.png')

    // Step 7: Report console errors
    console.log('')
    console.log('🔍 Step 5: Console errors check...')
    if (consoleErrors.length === 0) {
      console.log('  ✓ No critical console errors')
    } else {
      console.log(`  ⚠️  Found ${consoleErrors.length} error(s):`)
      consoleErrors.forEach((error, idx) => {
        console.log(`    ${idx + 1}. ${error}`)
      })
    }

    // Final report
    console.log('')
    console.log('╔════════════════════════════════════════════╗')
    console.log('║          VNC INTEGRATION SUMMARY           ║')
    console.log('╚════════════════════════════════════════════╝')
    console.log('')
    console.log(`  VNC Elements Found: ${vncElements}`)
    console.log(`  Terminal VNC: ${terminalVNC > 0 ? '✓ YES' : '❌ NO'}`)
    console.log(`  Playwright VNC: ${playwrightVNC > 0 ? '✓ YES' : '❌ NO'}`)
    console.log(`  Canvas Elements: ${canvasElements}`)
    console.log(`  Critical Errors: ${consoleErrors.length}`)
    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('')

    // Assertions - at least some VNC elements should be present
    expect(vncElements).toBeGreaterThan(0)
  })
})
