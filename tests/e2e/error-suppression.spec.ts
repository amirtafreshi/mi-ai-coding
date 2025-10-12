import { test, expect } from '@playwright/test'

test.describe('ErrorSuppression Component', () => {
  test('should filter out noVNC removeChild errors from console', async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string }> = []

    // Capture all console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    // Navigate to the app
    await page.goto('http://localhost:3000')

    // Wait for page to fully load and any errors to appear
    await page.waitForTimeout(5000)

    // Filter for errors only
    const errors = consoleMessages.filter(msg => msg.type === 'error')

    // Check for removeChild errors
    const removeChildErrors = errors.filter(msg =>
      msg.text.toLowerCase().includes('removechild') ||
      msg.text.toLowerCase().includes('failed to execute \'removechild\'')
    )

    // Count total errors
    const totalErrorCount = errors.length

    // List all unique error messages
    const uniqueErrors = [...new Set(errors.map(e => e.text))]

    // Output results
    console.log('=== ERROR SUPPRESSION TEST RESULTS ===')
    console.log(`Total Console Error Count: ${totalErrorCount}`)
    console.log(`\nRemoveChild Errors Found: ${removeChildErrors.length}`)

    if (removeChildErrors.length > 0) {
      console.log('\nRemoveChild Errors:')
      removeChildErrors.forEach(err => console.log(`  - ${err.text}`))
    }

    console.log('\nAll Errors Present:')
    if (uniqueErrors.length === 0) {
      console.log('  (None)')
    } else {
      uniqueErrors.forEach(err => console.log(`  - ${err}`))
    }

    // Assertions
    expect(removeChildErrors.length, 'removeChild errors should be suppressed').toBe(0)

    // Log final verdict
    console.log('\n=== VERDICT ===')
    console.log(`Is removeChild error visible? ${removeChildErrors.length > 0 ? 'YES' : 'NO'}`)
    console.log(`Total console error count: ${totalErrorCount}`)
  })
})
