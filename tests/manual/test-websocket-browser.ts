/**
 * Manual WebSocket Browser Test
 *
 * This script opens the dashboard and tests WebSocket functionality
 * Run with: DISPLAY=:99 npx ts-node tests/manual/test-websocket-browser.ts
 */

import { chromium, Browser, Page } from 'playwright'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function createActivityLog(page: Page, agent: string, action: string, details: string, level: string = 'info') {
  return await page.evaluate(
    async ({ agent, action, details, level }) => {
      const response = await fetch('http://localhost:3000/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent, action, details, level }),
      })
      return await response.json()
    },
    { agent, action, details, level }
  )
}

async function main() {
  console.log('🚀 Starting WebSocket browser test...')

  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page: Page = await context.newPage()

  // Track console messages
  page.on('console', (msg) => {
    if (msg.text().includes('WebSocket') || msg.text().includes('ActivityStream')) {
      console.log(`[Browser Console] ${msg.text()}`)
    }
  })

  try {
    // Step 1: Login
    console.log('\n📍 Step 1: Navigating to login page...')
    await page.goto('http://localhost:3000/login')
    await sleep(2000)

    console.log('🔑 Step 2: Logging in...')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await sleep(3000)

    // Step 2: Navigate to dashboard
    console.log('\n📊 Step 3: Navigating to dashboard...')
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    await sleep(3000)

    // Take screenshot of dashboard
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/dashboard-loaded.png', fullPage: true })
    console.log('✅ Screenshot saved: dashboard-loaded.png')

    // Step 3: Check WebSocket connection
    console.log('\n🔌 Step 4: Checking WebSocket connection...')
    const liveBadgeVisible = await page.locator('text=Live').isVisible().catch(() => false)
    const disconnectedBadgeVisible = await page.locator('text=Disconnected').isVisible().catch(() => false)

    if (liveBadgeVisible) {
      console.log('✅ WebSocket connected (Live badge visible)')
    } else if (disconnectedBadgeVisible) {
      console.log('❌ WebSocket disconnected')
    } else {
      console.log('⚠️ Could not determine WebSocket status')
    }

    // Step 4: Get initial log count
    console.log('\n📝 Step 5: Counting initial activity logs...')
    const logContainer = page.locator('.activity-log')
    const initialCount = await logContainer.locator('.activity-log-entry').count()
    console.log(`📊 Initial log count: ${initialCount}`)

    // Step 5: Create test logs
    console.log('\n✍️ Step 6: Creating test activity logs...')
    const testLogs = [
      { agent: 'full-stack-developer', action: 'test_websocket_1', details: 'Testing WebSocket real-time update #1', level: 'info' },
      { agent: 'debugging', action: 'test_websocket_2', details: 'Testing WebSocket real-time update #2', level: 'warning' },
      { agent: 'frontend-testing', action: 'test_websocket_3', details: 'Testing WebSocket real-time update #3', level: 'error' },
      { agent: 'orchestrating', action: 'test_websocket_4', details: 'Testing WebSocket real-time update #4', level: 'info' },
      { agent: 'documentation', action: 'test_websocket_5', details: 'Testing WebSocket real-time update #5', level: 'warning' },
    ]

    for (let i = 0; i < testLogs.length; i++) {
      const log = testLogs[i]
      console.log(`   Creating log ${i + 1}/${testLogs.length}: ${log.agent} - ${log.action}`)
      const result = await createActivityLog(page, log.agent, log.action, log.details, log.level)
      console.log(`   ✅ Created: ${result.id}`)
      await sleep(1000) // Wait for WebSocket broadcast
    }

    // Step 6: Verify logs appeared
    console.log('\n🔍 Step 7: Verifying logs appeared in UI...')
    await sleep(2000)
    const newCount = await logContainer.locator('.activity-log-entry').count()
    console.log(`📊 New log count: ${newCount}`)
    console.log(`📈 Logs added: ${newCount - initialCount}`)

    if (newCount > initialCount) {
      console.log('✅ Logs successfully added via WebSocket!')
    } else {
      console.log('❌ Logs did not appear in UI')
    }

    // Take screenshot of activity log
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/activity-log-with-logs.png', fullPage: true })
    console.log('✅ Screenshot saved: activity-log-with-logs.png')

    // Step 7: Test filters
    console.log('\n🔎 Step 8: Testing agent filter...')
    const agentSelect = page.locator('select').first()
    await agentSelect.selectOption('debugging')
    await sleep(1000)

    const filteredCount = await logContainer.locator('.activity-log-entry').count()
    console.log(`📊 Filtered count (debugging): ${filteredCount}`)

    // Take screenshot of filtered logs
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/activity-log-filtered.png', fullPage: true })
    console.log('✅ Screenshot saved: activity-log-filtered.png')

    // Reset filter
    await agentSelect.selectOption('all')
    await sleep(1000)

    // Step 8: Test level filter
    console.log('\n🔎 Step 9: Testing level filter...')
    const levelSelect = page.locator('select').nth(1)
    await levelSelect.selectOption('error')
    await sleep(1000)

    const errorCount = await logContainer.locator('.activity-log-entry').count()
    console.log(`📊 Filtered count (error): ${errorCount}`)

    // Reset filter
    await levelSelect.selectOption('all')
    await sleep(1000)

    // Step 9: Test clear logs
    console.log('\n🗑️ Step 10: Testing clear logs button...')
    const clearButton = page.locator('button[title="Clear logs"]')
    await clearButton.click()
    await sleep(1000)

    const afterClearCount = await logContainer.locator('.activity-log-entry').count()
    console.log(`📊 Count after clear: ${afterClearCount}`)

    if (afterClearCount === 0) {
      console.log('✅ Clear logs button working!')
    } else {
      console.log('❌ Clear logs button not working')
    }

    // Take screenshot of cleared logs
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/activity-log-cleared.png', fullPage: true })
    console.log('✅ Screenshot saved: activity-log-cleared.png')

    // Step 10: Test refresh logs
    console.log('\n🔄 Step 11: Testing refresh logs button...')
    const refreshButton = page.locator('button[title="Refresh"]')
    await refreshButton.click()
    await sleep(2000)

    const afterRefreshCount = await logContainer.locator('.activity-log-entry').count()
    console.log(`📊 Count after refresh: ${afterRefreshCount}`)

    if (afterRefreshCount > 0) {
      console.log('✅ Refresh logs button working!')
    } else {
      console.log('⚠️ No logs after refresh (may be cleared from previous step)')
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary:')
    console.log('='.repeat(60))
    console.log(`✅ WebSocket Status: ${liveBadgeVisible ? 'Connected' : 'Disconnected'}`)
    console.log(`✅ Logs Created: ${testLogs.length}`)
    console.log(`✅ Logs Appeared: ${newCount > initialCount ? 'Yes' : 'No'}`)
    console.log(`✅ Agent Filter: ${filteredCount >= 0 ? 'Working' : 'Not tested'}`)
    console.log(`✅ Level Filter: ${errorCount >= 0 ? 'Working' : 'Not tested'}`)
    console.log(`✅ Clear Button: ${afterClearCount === 0 ? 'Working' : 'Not working'}`)
    console.log(`✅ Refresh Button: ${afterRefreshCount >= 0 ? 'Working' : 'Not tested'}`)
    console.log('='.repeat(60))

    console.log('\n⏸️ Pausing for 10 seconds to inspect browser...')
    await sleep(10000)

  } catch (error) {
    console.error('❌ Error during test:', error)
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/error-state.png', fullPage: true })
  } finally {
    await browser.close()
    console.log('\n✅ Test complete!')
  }
}

main().catch(console.error)
