import { test, expect } from '@playwright/test'

test('visual console verification with screenshot', async ({ page }) => {
  const consoleMessages: Array<{ type: string; text: string }> = []

  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    })
  })

  // Navigate to dashboard
  await page.goto('http://localhost:3000')
  await page.waitForTimeout(3000)

  // Take screenshot of the page
  await page.screenshot({
    path: '/home/master/projects/mi-ai-coding/tests/screenshots/console-verification.png',
    fullPage: true
  })

  console.log('\n📸 Screenshot saved to: tests/screenshots/console-verification.png')
  console.log(`\n📊 Captured ${consoleMessages.length} console messages`)
  console.log(`   Errors: ${consoleMessages.filter(m => m.type === 'error').length}`)
  console.log(`   Warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`)
})
