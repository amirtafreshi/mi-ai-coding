import { chromium } from 'playwright'

async function finalTest() {
  console.log('=== FINAL DASHBOARD TEST AFTER MONACOEDITOR FIX ===\n')

  const browser = await chromium.launch({
    headless: false,
    env: { DISPLAY: ':99' }
  })

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  const errors: Array<{ timestamp: number; message: string }> = []

  // Capture ALL console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ timestamp: Date.now(), message: msg.text() })
      console.log(`[CONSOLE ERROR] ${msg.text()}`)
    }
  })

  // Capture page errors
  page.on('pageerror', (error) => {
    errors.push({ timestamp: Date.now(), message: `PAGE ERROR: ${error.message}\n${error.stack}` })
    console.log(`[PAGE ERROR] ${error.message}`)
  })

  console.log('1. Navigating to login...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  console.log('✓ Login page loaded\n')

  console.log('2. Logging in...')
  await page.fill('#login_email', 'admin@example.com')
  await page.fill('#login_password', 'admin123')
  await page.click('button[type="submit"]')
  console.log('✓ Login submitted\n')

  console.log('3. Waiting for dashboard...')
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  console.log('✓ Dashboard URL reached\n')

  console.log('4. Waiting for dashboard to fully load (10 seconds)...')
  await page.waitForTimeout(10000)
  console.log('✓ Wait complete\n')

  console.log('5. Taking screenshots...')
  await page.screenshot({
    path: '/home/master/projects/mi-ai-coding/test-results/final-test-dashboard.png',
    fullPage: true
  })
  console.log('✓ Screenshots saved\n')

  console.log('=== ERROR ANALYSIS ===')
  const removeChildErrors = errors.filter(e =>
    e.message.toLowerCase().includes('removechild') ||
    e.message.toLowerCase().includes('remove child')
  )

  console.log(`Total errors captured: ${errors.length}`)
  console.log(`removeChild errors: ${removeChildErrors.length}\n`)

  if (removeChildErrors.length > 0) {
    console.log('❌ REMOVECHILD ERRORS FOUND:')
    removeChildErrors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.message}`)
    })
  } else {
    console.log('✅ NO REMOVECHILD ERRORS!')
  }

  if (errors.length > 0) {
    console.log('\n=== ALL ERRORS ===')
    errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err.message}`)
    })
  }

  console.log('\n6. Keeping browser open for 20 seconds for VNC inspection...')
  console.log('View at: http://localhost:6080\n')
  await page.waitForTimeout(20000)

  await browser.close()

  console.log('\n=== TEST COMPLETE ===')
  console.log(`Result: ${removeChildErrors.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`)
  console.log(`removeChild errors: ${removeChildErrors.length}`)
  console.log(`Total errors: ${errors.length}`)

  process.exit(removeChildErrors.length > 0 ? 1 : 0)
}

finalTest().catch((error) => {
  console.error('Test crashed:', error)
  process.exit(1)
})
