import { test, expect, chromium } from '@playwright/test'
import path from 'path'

test.describe('Direct Dashboard Error Investigation', () => {
  test('Navigate directly to dashboard and capture errors', async () => {
    // Launch browser with display :99
    const browser = await chromium.launch({
      headless: false,
      slowMo: 500
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    const consoleMessages: Array<{ type: string; text: string }> = []
    const pageErrors: Array<{ message: string; stack?: string }> = []

    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      consoleMessages.push({ type, text })
      console.log(`[${type.toUpperCase()}] ${text}`)
    })

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack
      })
      console.log(`[PAGE ERROR] ${error.message}`)
      if (error.stack) {
        console.log(`[STACK] ${error.stack}`)
      }
    })

    try {
      // Navigate to login page first
      console.log('Step 1: Navigating to login page...')
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
      await page.screenshot({ path: '/tmp/error-capture-01-login-page.png', fullPage: true })

      // Login
      console.log('Step 2: Filling login form...')
      await page.waitForSelector('input[name="email"]', { timeout: 5000 })
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'admin123')
      await page.screenshot({ path: '/tmp/error-capture-02-before-submit.png', fullPage: true })

      console.log('Step 3: Submitting login...')
      await page.click('button[type="submit"]')

      // Wait for navigation to dashboard
      console.log('Step 4: Waiting for dashboard...')
      await page.waitForURL('**/dashboard', { timeout: 15000 })
      await page.screenshot({ path: '/tmp/error-capture-03-dashboard-loaded.png', fullPage: true })

      // Wait for page to settle
      console.log('Step 5: Waiting for page to settle...')
      await page.waitForTimeout(5000)
      await page.screenshot({ path: '/tmp/error-capture-04-after-settle.png', fullPage: true })

      // Check for error overlays
      console.log('Step 6: Checking for error overlays...')
      const errorOverlaySelectors = [
        '[data-nextjs-dialog-overlay]',
        '[data-nextjs-toast]',
        '.nextjs-error-overlay',
        '#nextjs__container_errors_label',
        '[role="alert"]',
        '.ant-notification',
        '.ant-message'
      ]

      for (const selector of errorOverlaySelectors) {
        const element = page.locator(selector)
        const count = await element.count()
        if (count > 0) {
          console.log(`Found error overlay with selector: ${selector}`)
          const text = await element.allTextContents()
          console.log(`Error text: ${text.join('\n')}`)

          try {
            await element.first().screenshot({ path: `/tmp/error-capture-overlay-${selector.replace(/[^a-z0-9]/gi, '_')}.png` })
          } catch (e) {
            console.log(`Could not screenshot ${selector}`)
          }
        }
      }

      // Check for specific text in the page
      console.log('Step 7: Checking for error text in page...')
      const pageContent = await page.content()

      if (pageContent.includes('You are calling notice in render')) {
        console.log('FOUND: "You are calling notice in render" error in page')
      }

      if (pageContent.includes('message handler took')) {
        console.log('FOUND: "message handler took" performance warning in page')
      }

      // Take final screenshot
      await page.screenshot({ path: '/tmp/error-capture-05-final.png', fullPage: true })

      // Generate report
      console.log('\n\n=== ERROR INVESTIGATION REPORT ===\n')
      console.log(`Total Console Messages: ${consoleMessages.length}`)
      console.log(`Total Page Errors: ${pageErrors.length}`)

      console.log('\n--- Console Errors ---')
      const errors = consoleMessages.filter(m => m.type === 'error')
      errors.forEach((error, i) => {
        console.log(`\n[${i + 1}] ${error.text}`)
      })

      console.log('\n--- Console Warnings ---')
      const warnings = consoleMessages.filter(m => m.type === 'warning')
      warnings.forEach((warning, i) => {
        console.log(`\n[${i + 1}] ${warning.text}`)
      })

      console.log('\n--- Page Errors ---')
      pageErrors.forEach((error, i) => {
        console.log(`\n[${i + 1}] ${error.message}`)
        if (error.stack) {
          console.log(`Stack: ${error.stack}`)
        }
      })

      console.log('\n--- Screenshots Saved ---')
      console.log('1. /tmp/error-capture-01-login-page.png')
      console.log('2. /tmp/error-capture-02-before-submit.png')
      console.log('3. /tmp/error-capture-03-dashboard-loaded.png')
      console.log('4. /tmp/error-capture-04-after-settle.png')
      console.log('5. /tmp/error-capture-05-final.png')

    } catch (error) {
      console.error('Test failed:', error)
      await page.screenshot({ path: '/tmp/error-capture-FAILED.png', fullPage: true })
      throw error
    } finally {
      await browser.close()
    }
  })
})
