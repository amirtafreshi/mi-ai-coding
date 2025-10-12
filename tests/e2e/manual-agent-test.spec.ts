import { test, expect } from '@playwright/test'

/**
 * Manual Agent Creation System Test
 *
 * This test manually logs in and explores the agent creation features
 * Run with: DISPLAY=:99 npx playwright test tests/e2e/manual-agent-test.spec.ts --project=chromium --headed
 */

test.describe('Manual Agent System Exploration', () => {
  test('Manual login and agent system exploration', async ({ page }) => {
    console.log('=== Starting Manual Agent System Test ===\n')

    // 1. Go to login page
    console.log('Step 1: Navigating to login page...')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/manual-01-login-page.png', fullPage: true })
    console.log('Screenshot: manual-01-login-page.png')

    // Wait to see the page
    await page.waitForTimeout(2000)

    // 2. Fill login form
    console.log('\nStep 2: Filling login form...')

    // Ant Design Form generates inputs with id like "login_email" and "login_password"
    // Also try placeholder-based selectors
    const emailInput = page.locator('#login_email, input[placeholder*="email"]').first()
    const passwordInput = page.locator('#login_password, input[placeholder*="password"]').first()

    // Wait for inputs to be visible and enabled
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 })

    await emailInput.fill('admin@example.com')
    console.log('Filled email: admin@example.com')

    await passwordInput.fill('admin123')
    console.log('Filled password: admin123')

    await page.screenshot({ path: 'tests/screenshots/manual-02-login-filled.png', fullPage: true })
    console.log('Screenshot: manual-02-login-filled.png')

    // 3. Submit form
    console.log('\nStep 3: Submitting login form...')
    await page.click('button[type="submit"]')

    // Wait a bit and see what happens
    await page.waitForTimeout(5000)

    const currentUrl = page.url()
    console.log('Current URL after login:', currentUrl)

    await page.screenshot({ path: 'tests/screenshots/manual-03-after-login-submit.png', fullPage: true })
    console.log('Screenshot: manual-03-after-login-submit.png')

    // 4. Check if we're on dashboard
    if (currentUrl.match(/\/(dashboard)?$/)) {
      console.log('\nSUCCESS: Logged in to dashboard!')

      // Wait for dashboard to load
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'tests/screenshots/manual-04-dashboard.png', fullPage: true })
      console.log('Screenshot: manual-04-dashboard.png')

      // 5. Look for file explorer
      console.log('\nStep 5: Looking for file explorer...')
      const fileExplorer = page.locator('.ant-tree, [class*="file-tree"], [class*="FileTree"]').first()

      if (await fileExplorer.isVisible({ timeout: 5000 })) {
        console.log('File explorer found!')
        await page.screenshot({ path: 'tests/screenshots/manual-05-file-explorer.png', fullPage: true })

        // 6. Look for Agents button
        console.log('\nStep 6: Looking for Agents quick access button...')
        const agentsButton = page.locator('button:has-text("Agents"), [data-testid="quick-access-agents"]')

        if (await agentsButton.count() > 0) {
          console.log('Agents button found! Clicking...')
          await agentsButton.first().click()
          await page.waitForTimeout(2000)
          await page.screenshot({ path: 'tests/screenshots/manual-06-agents-folder.png', fullPage: true })
          console.log('Screenshot: manual-06-agents-folder.png')

          // 7. Look for +Agent button
          console.log('\nStep 7: Looking for +Agent button...')
          const addAgentButton = page.locator('button:has-text("+Agent"), button:has-text("New Agent")').first()
          const addFileButton = page.locator('button:has-text("+File"), button:has-text("New File")').first()

          const hasAgentButton = await addAgentButton.count() > 0
          const hasFileButton = await addFileButton.count() > 0

          console.log(`+Agent button found: ${hasAgentButton}`)
          console.log(`+File button found: ${hasFileButton}`)

          await page.screenshot({ path: 'tests/screenshots/manual-07-add-buttons.png', fullPage: true })
          console.log('Screenshot: manual-07-add-buttons.png')

          // 8. Try to click +Agent button if it exists
          if (hasAgentButton) {
            console.log('\nStep 8: Clicking +Agent button...')
            await addAgentButton.click()
            await page.waitForTimeout(2000)
            await page.screenshot({ path: 'tests/screenshots/manual-08-create-agent-modal.png', fullPage: true })
            console.log('Screenshot: manual-08-create-agent-modal.png')

            // Check if modal opened
            const modal = page.locator('.ant-modal').first()
            if (await modal.isVisible({ timeout: 2000 })) {
              console.log('SUCCESS: Create Agent Modal opened!')

              // Look for creation method tabs
              const tabs = await page.locator('.ant-tabs-tab, .ant-radio-button').count()
              console.log(`Found ${tabs} creation method options`)

              await page.waitForTimeout(2000)
              await page.screenshot({ path: 'tests/screenshots/manual-09-modal-details.png', fullPage: true })
              console.log('Screenshot: manual-09-modal-details.png')
            } else {
              console.log('WARNING: Modal did not open')
            }
          } else {
            console.log('INFO: +Agent button not found. This feature may not be implemented yet.')
          }

          // 9. Look for existing .md files in agents folder
          console.log('\nStep 9: Looking for existing .md files in agents folder...')
          const mdFiles = await page.locator('[role="treeitem"]:has-text(".md")').count()
          console.log(`Found ${mdFiles} .md files in agents folder`)

          if (mdFiles > 0) {
            console.log('Clicking first .md file...')
            await page.locator('[role="treeitem"]:has-text(".md")').first().click()
            await page.waitForTimeout(2000)
            await page.screenshot({ path: 'tests/screenshots/manual-10-md-file-selected.png', fullPage: true })
            console.log('Screenshot: manual-10-md-file-selected.png')

            // Look for rocket deploy button
            const rocketButton = page.locator('button:has-text("🚀"), button[title*="Deploy"]')
            if (await rocketButton.count() > 0) {
              console.log('SUCCESS: Rocket deploy button found!')
              await page.screenshot({ path: 'tests/screenshots/manual-11-rocket-button.png', fullPage: true })
            } else {
              console.log('INFO: Rocket deploy button not found')
            }
          }

        } else {
          console.log('WARNING: Agents button not found')
          await page.screenshot({ path: 'tests/screenshots/manual-06-no-agents-button.png', fullPage: true })
        }
      } else {
        console.log('WARNING: File explorer not found')
        await page.screenshot({ path: 'tests/screenshots/manual-05-no-file-explorer.png', fullPage: true })
      }
    } else {
      console.log('\nERROR: Login failed - still on login page')

      // Check for error messages
      const errorAlert = await page.locator('[role="alert"], .ant-message-error, .ant-notification-error').count()
      if (errorAlert > 0) {
        const errorText = await page.locator('[role="alert"], .ant-message-error').first().textContent()
        console.log('Error message:', errorText)
      }
    }

    console.log('\n=== Test Complete ===')
    console.log('All screenshots saved to tests/screenshots/')
    console.log('Check VNC viewer at http://localhost:6080 for live view')
  })
})
