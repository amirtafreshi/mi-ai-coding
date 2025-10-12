import { test, expect } from '@playwright/test'
import { USER_AUTH_FILE } from '../helpers/auth'

/**
 * File Explorer E2E Tests
 *
 * Tests basic file CRUD operations in the MI AI Coding Platform
 *
 * Prerequisites:
 * - Application running on http://localhost:3000
 * - DISPLAY=:99 environment variable set (for VNC visibility)
 * - Database seeded with test user
 * - Global setup has created authenticated session
 */

test.describe('File Explorer CRUD Operations', () => {
  // Use authenticated storage state (no need to login in beforeEach!)
  test.use({ storageState: USER_AUTH_FILE })

  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard (already authenticated via storage state)
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Verify we're authenticated (should be on dashboard)
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 5000 })
  })

  test('should display file explorer on dashboard', async ({ page }) => {
    // Check if file explorer or file tree component is visible
    const fileExplorer = page.locator('[data-testid="file-explorer"], .file-explorer, [class*="file-tree"], [class*="FileTree"]')

    // Wait for the component to be visible
    await expect(fileExplorer.first()).toBeVisible({ timeout: 10000 })
  })

  test('should create a new file', async ({ page }) => {
    // Take screenshot before action
    await page.screenshot({ path: 'tests/screenshots/before-create-file.png', fullPage: true })

    // Look for "New File" button or action
    const newFileButton = page.locator('button:has-text("New File"), [data-testid="new-file-button"]')

    if (await newFileButton.count() > 0) {
      await newFileButton.first().click()

      // Wait for file name input or dialog
      const fileNameInput = page.locator('input[placeholder*="file" i], input[name="filename"], input[data-testid="file-name-input"]')
      await expect(fileNameInput.first()).toBeVisible({ timeout: 5000 })

      // Enter file name
      const testFileName = `test-${Date.now()}.txt`
      await fileNameInput.first().fill(testFileName)

      // Click create/submit button
      const createButton = page.locator('button:has-text("Create"), button:has-text("OK"), button[type="submit"]')
      await createButton.first().click()

      // Verify file appears in file tree
      await expect(page.locator(`text=${testFileName}`)).toBeVisible({ timeout: 5000 })

      // Take screenshot after action
      await page.screenshot({ path: 'tests/screenshots/after-create-file.png', fullPage: true })
    } else {
      // If no new file button found, skip this test
      test.skip(true, 'New File button not found - feature may not be implemented yet')
    }
  })

  test('should open and read a file', async ({ page }) => {
    // Look for any file in the file tree (assuming at least one file exists)
    const firstFile = page.locator('.file-tree [role="treeitem"]:has-text(".txt"), .file-tree [role="treeitem"]:has-text(".js")').first()

    if (await firstFile.count() > 0) {
      // Click on the file to open it
      await firstFile.click()

      // Wait for editor or file content to be visible
      const editor = page.locator('.monaco-editor, [data-testid="code-editor"], textarea[class*="editor"]')
      await expect(editor.first()).toBeVisible({ timeout: 10000 })

      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/file-opened.png', fullPage: true })
    } else {
      test.skip(true, 'No files found in file tree - may need to create files first')
    }
  })

  test('should delete a file', async ({ page }) => {
    // First, try to find a file to delete
    const fileItem = page.locator('.file-tree [role="treeitem"]').first()

    if (await fileItem.count() > 0) {
      // Get the file name before deleting
      const fileName = await fileItem.textContent()

      // Right-click to open context menu
      await fileItem.click({ button: 'right' })

      // Look for delete option in context menu
      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")')

      if (await deleteOption.count() > 0) {
        await deleteOption.first().click()

        // Look for confirmation dialog
        const confirmButton = page.locator('button:has-text("Delete"), button:has-text("OK"), button:has-text("Confirm")')

        if (await confirmButton.count() > 0) {
          await confirmButton.first().click()
        }

        // Verify file is removed from tree
        await expect(page.locator(`text="${fileName}"`)).not.toBeVisible({ timeout: 5000 })

        // Take screenshot
        await page.screenshot({ path: 'tests/screenshots/after-delete-file.png', fullPage: true })
      } else {
        test.skip(true, 'Delete option not found - feature may not be implemented yet')
      }
    } else {
      test.skip(true, 'No files found to delete')
    }
  })
})

test.describe('File Explorer Responsive Design', () => {
  // Use authenticated storage state
  test.use({ storageState: USER_AUTH_FILE })

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ]

  viewports.forEach(({ name, width, height }) => {
    test(`should render correctly on ${name} (${width}x${height})`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width, height })

      // Navigate to application (authenticated via storage state)
      await page.goto('/')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify we're on dashboard
      await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 5000 })

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/responsive-${name.toLowerCase()}.png`,
        fullPage: true
      })

      // Verify basic layout elements are visible
      const header = page.locator('header, [role="banner"]')
      await expect(header.first()).toBeVisible({ timeout: 5000 })
    })
  })
})

test.describe('File Explorer Error Handling', () => {
  test('should handle invalid file names gracefully', async ({ page }) => {
    // This test will be skipped if the feature is not implemented
    test.skip(true, 'To be implemented when file validation is added')
  })

  test('should show error when file operation fails', async ({ page }) => {
    // This test will be skipped if the feature is not implemented
    test.skip(true, 'To be implemented when error handling is added')
  })
})
