import { test, expect } from '@playwright/test'

/**
 * Debug Login Test
 *
 * Investigates why login is failing
 */

test.describe('Login Debug', () => {
  test('Debug login with console logging', async ({ page }) => {
    const consoleMessages: string[] = []
    const networkRequests: any[] = []
    const networkResponses: any[] = []

    // Capture console messages
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`
      consoleMessages.push(text)
      console.log(text)
    })

    // Capture network activity
    page.on('request', request => {
      const info = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postDataJSON?.()
      }
      networkRequests.push(info)
      console.log(`→ REQUEST: ${request.method()} ${request.url()}`)
    })

    page.on('response', async response => {
      const info = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      }
      networkResponses.push(info)
      console.log(`← RESPONSE: ${response.status()} ${response.url()}`)
    })

    // Navigate to login
    console.log('\n=== NAVIGATING TO LOGIN PAGE ===')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/debug-01-login-page.png', fullPage: true })
    console.log('\n=== PAGE LOADED ===')

    // Fill form
    console.log('\n=== FILLING FORM ===')
    const emailInput = page.locator('#login_email, input[placeholder*="email"]').first()
    const passwordInput = page.locator('#login_password, input[placeholder*="password"]').first()

    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 })

    await emailInput.fill('admin@example.com')
    console.log('Filled email')

    await passwordInput.fill('admin123')
    console.log('Filled password')

    await page.screenshot({ path: 'tests/screenshots/debug-02-form-filled.png', fullPage: true })

    // Submit
    console.log('\n=== SUBMITTING FORM ===')
    await page.click('button[type="submit"]')

    // Wait and observe
    await page.waitForTimeout(8000)

    const currentUrl = page.url()
    console.log('\n=== RESULT ===')
    console.log('Current URL:', currentUrl)

    await page.screenshot({ path: 'tests/screenshots/debug-03-after-submit.png', fullPage: true })

    // Check for error messages
    const errorAlerts = await page.locator('[role="alert"], .ant-message, .ant-notification').count()
    console.log('Error alerts found:', errorAlerts)

    if (errorAlerts > 0) {
      for (let i = 0; i < errorAlerts; i++) {
        const alertText = await page.locator('[role="alert"], .ant-message, .ant-notification').nth(i).textContent()
        console.log(`Alert ${i + 1}:`, alertText)
      }
    }

    // Summary
    console.log('\n=== CONSOLE MESSAGES ===')
    consoleMessages.forEach(msg => console.log(msg))

    console.log('\n=== NETWORK SUMMARY ===')
    console.log(`Total requests: ${networkRequests.length}`)
    console.log(`Total responses: ${networkResponses.length}`)

    // Look for auth requests
    const authRequests = networkRequests.filter(r => r.url.includes('/api/auth'))
    console.log('\n=== AUTH REQUESTS ===')
    authRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`)
      if (req.postData) {
        console.log('POST Data:', JSON.stringify(req.postData, null, 2))
      }
    })

    const authResponses = networkResponses.filter(r => r.url.includes('/api/auth'))
    console.log('\n=== AUTH RESPONSES ===')
    authResponses.forEach(res => {
      console.log(`${res.status} ${res.statusText} - ${res.url}`)
    })

    // Determine success
    const isSuccess = currentUrl.includes('/dashboard') || !currentUrl.includes('/login')
    console.log('\n=== TEST RESULT ===')
    console.log(`Login ${isSuccess ? 'SUCCESS' : 'FAILED'}`)

    if (!isSuccess) {
      console.log('\nDEBUG INFO:')
      console.log('- Check if NextAuth API is responding')
      console.log('- Check if database connection is working')
      console.log('- Check if password hash matches')
      console.log('- Review server logs for errors')
    }
  })
})
