import { test, expect, Page } from '@playwright/test'

test.describe('Error Overlay Investigation', () => {
  let consoleErrors: Array<{ type: string; text: string; timestamp: Date }> = []
  let consoleWarnings: Array<{ type: string; text: string; timestamp: Date }> = []

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      const timestamp = new Date()
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        consoleErrors.push({ type, text, timestamp })
        console.log(`[CONSOLE ERROR] ${text}`)
      } else if (type === 'warning') {
        consoleWarnings.push({ type, text, timestamp })
        console.log(`[CONSOLE WARNING] ${text}`)
      }
    })

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`)
      console.log(`[STACK] ${error.stack}`)
    })
  })

  test('Capture error overlays on dashboard', async ({ page }) => {
    // Navigate to login page
    console.log('Navigating to http://localhost:3000...')
    await page.goto('http://localhost:3000')

    // Take screenshot of initial page
    await page.screenshot({
      path: '/tmp/1-initial-page.png',
      fullPage: true
    })
    console.log('Screenshot saved: 1-initial-page.png')

    // Fill in login credentials
    console.log('Logging in with admin@example.com...')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')

    // Screenshot before clicking login
    await page.screenshot({
      path: '/tmp/2-before-login.png',
      fullPage: true
    })
    console.log('Screenshot saved: 2-before-login.png')

    // Click login button
    await page.click('button[type="submit"]')

    // Wait for navigation
    console.log('Waiting for dashboard to load...')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Wait a bit more for any error overlays to appear
    await page.waitForTimeout(3000)

    // Take screenshot of dashboard with any error overlays
    await page.screenshot({
      path: '/tmp/3-dashboard-with-errors.png',
      fullPage: true
    })
    console.log('Screenshot saved: 3-dashboard-with-errors.png')

    // Check for React error overlay
    const errorOverlay = page.locator('[data-nextjs-dialog-overlay], [data-nextjs-toast], .nextjs-error-overlay, #nextjs__container_errors_label')
    const hasErrorOverlay = await errorOverlay.count() > 0

    if (hasErrorOverlay) {
      console.log('ERROR OVERLAY DETECTED!')

      // Get error overlay text
      const errorText = await errorOverlay.allTextContents()
      console.log('Error overlay text:', errorText)

      // Screenshot just the error overlay
      await errorOverlay.first().screenshot({
        path: '/tmp/4-error-overlay-closeup.png'
      })
      console.log('Screenshot saved: 4-error-overlay-closeup.png')
    } else {
      console.log('No error overlay found')
    }

    // Check for specific error messages in the page
    const vncViewerError = page.locator('text=/You are calling notice in render/i')
    const activityStreamError = page.locator('text=/message handler took/i')

    if (await vncViewerError.count() > 0) {
      console.log('Found VNCViewer error message')
    }

    if (await activityStreamError.count() > 0) {
      console.log('Found ActivityStream performance warning')
    }

    // Screenshot the VNC viewers
    const vncDisplay98 = page.locator('iframe[src*="6081"]').first()
    const vncDisplay99 = page.locator('iframe[src*="6080"]').first()

    if (await vncDisplay98.count() > 0) {
      console.log('VNC Display :98 found')
      await page.screenshot({
        path: '/tmp/5-vnc-display-98.png',
        fullPage: true
      })
    }

    if (await vncDisplay99.count() > 0) {
      console.log('VNC Display :99 found')
      await page.screenshot({
        path: '/tmp/6-vnc-display-99.png',
        fullPage: true
      })
    }

    // Get the browser console output
    console.log('\n=== CONSOLE ERRORS ===')
    consoleErrors.forEach((error, i) => {
      console.log(`\n[${i + 1}] ${error.timestamp.toISOString()}`)
      console.log(`Type: ${error.type}`)
      console.log(`Message: ${error.text}`)
    })

    console.log('\n=== CONSOLE WARNINGS ===')
    consoleWarnings.forEach((warning, i) => {
      console.log(`\n[${i + 1}] ${warning.timestamp.toISOString()}`)
      console.log(`Type: ${warning.type}`)
      console.log(`Message: ${warning.text}`)
    })

    // Take final screenshot
    await page.screenshot({
      path: '/tmp/7-final-dashboard-state.png',
      fullPage: true
    })
    console.log('Screenshot saved: 7-final-dashboard-state.png')

    // Generate error report
    console.log('\n\n=== ERROR REPORT ===')
    console.log(`Total Console Errors: ${consoleErrors.length}`)
    console.log(`Total Console Warnings: ${consoleWarnings.length}`)
    console.log(`Error Overlay Present: ${hasErrorOverlay}`)
    console.log('\nScreenshots saved to /tmp/')
    console.log('- 1-initial-page.png')
    console.log('- 2-before-login.png')
    console.log('- 3-dashboard-with-errors.png')
    if (hasErrorOverlay) {
      console.log('- 4-error-overlay-closeup.png')
    }
    console.log('- 5-vnc-display-98.png (if VNC loaded)')
    console.log('- 6-vnc-display-99.png (if VNC loaded)')
    console.log('- 7-final-dashboard-state.png')
  })
})
