/**
 * Test Helper Utilities
 *
 * Common helper functions for E2E tests
 */

import { Page, expect } from '@playwright/test'
import { testUsers } from './test-users'

/**
 * Login helper function
 * Performs login with provided credentials and waits for successful authentication
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

  await page.fill('input[name="email"], input[type="email"]', email)
  await page.fill('input[name="password"], input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

/**
 * Login as default test user
 */
export async function loginAsTestUser(page: Page) {
  await login(page, testUsers.user.email, testUsers.user.password)
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await login(page, testUsers.admin.email, testUsers.admin.password)
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), [data-testid="logout-button"], a:has-text("Logout")')

  if (await logoutButton.count() > 0) {
    await logoutButton.first().click()
    await page.waitForURL(/\/login/, { timeout: 5000 })
  }
}

/**
 * Take a timestamped screenshot
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = Date.now()
  await page.screenshot({
    path: `tests/screenshots/${name}-${timestamp}.png`,
    fullPage: true
  })
}

/**
 * Wait for file tree to be visible
 */
export async function waitForFileExplorer(page: Page) {
  const fileExplorer = page.locator('[data-testid="file-explorer"], .file-explorer, [class*="file-tree"], [class*="FileTree"]')
  await expect(fileExplorer.first()).toBeVisible({ timeout: 10000 })
}

/**
 * Create a new file via UI
 */
export async function createFile(page: Page, fileName: string, content?: string) {
  const newFileButton = page.locator('button:has-text("New File"), [data-testid="new-file-button"]')

  if (await newFileButton.count() === 0) {
    throw new Error('New File button not found')
  }

  await newFileButton.first().click()

  const fileNameInput = page.locator('input[placeholder*="file" i], input[name="filename"], input[data-testid="file-name-input"]')
  await expect(fileNameInput.first()).toBeVisible({ timeout: 5000 })

  await fileNameInput.first().fill(fileName)

  const createButton = page.locator('button:has-text("Create"), button:has-text("OK"), button[type="submit"]')
  await createButton.first().click()

  // Wait for file to appear
  await expect(page.locator(`text=${fileName}`)).toBeVisible({ timeout: 5000 })

  // If content is provided, add it
  if (content) {
    await page.locator(`text=${fileName}`).click()
    const editor = page.locator('.monaco-editor textarea, [data-testid="code-editor"]')
    await expect(editor.first()).toBeVisible({ timeout: 5000 })
    await editor.first().fill(content)

    // Save file
    await page.keyboard.press('Control+S')
  }
}

/**
 * Delete a file via UI
 */
export async function deleteFile(page: Page, fileName: string) {
  const fileItem = page.locator(`[role="treeitem"]:has-text("${fileName}")`)

  if (await fileItem.count() === 0) {
    throw new Error(`File ${fileName} not found`)
  }

  // Right-click to open context menu
  await fileItem.first().click({ button: 'right' })

  // Click delete option
  const deleteOption = page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")')
  await deleteOption.first().click()

  // Confirm deletion if dialog appears
  const confirmButton = page.locator('button:has-text("Delete"), button:has-text("OK"), button:has-text("Confirm")')

  if (await confirmButton.count() > 0) {
    await confirmButton.first().click()
  }

  // Wait for file to be removed
  await expect(page.locator(`text="${fileName}"`)).not.toBeVisible({ timeout: 5000 })
}

/**
 * Wait for activity log to update with specific action
 */
export async function waitForActivityLog(page: Page, action: string, timeout = 5000) {
  const activityLog = page.locator(`[data-testid="activity-log"]:has-text("${action}"), .activity-log:has-text("${action}")`)
  await expect(activityLog.first()).toBeVisible({ timeout })
}

/**
 * Check if VNC viewer is visible and functional
 */
export async function checkVNCViewer(page: Page, displayNumber: '98' | '99') {
  const vncViewer = page.locator(`[data-testid="vnc-viewer-${displayNumber}"], .vnc-viewer, canvas[class*="vnc"]`)
  await expect(vncViewer.first()).toBeVisible({ timeout: 10000 })
}

/**
 * Wait for toast/notification message
 */
export async function waitForNotification(page: Page, message: string) {
  const notification = page.locator(`.ant-message:has-text("${message}"), .ant-notification:has-text("${message}"), [role="alert"]:has-text("${message}")`)
  await expect(notification.first()).toBeVisible({ timeout: 5000 })
}
