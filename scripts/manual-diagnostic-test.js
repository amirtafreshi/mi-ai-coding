#!/usr/bin/env node

/**
 * Manual Diagnostic Test Script
 *
 * Tests the three issues manually with Puppeteer
 * Run: DISPLAY=:99 node scripts/manual-diagnostic-test.js
 */

const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const SCREENSHOTS_DIR = path.join(__dirname, '../test-screenshots')
const BASE_URL = 'http://localhost:3000'

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function login(page) {
  console.log('\n  📝 Logging in...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })
  await page.waitForSelector('[name="email"]')
  await page.type('[name="email"]', 'admin@example.com')
  await page.type('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')

  try {
    await page.waitForNavigation({ timeout: 15000 })
    console.log('  ✓ Logged in successfully')
  } catch (e) {
    console.log('  ⚠ Navigation timeout, checking URL...')
    console.log('  Current URL:', page.url())
  }

  await sleep(2000) // Wait for hydration
}

async function testIssue1() {
  console.log('\n' + '='.repeat(60))
  console.log('ISSUE #1: DUAL SESSION LOGOUT TEST')
  console.log('='.repeat(60))

  // Session 1
  console.log('\n--- Session 1: First Login ---')
  const browser1 = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })
  const page1 = await browser1.newPage()

  await login(page1)

  await page1.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue1-session1-logged-in.png'),
    fullPage: true
  })
  console.log('  ✓ Screenshot: issue1-session1-logged-in.png')

  await sleep(3000)

  // Session 2
  console.log('\n--- Session 2: Second Login (Same Credentials) ---')
  const browser2 = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })
  const page2 = await browser2.newPage()

  await login(page2)

  await page2.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue1-session2-logged-in.png'),
    fullPage: true
  })
  console.log('  ✓ Screenshot: issue1-session2-logged-in.png')

  // Wait for session validation check (IdleTimeout checks every 10s)
  console.log('\n--- Waiting for Session Validation (20 seconds) ---')
  await sleep(20000)

  // Check Session 1 status
  console.log('\n--- Checking Session 1 Status ---')
  const url1 = page1.url()
  const isLoggedIn1 = url1.includes('/dashboard')

  await page1.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue1-session1-final.png'),
    fullPage: true
  })
  console.log(`  Session 1 URL: ${url1}`)
  console.log(`  Session 1 logged in: ${isLoggedIn1}`)
  console.log('  ✓ Screenshot: issue1-session1-final.png')

  // Check Session 2 status
  console.log('\n--- Checking Session 2 Status ---')
  const url2 = page2.url()
  const isLoggedIn2 = url2.includes('/dashboard')

  await page2.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue1-session2-final.png'),
    fullPage: true
  })
  console.log(`  Session 2 URL: ${url2}`)
  console.log(`  Session 2 logged in: ${isLoggedIn2}`)
  console.log('  ✓ Screenshot: issue1-session2-final.png')

  // Results
  console.log('\n' + '-'.repeat(60))
  console.log('ISSUE #1 RESULTS')
  console.log('-'.repeat(60))
  console.log('EXPECTED:')
  console.log('  - Session 1 should be LOGGED OUT (redirected to /login)')
  console.log('  - Session 2 should be LOGGED IN (at /dashboard)')
  console.log('\nACTUAL:')
  console.log(`  - Session 1: ${isLoggedIn1 ? '❌ LOGGED IN (BUG!)' : '✓ LOGGED OUT'}`)
  console.log(`  - Session 2: ${isLoggedIn2 ? '✓ LOGGED IN' : '❌ LOGGED OUT (BUG!)'}`)

  if (!isLoggedIn1 && !isLoggedIn2) {
    console.log('\n❌ BUG CONFIRMED: Both sessions are logged out!')
    console.log('\nCode to investigate:')
    console.log('  1. lib/auth.ts (JWT callback, lines 68-94)')
    console.log('  2. components/auth/IdleTimeout.tsx (session check, lines 122-149)')
    console.log('  3. app/api/auth/check-session/route.ts')
  } else if (!isLoggedIn1 && isLoggedIn2) {
    console.log('\n✓ WORKING AS EXPECTED')
  } else {
    console.log('\n⚠ Unexpected state')
  }

  await browser1.close()
  await browser2.close()
}

async function testIssue2() {
  console.log('\n' + '='.repeat(60))
  console.log('ISSUE #2: MOBILE HEADER AVATAR VISIBILITY')
  console.log('='.repeat(60))

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })
  const page = await browser.newPage()

  await login(page)

  // Desktop test
  console.log('\n--- Testing Desktop (1920x1080) ---')
  await page.setViewport({ width: 1920, height: 1080 })
  await sleep(1000)

  const desktopAvatar = await page.$('.ant-avatar')
  const desktopBox = await desktopAvatar?.boundingBox()

  console.log('  Desktop avatar box:', desktopBox)

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue2-desktop-header.png')
  })
  console.log('  ✓ Screenshot: issue2-desktop-header.png')

  // Mobile test
  console.log('\n--- Testing Mobile (375x667) ---')
  await page.setViewport({ width: 375, height: 667 })
  await sleep(1000)

  const mobileAvatar = await page.$('.ant-avatar')
  const mobileBox = await mobileAvatar?.boundingBox()

  console.log('  Mobile avatar box:', mobileBox)

  let isOffScreen = false
  if (mobileBox) {
    const rightEdge = mobileBox.x + mobileBox.width
    isOffScreen = rightEdge > 375
    console.log(`  Mobile avatar right edge: ${rightEdge}px (viewport: 375px)`)
    console.log(`  Avatar off-screen: ${isOffScreen}`)
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue2-mobile-header.png'),
    fullPage: true
  })
  console.log('  ✓ Screenshot: issue2-mobile-header.png')

  // Results
  console.log('\n' + '-'.repeat(60))
  console.log('ISSUE #2 RESULTS')
  console.log('-'.repeat(60))
  console.log('EXPECTED:')
  console.log('  - Avatar should be fully visible within viewport on mobile')
  console.log('\nACTUAL:')
  console.log(`  - Avatar visible: ${mobileBox ? '✓ Yes' : '❌ No'}`)
  console.log(`  - Avatar off-screen: ${isOffScreen ? '❌ Yes (BUG!)' : '✓ No'}`)

  if (isOffScreen) {
    console.log('\n❌ BUG CONFIRMED: Avatar is off-screen on mobile!')
    console.log('\nCode to fix:')
    console.log('  - components/layout/Header.tsx (line 64)')
    console.log('  - Adjust responsive padding/spacing on mobile')
  } else {
    console.log('\n✓ WORKING AS EXPECTED')
  }

  await browser.close()
}

async function testIssue3() {
  console.log('\n' + '='.repeat(60))
  console.log('ISSUE #3: VNC DEAD SPACE')
  console.log('='.repeat(60))

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })
  const page = await browser.newPage()

  await login(page)

  // Desktop test
  console.log('\n--- Testing Desktop VNC (1920x1080) ---')
  await page.setViewport({ width: 1920, height: 1080 })
  await sleep(3000) // Wait for VNC to connect

  const vncContainer = await page.$('.vnc-container')
  if (!vncContainer) {
    console.log('  ⚠ VNC container not found')
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'issue3-no-vnc-found.png'),
      fullPage: true
    })
    await browser.close()
    return
  }

  const containerBox = await vncContainer.boundingBox()
  const canvas = await page.$('.vnc-container canvas')
  const canvasBox = await canvas?.boundingBox()

  console.log('  VNC container box:', containerBox)
  console.log('  VNC canvas box:', canvasBox)

  let desktopDeadSpace = { top: 0, bottom: 0, total: 0 }
  if (containerBox && canvasBox) {
    desktopDeadSpace.top = canvasBox.y - containerBox.y
    desktopDeadSpace.bottom = (containerBox.y + containerBox.height) - (canvasBox.y + canvasBox.height)
    desktopDeadSpace.total = desktopDeadSpace.top + desktopDeadSpace.bottom
    console.log(`  Dead space: ${desktopDeadSpace.total}px (${desktopDeadSpace.top}px top, ${desktopDeadSpace.bottom}px bottom)`)
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue3-desktop-vnc.png'),
    fullPage: true
  })
  console.log('  ✓ Screenshot: issue3-desktop-vnc.png')

  // Mobile test
  console.log('\n--- Testing Mobile VNC (375x667) ---')
  await page.setViewport({ width: 375, height: 667 })
  await sleep(1000)

  const mobileContainerBox = await vncContainer.boundingBox()
  const mobileCanvasBox = await canvas?.boundingBox()

  console.log('  VNC container box:', mobileContainerBox)
  console.log('  VNC canvas box:', mobileCanvasBox)

  let mobileDeadSpace = { top: 0, bottom: 0, total: 0 }
  if (mobileContainerBox && mobileCanvasBox) {
    mobileDeadSpace.top = mobileCanvasBox.y - mobileContainerBox.y
    mobileDeadSpace.bottom = (mobileContainerBox.y + mobileContainerBox.height) - (mobileCanvasBox.y + mobileCanvasBox.height)
    mobileDeadSpace.total = mobileDeadSpace.top + mobileDeadSpace.bottom
    console.log(`  Dead space: ${mobileDeadSpace.total}px (${mobileDeadSpace.top}px top, ${mobileDeadSpace.bottom}px bottom)`)
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'issue3-mobile-vnc.png'),
    fullPage: true
  })
  console.log('  ✓ Screenshot: issue3-mobile-vnc.png')

  // Results
  console.log('\n' + '-'.repeat(60))
  console.log('ISSUE #3 RESULTS')
  console.log('-'.repeat(60))
  console.log('EXPECTED:')
  console.log('  - Minimal dead space (< 10px for padding)')
  console.log('\nACTUAL Desktop:')
  console.log(`  - Dead space: ${desktopDeadSpace.total}px ${desktopDeadSpace.total > 20 ? '❌ EXCESSIVE (BUG!)' : '✓ OK'}`)
  console.log('\nACTUAL Mobile:')
  console.log(`  - Dead space: ${mobileDeadSpace.total}px ${mobileDeadSpace.total > 20 ? '❌ EXCESSIVE (BUG!)' : '✓ OK'}`)

  if (desktopDeadSpace.total > 20 || mobileDeadSpace.total > 20) {
    console.log('\n❌ BUG CONFIRMED: Excessive dead space!')
    console.log('\nCode to fix:')
    console.log('  - components/vnc/VNCViewer.tsx (lines 387-417)')
    console.log('  - Remove or adjust minHeight in container styles')
  } else {
    console.log('\n✓ WORKING AS EXPECTED')
  }

  await browser.close()
}

async function main() {
  console.log('\n')
  console.log('#'.repeat(60))
  console.log('MI AI CODING PLATFORM - DIAGNOSTIC TEST SUITE')
  console.log('#'.repeat(60))
  console.log('\nThis script will test three specific issues:')
  console.log('  1. Session logout issue (both tabs logging out)')
  console.log('  2. Mobile header issue (avatar off-page)')
  console.log('  3. VNC dead space issue')
  console.log('\nScreenshots will be saved in: test-screenshots/')
  console.log('\n' + '#'.repeat(60))

  try {
    await testIssue1()
    await sleep(2000)

    await testIssue2()
    await sleep(2000)

    await testIssue3()

    console.log('\n' + '#'.repeat(60))
    console.log('ALL DIAGNOSTICS COMPLETE')
    console.log('#'.repeat(60))
    console.log('\nScreenshots saved in: test-screenshots/')
    console.log('\nView screenshots to see visual evidence of issues.')
    console.log('Check console output above for detailed analysis.')
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Error during diagnostic tests:', error)
    process.exit(1)
  }
}

main()
