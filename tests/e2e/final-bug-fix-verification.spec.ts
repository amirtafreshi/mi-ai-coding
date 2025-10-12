import { test, expect, Page } from '@playwright/test'
import path from 'path'

test.describe('Final Bug Fix Verification - All Three Issues', () => {
  let page: Page
  const screenshotDir = path.join(process.cwd(), 'test-results', 'final-verification')

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()

    // Enable console logging
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('[MonacoEditor]') || text.includes('isDirty') || text.includes('Saved')) {
        console.log(`[CONSOLE] ${msg.type()}: ${text}`)
      }
    })

    // Log all errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error.message)
    })
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Complete verification of all 3 bug fixes', async () => {
    console.log('\n====== STARTING FINAL VERIFICATION TEST ======\n')

    // Step 1-2: Login and navigate
    console.log('Step 1-2: Login with admin@example.com / admin123')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('http://localhost:3000/', { timeout: 10000 })
    console.log('✅ Login successful')

    // Step 3: Navigate to mi-ai-coding folder and click CLAUDE.md
    console.log('\nStep 3: Navigate to mi-ai-coding folder and click CLAUDE.md')
    await page.waitForSelector('.file-tree', { timeout: 10000 })

    // Expand folders if needed
    const miAiCodingFolder = page.locator('.file-tree-item:has-text("mi-ai-coding")')
    if (await miAiCodingFolder.count() > 0) {
      await miAiCodingFolder.click()
      await page.waitForTimeout(500)
    }

    // Click CLAUDE.md
    const claudeFile = page.locator('.file-tree-item:has-text("CLAUDE.md")').first()
    await claudeFile.waitFor({ state: 'visible', timeout: 5000 })
    await claudeFile.click()
    await page.waitForTimeout(2000) // Wait for editor to load
    console.log('✅ CLAUDE.md opened')

    // Step 4: Make an edit (type "TEST" at line 1)
    console.log('\nStep 4: Make an edit - type "TEST" at line 1')
    const editor = page.locator('.monaco-editor').first()
    await editor.waitFor({ state: 'visible', timeout: 5000 })

    // Click in editor and type
    await editor.click()
    await page.keyboard.press('Control+Home') // Go to start
    await page.keyboard.type('TEST ')
    await page.waitForTimeout(1000)
    console.log('✅ Edit made')

    // Step 5: CHECK - Orange dot appears on tab
    console.log('\nStep 5: CHECK - Orange dot appears on tab')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-01-edited-dirty.png'), fullPage: true })

    const tabWithDot = page.locator('.tab-item:has-text("CLAUDE.md") .tab-dirty-indicator')
    const hasDirtyIndicator = await tabWithDot.count() > 0
    console.log(`CHECK 1: Orange dot visible = ${hasDirtyIndicator ? '✅' : '❌'}`)

    if (!hasDirtyIndicator) {
      console.log('❌ BUG 1 FAILED: Orange dot not visible after edit')
    }

    // Step 6: Click Save button
    console.log('\nStep 6: Click Save button')
    const saveButton = page.locator('button:has-text("Save")').first()
    await saveButton.click()
    await page.waitForTimeout(2000) // Wait for save to complete
    console.log('✅ Save button clicked')

    // Step 7: CHECK - Success message appears
    console.log('\nStep 7: CHECK - Success message "Saved CLAUDE.md" appears')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-02-save-success.png'), fullPage: true })

    const successMessage = page.locator('.ant-message:has-text("Saved CLAUDE.md")')
    const hasSuccessMessage = await successMessage.count() > 0
    console.log(`CHECK 2: Success message visible = ${hasSuccessMessage ? '✅' : '❌'}`)

    if (!hasSuccessMessage) {
      console.log('❌ BUG 2 FAILED: Save success message not visible')
    }

    // Step 8: CHECK - Orange dot disappears from tab
    console.log('\nStep 8: CHECK - Orange dot disappears from tab')
    await page.waitForTimeout(1000)
    const stillHasDirtyIndicator = await tabWithDot.count() > 0
    console.log(`CHECK 3: Orange dot removed = ${!stillHasDirtyIndicator ? '✅' : '❌'}`)

    if (stillHasDirtyIndicator) {
      console.log('❌ BUG 3 FAILED: Orange dot still visible after save')
    }

    // Step 9: Make another edit (type "TEST2" at line 2)
    console.log('\nStep 9: Make another edit - type "TEST2" at line 2')
    await editor.click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('TEST2 ')
    await page.waitForTimeout(1000)
    console.log('✅ Second edit made')

    // Step 10: CHECK - Orange dot reappears
    console.log('\nStep 10: CHECK - Orange dot reappears')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-03-second-edit.png'), fullPage: true })

    const dirtyIndicatorReappeared = await tabWithDot.count() > 0
    console.log(`CHECK 4: Orange dot reappeared = ${dirtyIndicatorReappeared ? '✅' : '❌'}`)

    if (!dirtyIndicatorReappeared) {
      console.log('❌ BUG 4 FAILED: Orange dot did not reappear after second edit')
    }

    // Step 11: Click Close button (red button in toolbar)
    console.log('\nStep 11: Click Close button (red X in toolbar)')
    const closeButton = page.locator('.tab-item:has-text("CLAUDE.md") .tab-close').first()
    await closeButton.click()
    await page.waitForTimeout(1000)
    console.log('✅ Close button clicked')

    // Step 12: CHECK - Modal appears with "Unsaved Changes" warning
    console.log('\nStep 12: CHECK - Modal appears with "Unsaved Changes" warning')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-04-unsaved-modal.png'), fullPage: true })

    const unsavedModal = page.locator('.ant-modal:has-text("Unsaved Changes")')
    const hasUnsavedModal = await unsavedModal.count() > 0
    console.log(`CHECK 5: Unsaved Changes modal visible = ${hasUnsavedModal ? '✅' : '❌'}`)

    if (!hasUnsavedModal) {
      console.log('❌ BUG 5 FAILED: Unsaved Changes modal not visible')
    }

    // Step 13: Click "Close Without Saving" to test
    console.log('\nStep 13: Click "Close Without Saving" to test')
    if (hasUnsavedModal) {
      const closeWithoutSavingBtn = page.locator('button:has-text("Close Without Saving")')
      await closeWithoutSavingBtn.click()
      await page.waitForTimeout(1000)
      console.log('✅ Clicked "Close Without Saving"')
    }

    // Step 14: CHECK - File closes
    console.log('\nStep 14: CHECK - File closes')
    const tabStillExists = await page.locator('.tab-item:has-text("CLAUDE.md")').count() > 0
    console.log(`CHECK 6: File closed = ${!tabStillExists ? '✅' : '❌'}`)

    if (tabStillExists) {
      console.log('❌ BUG 6 FAILED: File tab still visible after close')
    }

    // Step 15: Take console logs screenshot
    console.log('\nStep 15: Take console logs screenshot')
    // Open console in browser (this is just for visual verification)
    await page.screenshot({ path: path.join(screenshotDir, 'verify-05-console-logs.png'), fullPage: true })

    // Final Report
    console.log('\n====== FINAL VERIFICATION REPORT ======')
    console.log(`
BUG FIX 1: Save success message shows
  Status: ${hasSuccessMessage ? '✅ PASS' : '❌ FAIL'}

BUG FIX 2: isDirty flag clears after save
  Status: ${!stillHasDirtyIndicator ? '✅ PASS' : '❌ FAIL'}

BUG FIX 3: Unsaved changes warning on close
  Status: ${hasUnsavedModal ? '✅ PASS' : '❌ FAIL'}

OVERALL STATUS: ${hasSuccessMessage && !stillHasDirtyIndicator && hasUnsavedModal ? '✅ PASS' : '❌ FAIL'}
`)

    console.log('\nScreenshots saved to: test-results/final-verification/')
    console.log('- verify-01-edited-dirty.png')
    console.log('- verify-02-save-success.png')
    console.log('- verify-03-second-edit.png')
    console.log('- verify-04-unsaved-modal.png')
    console.log('- verify-05-console-logs.png')

    // Assert all checks passed
    expect(hasDirtyIndicator, 'Dirty indicator should appear after edit').toBe(true)
    expect(hasSuccessMessage, 'Success message should appear after save').toBe(true)
    expect(stillHasDirtyIndicator, 'Dirty indicator should disappear after save').toBe(false)
    expect(dirtyIndicatorReappeared, 'Dirty indicator should reappear after second edit').toBe(true)
    expect(hasUnsavedModal, 'Unsaved changes modal should appear on close').toBe(true)
    expect(tabStillExists, 'File tab should close after confirming').toBe(false)
  })
})
