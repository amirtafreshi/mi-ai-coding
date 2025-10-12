import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Standalone Bug Fix Verification', () => {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'final-verification')

  test('Complete verification of all 3 bug fixes - standalone', async ({ page }) => {
    console.log('\n====== STARTING FINAL VERIFICATION TEST ======\n')

    // Capture all console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      if (text.includes('[MonacoEditor]') || text.includes('isDirty') || text.includes('Saved')) {
        console.log(`[CONSOLE] ${msg.type()}: ${text}`)
      }
    })

    page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error.message)
      consoleLogs.push(`[ERROR] ${error.message}`)
    })

    // Step 1-2: Login
    console.log('Step 1-2: Login with admin@example.com / admin123')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })

    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
    console.log('✅ Login successful')

    // Wait for dashboard to load
    await page.waitForTimeout(3000)

    // Step 3: Navigate to mi-ai-coding folder and click CLAUDE.md
    console.log('\nStep 3: Navigate to mi-ai-coding folder and click CLAUDE.md')

    // Wait for file tree to be visible
    await page.waitForSelector('.file-tree', { timeout: 10000 })

    // Try to find and expand mi-ai-coding folder
    try {
      const folders = page.locator('.file-tree-item')
      const count = await folders.count()
      console.log(`Found ${count} file tree items`)

      // Look for CLAUDE.md directly or in mi-ai-coding folder
      let claudeFile = page.locator('.file-tree-item:has-text("CLAUDE.md")').first()

      if (await claudeFile.count() === 0) {
        console.log('CLAUDE.md not found in root, looking in folders...')
        // Try to expand first folder
        const firstFolder = folders.first()
        await firstFolder.click()
        await page.waitForTimeout(1000)

        claudeFile = page.locator('.file-tree-item:has-text("CLAUDE.md")').first()
      }

      if (await claudeFile.count() > 0) {
        await claudeFile.click()
        await page.waitForTimeout(3000) // Wait for editor to load
        console.log('✅ CLAUDE.md opened')
      } else {
        console.log('⚠️ CLAUDE.md not found, creating test scenario with any file')
        // Click on any .md or .txt file
        const anyFile = page.locator('.file-tree-item[data-type="file"]').first()
        if (await anyFile.count() > 0) {
          await anyFile.click()
          await page.waitForTimeout(3000)
          console.log('✅ Test file opened')
        } else {
          throw new Error('No files found in file tree')
        }
      }
    } catch (error) {
      console.error('Error navigating file tree:', error)
      await page.screenshot({ path: path.join(screenshotDir, 'error-file-tree.png'), fullPage: true })
      throw error
    }

    // Step 4: Make an edit
    console.log('\nStep 4: Make an edit - type "TEST" at line 1')

    // Wait for Monaco editor
    const editor = page.locator('.monaco-editor').first()
    await editor.waitFor({ state: 'visible', timeout: 10000 })

    // Click in editor and type
    await editor.click({ position: { x: 100, y: 50 } })
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+Home') // Go to start
    await page.keyboard.type('TEST ')
    await page.waitForTimeout(2000)
    console.log('✅ Edit made')

    // Step 5: CHECK - Orange dot appears on tab
    console.log('\nStep 5: CHECK - Orange dot appears on tab')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-01-edited-dirty.png'), fullPage: true })

    const tabWithDot = page.locator('.tab-dirty-indicator').first()
    const hasDirtyIndicator = await tabWithDot.count() > 0
    console.log(`CHECK 1: Orange dot visible = ${hasDirtyIndicator ? '✅' : '❌'}`)

    // Step 6: Click Save button
    console.log('\nStep 6: Click Save button')
    const saveButton = page.locator('button:has-text("Save")').first()
    await saveButton.click()
    await page.waitForTimeout(3000) // Wait for save to complete
    console.log('✅ Save button clicked')

    // Step 7: CHECK - Success message appears
    console.log('\nStep 7: CHECK - Success message appears')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(screenshotDir, 'verify-02-save-success.png'), fullPage: true })

    const successMessage = page.locator('.ant-message-success')
    const hasSuccessMessage = await successMessage.count() > 0
    console.log(`CHECK 2: Success message visible = ${hasSuccessMessage ? '✅' : '❌'}`)

    // Step 8: CHECK - Orange dot disappears from tab
    console.log('\nStep 8: CHECK - Orange dot disappears from tab')
    await page.waitForTimeout(1000)
    const stillHasDirtyIndicator = await tabWithDot.count() > 0
    console.log(`CHECK 3: Orange dot removed = ${!stillHasDirtyIndicator ? '✅' : '❌'}`)

    // Step 9: Make another edit
    console.log('\nStep 9: Make another edit - type "TEST2" at line 2')
    await editor.click({ position: { x: 100, y: 80 } })
    await page.waitForTimeout(500)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('TEST2 ')
    await page.waitForTimeout(2000)
    console.log('✅ Second edit made')

    // Step 10: CHECK - Orange dot reappears
    console.log('\nStep 10: CHECK - Orange dot reappears')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-03-second-edit.png'), fullPage: true })

    const dirtyIndicatorReappeared = await tabWithDot.count() > 0
    console.log(`CHECK 4: Orange dot reappeared = ${dirtyIndicatorReappeared ? '✅' : '❌'}`)

    // Step 11: Click Close button
    console.log('\nStep 11: Click Close button (red X in toolbar)')
    const activeTab = page.locator('.tab-item.active').first()
    const closeButton = activeTab.locator('.tab-close').first()

    if (await closeButton.count() > 0) {
      await closeButton.click()
      await page.waitForTimeout(1000)
      console.log('✅ Close button clicked')
    } else {
      console.log('⚠️ Close button not found, trying alternative selector')
      const altCloseBtn = page.locator('[aria-label="Close"]').first()
      await altCloseBtn.click()
      await page.waitForTimeout(1000)
    }

    // Step 12: CHECK - Modal appears with "Unsaved Changes" warning
    console.log('\nStep 12: CHECK - Modal appears with "Unsaved Changes" warning')
    await page.screenshot({ path: path.join(screenshotDir, 'verify-04-unsaved-modal.png'), fullPage: true })

    const unsavedModal = page.locator('.ant-modal:has-text("Unsaved Changes")').or(
      page.locator('.ant-modal:has-text("unsaved")')
    )
    const hasUnsavedModal = await unsavedModal.count() > 0
    console.log(`CHECK 5: Unsaved Changes modal visible = ${hasUnsavedModal ? '✅' : '❌'}`)

    // Step 13: Click "Close Without Saving"
    console.log('\nStep 13: Click "Close Without Saving" to test')
    if (hasUnsavedModal) {
      const closeWithoutSavingBtn = page.locator('button:has-text("Close Without Saving")').or(
        page.locator('button:has-text("Don\'t Save")')
      )
      if (await closeWithoutSavingBtn.count() > 0) {
        await closeWithoutSavingBtn.click()
        await page.waitForTimeout(1000)
        console.log('✅ Clicked "Close Without Saving"')
      }
    }

    // Step 14: CHECK - File closes
    console.log('\nStep 14: CHECK - File closes')
    await page.waitForTimeout(1000)
    const tabStillExists = await activeTab.count() > 0
    console.log(`CHECK 6: File closed = ${!tabStillExists ? '✅' : '❌'}`)

    // Step 15: Console logs
    console.log('\nStep 15: Console logs captured:')
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('MonacoEditor') ||
      log.includes('isDirty') ||
      log.includes('Saved') ||
      log.includes('closeFile')
    )
    relevantLogs.forEach(log => console.log(log))

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

    console.log('\n====== RELEVANT CONSOLE LOGS ======')
    relevantLogs.forEach(log => console.log(log))

    // Soft assertions for reporting
    expect.soft(hasDirtyIndicator, 'Dirty indicator should appear after edit').toBe(true)
    expect.soft(hasSuccessMessage, 'Success message should appear after save').toBe(true)
    expect.soft(stillHasDirtyIndicator, 'Dirty indicator should disappear after save').toBe(false)
    expect.soft(dirtyIndicatorReappeared, 'Dirty indicator should reappear after second edit').toBe(true)
    expect.soft(hasUnsavedModal, 'Unsaved changes modal should appear on close').toBe(true)
  })
})
