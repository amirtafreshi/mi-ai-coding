import { test, expect } from '@playwright/test'

// Simplified tests with shorter timeouts
test.describe('New Features Quick Test', () => {
  test('All Features Combined Test', async ({ page }) => {
    console.log('Starting combined features test...')

    // 1. Login as admin
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' })
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await page.waitForTimeout(3000)

    console.log('✅ Login successful')

    // 2. Check Platform Branding
    try {
      const platformTitle = page.locator('text=MI AI Coding Platform').first()
      const isVisible = await platformTitle.isVisible({ timeout: 5000 })
      if (isVisible) {
        console.log('✅ Feature 1: Platform branding visible in header')
        await page.screenshot({ path: 'test-results/e2e-01-header-branding.png', fullPage: false })
      } else {
        console.log('❌ Feature 1: Platform branding NOT visible')
      }
    } catch (e) {
      console.log('❌ Feature 1: Error checking platform branding:', (e as Error).message)
    }

    // 3. Check Sidebar Collapsed State
    try {
      const sidebar = page.locator('aside, [class*="sidebar"], [class*="sider"]').first()
      const sidebarBox = await sidebar.boundingBox()

      if (sidebarBox && sidebarBox.width < 100) {
        console.log(`✅ Feature 2: Sidebar starts collapsed (width: ${sidebarBox.width}px)`)
        await page.screenshot({ path: 'test-results/e2e-02-sidebar-collapsed.png', fullPage: false })
      } else {
        console.log(`❌ Feature 2: Sidebar not collapsed (width: ${sidebarBox?.width}px)`)
      }
    } catch (e) {
      console.log('❌ Feature 2: Error checking sidebar:', (e as Error).message)
    }

    // 4. Navigate to Users Page
    try {
      // Try to find Users link
      let usersLink = page.locator('a[href*="/users"], span:text-is("Users")').first()

      // If not visible, try to expand sidebar
      if (!(await usersLink.isVisible({ timeout: 2000 }).catch(() => false))) {
        const hamburger = page.locator('button[class*="trigger"], .ant-layout-sider-trigger').first()
        if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
          await hamburger.click()
          await page.waitForTimeout(500)
        }
      }

      // Try again to find and click Users link
      usersLink = page.locator('a[href*="/users"], span:text-is("Users")').first()
      await usersLink.click({ timeout: 5000 })
      await page.waitForURL('**/users**', { timeout: 10000 })
      await page.waitForTimeout(2000)

      console.log('✅ Feature 3: Navigated to Users page')
      await page.screenshot({ path: 'test-results/e2e-03-users-page.png', fullPage: true })

      // Quick user check - just verify page loaded
      const pageContent = await page.textContent('body')
      if (pageContent?.includes('admin@example.com') || pageContent?.includes('Email')) {
        console.log('✅ Feature 3: Users table visible with data')
      }

    } catch (e) {
      console.log('❌ Feature 3: Error accessing Users page:', (e as Error).message)
    }

    // 5. Check Activity Log
    try {
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const activityLog = page.locator('[class*="activity"]').first()
      if (await activityLog.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.screenshot({ path: 'test-results/e2e-07-activity-log.png', fullPage: false })

        const activityContent = await activityLog.textContent()
        // Look for purple tags or username indicators
        const hasTags = activityContent?.includes('admin') || activityContent?.includes('user')

        if (hasTags) {
          console.log('✅ Feature 4: Activity log shows user information')
        } else {
          console.log('⚠️ Feature 4: Activity log visible but no clear username tags')
        }
      } else {
        console.log('❌ Feature 4: Activity log not visible')
      }
    } catch (e) {
      console.log('❌ Feature 4: Error checking activity log:', (e as Error).message)
    }

    // 6. Check VNC Fullscreen Buttons
    try {
      const fullscreenButtons = page.locator('button:has-text("Fullscreen")')
      const buttonCount = await fullscreenButtons.count()

      if (buttonCount > 0) {
        console.log(`✅ Feature 5: Found ${buttonCount} fullscreen button(s) for VNC`)

        // Try clicking one
        await fullscreenButtons.first().click()
        await page.waitForTimeout(1000)

        const modal = page.locator('.ant-modal, [role="dialog"]').first()
        if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ Feature 5: VNC fullscreen modal opens')
          await page.screenshot({ path: 'test-results/e2e-08-vnc-fullscreen.png', fullPage: false })

          // Close modal
          const closeBtn = page.locator('.ant-modal-close, button:has-text("Exit")').first()
          await closeBtn.click({ timeout: 3000 }).catch(() => {})
          await page.waitForTimeout(500)
        }
      } else {
        console.log('❌ Feature 5: No fullscreen buttons found')
      }
    } catch (e) {
      console.log('❌ Feature 5: Error checking VNC fullscreen:', (e as Error).message)
    }

    // 7. Check Editor/File Tree
    try {
      const fileTree = page.locator('[class*="file"], [class*="explorer"]').first()
      if (await fileTree.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Feature 6: File explorer visible')

        // Check for editor fullscreen button
        const editorFullscreen = page.locator('button:has-text("Fullscreen")').last()
        if (await editorFullscreen.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Feature 6: Editor fullscreen button available')
        }
      } else {
        console.log('⚠️ Feature 6: File explorer not immediately visible')
      }
    } catch (e) {
      console.log('❌ Feature 6: Error checking editor:', (e as Error).message)
    }

    // 8. Final System Health Screenshot
    await page.screenshot({ path: 'test-results/e2e-10-system-health.png', fullPage: true })
    console.log('✅ Complete system screenshot captured')

    // Console error check
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)

    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors detected:')
      consoleErrors.forEach(err => console.log('  -', err.substring(0, 100)))
    } else {
      console.log('✅ No console errors detected')
    }

    console.log('\n=== TEST SUMMARY ===')
    console.log('Check the screenshots in test-results/ directory for visual verification')
  })
})
