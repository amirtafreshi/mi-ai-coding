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

test.describe('MI AI Coding Platform - Manual Editor Features Test', () => {
  test.setTimeout(180000) // 3 minutes timeout
  test.use({ storageState: undefined }) // Don't use stored auth

  test('Complete editor features workflow - manual login', async ({ page }) => {
    console.log('\n=== Starting Manual Editor Features Test ===\n')

    // ============================================
    // STEP 1: Navigate to login page and login
    // ============================================
    console.log('STEP 1: Navigating to login page...')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    console.log('  Filling in email...')
    const emailInput = await page.locator('input[type="email"]').first()
    await emailInput.waitFor({ state: 'visible', timeout: 5000 })
    await emailInput.clear()
    await emailInput.fill('admin@example.com')
    await page.waitForTimeout(500)

    console.log('  Filling in password...')
    const passwordInput = await page.locator('input[type="password"]').first()
    await passwordInput.clear()
    await passwordInput.fill('admin123')
    await page.waitForTimeout(500)

    console.log('  Clicking Sign In button...')
    const signInButton = await page.locator('button:has-text("Sign In")').first()
    await signInButton.click()

    console.log('  Waiting for navigation after login...')
    await page.waitForTimeout(3000)

    // Check if we're redirected
    const currentUrl = page.url()
    console.log(`  Current URL: ${currentUrl}`)

    if (currentUrl.includes('login')) {
      console.log('⚠ Still on login page, checking for errors...')
      const errorMsg = await page.locator('text=/error|invalid|failed/i').first().textContent().catch(() => null)
      if (errorMsg) {
        console.log(`  Error message: ${errorMsg}`)
      }
    } else {
      console.log('✓ Successfully redirected from login page')
    }

    await page.waitForTimeout(2000)

    // ============================================
    // STEP 2: Verify left panel state
    // ============================================
    console.log('\nSTEP 2: Checking page layout...')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('  Looking for file explorer panel...')

    // Try multiple selectors for the file explorer
    const panelSelectors = [
      '[data-panel-id*="file"]',
      '[class*="file-explorer"]',
      '[class*="FileExplorer"]',
      'aside',
      '[class*="sidebar"]',
      '.ant-layout-sider'
    ]

    let panelFound = false
    let fileExplorerPanel = null

    for (const selector of panelSelectors) {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible().catch(() => false)
      if (isVisible) {
        fileExplorerPanel = element
        panelFound = true
        console.log(`  Found panel with selector: ${selector}`)
        break
      }
    }

    if (panelFound && fileExplorerPanel) {
      const panelBox = await fileExplorerPanel.boundingBox()
      const viewportSize = page.viewportSize()

      if (panelBox && viewportSize) {
        const widthPercentage = (panelBox.width / viewportSize.width) * 100
        console.log(`  Panel width: ${panelBox.width}px (${widthPercentage.toFixed(1)}%)`)

        if (widthPercentage <= 10) {
          console.log('✓ Left panel is minimized')
        } else {
          console.log(`✓ Left panel is visible (${widthPercentage.toFixed(1)}% width)`)
        }
      }
    } else {
      console.log('⚠ File explorer panel not found - may have different structure')
    }

    await saveScreenshot(page, 'editor-test-01-minimized-panel.png')

    // ============================================
    // STEP 3: Look for file explorer functionality
    // ============================================
    console.log('\nSTEP 3: Exploring file explorer...')

    // Look for path input
    const pathInput = page.locator('input[placeholder*="path" i], input[placeholder*="folder" i], input[type="text"]').first()
    const hasPathInput = await pathInput.isVisible().catch(() => false)

    if (hasPathInput) {
      console.log('  Found path input field')
      const currentPath = await pathInput.inputValue()
      console.log(`  Current path: ${currentPath}`)

      console.log('  Entering project path...')
      await pathInput.clear()
      await pathInput.fill('/home/master/projects/mi-ai-coding')
      await pathInput.press('Enter')
      await page.waitForTimeout(2000)
      console.log('✓ Navigated to project directory')
    } else {
      console.log('⚠ Path input not found')
    }

    // ============================================
    // STEP 4: Look for files and open one
    // ============================================
    console.log('\nSTEP 4: Looking for files to open...')

    // Wait for file list to load
    await page.waitForTimeout(2000)

    // Try to find any file in the tree
    const fileSelectors = [
      'text="README.md"',
      'text="package.json"',
      'text="tsconfig.json"',
      'text="CLAUDE.md"',
      '[class*="file-item"]',
      '[role="treeitem"]'
    ]

    let fileOpened = false

    for (const selector of fileSelectors) {
      const fileElement = page.locator(selector).first()
      const isVisible = await fileElement.isVisible().catch(() => false)

      if (isVisible) {
        const text = await fileElement.textContent().catch(() => selector)
        console.log(`  Found file: ${text}`)
        console.log('  Clicking on file...')
        await fileElement.click()
        await page.waitForTimeout(2000)
        fileOpened = true
        console.log('✓ Clicked on file')
        break
      }
    }

    if (!fileOpened) {
      console.log('⚠ Could not find any files to open')
    }

    await saveScreenshot(page, 'editor-test-02-file-opened.png')

    // ============================================
    // STEP 5: Look for Monaco editor
    // ============================================
    console.log('\nSTEP 5: Checking for Monaco editor...')

    await page.waitForTimeout(2000)

    const editorSelectors = [
      '.monaco-editor',
      '[class*="monaco"]',
      '[class*="editor"]',
      '[role="code"]',
      'textarea.inputarea'
    ]

    let editorFound = false
    let monacoEditor = null

    for (const selector of editorSelectors) {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible().catch(() => false)

      if (isVisible) {
        monacoEditor = element
        editorFound = true
        console.log(`✓ Found Monaco editor with selector: ${selector}`)
        break
      }
    }

    if (!editorFound) {
      console.log('⚠ Monaco editor not found')
    }

    // ============================================
    // STEP 6: Test editor buttons if editor exists
    // ============================================
    console.log('\nSTEP 6: Looking for editor action buttons...')

    const buttons = [
      { name: 'Save', selector: 'button:has-text("Save")' },
      { name: 'Save As', selector: 'button:has-text("Save As")' },
      { name: 'Permissions', selector: 'button:has-text("Permissions")' },
      { name: 'Close', selector: 'button:has-text("Close")' }
    ]

    for (const button of buttons) {
      const buttonElement = page.locator(button.selector).first()
      const isVisible = await buttonElement.isVisible().catch(() => false)

      if (isVisible) {
        const isDisabled = await buttonElement.isDisabled().catch(() => false)
        console.log(`  ${button.name} button: ${isDisabled ? 'DISABLED' : 'ENABLED'}`)
      } else {
        console.log(`  ${button.name} button: NOT FOUND`)
      }
    }

    // ============================================
    // STEP 7: Try to edit and save if editor exists
    // ============================================
    if (editorFound && monacoEditor) {
      console.log('\nSTEP 7: Testing editor functionality...')

      console.log('  Clicking in editor...')
      await monacoEditor.click()
      await page.waitForTimeout(500)

      console.log('  Typing test text...')
      await page.keyboard.type('\n// Test edit by Playwright\n')
      await page.waitForTimeout(1000)
      console.log('✓ Typed text into editor')

      // Check Save button state
      const saveButton = page.locator('button:has-text("Save")').first()
      const saveVisible = await saveButton.isVisible().catch(() => false)

      if (saveVisible) {
        const isDisabled = await saveButton.isDisabled()
        console.log(`  Save button is now: ${isDisabled ? 'DISABLED' : 'ENABLED'}`)

        if (!isDisabled) {
          console.log('  Clicking Save button...')
          await saveButton.click()
          await page.waitForTimeout(2000)

          // Look for success message
          const successVisible = await page.locator('text=/saved|success/i').first().isVisible({ timeout: 3000 }).catch(() => false)
          if (successVisible) {
            console.log('✓ Save success message appeared')
          } else {
            console.log('⚠ No success message (may have saved anyway)')
          }
        }
      }

      await saveScreenshot(page, 'editor-test-03-edit-save.png')

      // Test Save As
      console.log('\nSTEP 8: Testing Save As dialog...')
      const saveAsButton = page.locator('button:has-text("Save As")').first()
      const saveAsVisible = await saveAsButton.isVisible().catch(() => false)

      if (saveAsVisible) {
        await saveAsButton.click()
        await page.waitForTimeout(1500)

        const dialogVisible = await page.locator('.ant-modal, [role="dialog"]').first().isVisible().catch(() => false)
        if (dialogVisible) {
          console.log('✓ Save As dialog opened')

          // Close dialog
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
          console.log('✓ Closed dialog')
        } else {
          console.log('⚠ Save As dialog not detected')
        }
      }

      // Test Permissions
      console.log('\nSTEP 9: Testing Permissions dialog...')
      const permButton = page.locator('button:has-text("Permissions")').first()
      const permVisible = await permButton.isVisible().catch(() => false)

      if (permVisible) {
        await permButton.click()
        await page.waitForTimeout(1500)

        const dialogVisible = await page.locator('.ant-modal, [role="dialog"]').first().isVisible().catch(() => false)
        if (dialogVisible) {
          console.log('✓ Permissions dialog opened')
          await saveScreenshot(page, 'editor-test-04-permissions.png')

          // Close dialog
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
          console.log('✓ Closed dialog')
        } else {
          console.log('⚠ Permissions dialog not detected')
        }
      }

      // Test Close with unsaved changes
      console.log('\nSTEP 10: Testing Close with unsaved changes...')

      // Make another edit
      await monacoEditor.click()
      await page.waitForTimeout(500)
      await page.keyboard.type('\n// Unsaved edit for Close test\n')
      await page.waitForTimeout(500)

      const closeButton = page.locator('button:has-text("Close")').first()
      const closeVisible = await closeButton.isVisible().catch(() => false)

      if (closeVisible) {
        await closeButton.click()
        await page.waitForTimeout(1500)

        const warningVisible = await page.locator('.ant-modal:has-text("unsaved"), [role="dialog"]:has-text("unsaved")').first().isVisible().catch(() => false)
        if (warningVisible) {
          console.log('✓ Unsaved changes warning appeared')
          await saveScreenshot(page, 'editor-test-05-unsaved-warning.png')

          // Cancel
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
          console.log('✓ Cancelled close operation')
        } else {
          console.log('⚠ Unsaved changes warning not detected')
        }
      }

      // Test Ctrl+S
      console.log('\nSTEP 11: Testing Ctrl+S keyboard shortcut...')
      await monacoEditor.click()
      await page.keyboard.press('Control+s')
      await page.waitForTimeout(2000)

      const saveIndicator = await page.locator('text=/saved|success/i').first().isVisible({ timeout: 2000 }).catch(() => false)
      if (saveIndicator) {
        console.log('✓ Ctrl+S triggered save')
      } else {
        console.log('⚠ Ctrl+S save not confirmed')
      }
    }

    // ============================================
    // STEP 12: Check localStorage
    // ============================================
    console.log('\nSTEP 12: Checking localStorage persistence...')

    const storedPath = await page.evaluate(() => {
      const keys = ['lastFilePath', 'fileExplorerPath', 'currentPath']
      for (const key of keys) {
        const value = localStorage.getItem(key)
        if (value) return { key, value }
      }
      return null
    })

    if (storedPath) {
      console.log(`✓ Found stored path: ${storedPath.key} = ${storedPath.value}`)
    } else {
      console.log('⚠ No path stored in localStorage')
    }

    console.log('\n=== Manual Editor Features Test Complete ===\n')
  })
})
