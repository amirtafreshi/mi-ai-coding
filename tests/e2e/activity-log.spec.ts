import { test, expect } from '@playwright/test'

test.describe('Activity Log WebSocket Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Login with test credentials
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  })

  test('WebSocket connection established', async ({ page }) => {
    // Check console logs for WebSocket connection
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('ActivityStream')) {
        consoleLogs.push(msg.text())
      }
    })

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')

    // Wait for WebSocket connection
    await page.waitForTimeout(2000)

    // Check if ActivityStream component is visible
    const activityCard = page.locator('text=Activity Log')
    await expect(activityCard).toBeVisible()

    // Check for "Live" badge indicating connection
    const liveBadge = page.locator('text=Live')
    await expect(liveBadge).toBeVisible({ timeout: 5000 })

    // Log console messages for debugging
    console.log('Console logs:', consoleLogs)
  })

  test('Create activity log and verify real-time update', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')

    // Wait for WebSocket connection
    await page.waitForTimeout(2000)

    // Get initial log count
    const logContainer = page.locator('.activity-log')
    const initialEntries = await logContainer.locator('.activity-log-entry').count()

    // Create a test activity log via API
    const response = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent: 'frontend-testing',
          action: 'test_websocket',
          details: 'Testing WebSocket real-time updates',
          level: 'info',
        }),
      })
      return res.json()
    })

    console.log('Created activity log:', response)

    // Wait for WebSocket to receive and display the new log
    await page.waitForTimeout(1000)

    // Verify the new log appears
    const newEntries = await logContainer.locator('.activity-log-entry').count()
    expect(newEntries).toBe(initialEntries + 1)

    // Verify the log content
    const lastEntry = logContainer.locator('.activity-log-entry').last()
    await expect(lastEntry).toContainText('frontend-testing')
    await expect(lastEntry).toContainText('test_websocket')
    await expect(lastEntry).toContainText('Testing WebSocket real-time updates')
  })

  test('Create multiple activity logs', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const logContainer = page.locator('.activity-log')
    const initialEntries = await logContainer.locator('.activity-log-entry').count()

    // Create 5 test logs
    const agents = ['full-stack-developer', 'debugging', 'frontend-testing', 'orchestrating', 'documentation']
    const levels = ['info', 'warning', 'error', 'info', 'warning']

    for (let i = 0; i < 5; i++) {
      await page.evaluate(
        async ({ agent, level, index }) => {
          await fetch('http://localhost:3000/api/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agent,
              action: `test_action_${index}`,
              details: `Test log ${index + 1} for WebSocket testing`,
              level,
            }),
          })
        },
        { agent: agents[i], level: levels[i], index: i }
      )
      await page.waitForTimeout(500)
    }

    // Wait for all logs to appear
    await page.waitForTimeout(2000)

    // Verify all logs appeared
    const newEntries = await logContainer.locator('.activity-log-entry').count()
    expect(newEntries).toBeGreaterThanOrEqual(initialEntries + 5)

    // Verify different agents are displayed
    for (const agent of agents) {
      const agentTag = logContainer.locator(`text=${agent}`).first()
      await expect(agentTag).toBeVisible()
    }
  })

  test('Filter logs by agent', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Create logs from different agents
    await page.evaluate(async () => {
      await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'debugging',
          action: 'test_filter',
          details: 'Test log for debugging agent',
          level: 'info',
        }),
      })
      await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'full-stack-developer',
          action: 'test_filter',
          details: 'Test log for full-stack-developer agent',
          level: 'info',
        }),
      })
    })

    await page.waitForTimeout(1500)

    // Find and click the agent filter dropdown
    const agentSelect = page.locator('select').first()
    await agentSelect.selectOption('debugging')

    await page.waitForTimeout(500)

    // Verify only debugging logs are visible
    const logContainer = page.locator('.activity-log')
    const visibleEntries = logContainer.locator('.activity-log-entry')
    const count = await visibleEntries.count()

    // Check that at least one debugging log is visible
    expect(count).toBeGreaterThan(0)

    // Verify all visible entries are from debugging agent
    for (let i = 0; i < count; i++) {
      const entry = visibleEntries.nth(i)
      await expect(entry).toContainText('debugging')
    }
  })

  test('Filter logs by level', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Create logs with different levels
    await page.evaluate(async () => {
      await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'frontend-testing',
          action: 'test_error',
          details: 'Test error level log',
          level: 'error',
        }),
      })
      await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'frontend-testing',
          action: 'test_warning',
          details: 'Test warning level log',
          level: 'warning',
        }),
      })
    })

    await page.waitForTimeout(1500)

    // Find and click the level filter dropdown
    const levelSelect = page.locator('select').nth(1)
    await levelSelect.selectOption('error')

    await page.waitForTimeout(500)

    // Verify only error logs are visible
    const logContainer = page.locator('.activity-log')
    const errorTags = logContainer.locator('text=ERROR')
    const errorCount = await errorTags.count()

    expect(errorCount).toBeGreaterThan(0)
  })

  test('Auto-scroll behavior', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const logContainer = page.locator('.activity-log')

    // Create several logs to trigger scrolling
    for (let i = 0; i < 10; i++) {
      await page.evaluate(
        async (index) => {
          await fetch('http://localhost:3000/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent: 'frontend-testing',
              action: 'test_scroll',
              details: `Test log ${index} for scroll testing`,
              level: 'info',
            }),
          })
        },
        i
      )
      await page.waitForTimeout(300)
    }

    await page.waitForTimeout(1000)

    // Check if the last entry is visible (auto-scroll working)
    const lastEntry = logContainer.locator('.activity-log-entry').last()
    await expect(lastEntry).toBeInViewport()
  })

  test('Clear logs button', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Create a test log
    await page.evaluate(async () => {
      await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'frontend-testing',
          action: 'test_clear',
          details: 'Test log before clear',
          level: 'info',
        }),
      })
    })

    await page.waitForTimeout(1000)

    const logContainer = page.locator('.activity-log')
    const entriesBeforeClear = await logContainer.locator('.activity-log-entry').count()
    expect(entriesBeforeClear).toBeGreaterThan(0)

    // Click clear button
    const clearButton = page.locator('button[title="Clear logs"]')
    await clearButton.click()

    await page.waitForTimeout(500)

    // Verify logs are cleared
    const entriesAfterClear = await logContainer.locator('.activity-log-entry').count()
    expect(entriesAfterClear).toBe(0)

    // Verify "no logs" message is displayed
    await expect(logContainer).toContainText('No activity logs yet')
  })

  test('Refresh logs button', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click refresh button
    const refreshButton = page.locator('button[title="Refresh"]')
    await refreshButton.click()

    await page.waitForTimeout(1000)

    // Verify logs are loaded (check for activity log entries or no logs message)
    const logContainer = page.locator('.activity-log')
    const hasEntries = (await logContainer.locator('.activity-log-entry').count()) > 0
    const hasNoLogsMessage = await logContainer.locator('text=No activity logs yet').isVisible()

    expect(hasEntries || hasNoLogsMessage).toBe(true)
  })
})
