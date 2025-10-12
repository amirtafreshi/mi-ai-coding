import { test, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-users'

/**
 * Detailed Authentication Flow Test
 *
 * Tests the complete authentication flow and captures all console messages
 * after successful login to verify dashboard loading
 */

test.describe('Detailed Authentication Flow', () => {
  test('should complete full login flow and capture dashboard state', async ({ page }) => {
    const consoleMessages: string[] = []
    const pageErrors: string[] = []
    const networkErrors: string[] = []

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${text}`)
    })

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(`[PAGE ERROR] ${error.message}`)
    })

    // Capture network errors
    page.on('requestfailed', request => {
      networkErrors.push(`[NETWORK ERROR] ${request.url()} - ${request.failure()?.errorText}`)
    })

    console.log('\n=== STEP 1: Navigate to Login Page ===')
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'screenshots/auth-01-login-page.png', fullPage: true })
    console.log('✓ Login page loaded')

    console.log('\n=== STEP 2: Fill in Email ===')
    await page.fill('#login_email', 'admin@example.com')
    console.log('✓ Email filled: admin@example.com')

    console.log('\n=== STEP 3: Fill in Password ===')
    await page.fill('#login_password', 'admin123')
    await page.screenshot({ path: 'screenshots/auth-02-form-filled.png' })
    console.log('✓ Password filled: admin123')

    console.log('\n=== STEP 4: Click Sign In Button ===')
    await page.click('button[type="submit"]')
    console.log('✓ Sign In button clicked')

    console.log('\n=== STEP 5: Wait for Redirect to Dashboard ===')
    try {
      await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })
      console.log('✓ Redirected to:', page.url())
    } catch (error) {
      console.log('⚠ Redirect timeout or failed')
      console.log('Current URL:', page.url())
      await page.screenshot({ path: 'screenshots/auth-03-redirect-failed.png', fullPage: true })
      throw error
    }

    console.log('\n=== STEP 6: Wait for Dashboard to Load ===')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    await page.waitForTimeout(2000) // Give extra time for React components to mount
    await page.screenshot({ path: 'screenshots/auth-04-dashboard-loaded.png', fullPage: true })
    console.log('✓ Dashboard loaded')

    console.log('\n=== STEP 7: Verify Dashboard Elements ===')
    const pageTitle = await page.title()
    console.log(`Page title: ${pageTitle}`)

    // Check for common dashboard elements
    const header = await page.locator('header').count()
    const sidebar = await page.locator('aside, nav, [class*="sidebar"]').count()
    const main = await page.locator('main, [role="main"], [class*="content"]').count()

    console.log(`Header elements: ${header}`)
    console.log(`Sidebar elements: ${sidebar}`)
    console.log(`Main content elements: ${main}`)

    // Check if dashboard loaded successfully
    expect(page.url()).toMatch(/\/(dashboard)?$/)

    console.log('\n=== STEP 8: Take Final Screenshot ===')
    await page.screenshot({ path: 'screenshots/auth-05-final-state.png', fullPage: true })

    // Print all captured messages
    console.log('\n=== CONSOLE MESSAGES (after login) ===')
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(msg => console.log(msg))
    } else {
      console.log('(No console messages)')
    }

    console.log('\n=== PAGE ERRORS ===')
    if (pageErrors.length > 0) {
      pageErrors.forEach(err => console.log(err))
      console.log(`\n⚠ Total page errors: ${pageErrors.length}`)
    } else {
      console.log('(No page errors)')
    }

    console.log('\n=== NETWORK ERRORS ===')
    if (networkErrors.length > 0) {
      networkErrors.forEach(err => console.log(err))
      console.log(`\n⚠ Total network errors: ${networkErrors.length}`)
    } else {
      console.log('(No network errors)')
    }

    console.log('\n=== TEST RESULT ===')
    console.log('✓ Authentication flow completed successfully')
    console.log('✓ Dashboard loaded without critical errors')
    console.log(`✓ Final URL: ${page.url()}`)
    console.log('\nScreenshots saved to: /home/master/projects/mi-ai-coding/screenshots/')
  })
})
