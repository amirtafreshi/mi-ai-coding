import { test, expect } from '@playwright/test'

/**
 * Direct File Explorer Testing (uses pre-authenticated state)
 * Tests the updated dashboard layout and file explorer functionality
 *
 * CRITICAL: Runs on DISPLAY=:99 - visible at http://localhost:6080
 */

test.describe('File Explorer Direct Testing', () => {
  // Increase timeout for each test
  test.setTimeout(120000)

  test('01 - Dashboard Layout and File Explorer', async ({ page }) => {
    console.log('\n=== Test 01: Dashboard Layout ===')

    // Navigate directly to dashboard (auth handled by global setup)
    await page.goto('http://localhost:3000/dashboard', { timeout: 60000 })

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(3000)

    // Take screenshot of the dashboard layout
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/file-explorer-01-layout.png',
      fullPage: true
    })

    console.log('✅ Screenshot saved: file-explorer-01-layout.png')

    // Verify layout components are present
    const hasFileExplorer = await page.locator('text=/File Explorer/i').count()
    const hasVNC = await page.locator('text=/VNC|Terminal|Playwright/i').count()
    const hasCodeEditor = await page.locator('text=/Code Editor|Editor/i').count()
    const hasActivityLog = await page.locator('text=/Activity/i').count()

    console.log(`\nLayout Components Found:`)
    console.log(`  - File Explorer: ${hasFileExplorer}`)
    console.log(`  - VNC Displays: ${hasVNC}`)
    console.log(`  - Code Editor: ${hasCodeEditor}`)
    console.log(`  - Activity Log: ${hasActivityLog}`)

    // Check the VNC panels are on top (they should be in the first vertical panel)
    const vncPanel = page.locator('[id="vnc-panel"]')
    const vncExists = await vncPanel.count() > 0
    console.log(`  - VNC Panel found: ${vncExists}`)

    // Check code editor is on bottom (second vertical panel)
    const editorPanel = page.locator('[id="code-editor"]')
    const editorExists = await editorPanel.count() > 0
    console.log(`  - Code Editor Panel found: ${editorExists}`)

    console.log('\n✅ Layout verification complete\n')
  })

  test('02 - File Explorer Quick Access Buttons', async ({ page }) => {
    console.log('\n=== Test 02: Quick Access Buttons ===')

    await page.goto('http://localhost:3000/dashboard', { timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(3000)

    // Look for Segmented control (quick access buttons)
    const segmentedControl = page.locator('.ant-segmented')
    const segmentedExists = await segmentedControl.count()
    console.log(`Segmented control found: ${segmentedExists}`)

    // Look for quick access buttons using Ant Design Segmented component structure
    const rootButton = page.locator('.ant-segmented-item-label:has-text("Root")')
    const projectsButton = page.locator('.ant-segmented-item-label:has-text("Projects")')
    const agentsButton = page.locator('.ant-segmented-item-label:has-text("Agents")')

    const rootCount = await rootButton.count()
    const projectsCount = await projectsButton.count()
    const agentsCount = await agentsButton.count()

    console.log(`\nQuick Access Buttons Found:`)
    console.log(`  - Root: ${rootCount}`)
    console.log(`  - Projects: ${projectsCount}`)
    console.log(`  - Agents: ${agentsCount}`)

    // Take screenshot showing quick access buttons
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/file-explorer-02-quick-access.png',
      fullPage: true
    })
    console.log('✅ Screenshot saved: file-explorer-02-quick-access.png')

    // Test clicking the buttons
    if (rootCount > 0) {
      console.log('\nClicking Root button...')
      await rootButton.first().click()
      await page.waitForTimeout(2000)

      // Check if path changed
      const currentPath = await page.locator('text=/^\\//').first().textContent()
      console.log(`  Current path after Root click: ${currentPath}`)
    }

    if (projectsCount > 0) {
      console.log('\nClicking Projects button...')
      await projectsButton.first().click()
      await page.waitForTimeout(2000)

      const currentPath = await page.locator('text=/\\/home\\/master\\/projects/').first().textContent()
      console.log(`  Current path after Projects click: ${currentPath}`)
    }

    if (agentsCount > 0) {
      console.log('\nClicking Agents button...')
      await agentsButton.first().click()
      await page.waitForTimeout(2000)

      const currentPath = await page.locator('text=/agents/').first().textContent()
      console.log(`  Current path after Agents click: ${currentPath}`)
    }

    console.log('\n✅ Quick access buttons test complete\n')
  })

  test('03 - Folder Navigation', async ({ page }) => {
    console.log('\n=== Test 03: Folder Navigation ===')

    await page.goto('http://localhost:3000/dashboard', { timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(3000)

    // Look for the current path display (should be in gray text)
    const pathDisplay = page.locator('.text-gray-600').first()
    const pathText = await pathDisplay.textContent()
    console.log(`Initial path: ${pathText}`)

    // Look for folder icons in the tree
    const folderIcons = page.locator('.anticon-folder')
    const folderCount = await folderIcons.count()
    console.log(`Found ${folderCount} folder icons`)

    // Look for tree nodes
    const treeNodes = page.locator('.ant-tree-treenode')
    const nodeCount = await treeNodes.count()
    console.log(`Found ${nodeCount} tree nodes`)

    // Try to click a folder to navigate
    if (nodeCount > 0) {
      console.log('\nAttempting to click first folder...')
      const firstNode = treeNodes.first()
      const nodeTitle = await firstNode.locator('.ant-tree-title').textContent()
      console.log(`  Clicking: ${nodeTitle}`)

      await firstNode.click()
      await page.waitForTimeout(2000)

      // Check if path changed
      const newPath = await pathDisplay.textContent()
      console.log(`  Path after click: ${newPath}`)
    }

    // Take screenshot showing navigation
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/file-explorer-03-navigation.png',
      fullPage: true
    })
    console.log('✅ Screenshot saved: file-explorer-03-navigation.png')

    console.log('\n✅ Navigation test complete\n')
  })

  test('04 - Component Structure Analysis', async ({ page }) => {
    console.log('\n=== Test 04: Component Structure Analysis ===')

    await page.goto('http://localhost:3000/dashboard', { timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 60000 })
    await page.waitForTimeout(3000)

    // Check panel structure
    const panelGroup = page.locator('[data-panel-group]')
    const panelCount = await panelGroup.count()
    console.log(`\nPanel groups found: ${panelCount}`)

    // Check for resizable panels
    const panels = page.locator('[data-panel]')
    const individualPanels = await panels.count()
    console.log(`Individual panels found: ${individualPanels}`)

    // Check for resize handles
    const resizeHandles = page.locator('[data-panel-resize-handle]')
    const handleCount = await resizeHandles.count()
    console.log(`Resize handles found: ${handleCount}`)

    // Get all panel IDs
    const panelIds = await panels.evaluateAll((elements) =>
      elements.map(el => el.getAttribute('data-panel-id')).filter(Boolean)
    )
    console.log(`\nPanel IDs: ${panelIds.join(', ')}`)

    // Check Ant Design components
    const antCards = page.locator('.ant-card')
    const cardCount = await antCards.count()
    console.log(`\nAnt Design cards found: ${cardCount}`)

    const antTrees = page.locator('.ant-tree')
    const treeCount = await antTrees.count()
    console.log(`Ant Design trees found: ${treeCount}`)

    // Get page title
    const pageTitle = await page.title()
    console.log(`\nPage title: ${pageTitle}`)

    console.log('\n✅ Component structure analysis complete\n')
  })
})
