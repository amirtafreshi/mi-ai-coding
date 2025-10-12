/**
 * Debug login flow to identify authentication issue
 */
import { test, expect } from '@playwright/test'

test.use({ storageState: undefined })

test('Debug login flow with detailed logging', async ({ page }) => {
  const consoleMessages: any[] = []
  const networkRequests: any[] = []
  const networkResponses: any[] = []

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    })
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
  })

  // Capture network activity
  page.on('request', request => {
    if (request.url().includes('/api/auth')) {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        postData: request.postData()
      })
      console.log(`[REQUEST] ${request.method()} ${request.url()}`)
    }
  })

  page.on('response', async response => {
    if (response.url().includes('/api/auth')) {
      const status = response.status()
      let body = null
      try {
        body = await response.text()
      } catch (e) {
        // Can't read body
      }
      networkResponses.push({
        method: response.request().method(),
        url: response.url(),
        status,
        body
      })
      console.log(`[RESPONSE] ${response.request().method()} ${response.url()} - ${status}`)
      if (body) {
        console.log(`[RESPONSE BODY] ${body.substring(0, 200)}`)
      }
    }
  })

  console.log('\n=== LOGIN DEBUG TEST ===\n')

  // Navigate to login
  console.log('1. Navigating to login page...')
  await page.goto('http://localhost:3000/login')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/screenshots/debug-01-login-page.png' })

  // Fill credentials
  console.log('2. Filling credentials...')
  await page.fill('input[name="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.screenshot({ path: 'tests/screenshots/debug-02-filled.png' })

  // Submit
  console.log('3. Clicking Sign In button...')
  const submitPromise = page.waitForResponse(
    response => response.url().includes('/api/auth/callback/credentials'),
    { timeout: 10000 }
  ).catch(() => null)

  await page.click('button[type="submit"]')

  // Wait for auth response
  const authResponse = await submitPromise
  if (authResponse) {
    console.log(`[AUTH RESPONSE] Status: ${authResponse.status()}`)
    try {
      const responseBody = await authResponse.text()
      console.log(`[AUTH RESPONSE BODY] ${responseBody}`)
    } catch (e) {
      console.log('[AUTH RESPONSE BODY] Could not read body')
    }
  }

  // Wait for navigation or error
  await page.waitForTimeout(3000)
  const currentUrl = page.url()
  console.log(`4. Current URL after submit: ${currentUrl}`)

  await page.screenshot({ path: 'tests/screenshots/debug-03-after-submit.png' })

  // Check for error messages on page
  const pageText = await page.textContent('body')
  if (pageText?.includes('Invalid email or password')) {
    console.log('❌ Error message found on page: Invalid email or password')
  }
  if (pageText?.includes('unexpected error')) {
    console.log('❌ Error message found on page: unexpected error')
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Final URL: ${currentUrl}`)
  console.log(`Auth requests: ${networkRequests.filter(r => r.url.includes('/callback/credentials')).length}`)
  console.log(`Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`)

  console.log('\n=== ALL AUTH NETWORK ACTIVITY ===')
  networkRequests.forEach((req, idx) => {
    console.log(`[${idx + 1}] ${req.method} ${req.url}`)
    if (req.postData) {
      console.log(`    POST Data: ${req.postData}`)
    }
  })

  networkResponses.forEach((res, idx) => {
    console.log(`[${idx + 1}] ${res.status} ${res.url}`)
    if (res.body) {
      console.log(`    Body: ${res.body.substring(0, 300)}`)
    }
  })

  console.log('\n===================\n')
})
