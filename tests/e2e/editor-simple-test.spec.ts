import { test, expect, Page } from '@playwright/test'
import { join } from 'path'

const SCREENSHOTS_DIR = '/home/master/projects/mi-ai-coding'
const BASE_URL = 'http://localhost:3000'

async function saveScreenshot(page: Page, name: string) {
  await page.screenshot({ path: join(SCREENSHOTS_DIR, name), fullPage: true })
  console.log(`✓ Screenshot saved: ${name}`)
}

test.describe('MI AI Coding Platform - Simple Editor Test', () => {
  test.setTimeout(180000)
  test.use({ storageState: undefined })

  test('Complete editor features workflow', async ({ page }) => {
    console.log('\n=== Starting Editor Test ===\n')

    // STEP 1: Login
    console.log('STEP 1: Logging in...')
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Use Ant Design input selectors (id="login_email" and id="login_password")
    const emailInput = page.locator('input#login_email, input[placeholder*="email"]')
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill('admin@example.com')

    const passwordInput = page.locator('input#login_password, input[placeholder*="password"]')
    await passwordInput.fill('admin123')

    // Click Sign In
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(4000)

    const url = page.url()
    console.log(`Current URL after login: ${url}`)

    if (url.includes('dashboard') || !url.includes('login')) {
      console.log('✓ Login successful\n')
    } else {
      console.log('⚠ Still on login page\n')
    }

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STEP 2: Check panel state
    console.log('STEP 2: Checking layout...')
    await saveScreenshot(page, 'editor-test-01-minimized-panel.png')

    // Look for file explorer elements
    const hasFileTree = await page.locator('text=/file explorer|files/i').first().isVisible().catch(() => false)
    const hasPathInput = await page.locator('input[placeholder*="path" i], input[type="text"]').first().isVisible().catch(() => false)

    console.log(`  File explorer visible: ${hasFileTree}`)
    console.log(`  Path input visible: ${hasPathInput}\n`)

    // STEP 3: Navigate to project folder
    console.log('STEP 3: Navigating to project folder...')
    if (hasPathInput) {
      const pathInput = page.locator('input[placeholder*="path" i], input[type="text"]').first()
      await pathInput.fill('/home/master/projects/mi-ai-coding')
      await pathInput.press('Enter')
      await page.waitForTimeout(2000)
      console.log('✓ Entered project path\n')
    } else {
      console.log('⚠ Path input not found\n')
    }

    // STEP 4: Look for files
    console.log('STEP 4: Looking for files...')
    await page.waitForTimeout(2000)

    // Try to find and click README.md or any file
    const filesToTry = ['README.md', 'package.json', 'tsconfig.json']
    let clicked = false

    for (const filename of filesToTry) {
      const fileElement = page.locator(`text="${filename}"`).first()
      const isVisible = await fileElement.isVisible().catch(() => false)

      if (isVisible) {
        console.log(`  Found ${filename}, clicking...`)
        await fileElement.dblclick() // Try double-click
        await page.waitForTimeout(2000)
        clicked = true
        break
      }
    }

    if (!clicked) {
      // Try single click on any file-like element
      const anyFile = page.locator('[role="treeitem"], .file-item').first()
      const exists = await anyFile.isVisible().catch(() => false)
      if (exists) {
        await anyFile.dblclick()
        await page.waitForTimeout(2000)
        console.log('  Clicked on file\n')
      } else {
        console.log('  ⚠ No files found\n')
      }
    } else {
      console.log('✓ File clicked\n')
    }

    await saveScreenshot(page, 'editor-test-02-file-opened.png')

    // STEP 5: Check for Monaco editor
    console.log('STEP 5: Checking for Monaco editor...')
    const editorSelectors = ['.monaco-editor', 'textarea.inputarea', '[class*="monaco"]']

    let editorFound = false
    let editor = null

    for (const selector of editorSelectors) {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible().catch(() => false)
      if (isVisible) {
        editor = element
        editorFound = true
        console.log(`✓ Found Monaco editor: ${selector}\n`)
        break
      }
    }

    if (!editorFound) {
      console.log('⚠ Monaco editor not found\n')
    }

    // STEP 6: Check editor buttons
    console.log('STEP 6: Checking editor buttons...')
    const buttons = ['Save', 'Save As', 'Permissions', 'Close']

    for (const btnText of buttons) {
      const btn = page.locator(`button:has-text("${btnText}")`).first()
      const isVisible = await btn.isVisible().catch(() => false)
      const isDisabled = isVisible ? await btn.isDisabled() : true

      if (isVisible) {
        console.log(`  ${btnText}: ${isDisabled ? 'DISABLED' : 'ENABLED'}`)
      } else {
        console.log(`  ${btnText}: NOT FOUND`)
      }
    }
    console.log('')

    // STEP 7: Try to edit if editor exists
    if (editorFound && editor) {
      console.log('STEP 7: Testing editor edit and save...')

      // Click in editor
      await editor.click()
      await page.waitForTimeout(500)

      // Type text
      await page.keyboard.type('\n// Playwright test edit\n')
      await page.waitForTimeout(1000)
      console.log('✓ Typed text into editor')

      // Check if Save button is now enabled
      const saveBtn = page.locator('button:has-text("Save")').first()
      const isSaveVisible = await saveBtn.isVisible().catch(() => false)

      if (isSaveVisible) {
        const isDisabled = await saveBtn.isDisabled()
        console.log(`  Save button is: ${isDisabled ? 'DISABLED' : 'ENABLED'}`)

        if (!isDisabled) {
          console.log('  Clicking Save...')
          await saveBtn.click()
          await page.waitForTimeout(2000)

          // Check for success message
          const success = await page.locator('text=/saved|success/i').first().isVisible({ timeout: 3000 }).catch(() => false)
          console.log(`  Save success message: ${success ? 'YES' : 'NO'}`)
        }
      }
      console.log('')

      await saveScreenshot(page, 'editor-test-03-edit-save.png')

      // STEP 8: Test Save As
      console.log('STEP 8: Testing Save As...')
      const saveAsBtn = page.locator('button:has-text("Save As")').first()
      const hasSaveAs = await saveAsBtn.isVisible().catch(() => false)

      if (hasSaveAs) {
        await saveAsBtn.click()
        await page.waitForTimeout(1500)

        const dialog = await page.locator('.ant-modal, [role="dialog"]').first().isVisible().catch(() => false)
        console.log(`  Save As dialog opened: ${dialog ? 'YES' : 'NO'}`)

        if (dialog) {
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
        }
      } else {
        console.log('  Save As button not found')
      }
      console.log('')

      // STEP 9: Test Permissions
      console.log('STEP 9: Testing Permissions...')
      const permBtn = page.locator('button:has-text("Permissions")').first()
      const hasPerm = await permBtn.isVisible().catch(() => false)

      if (hasPerm) {
        await permBtn.click()
        await page.waitForTimeout(1500)

        const dialog = await page.locator('.ant-modal, [role="dialog"]').first().isVisible().catch(() => false)
        console.log(`  Permissions dialog opened: ${dialog ? 'YES' : 'NO'}`)

        if (dialog) {
          await saveScreenshot(page, 'editor-test-04-permissions.png')
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
        }
      } else {
        console.log('  Permissions button not found')
      }
      console.log('')

      // STEP 10: Test Close with unsaved changes
      console.log('STEP 10: Testing Close with unsaved changes...')

      // Make another edit
      await editor.click()
      await page.waitForTimeout(500)
      await page.keyboard.type('\n// Unsaved edit\n')
      await page.waitForTimeout(500)

      const closeBtn = page.locator('button:has-text("Close")').first()
      const hasClose = await closeBtn.isVisible().catch(() => false)

      if (hasClose) {
        await closeBtn.click()
        await page.waitForTimeout(1500)

        const warning = await page.locator('.ant-modal:has-text("unsaved"), [role="dialog"]:has-text("unsaved")').first().isVisible().catch(() => false)
        console.log(`  Unsaved changes warning: ${warning ? 'YES' : 'NO'}`)

        if (warning) {
          await saveScreenshot(page, 'editor-test-05-unsaved-warning.png')
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
        }
      } else {
        console.log('  Close button not found')
      }
      console.log('')

      // STEP 11: Test Ctrl+S
      console.log('STEP 11: Testing Ctrl+S...')
      await editor.click()
      await page.keyboard.press('Control+s')
      await page.waitForTimeout(2000)

      const saveIndicator = await page.locator('text=/saved|success/i').first().isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`  Ctrl+S save triggered: ${saveIndicator ? 'YES' : 'NO'}`)
      console.log('')
    }

    // STEP 12: Check localStorage
    console.log('STEP 12: Checking localStorage...')
    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const pathKeys = keys.filter(k => k.toLowerCase().includes('path') || k.toLowerCase().includes('file'))
      return pathKeys.map(k => ({ key: k, value: localStorage.getItem(k) }))
    })

    if (stored.length > 0) {
      console.log('✓ Found localStorage entries:')
      stored.forEach(item => console.log(`  ${item.key}: ${item.value}`))
    } else {
      console.log('⚠ No path-related localStorage entries found')
    }

    console.log('\n=== Test Complete ===\n')
  })
})
