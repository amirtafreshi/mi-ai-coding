import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Dashboard Verification After VNCViewer Fix', () => {
  test('should load dashboard without removeChild errors', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes timeout
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    const consoleMessages: Array<{ type: string; text: string }> = []

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text()
      const type = msg.type()

      consoleMessages.push({ type, text })

      if (type === 'error') {
        consoleErrors.push(text)
      } else if (type === 'warning') {
        consoleWarnings.push(text)
      }
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`)
    })

    console.log('\n=== Step 1: Navigate to Login Page ===')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    console.log('✓ Login page loaded')
    await page.screenshot({
      path: path.join(__dirname, '../test-results/01-login-page.png'),
      fullPage: true
    })

    console.log('\n=== Step 2: Login with admin credentials ===')
    // Wait for the form to be visible
    await page.waitForSelector('input[placeholder="email@example.com"]', { timeout: 5000 })

    // Fill in credentials using placeholder selectors (Ant Design inputs)
    await page.fill('input[placeholder="email@example.com"]', 'admin@example.com')
    await page.fill('input[placeholder="Enter your password"]', 'admin123')

    console.log('✓ Credentials entered')
    await page.screenshot({
      path: path.join(__dirname, '../test-results/02-credentials-entered.png'),
      fullPage: true
    })

    // Click login button
    await page.click('button:has-text("Sign In")')
    console.log('✓ Login button clicked')

    console.log('\n=== Step 3: Wait for dashboard to load ===')
    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:3000/', { timeout: 30000 })
    console.log('✓ Navigated to dashboard URL')

    // Wait for main dashboard elements to load
    await page.waitForTimeout(5000)

    console.log('\n=== Step 4: Check for removeChild errors ===')
    const removeChildErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('removechild') ||
      err.toLowerCase().includes('remove child')
    )

    if (removeChildErrors.length > 0) {
      console.log('❌ FOUND removeChild errors:')
      removeChildErrors.forEach(err => console.log(`  - ${err}`))
    } else {
      console.log('✅ NO removeChild errors found!')
    }

    console.log('\n=== Step 5: Check dashboard UI components ===')

    // Check File Explorer
    const fileExplorer = page.locator('text=File Explorer').first()
    const fileExplorerVisible = await fileExplorer.isVisible().catch(() => false)
    console.log(`${fileExplorerVisible ? '✅' : '❌'} File Explorer: ${fileExplorerVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

    // Check Code Editor
    const codeEditor = page.locator('text=Code Editor').first()
    const codeEditorVisible = await codeEditor.isVisible().catch(() => false)
    console.log(`${codeEditorVisible ? '✅' : '❌'} Code Editor: ${codeEditorVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

    // Check VNC Viewers
    const vncTerminal = page.locator('text=Terminal VNC').first()
    const vncTerminalVisible = await vncTerminal.isVisible().catch(() => false)
    console.log(`${vncTerminalVisible ? '✅' : '❌'} Terminal VNC: ${vncTerminalVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

    const vncPlaywright = page.locator('text=Playwright VNC').first()
    const vncPlaywrightVisible = await vncPlaywright.isVisible().catch(() => false)
    console.log(`${vncPlaywrightVisible ? '✅' : '❌'} Playwright VNC: ${vncPlaywrightVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

    // Check Activity Log
    const activityLog = page.locator('text=Activity Log').first()
    const activityLogVisible = await activityLog.isVisible().catch(() => false)
    console.log(`${activityLogVisible ? '✅' : '❌'} Activity Log: ${activityLogVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

    console.log('\n=== Step 6: Take final screenshot ===')
    await page.screenshot({
      path: path.join(__dirname, '../test-results/03-dashboard-loaded.png'),
      fullPage: true
    })
    console.log('✓ Screenshot saved')

    console.log('\n=== Step 7: Console Error Report ===')
    console.log(`Total console messages: ${consoleMessages.length}`)
    console.log(`Total errors: ${consoleErrors.length}`)
    console.log(`Total warnings: ${consoleWarnings.length}`)

    if (consoleErrors.length > 0) {
      console.log('\n❌ ALL CONSOLE ERRORS:')
      consoleErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`)
      })
    } else {
      console.log('\n✅ NO CONSOLE ERRORS!')
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  CONSOLE WARNINGS:')
      consoleWarnings.slice(0, 10).forEach((warn, idx) => {
        console.log(`  ${idx + 1}. ${warn}`)
      })
      if (consoleWarnings.length > 10) {
        console.log(`  ... and ${consoleWarnings.length - 10} more warnings`)
      }
    }

    console.log('\n=== SUMMARY ===')
    console.log(`removeChild errors: ${removeChildErrors.length}`)
    console.log(`File Explorer visible: ${fileExplorerVisible}`)
    console.log(`Code Editor visible: ${codeEditorVisible}`)
    console.log(`Terminal VNC visible: ${vncTerminalVisible}`)
    console.log(`Playwright VNC visible: ${vncPlaywrightVisible}`)
    console.log(`Activity Log visible: ${activityLogVisible}`)
    console.log(`Total errors: ${consoleErrors.length}`)

    // Assertions
    expect(removeChildErrors.length).toBe(0)
    expect(consoleErrors.length).toBe(0)
    expect(fileExplorerVisible).toBe(true)
    expect(codeEditorVisible).toBe(true)
    expect(activityLogVisible).toBe(true)
  })
})
