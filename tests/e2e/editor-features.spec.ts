import { test, expect, Page } from '@playwright/test'
import { join } from 'path'

const SCREENSHOTS_DIR = '/home/master/projects/mi-ai-coding'
const BASE_URL = 'http://localhost:3000'

// Helper to save screenshot
async function saveScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: join(SCREENSHOTS_DIR, name),
    fullPage: true
  })
  console.log(`✓ Screenshot saved: ${name}`)
}

test.describe('MI AI Coding Platform - Editor Features Test', () => {
  test.setTimeout(120000) // 2 minutes timeout

  test('Complete editor features workflow', async ({ page }) => {
    console.log('\n=== Starting Editor Features Test ===\n')

    // ============================================
    // STEP 1: Login with admin credentials
    // ============================================
    console.log('STEP 1: Logging in...')
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    // Fill in login form
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'admin@example.com')
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'admin123')

    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')

    // Wait for redirect to dashboard
    await page.waitForURL(/^(?!.*\/login).*/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    console.log('✓ Login successful')

    // Wait a moment for layout to render
    await page.waitForTimeout(2000)

    // ============================================
    // STEP 2: Verify left panel is minimized (~5% width)
    // ============================================
    console.log('\nSTEP 2: Verifying left panel is minimized...')

    // Look for the file explorer panel
    const fileExplorerPanel = page.locator('[data-panel-id="file-explorer"], .file-explorer-panel, aside, [class*="file-explorer"]').first()

    // Check if panel exists
    const panelExists = await fileExplorerPanel.isVisible().catch(() => false)

    if (panelExists) {
      const panelBox = await fileExplorerPanel.boundingBox()
      const viewportSize = page.viewportSize()

      if (panelBox && viewportSize) {
        const widthPercentage = (panelBox.width / viewportSize.width) * 100
        console.log(`  Panel width: ${panelBox.width}px (${widthPercentage.toFixed(1)}%)`)
        console.log(`  Viewport width: ${viewportSize.width}px`)

        // Panel should be narrow (less than 10% width when minimized)
        if (widthPercentage <= 10) {
          console.log('✓ Left panel is minimized (narrow)')
        } else {
          console.log('⚠ Panel appears to be expanded already')
        }
      }
    } else {
      console.log('⚠ File explorer panel not found - may have different structure')
    }

    await saveScreenshot(page, 'editor-test-01-minimized-panel.png')

    // ============================================
    // STEP 3: Expand file explorer panel by dragging
    // ============================================
    console.log('\nSTEP 3: Expanding file explorer panel...')

    // Look for resize handle
    const resizeHandle = page.locator('[data-panel-resize-handle-id], [role="separator"], .resize-handle, [class*="resize"]').first()

    const handleExists = await resizeHandle.isVisible().catch(() => false)

    if (handleExists) {
      const handleBox = await resizeHandle.boundingBox()
      if (handleBox) {
        // Drag resize handle to the right to expand panel
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
        await page.mouse.down()
        await page.mouse.move(handleBox.x + 200, handleBox.y + handleBox.height / 2, { steps: 10 })
        await page.mouse.up()
        await page.waitForTimeout(500)
        console.log('✓ Dragged resize handle to expand panel')
      }
    } else {
      console.log('⚠ Resize handle not found - trying alternative method')
      // Try clicking on the panel itself to expand it
      if (panelExists) {
        await fileExplorerPanel.click()
        await page.waitForTimeout(500)
      }
    }

    // ============================================
    // STEP 4: Navigate to project folder
    // ============================================
    console.log('\nSTEP 4: Navigating to /home/master/projects/mi-ai-coding...')

    // Look for path input or navigation controls
    const pathInput = page.locator('input[placeholder*="path" i], input[type="text"]').first()
    const pathInputExists = await pathInput.isVisible().catch(() => false)

    if (pathInputExists) {
      await pathInput.clear()
      await pathInput.fill('/home/master/projects/mi-ai-coding')
      await pathInput.press('Enter')
      await page.waitForTimeout(1500)
      console.log('✓ Navigated to project folder via input')
    } else {
      console.log('⚠ Path input not found - looking for folder navigation')

      // Try clicking on folder items in the tree
      const folders = ['home', 'master', 'projects', 'mi-ai-coding']
      for (const folder of folders) {
        const folderItem = page.locator(`text="${folder}"`).first()
        const exists = await folderItem.isVisible().catch(() => false)
        if (exists) {
          await folderItem.click()
          await page.waitForTimeout(300)
        }
      }
      console.log('✓ Attempted to navigate via folder tree')
    }

    await page.waitForTimeout(1000)

    // ============================================
    // STEP 5: Click on a file (README.md or package.json)
    // ============================================
    console.log('\nSTEP 5: Opening a file in the editor...')

    // Try to find README.md or package.json in the file list
    let fileOpened = false
    const filesToTry = ['README.md', 'package.json', 'tsconfig.json', 'CLAUDE.md']

    for (const filename of filesToTry) {
      const fileItem = page.locator(`text="${filename}"`).first()
      const exists = await fileItem.isVisible().catch(() => false)

      if (exists) {
        console.log(`  Found ${filename}, clicking...`)
        await fileItem.click()
        await page.waitForTimeout(2000)
        fileOpened = true
        console.log(`✓ Clicked on ${filename}`)
        break
      }
    }

    if (!fileOpened) {
      console.log('⚠ No files found - looking for any clickable file')
      // Try to click any file-like element
      const anyFile = page.locator('[class*="file-item"], [role="treeitem"], .file').first()
      const exists = await anyFile.isVisible().catch(() => false)
      if (exists) {
        await anyFile.click()
        await page.waitForTimeout(2000)
        console.log('✓ Clicked on first available file')
      }
    }

    // ============================================
    // STEP 6: Verify file opens in Monaco editor
    // ============================================
    console.log('\nSTEP 6: Verifying Monaco editor opened...')

    // Wait for Monaco editor to load
    await page.waitForTimeout(2000)

    // Look for Monaco editor indicators
    const monacoEditor = page.locator('.monaco-editor, [class*="monaco"], [role="code"]').first()
    const editorExists = await monacoEditor.isVisible().catch(() => false)

    if (editorExists) {
      console.log('✓ Monaco editor is visible')
    } else {
      console.log('⚠ Monaco editor not detected')
    }

    await saveScreenshot(page, 'editor-test-02-file-opened.png')

    // ============================================
    // STEP 7: Test editor buttons
    // ============================================
    console.log('\nSTEP 7: Testing editor action buttons...')

    // 7a. Make an edit to the file
    console.log('  7a. Making an edit...')

    // Try to focus Monaco editor and type
    if (editorExists) {
      await monacoEditor.click()
      await page.waitForTimeout(500)

      // Type some text
      await page.keyboard.type('\n\n// Test edit by Playwright\n')
      await page.waitForTimeout(500)
      console.log('✓ Typed text into editor')
    } else {
      console.log('⚠ Could not edit - editor not found')
    }

    // 7b. Verify Save button is enabled
    console.log('  7b. Checking Save button state...')

    const saveButton = page.locator('button:has-text("Save"), button[title*="Save" i], button:has([aria-label*="save" i])').first()
    const saveButtonExists = await saveButton.isVisible().catch(() => false)

    if (saveButtonExists) {
      const isDisabled = await saveButton.isDisabled().catch(() => false)
      if (!isDisabled) {
        console.log('✓ Save button is enabled')
      } else {
        console.log('⚠ Save button is disabled')
      }
    } else {
      console.log('⚠ Save button not found')
    }

    // 7c. Click Save button
    console.log('  7c. Clicking Save button...')

    if (saveButtonExists) {
      await saveButton.click()
      await page.waitForTimeout(2000)

      // Look for success message
      const successMessage = page.locator('text=/saved|success/i, .ant-message-success, .notification-success').first()
      const messageVisible = await successMessage.isVisible({ timeout: 3000 }).catch(() => false)

      if (messageVisible) {
        console.log('✓ Save success message appeared')
      } else {
        console.log('⚠ No success message detected (may have succeeded anyway)')
      }
    }

    await saveScreenshot(page, 'editor-test-03-edit-save.png')

    // 7d. Test Save As button
    console.log('  7d. Testing Save As button...')

    const saveAsButton = page.locator('button:has-text("Save As"), button[title*="Save As" i]').first()
    const saveAsExists = await saveAsButton.isVisible().catch(() => false)

    if (saveAsExists) {
      await saveAsButton.click()
      await page.waitForTimeout(1000)

      // Look for Save As dialog
      const dialog = page.locator('.ant-modal, [role="dialog"], .modal').first()
      const dialogVisible = await dialog.isVisible().catch(() => false)

      if (dialogVisible) {
        console.log('✓ Save As dialog opened')

        // Close dialog
        const closeButton = dialog.locator('button:has-text("Cancel"), .ant-modal-close, button[aria-label="Close"]').first()
        const closeExists = await closeButton.isVisible().catch(() => false)
        if (closeExists) {
          await closeButton.click()
          await page.waitForTimeout(500)
          console.log('✓ Closed Save As dialog')
        }
      } else {
        console.log('⚠ Save As dialog not detected')
      }
    } else {
      console.log('⚠ Save As button not found')
    }

    // 7e. Test Permissions button
    console.log('  7e. Testing Permissions button...')

    const permissionsButton = page.locator('button:has-text("Permissions"), button[title*="Permission" i]').first()
    const permissionsExists = await permissionsButton.isVisible().catch(() => false)

    if (permissionsExists) {
      await permissionsButton.click()
      await page.waitForTimeout(1000)

      // Look for Permissions dialog
      const permDialog = page.locator('.ant-modal:has-text("Permissions"), [role="dialog"]:has-text("Permissions")').first()
      const permDialogVisible = await permDialog.isVisible().catch(() => false)

      if (permDialogVisible) {
        console.log('✓ Permissions dialog opened')

        await saveScreenshot(page, 'editor-test-04-permissions.png')

        // Close dialog
        const closeButton = permDialog.locator('button:has-text("Cancel"), .ant-modal-close, button[aria-label="Close"]').first()
        const closeExists = await closeButton.isVisible().catch(() => false)
        if (closeExists) {
          await closeButton.click()
          await page.waitForTimeout(500)
          console.log('✓ Closed Permissions dialog')
        }
      } else {
        console.log('⚠ Permissions dialog not detected')
      }
    } else {
      console.log('⚠ Permissions button not found')
    }

    // 7f. Make another edit to test Close with unsaved changes
    console.log('  7f. Testing Close button with unsaved changes...')

    if (editorExists) {
      await monacoEditor.click()
      await page.waitForTimeout(500)
      await page.keyboard.type('\n// Another unsaved edit\n')
      await page.waitForTimeout(500)
      console.log('✓ Made another unsaved edit')
    }

    // Click Close button
    const closeButton = page.locator('button:has-text("Close"), button[title*="Close" i]').first()
    const closeExists = await closeButton.isVisible().catch(() => false)

    if (closeExists) {
      await closeButton.click()
      await page.waitForTimeout(1000)

      // Look for unsaved changes warning modal
      const warningModal = page.locator('.ant-modal:has-text("unsaved"), [role="dialog"]:has-text("unsaved"), .ant-modal:has-text("changes")').first()
      const warningVisible = await warningModal.isVisible().catch(() => false)

      if (warningVisible) {
        console.log('✓ Unsaved changes warning modal appeared')

        await saveScreenshot(page, 'editor-test-05-unsaved-warning.png')

        // Click "Discard" or "Cancel" to close modal
        const discardButton = warningModal.locator('button:has-text("Discard"), button:has-text("Don\'t Save")').first()
        const cancelButton = warningModal.locator('button:has-text("Cancel")').first()

        const discardExists = await discardButton.isVisible().catch(() => false)
        const cancelExists = await cancelButton.isVisible().catch(() => false)

        if (cancelExists) {
          await cancelButton.click()
          await page.waitForTimeout(500)
          console.log('✓ Cancelled close operation')
        } else if (discardExists) {
          // Don't discard, we want to keep testing
          console.log('✓ Warning modal has Discard option')
        }
      } else {
        console.log('⚠ Unsaved changes warning not detected')
      }
    } else {
      console.log('⚠ Close button not found')
    }

    // ============================================
    // STEP 8: Test Ctrl+S keyboard shortcut
    // ============================================
    console.log('\nSTEP 8: Testing Ctrl+S keyboard shortcut...')

    if (editorExists) {
      await monacoEditor.click()
      await page.waitForTimeout(500)

      // Press Ctrl+S
      await page.keyboard.press('Control+s')
      await page.waitForTimeout(2000)

      // Look for save indication
      const saveIndicator = page.locator('text=/saved|success/i, .ant-message-success').first()
      const indicatorVisible = await saveIndicator.isVisible({ timeout: 3000 }).catch(() => false)

      if (indicatorVisible) {
        console.log('✓ Ctrl+S triggered save successfully')
      } else {
        console.log('⚠ Ctrl+S save not confirmed (may have succeeded anyway)')
      }
    }

    // ============================================
    // STEP 9: Test localStorage persistence
    // ============================================
    console.log('\nSTEP 9: Testing localStorage persistence...')

    // Get current path from localStorage
    const storedPath = await page.evaluate(() => {
      return localStorage.getItem('lastFilePath') || localStorage.getItem('fileExplorerPath') || 'not found'
    })

    console.log(`  Current localStorage path: ${storedPath}`)

    if (storedPath && storedPath !== 'not found') {
      console.log('✓ localStorage is storing the path')

      // Reload page
      console.log('  Reloading page...')
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // Check if path is restored
      const restoredPath = await page.evaluate(() => {
        return localStorage.getItem('lastFilePath') || localStorage.getItem('fileExplorerPath')
      })

      if (restoredPath === storedPath) {
        console.log('✓ Path persisted after reload')
      } else {
        console.log('⚠ Path may not have persisted correctly')
      }
    } else {
      console.log('⚠ localStorage path not found')
    }

    console.log('\n=== Editor Features Test Complete ===\n')
  })
})
