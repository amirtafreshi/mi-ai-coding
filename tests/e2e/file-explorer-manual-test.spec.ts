import { test, expect } from '@playwright/test'

/**
 * Manual Testing Script for File Explorer
 * Tests the updated dashboard layout and file explorer functionality
 *
 * CRITICAL: Runs on DISPLAY=:99 - visible at http://localhost:6080
 */

test.describe('File Explorer Manual Testing', () => {
  // Increase timeout for each test
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { timeout: 60000 })

    // Wait for login form to load
    await page.waitForSelector('input[placeholder*="email"], input[type="email"], #email', { timeout: 60000 })

    // Login with admin credentials - try multiple selectors
    const emailInput = page.locator('input[placeholder*="email"], input[type="email"], #email').first()
    const passwordInput = page.locator('input[placeholder*="password"], input[type="password"], #password').first()
    const signInButton = page.locator('button:has-text("Sign In"), button[type="submit"]').first()

    await emailInput.fill('admin@example.com')
    await passwordInput.fill('admin123')
    await signInButton.click()

    // Wait for navigation to dashboard (give it more time)
    await page.waitForURL('http://localhost:3000/', { timeout: 60000 }).catch(() => {
      console.log('Note: URL did not change to exact "/" - may have redirected elsewhere')
    })

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(2000)
  })

  test('01 - Dashboard Layout', async ({ page }) => {
    console.log('Testing: Dashboard Layout')

    // Wait a bit for layout to render
    await page.waitForTimeout(2000)

    // Take screenshot of the dashboard layout
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/file-explorer-01-layout.png',
      fullPage: true
    })

    console.log('✅ Screenshot saved: file-explorer-01-layout.png')

    // Verify VNC terminals are present (should be on top)
    const vncSections = await page.locator('text=/VNC|Terminal|Playwright/i').count()
    console.log(`Found ${vncSections} VNC-related elements`)

    // Verify code editor is present (should be on bottom)
    const editorExists = await page.locator('text=/Code Editor|Editor/i').count()
    console.log(`Found ${editorExists} editor-related elements`)

    console.log('✅ Layout verification complete')
  })

  test('02 - File Explorer Quick Access', async ({ page }) => {
    console.log('Testing: File Explorer Quick Access Buttons')

    // Wait for file explorer to load
    await page.waitForTimeout(2000)

    // Look for file explorer component
    const fileExplorerExists = await page.locator('text=/File Explorer|Files/i').count()
    console.log(`File explorer sections found: ${fileExplorerExists}`)

    // Take screenshot showing the file explorer with quick access buttons
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/file-explorer-02-quick-access.png',
      fullPage: true
    })

    console.log('✅ Screenshot saved: file-explorer-02-quick-access.png')

    // Try to find and click quick access buttons
    const rootButton = page.locator('button:has-text("Root"), button:has-text("root")')
    const projectsButton = page.locator('button:has-text("Projects"), button:has-text("projects")')
    const agentsButton = page.locator('button:has-text("Agents"), button:has-text("agents")')

    const rootCount = await rootButton.count()
    const projectsCount = await projectsButton.count()
    const agentsCount = await agentsButton.count()

    console.log(`Quick access buttons found:`)
    console.log(`  - Root: ${rootCount}`)
    console.log(`  - Projects: ${projectsCount}`)
    console.log(`  - Agents: ${agentsCount}`)

    // Try clicking Root button if it exists
    if (rootCount > 0) {
      await rootButton.first().click()
      await page.waitForTimeout(1500)
      console.log('✅ Clicked Root button')
    }

    // Try clicking Projects button if it exists
    if (projectsCount > 0) {
      await projectsButton.first().click()
      await page.waitForTimeout(1500)
      console.log('✅ Clicked Projects button')
    }

    // Try clicking Agents button if it exists
    if (agentsCount > 0) {
      await agentsButton.first().click()
      await page.waitForTimeout(1500)
      console.log('✅ Clicked Agents button')
    }
  })

  test('03 - Folder Navigation', async ({ page }) => {
    console.log('Testing: Folder Navigation')

    // Wait for file explorer to load
    await page.waitForTimeout(2000)

    // Look for folder icons or directory entries
    const folderIcons = page.locator('[class*="folder"], [data-type="folder"], .ant-tree-switcher')
    const folderCount = await folderIcons.count()
    console.log(`Found ${folderCount} potential folder elements`)

    // Look for file/folder list items
    const listItems = page.locator('.ant-tree-treenode, [role="treeitem"], li')
    const itemCount = await listItems.count()
    console.log(`Found ${itemCount} list items`)

    // Check for current path display
    const pathDisplay = page.locator('text=/^\/|Current Path|Path:/i')
    const pathCount = await pathDisplay.count()
    console.log(`Found ${pathCount} path display elements`)

    if (pathCount > 0) {
      const pathText = await pathDisplay.first().textContent()
      console.log(`Current path: ${pathText}`)
    }

    // Try to find and click a folder
    if (folderCount > 0) {
      console.log('Attempting to click first folder...')
      await folderIcons.first().click()
      await page.waitForTimeout(1500)
      console.log('✅ Clicked a folder')
    }

    // Take screenshot showing navigation
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/file-explorer-03-navigation.png',
      fullPage: true
    })

    console.log('✅ Screenshot saved: file-explorer-03-navigation.png')

    // Try clicking another folder if available
    if (folderCount > 1) {
      await folderIcons.nth(1).click()
      await page.waitForTimeout(1500)
      console.log('✅ Clicked another folder')
    }

    console.log('✅ Navigation test complete')
  })

  test('04 - Comprehensive Page Inspection', async ({ page }) => {
    console.log('Testing: Comprehensive Page Inspection')

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000)

    // Get page HTML for inspection
    const bodyHTML = await page.locator('body').innerHTML()

    // Check for specific elements
    const checks = {
      'File Explorer': bodyHTML.includes('File') || bodyHTML.includes('Explorer'),
      'Quick Access': bodyHTML.includes('Root') || bodyHTML.includes('Projects') || bodyHTML.includes('Agents'),
      'VNC Display': bodyHTML.includes('VNC') || bodyHTML.includes('Terminal'),
      'Code Editor': bodyHTML.includes('Editor') || bodyHTML.includes('Monaco'),
      'Activity Log': bodyHTML.includes('Activity') || bodyHTML.includes('Log'),
    }

    console.log('\nPage Content Analysis:')
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'Found' : 'Not found'}`)
    })

    // Get all button texts
    const buttons = await page.locator('button').allTextContents()
    console.log(`\nButtons found (${buttons.length}):`)
    buttons.slice(0, 20).forEach(text => {
      if (text.trim()) console.log(`  - "${text.trim()}"`)
    })

    // Get all visible text
    const allText = await page.locator('body').textContent()
    const hasFileExplorer = allText?.toLowerCase().includes('file') || false
    const hasQuickAccess = allText?.toLowerCase().includes('root') ||
                          allText?.toLowerCase().includes('projects') ||
                          allText?.toLowerCase().includes('agents') || false

    console.log(`\nText content check:`)
    console.log(`  - Contains 'file': ${hasFileExplorer}`)
    console.log(`  - Contains quick access keywords: ${hasQuickAccess}`)
  })
})
