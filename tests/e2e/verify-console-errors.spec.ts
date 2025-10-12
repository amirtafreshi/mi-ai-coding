import { test, expect } from '@playwright/test'

test.describe('Console Error Verification', () => {
  test('should capture and categorize console messages', async ({ page }) => {
    const consoleMessages: Array<{
      type: string
      text: string
      location?: string
    }> = []

    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url
      })
    })

    // Navigate to dashboard
    await page.goto('http://localhost:3000')

    // Wait for page to fully load and capture console output
    await page.waitForTimeout(3000)

    // Categorize errors
    const allErrors = consoleMessages.filter(m => m.type === 'error')
    const allWarnings = consoleMessages.filter(m => m.type === 'warning')

    // Expected errors/warnings (these are OK)
    const expectedMessages = [
      'CLIENT_FETCH_ERROR',
      '401',
      'Unauthorized',
      'React does not recognize',
      'WebSocket connection',
      'ws://'
    ]

    // Fixed issues (these should NOT appear)
    const fixedIssues = [
      'Static function can not consume context',
      'message.open',
      'App.useApp',
      'TLS',
      'secure context'
    ]

    // Check for Ant Design message warning (should be GONE)
    const antdMessageWarning = consoleMessages.find(m =>
      m.text.includes('Static function can not consume context') ||
      m.text.includes('message.open')
    )

    // Check for noVNC TLS warnings (should be SUPPRESSED)
    const novncTlsWarning = consoleMessages.find(m =>
      m.text.includes('TLS') ||
      m.text.includes('secure context')
    )

    // Filter critical errors (excluding expected ones)
    const criticalErrors = allErrors.filter(msg => {
      const text = msg.text.toLowerCase()
      return !expectedMessages.some(expected => text.includes(expected.toLowerCase()))
    })

    const criticalWarnings = allWarnings.filter(msg => {
      const text = msg.text.toLowerCase()
      return !expectedMessages.some(expected => text.includes(expected.toLowerCase()))
    })

    // Print detailed report
    console.log('\n' + '='.repeat(80))
    console.log('CONSOLE ERROR VERIFICATION REPORT')
    console.log('='.repeat(80))
    console.log(`Total Console Messages: ${consoleMessages.length}`)
    console.log(`  - Errors: ${allErrors.length}`)
    console.log(`  - Warnings: ${allWarnings.length}`)
    console.log(`  - Info: ${consoleMessages.filter(m => m.type === 'info').length}`)
    console.log(`  - Logs: ${consoleMessages.filter(m => m.type === 'log').length}`)
    console.log()

    console.log('FIXED ISSUES STATUS:')
    console.log(`  ✅ Ant Design message warning: ${antdMessageWarning ? '❌ STILL PRESENT' : '✅ FIXED'}`)
    console.log(`  ✅ noVNC TLS warnings: ${novncTlsWarning ? '❌ STILL PRESENT' : '✅ SUPPRESSED'}`)
    console.log()

    if (criticalErrors.length > 0) {
      console.log('CRITICAL ERRORS (Unexpected):')
      criticalErrors.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`)
        if (msg.location) console.log(`     Location: ${msg.location}`)
      })
    } else {
      console.log('✅ No critical errors detected')
    }
    console.log()

    if (criticalWarnings.length > 0) {
      console.log('CRITICAL WARNINGS (Unexpected):')
      criticalWarnings.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`)
      })
    }
    console.log()

    console.log('EXPECTED MESSAGES (OK):')
    const expectedFound = consoleMessages.filter(msg => {
      const text = msg.text.toLowerCase()
      return expectedMessages.some(expected => text.includes(expected.toLowerCase()))
    })
    expectedFound.slice(0, 5).forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${msg.type}] ${msg.text.substring(0, 100)}...`)
    })
    if (expectedFound.length > 5) {
      console.log(`  ... and ${expectedFound.length - 5} more expected messages`)
    }
    console.log()

    console.log('OVERALL ASSESSMENT:')
    const allFixed = !antdMessageWarning && !novncTlsWarning && criticalErrors.length === 0
    console.log(allFixed ? '✅ ALL ACTIONABLE CONSOLE ERRORS FIXED!' : '❌ SOME ISSUES REMAINING')
    console.log('='.repeat(80))
    console.log()

    // Assertions
    expect(antdMessageWarning, 'Ant Design message warning should be fixed').toBeUndefined()
    expect(novncTlsWarning, 'noVNC TLS warnings should be suppressed').toBeUndefined()
    expect(criticalErrors.length, 'No critical errors should be present').toBe(0)
  })
})
