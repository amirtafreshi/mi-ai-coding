/**
 * Simple Dashboard Test - Just open and take screenshots
 */

const { chromium } = require('playwright')

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('🚀 Starting simple dashboard test...')

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  // Track all console messages
  page.on('console', (msg) => {
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`)
  })

  // Track errors
  page.on('pageerror', (error) => {
    console.error(`[Page Error] ${error.message}`)
  })

  try {
    // Step 1: Go directly to dashboard (assuming logged in via session)
    console.log('\n📊 Opening dashboard...')
    await page.goto('http://localhost:3000/dashboard')
    await sleep(5000)

    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/dashboard-direct.png', fullPage: true })
    console.log('✅ Screenshot saved: dashboard-direct.png')

    // Check for Activity Log component
    const activityLogVisible = await page.locator('text=Activity Log').isVisible().catch(() => false)
    console.log(`Activity Log visible: ${activityLogVisible}`)

    // Check for WebSocket status
    const liveBadgeVisible = await page.locator('text=Live').isVisible().catch(() => false)
    const disconnectedBadgeVisible = await page.locator('text=Disconnected').isVisible().catch(() => false)
    console.log(`WebSocket status: ${liveBadgeVisible ? 'Live' : (disconnectedBadgeVisible ? 'Disconnected' : 'Unknown')}`)

    // Try to find the activity log container
    const logContainer = page.locator('.activity-log')
    const logContainerExists = await logContainer.count()
    console.log(`Activity log container exists: ${logContainerExists > 0}`)

    if (logContainerExists > 0) {
      const logCount = await logContainer.locator('.activity-log-entry').count()
      console.log(`Initial log count: ${logCount}`)
    }

    // Keep browser open for inspection
    console.log('\n⏸️ Keeping browser open for 30 seconds to inspect...')
    console.log('You can view the browser on VNC display :99 at http://localhost:6080')
    await sleep(30000)

  } catch (error) {
    console.error('❌ Error during test:', error)
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/screenshots/error-simple.png', fullPage: true })
  } finally {
    await browser.close()
    console.log('\n✅ Test complete!')
  }
}

main().catch(console.error)
