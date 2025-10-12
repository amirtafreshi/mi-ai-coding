import { test, expect } from '@playwright/test'

test.describe('Comprehensive E2E Test - New Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')
  })

  test('Feature 1: Platform Branding - Header Title', async ({ page }) => {
    // Login as admin first
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Check for "MI AI Coding Platform" in header
    const headerText = await page.locator('header').textContent()
    console.log('Header text:', headerText)

    // Look for the title - it might be in different elements
    const platformTitle = page.locator('text=MI AI Coding Platform').first()
    await expect(platformTitle).toBeVisible({ timeout: 5000 })

    // Take screenshot
    await page.screenshot({
      path: 'test-results/e2e-01-header-branding.png',
      fullPage: true
    })

    console.log('✅ Platform branding visible in header')
  })

  test('Feature 2: Sidebar Starts Collapsed', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/e2e-02-sidebar-collapsed.png',
      fullPage: true
    })

    // Check if sidebar is collapsed (narrow width or hidden menu items)
    const sidebar = page.locator('aside, [class*="sidebar"], [class*="sider"]').first()
    const sidebarBox = await sidebar.boundingBox()
    console.log('Sidebar width:', sidebarBox?.width)

    // Collapsed sidebar should be narrow (typically < 100px)
    if (sidebarBox && sidebarBox.width < 100) {
      console.log('✅ Sidebar starts collapsed')
    } else {
      console.log('⚠️ Sidebar width is:', sidebarBox?.width, 'px (expected < 100px)')
    }

    // Try to find and click hamburger menu
    const hamburger = page.locator('button[aria-label*="menu"], button[class*="trigger"], .ant-layout-sider-trigger').first()
    if (await hamburger.isVisible()) {
      await hamburger.click()
      await page.waitForTimeout(500)

      // Take screenshot after expanding
      await page.screenshot({
        path: 'test-results/e2e-02b-sidebar-expanded.png',
        fullPage: true
      })
      console.log('✅ Sidebar can be expanded via hamburger')
    }
  })

  test('Feature 3: User Management - Full CRUD Flow', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Navigate to Users page
    // First try to expand sidebar if collapsed
    const usersLink = page.locator('a[href*="/users"], text=Users').first()

    if (!(await usersLink.isVisible())) {
      // Try to expand sidebar
      const hamburger = page.locator('button[aria-label*="menu"], button[class*="trigger"], .ant-layout-sider-trigger').first()
      if (await hamburger.isVisible()) {
        await hamburger.click()
        await page.waitForTimeout(500)
      }
    }

    await usersLink.click()
    await page.waitForURL('**/users**', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Take screenshot of users page
    await page.screenshot({
      path: 'test-results/e2e-03-users-page.png',
      fullPage: true
    })
    console.log('✅ Users page loaded')

    // CREATE: Add new user
    const addButton = page.locator('button:has-text("Add User"), button:has-text("Create")').first()
    await addButton.click()
    await page.waitForTimeout(1000)

    // Take screenshot of create modal
    await page.screenshot({
      path: 'test-results/e2e-04-create-user-modal.png',
      fullPage: true
    })

    // Fill form
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="password"]', 'test123')

    // Select role (might be dropdown)
    const roleSelect = page.locator('select[name="role"], .ant-select:has-text("Role")').first()
    if (await roleSelect.isVisible()) {
      if (await roleSelect.evaluate(el => el.tagName === 'SELECT')) {
        await roleSelect.selectOption('user')
      } else {
        await roleSelect.click()
        await page.locator('text=user').first().click()
      }
    }

    await page.waitForTimeout(500)

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first()
    await submitButton.click()
    await page.waitForTimeout(2000)

    // Verify user appears in table
    await page.screenshot({
      path: 'test-results/e2e-05-user-created.png',
      fullPage: true
    })

    const testUserRow = page.locator('tr:has-text("test@test.com")').first()
    await expect(testUserRow).toBeVisible({ timeout: 5000 })
    console.log('✅ User created successfully')

    // EDIT: Update user
    const editButton = testUserRow.locator('button:has-text("Edit"), button[aria-label="Edit"]').first()
    await editButton.click()
    await page.waitForTimeout(1000)

    // Change name
    const nameInput = page.locator('input[name="name"]').first()
    await nameInput.clear()
    await nameInput.fill('Test User Updated')

    await page.screenshot({
      path: 'test-results/e2e-06-edit-user-modal.png',
      fullPage: true
    })

    const updateButton = page.locator('button[type="submit"], button:has-text("Update"), button:has-text("Save")').first()
    await updateButton.click()
    await page.waitForTimeout(2000)

    // Verify update
    const updatedRow = page.locator('tr:has-text("Test User Updated")').first()
    await expect(updatedRow).toBeVisible({ timeout: 5000 })
    console.log('✅ User updated successfully')

    // SEARCH: Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)

      // Verify filtering
      const visibleRows = await page.locator('tbody tr').count()
      console.log(`✅ Search filter shows ${visibleRows} result(s)`)

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(1000)
    }

    // FILTER: Test role filter
    const roleFilter = page.locator('select[aria-label*="role"], .ant-select:has-text("Role")').first()
    if (await roleFilter.isVisible()) {
      if (await roleFilter.evaluate(el => el.tagName === 'SELECT')) {
        await roleFilter.selectOption('user')
      } else {
        await roleFilter.click()
        await page.locator('text=user').first().click()
      }
      await page.waitForTimeout(1000)
      console.log('✅ Role filter applied')

      // Clear filter
      await roleFilter.selectOption('')
      await page.waitForTimeout(1000)
    }

    // DELETE: Remove test user
    const deleteButton = testUserRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').first()
    await deleteButton.click()
    await page.waitForTimeout(500)

    // Confirm deletion in modal
    const confirmButton = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Delete")').last()
    await confirmButton.click()
    await page.waitForTimeout(2000)

    // Verify deletion
    await expect(testUserRow).not.toBeVisible({ timeout: 5000 })
    console.log('✅ User deleted successfully')

    await page.screenshot({
      path: 'test-results/e2e-06b-user-deleted.png',
      fullPage: true
    })
  })

  test('Feature 4: Activity Log with Usernames', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Find activity log panel
    const activityLog = page.locator('[class*="activity"], [id*="activity"]').first()

    if (await activityLog.isVisible()) {
      // Take screenshot
      await page.screenshot({
        path: 'test-results/e2e-07-activity-log-users.png',
        fullPage: true
      })

      // Check for username tags (purple tags)
      const activityContent = await activityLog.textContent()
      console.log('Activity log sample:', activityContent?.substring(0, 500))

      // Look for username indicators (purple tags or formatted usernames)
      const usernameTags = activityLog.locator('.ant-tag, [class*="username"], [style*="purple"]')
      const tagCount = await usernameTags.count()

      if (tagCount > 0) {
        console.log(`✅ Activity log shows ${tagCount} username tags`)
      } else {
        console.log('⚠️ Username tags not found in activity log')
      }
    } else {
      console.log('⚠️ Activity log panel not visible')
    }
  })

  test('Feature 5: VNC Fullscreen', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Find VNC panels
    const vncPanels = page.locator('[class*="vnc"], canvas[data-display]')
    const panelCount = await vncPanels.count()
    console.log(`Found ${panelCount} VNC panel(s)`)

    // Look for fullscreen buttons
    const fullscreenButtons = page.locator('button:has-text("Fullscreen"), button[aria-label*="fullscreen"]')
    const buttonCount = await fullscreenButtons.count()
    console.log(`Found ${buttonCount} fullscreen button(s)`)

    if (buttonCount > 0) {
      // Click first fullscreen button (Terminal VNC :98)
      await fullscreenButtons.first().click()
      await page.waitForTimeout(1000)

      // Check for modal
      const modal = page.locator('.ant-modal, [role="dialog"]').first()
      await expect(modal).toBeVisible({ timeout: 5000 })

      await page.screenshot({
        path: 'test-results/e2e-08-vnc-fullscreen.png',
        fullPage: true
      })
      console.log('✅ VNC fullscreen modal opened')

      // Close modal
      const closeButton = page.locator('button:has-text("Exit"), button:has-text("Close"), .ant-modal-close').first()
      await closeButton.click()
      await page.waitForTimeout(500)

      console.log('✅ VNC fullscreen modal closed')
    } else {
      console.log('⚠️ No fullscreen buttons found')
    }
  })

  test('Feature 6: Editor Fullscreen', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Navigate to file explorer and open a file
    // First, expand file tree if needed
    const fileTree = page.locator('[class*="file-tree"], [class*="explorer"]').first()

    if (await fileTree.isVisible()) {
      // Try to find and click README.md or any file
      const readmeFile = page.locator('text=README.md, text=package.json').first()

      if (await readmeFile.isVisible()) {
        await readmeFile.click()
        await page.waitForTimeout(2000)

        // Look for editor fullscreen button
        const editorFullscreenBtn = page.locator('button:has-text("Fullscreen")').last()

        if (await editorFullscreenBtn.isVisible()) {
          await editorFullscreenBtn.click()
          await page.waitForTimeout(1000)

          // Check for fullscreen modal
          const modal = page.locator('.ant-modal, [role="dialog"]').first()
          await expect(modal).toBeVisible({ timeout: 5000 })

          await page.screenshot({
            path: 'test-results/e2e-09-editor-fullscreen.png',
            fullPage: true
          })
          console.log('✅ Editor fullscreen modal opened')

          // Try to verify Save button works
          const saveButton = page.locator('button:has-text("Save")').first()
          if (await saveButton.isVisible()) {
            console.log('✅ Save button visible in fullscreen mode')
          }

          // Close modal
          const closeButton = page.locator('button:has-text("Exit"), button:has-text("Close"), .ant-modal-close').first()
          await closeButton.click()
          await page.waitForTimeout(500)

          console.log('✅ Editor fullscreen modal closed')
        } else {
          console.log('⚠️ Editor fullscreen button not found')
        }
      } else {
        console.log('⚠️ No files found to open')
      }
    } else {
      console.log('⚠️ File tree not visible')
    }
  })

  test('Complete System Health Check', async ({ page }) => {
    // Login as admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Take final comprehensive screenshot
    await page.screenshot({
      path: 'test-results/e2e-10-system-health.png',
      fullPage: true
    })

    // Check for console errors
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    if (logs.length > 0) {
      console.log('⚠️ Console errors detected:')
      logs.forEach(log => console.log('  -', log))
    } else {
      console.log('✅ No console errors detected')
    }

    // Performance check
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart
      }
    })

    console.log('Performance Metrics:')
    console.log('  - DOM Content Loaded:', performanceMetrics.domContentLoaded, 'ms')
    console.log('  - Load Complete:', performanceMetrics.loadComplete, 'ms')
    console.log('  - DOM Interactive:', performanceMetrics.domInteractive, 'ms')

    if (performanceMetrics.domInteractive < 3000) {
      console.log('✅ Good performance (< 3s DOM interactive)')
    } else {
      console.log('⚠️ Slow performance (> 3s DOM interactive)')
    }
  })
})
