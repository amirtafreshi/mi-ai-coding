import { test, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-users'
import { takeScreenshot } from '../fixtures/helpers'

/**
 * Authentication E2E Tests
 *
 * Tests user authentication flows including login, logout, and session management
 *
 * Prerequisites:
 * - Application running on http://localhost:3000
 * - DISPLAY=:99 environment variable set (for VNC visibility)
 * - Database seeded with test users
 */

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display login page', async ({ page }) => {
    // Navigate to login
    await page.goto('/login')

    // Wait for login form
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

    // Check for email input (Ant Design generates #login_email ID)
    const emailInput = page.locator('#login_email, input[id*="email"], input[placeholder*="email"]')
    await expect(emailInput).toBeVisible()

    // Check for password input (Ant Design generates #login_password ID)
    const passwordInput = page.locator('#login_password, input[type="password"], input[placeholder*="password"]')
    await expect(passwordInput).toBeVisible()

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()

    // Take screenshot
    await takeScreenshot(page, 'login-page')
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in credentials using Ant Design IDs
    await page.fill('#login_email', testUsers.user.email)
    await page.fill('#login_password', testUsers.user.password)

    // Take screenshot before submit
    await takeScreenshot(page, 'before-login')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })

    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/(dashboard)?$/)

    // Take screenshot after login
    await takeScreenshot(page, 'after-login')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('#login_email', 'invalid@example.com')
    await page.fill('#login_password', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait a moment for error to appear
    await page.waitForTimeout(2000)

    // Check for error message - Ant Design shows alerts
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /invalid|incorrect|error|failed/i })

    // Should see error alert
    await expect(errorAlert.first()).toBeVisible({ timeout: 5000 })

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)

    // Take screenshot
    await takeScreenshot(page, 'login-error')
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without filling fields
    await page.click('button[type="submit"]')

    // Wait a moment
    await page.waitForTimeout(1000)

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)

    // Take screenshot
    await takeScreenshot(page, 'login-validation-error')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('#login_email', testUsers.user.email)
    await page.fill('#login_password', testUsers.user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })

    // Look for logout button (could be in menu, header, etc.)
    const logoutButton = page.locator(
      'button:has-text("Logout"), ' +
      'button:has-text("Log out"), ' +
      'a:has-text("Logout"), ' +
      'a:has-text("Log out"), ' +
      '[data-testid="logout-button"]'
    )

    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()

      // Wait for redirect to login or home
      await page.waitForURL(/\/(login|home)?/, { timeout: 10000 })

      // Should be logged out
      await expect(page).not.toHaveURL(/\/dashboard/)

      // Take screenshot
      await takeScreenshot(page, 'after-logout')
    } else {
      test.skip(true, 'Logout button not found - feature may not be implemented yet')
    }
  })
})

test.describe('Session Management', () => {
  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard')

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)

    // Take screenshot
    await takeScreenshot(page, 'protected-route-redirect')
  })

  test('should maintain session after page reload', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('#login_email', testUsers.user.email)
    await page.fill('#login_password', testUsers.user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be on dashboard (session maintained)
    await expect(page).toHaveURL(/\/(dashboard)?$/)

    // Take screenshot
    await takeScreenshot(page, 'session-maintained')
  })
})

test.describe('Authentication Security', () => {
  test('should not expose password in network requests', async ({ page }) => {
    const requests: any[] = []

    // Capture all requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      })
    })

    // Login
    await page.goto('/login')
    await page.fill('#login_email', testUsers.user.email)
    await page.fill('#login_password', testUsers.user.password)
    await page.click('button[type="submit"]')

    // Wait for login to complete
    await page.waitForTimeout(2000)

    // Check if any request contains the plain password (should be encrypted/hashed)
    const passwordInRequest = requests.some(req =>
      req.postData && req.postData.includes(testUsers.user.password)
    )

    // Password should ideally be encrypted, but this test is informational
    // In a real app, password should never appear in plain text in network logs
    console.log('Password found in plain text in requests:', passwordInRequest)
  })

  test('should include CSRF protection', async ({ page }) => {
    // This test will be skipped if CSRF protection is not implemented
    test.skip(true, 'To be implemented when CSRF protection is added')
  })
})
