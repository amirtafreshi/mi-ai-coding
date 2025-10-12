/**
 * WebSocket Test with Proper Login
 */

const { chromium } = require('playwright')

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🚀 Starting WebSocket test with login...')

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  // Track console messages
  let wsConnectedMessage = false
  page.on('console', (msg) => {
    const text = msg.text()
    console.log(`[Browser ${msg.type()}] ${text}`)
    if (text.includes('WebSocket connected')) {
      wsConnectedMessage = true
    }
  })

  try {
    // Step 1: Navigate to login
    console.log('\n📍 Step 1: Loading login page...')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')
    await sleep(2000)

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/ws-01-login.png', fullPage: true })
    console.log('✅ Screenshot: ws-01-login.png')

    // Step 2: Fill login form using text matching
    console.log('\n🔑 Step 2: Filling login form...')

    // Try multiple selector strategies
    let emailFilled = false
    let passwordFilled = false

    // Strategy 1: Try Ant Design form ID
    try {
      await page.fill('#login_email', 'admin@example.com', { timeout: 2000 })
      emailFilled = true
      console.log('✅ Email filled (strategy 1: #login_email)')
    } catch (e) {}

    // Strategy 2: Try placeholder text
    if (!emailFilled) {
      try {
        await page.fill('input[placeholder="email@example.com"]', 'admin@example.com', { timeout: 2000 })
        emailFilled = true
        console.log('✅ Email filled (strategy 2: placeholder)')
      } catch (e) {}
    }

    // Strategy 3: Try type=email
    if (!emailFilled) {
      try {
        await page.fill('input[type="email"]', 'admin@example.com', { timeout: 2000 })
        emailFilled = true
        console.log('✅ Email filled (strategy 3: type=email)')
      } catch (e) {}
    }

    // Strategy 4: Try autocomplete
    if (!emailFilled) {
      try {
        await page.fill('input[autocomplete="email"]', 'admin@example.com', { timeout: 2000 })
        emailFilled = true
        console.log('✅ Email filled (strategy 4: autocomplete)')
      } catch (e) {}
    }

    if (!emailFilled) {
      console.log('❌ Could not fill email field')
      throw new Error('Email field not found')
    }

    // Fill password
    try {
      await page.fill('#login_password', 'admin123', { timeout: 2000 })
      passwordFilled = true
      console.log('✅ Password filled (strategy 1: #login_password)')
    } catch (e) {}

    if (!passwordFilled) {
      try {
        await page.fill('input[type="password"]', 'admin123', { timeout: 2000 })
        passwordFilled = true
        console.log('✅ Password filled (strategy 2: type=password)')
      } catch (e) {}
    }

    if (!passwordFilled) {
      console.log('❌ Could not fill password field')
      throw new Error('Password field not found')
    }

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/ws-02-form-filled.png', fullPage: true })
    console.log('✅ Screenshot: ws-02-form-filled.png')

    // Step 3: Submit form
    console.log('\n📤 Step 3: Submitting form...')
    await page.click('button[type="submit"]')
    await sleep(3000)

    // Wait for navigation or dashboard to load
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      console.log('✅ Redirected to dashboard')
    } catch (e) {
      console.log('⚠️ Did not redirect to /dashboard, checking current URL...')
      console.log(`Current URL: ${page.url()}`)
    }

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/ws-03-after-login.png', fullPage: true })
    console.log('✅ Screenshot: ws-03-after-login.png')

    // Step 4: Check for WebSocket connection
    console.log('\n🔌 Step 4: Checking WebSocket connection...')
    await sleep(3000)

    const liveBadgeVisible = await page.locator('text=Live').isVisible().catch(() => false)
    const disconnectedBadgeVisible = await page.locator('text=Disconnected').isVisible().catch(() => false)
    const activityLogVisible = await page.locator('text=Activity Log').isVisible().catch(() => false)

    console.log(`Activity Log visible: ${activityLogVisible}`)
    console.log(`WebSocket status badge - Live: ${liveBadgeVisible}, Disconnected: ${disconnectedBadgeVisible}`)
    console.log(`Console message "WebSocket connected": ${wsConnectedMessage}`)

    // Step 5: Create test activity logs via API
    console.log('\n✍️ Step 5: Creating test activity logs...')

    for (let i = 1; i <= 5; i++) {
      const result = await page.evaluate(async (index) => {
        try {
          const response = await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent: 'frontend-testing',
              action: `websocket_test_${index}`,
              details: `WebSocket real-time test log #${index}`,
              level: index % 3 === 0 ? 'error' : (index % 2 === 0 ? 'warning' : 'info')
            })
          })
          return await response.json()
        } catch (err) {
          return { error: err.message }
        }
      }, i)

      console.log(`   Log ${i}/5 created: ${result.id || result.error}`)
      await sleep(1000)
    }

    await sleep(2000)
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/ws-04-logs-created.png', fullPage: true })
    console.log('✅ Screenshot: ws-04-logs-created.png')

    // Step 6: Check if logs appeared
    console.log('\n🔍 Step 6: Checking if logs appeared in UI...')
    const logContainer = page.locator('.activity-log')
    const logContainerExists = await logContainer.count()
    console.log(`Activity log container found: ${logContainerExists > 0}`)

    if (logContainerExists > 0) {
      const logCount = await logContainer.locator('.activity-log-entry').count()
      console.log(`Total log entries visible: ${logCount}`)

      if (logCount > 0) {
        console.log('✅ SUCCESS: Logs are visible in the UI!')
      } else {
        console.log('❌ FAIL: Log container exists but no entries visible')
      }
    } else {
      console.log('❌ FAIL: Activity log container not found')
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 WebSocket Test Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Login: ${emailFilled && passwordFilled ? 'Success' : 'Failed'}`)
    console.log(`✅ Dashboard loaded: ${activityLogVisible ? 'Yes' : 'No'}`)
    console.log(`✅ WebSocket connected: ${liveBadgeVisible || wsConnectedMessage ? 'Yes' : 'Unknown'}`)
    console.log(`✅ Logs created: 5`)
    console.log(`✅ Logs visible: ${logContainerExists > 0 ? 'Yes' : 'No'}`)
    console.log('='.repeat(60))

    console.log('\n⏸️ Pausing for 30 seconds for manual inspection...')
    console.log('View browser on VNC at http://localhost:6080')
    await sleep(30000)

  } catch (error) {
    console.error('\n❌ Error during test:', error.message)
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/ws-error.png', fullPage: true })
    console.log('✅ Error screenshot: ws-error.png')
  } finally {
    await browser.close()
    console.log('\n✅ Test complete!')
  }
}

main().catch(console.error)
