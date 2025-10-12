import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Editor Bug Fix Verification', () => {
  test.use({
    viewport: { width: 1920, height: 1080 }
  })

  test('Complete editor verification flow', async ({ page }) => {
    const consoleLogs: string[] = []

    // Enable console logging
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)
      if (text.includes('[FileTree]') || text.includes('[MonacoEditor]') || text.includes('file:open')) {
        console.log('🔍 Browser Console:', text)
      }
    })

    console.log('\n=== STEP 1: Login ===')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    // Find and fill email field
    const emailInput = page.locator('input[placeholder*="email" i], input[type="email"], input[name="email"]').first()
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill('admin@example.com')

    // Find and fill password field
    const passwordInput = page.locator('input[placeholder*="password" i], input[type="password"], input[name="password"]').first()
    await passwordInput.fill('admin123')

    // Click Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), button[type="submit"]').first()
    await signInButton.click()
    console.log('✓ Login submitted')

    console.log('\n=== STEP 2: Wait for dashboard to load ===')
    await page.waitForURL('http://localhost:3000', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    console.log('✓ Dashboard loaded')

    // Take screenshot of initial state
    await page.screenshot({
      path: path.join(process.cwd(), 'fix-test-00-dashboard.png'),
      fullPage: true
    })
    console.log('✓ Screenshot: fix-test-00-dashboard.png')

    console.log('\n=== STEP 3: Wait for file explorer ===')
    // Wait for file tree to be visible
    try {
      await page.waitForSelector('.file-tree-container, [data-testid="file-tree"], .ant-tree', {
        timeout: 10000,
        state: 'visible'
      })
      console.log('✓ File explorer visible')
    } catch (e) {
      console.log('⚠ File explorer not found with standard selectors')
    }

    await page.waitForTimeout(2000)
    await page.screenshot({
      path: path.join(process.cwd(), 'fix-test-00-file-tree.png'),
      fullPage: true
    })
    console.log('✓ Screenshot: fix-test-00-file-tree.png')

    console.log('\n=== STEP 4: Navigate to project folder ===')
    // Try to find Projects quick access or expand tree
    const projectsButton = page.locator('text=/mi-ai-coding|Projects|projects/i').first()
    if (await projectsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectsButton.click()
      console.log('✓ Clicked Projects quick access')
      await page.waitForTimeout(1500)
    }

    // Try to expand some nodes
    const treeExpanders = page.locator('.ant-tree-switcher, [class*="expand"]')
    const expandCount = await treeExpanders.count()
    console.log(`Found ${expandCount} expandable tree nodes`)

    for (let i = 0; i < Math.min(expandCount, 10); i++) {
      try {
        const expander = treeExpanders.nth(i)
        if (await expander.isVisible({ timeout: 500 })) {
          await expander.click({ timeout: 500 })
          await page.waitForTimeout(300)
        }
      } catch (e) {
        // Continue if click fails
      }
    }

    await page.waitForTimeout(1500)

    console.log('\n=== STEP 5: Click on a text file ===')
    // Try to find and click a text file
    const fileSelectors = [
      'text=README.md',
      'text=package.json',
      'text=.gitignore',
      'text=tsconfig.json',
      '[title="README.md"]',
      '.ant-tree-node-content-wrapper:has-text("README")'
    ]

    let clickedFile = ''
    let fileClicked = false

    for (const selector of fileSelectors) {
      try {
        const element = page.locator(selector).first()
        if (await element.isVisible({ timeout: 2000 })) {
          const fileName = await element.textContent()
          await element.click()
          fileClicked = true
          clickedFile = fileName || selector
          console.log(`✓ Clicked file: ${clickedFile}`)
          break
        }
      } catch (e) {
        continue
      }
    }

    if (!fileClicked) {
      console.log('⚠ No text file found, trying any file with text extension')
      const anyTextFile = page.locator('[class*="file"]:has-text(".md"), [class*="file"]:has-text(".json")').first()
      if (await anyTextFile.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyTextFile.click()
        fileClicked = true
        console.log('✓ Clicked alternative text file')
      }
    }

    expect(fileClicked).toBe(true)

    console.log('\n=== STEP 6: Verify file opens in Monaco editor ===')
    await page.waitForTimeout(3000)

    // Check for Monaco editor
    const monacoEditor = page.locator('.monaco-editor').first()
    const editorVisible = await monacoEditor.isVisible({ timeout: 5000 }).catch(() => false)

    console.log(`Monaco editor visible: ${editorVisible ? '✅ YES' : '❌ NO'}`)

    // Take screenshot of file opened
    await page.screenshot({
      path: path.join(process.cwd(), 'fix-test-01-file-opened.png'),
      fullPage: true
    })
    console.log('✓ Screenshot: fix-test-01-file-opened.png')

    // Check console logs for expected events
    const hasFileOpenDispatch = consoleLogs.some(log =>
      log.includes('[FileTree]') && log.includes('file:open')
    )
    const hasMonacoReceived = consoleLogs.some(log =>
      log.includes('[MonacoEditor]') && log.includes('Received file:open')
    )
    const hasMonacoSuccess = consoleLogs.some(log =>
      log.includes('[MonacoEditor]') && (log.includes('opened successfully') || log.includes('File opened'))
    )

    console.log('\n=== Console Log Events ===')
    console.log(`[FileTree] Dispatching file:open: ${hasFileOpenDispatch ? '✅' : '❌'}`)
    console.log(`[MonacoEditor] Received file:open: ${hasMonacoReceived ? '✅' : '❌'}`)
    console.log(`[MonacoEditor] File opened successfully: ${hasMonacoSuccess ? '✅' : '❌'}`)

    expect(editorVisible).toBe(true)

    console.log('\n=== STEP 7: Test editing functionality ===')
    if (editorVisible) {
      // Click on editor to focus
      await monacoEditor.click()
      await page.waitForTimeout(500)

      // Type test content
      await page.keyboard.type('\n\n// Test edit from automated verification\n')
      console.log('✓ Typed test content')

      await page.waitForTimeout(1500)

      // Take screenshot of editing
      await page.screenshot({
        path: path.join(process.cwd(), 'fix-test-02-editing.png'),
        fullPage: true
      })
      console.log('✓ Screenshot: fix-test-02-editing.png')

      // Check for Save button
      const saveButton = page.locator('button:has-text("Save")').first()
      const saveButtonVisible = await saveButton.isVisible({ timeout: 2000 }).catch(() => false)
      const saveButtonEnabled = saveButtonVisible ? await saveButton.isEnabled() : false

      console.log(`Save button visible: ${saveButtonVisible ? '✅' : '❌'}`)
      console.log(`Save button enabled: ${saveButtonEnabled ? '✅' : '❌'}`)

      if (saveButtonEnabled) {
        await saveButton.click()
        console.log('✓ Clicked Save button')
        await page.waitForTimeout(2000)

        // Take screenshot of save success
        await page.screenshot({
          path: path.join(process.cwd(), 'fix-test-03-save-success.png'),
          fullPage: true
        })
        console.log('✓ Screenshot: fix-test-03-save-success.png')

        // Test Save As dialog
        const saveAsButton = page.locator('button:has-text("Save As")').first()
        if (await saveAsButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await saveAsButton.click()
          await page.waitForTimeout(1000)

          const cancelButton = page.locator('button:has-text("Cancel"), .ant-modal-close').first()
          if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await cancelButton.click()
            console.log('✓ Tested Save As dialog')
          }
        }

        // Test Permissions dialog
        const permissionsButton = page.locator('button:has-text("Permissions")').first()
        if (await permissionsButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await permissionsButton.click()
          await page.waitForTimeout(1000)

          const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), .ant-modal-close').first()
          if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeButton.click()
            console.log('✓ Tested Permissions dialog')
          }
        }

        // Make another edit for dirty file test
        await monacoEditor.click()
        await page.waitForTimeout(500)
        await page.keyboard.type('\n// Another edit for dirty check\n')
        console.log('✓ Made another edit')
        await page.waitForTimeout(1000)

        // Try to close and check for unsaved warning
        const closeButton = page.locator('button:has-text("Close")').first()
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click()
          await page.waitForTimeout(1000)

          const warningModal = page.locator('.ant-modal, [role="dialog"]')
          const hasWarning = await warningModal.isVisible({ timeout: 2000 }).catch(() => false)
          console.log(`Unsaved changes warning: ${hasWarning ? '✅ SHOWN' : '❌ NOT SHOWN'}`)

          if (hasWarning) {
            const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first()
            if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
              await cancelBtn.click()
              console.log('✓ Dismissed warning')
            }
          }
        }
      }
    }

    console.log('\n=== STEP 8: Final screenshot with console context ===')
    await page.screenshot({
      path: path.join(process.cwd(), 'fix-test-04-console-logs.png'),
      fullPage: true
    })
    console.log('✓ Screenshot: fix-test-04-console-logs.png')

    console.log('\n=== All Captured Console Logs ===')
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('FileTree') ||
      log.includes('MonacoEditor') ||
      log.includes('file:open') ||
      log.includes('error') ||
      log.includes('Error')
    )
    relevantLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`)
    })

    console.log('\n' + '='.repeat(70))
    console.log('FINAL VERIFICATION REPORT')
    console.log('='.repeat(70))
    console.log(`File clicked: ${clickedFile}`)
    console.log(`Monaco editor visible: ${editorVisible ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Console events working: ${hasFileOpenDispatch && hasMonacoReceived ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Bug fix status: ${editorVisible && hasMonacoReceived ? '✅ FIXED' : '❌ STILL BROKEN'}`)
    console.log('='.repeat(70))

    // Generate summary report
    const bugFixed = editorVisible && (hasMonacoReceived || hasMonacoSuccess)
    console.log(`\n🎯 FINAL RESULT: ${bugFixed ? '✅ FILE OPENING FIXED' : '❌ STILL BROKEN'}`)
  })
})
