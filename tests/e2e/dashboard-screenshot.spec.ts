import { test, expect } from '@playwright/test'

/**
 * Dashboard Screenshot Test
 * Captures a screenshot of the authenticated dashboard for documentation
 */

test.describe('Dashboard Screenshot', () => {
  test('capture authenticated dashboard', async ({ page }) => {
    // Navigate and login
    await page.goto('http://localhost:3000/login')
    await page.waitForTimeout(2000)

    // Fill in login form
    await page.fill('input#login_email', 'admin@example.com')
    await page.fill('input#login_password', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForTimeout(5000)

    // Take screenshot
    await page.screenshot({ path: '/tmp/dashboard-authenticated.png', fullPage: true })
    console.log('Dashboard screenshot saved to /tmp/dashboard-authenticated.png')
  })
})
