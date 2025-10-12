/**
 * Authentication Helper for Playwright E2E Tests
 *
 * Provides reusable authentication functions using Playwright's storage state feature
 * This allows tests to share authentication state and avoid repeated logins
 *
 * Usage:
 * 1. Run auth setup once (Playwright config handles this automatically)
 * 2. Tests use stored auth state via storageState option
 */

import { Page, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-users'
import path from 'path'

// Storage state paths
export const AUTH_STATE_DIR = path.join(__dirname, '../.auth')
export const USER_AUTH_FILE = path.join(AUTH_STATE_DIR, 'user.json')
export const ADMIN_AUTH_FILE = path.join(AUTH_STATE_DIR, 'admin.json')
export const DEVELOPER_AUTH_FILE = path.join(AUTH_STATE_DIR, 'developer.json')

/**
 * Authenticate a user and save session state to file
 * This function is used in the global setup to create reusable auth states
 */
export async function authenticateUser(
  page: Page,
  email: string,
  password: string,
  storageStatePath: string
): Promise<void> {
  // Navigate to login page
  await page.goto('/login')

  // Wait for login form to be visible
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

  // Fill in credentials using Ant Design IDs
  // Ant Design Form fields have id pattern: formname_fieldname
  const emailInput = page.locator('#login_email')
  const passwordInput = page.locator('#login_password')

  // Use type() with delay for better compatibility with Ant Design forms
  await emailInput.click()
  await emailInput.fill('')
  await emailInput.type(email, { delay: 50 })

  await passwordInput.click()
  await passwordInput.fill('')
  await passwordInput.type(password, { delay: 50 })

  // Wait for form to update
  await page.waitForTimeout(500)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for successful login redirect to dashboard
  // Allow more time for server compilation during first load
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 })

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle')

  // Verify we're authenticated by checking we're on dashboard
  await expect(page).toHaveURL(/\/(dashboard)?$/)

  // Save storage state (cookies, localStorage, sessionStorage)
  await page.context().storageState({ path: storageStatePath })

  console.log(`✓ Authentication successful for ${email}`)
  console.log(`✓ Storage state saved to ${storageStatePath}`)
}

/**
 * Setup authentication for default test user
 * Used in global-setup.ts
 */
export async function setupUserAuth(page: Page): Promise<void> {
  await authenticateUser(
    page,
    testUsers.user.email,
    testUsers.user.password,
    USER_AUTH_FILE
  )
}

/**
 * Setup authentication for admin user
 * Used in global-setup.ts
 */
export async function setupAdminAuth(page: Page): Promise<void> {
  await authenticateUser(
    page,
    testUsers.admin.email,
    testUsers.admin.password,
    ADMIN_AUTH_FILE
  )
}

/**
 * Setup authentication for developer user
 * Used in global-setup.ts
 */
export async function setupDeveloperAuth(page: Page): Promise<void> {
  await authenticateUser(
    page,
    testUsers.developer.email,
    testUsers.developer.password,
    DEVELOPER_AUTH_FILE
  )
}

/**
 * Login helper (for tests that need manual login)
 * Use this only when you can't use storage state
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

  const emailInput = page.locator('#login_email, input[name="email"], input[type="email"]')
  const passwordInput = page.locator('#login_password, input[name="password"], input[type="password"]')

  await emailInput.first().fill(email)
  await passwordInput.first().fill(password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

/**
 * Login as default test user (for tests that need manual login)
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await login(page, testUsers.user.email, testUsers.user.password)
}

/**
 * Login as admin user (for tests that need manual login)
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, testUsers.admin.email, testUsers.admin.password)
}

/**
 * Login as developer user (for tests that need manual login)
 */
export async function loginAsDeveloper(page: Page): Promise<void> {
  await login(page, testUsers.developer.email, testUsers.developer.password)
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator(
    'button:has-text("Logout"), ' +
    'button:has-text("Log out"), ' +
    'a:has-text("Logout"), ' +
    'a:has-text("Log out"), ' +
    '[data-testid="logout-button"]'
  )

  if (await logoutButton.count() > 0) {
    await logoutButton.first().click()
    await page.waitForURL(/\/login/, { timeout: 10000 })
  } else {
    throw new Error('Logout button not found')
  }
}

/**
 * Check if user is authenticated (on dashboard)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}
