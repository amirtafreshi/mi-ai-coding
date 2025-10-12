#!/usr/bin/env node

/**
 * Manual diagnostic test for FileTree component
 * Run with: DISPLAY=:99 node tests/manual/debug-file-tree.js
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting File Tree diagnostic test...');
  console.log('DISPLAY:', process.env.DISPLAY);

  const browser = await chromium.launch({
    headless: false,
    env: {
      DISPLAY: ':99'
    }
  });

  const page = await browser.newPage();

  // Collect console messages
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
    if (text.includes('[FileTree]')) {
      console.log('📋', text);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
    console.error('❌ Page Error:', error.message);
  });

  try {
    // Step 1: Navigate to login
    console.log('\n✓ Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/debug-step1-login.png' });

    // Step 2: Login
    console.log('✓ Step 2: Logging in with admin credentials...');
    await page.waitForSelector('input[placeholder*="email"]', { timeout: 5000 });
    await page.fill('input[placeholder*="email"]', 'admin@example.com');
    await page.fill('input[placeholder*="password"]', 'admin123');
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/debug-step2-credentials.png' });

    await page.click('button:has-text("Sign In")');

    // Step 3: Wait for dashboard
    console.log('✓ Step 3: Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra time for React to render

    // Step 4: Check file explorer
    console.log('✓ Step 4: Checking file explorer panel...');
    await page.waitForTimeout(3000); // Wait for file tree to load

    // Click on File Explorer menu item to expand it if collapsed
    const fileExplorerMenuItem = page.locator('.ant-menu-title-content:has-text("File Explorer")');
    const isVisible = await fileExplorerMenuItem.isVisible().catch(() => false);
    if (isVisible) {
      console.log('Clicking File Explorer menu item to expand...');
      await fileExplorerMenuItem.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot of dashboard
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/debug-02-file-tree.png',
      fullPage: true
    });

    // Step 5: Take another screenshot (console visible in terminal)
    console.log('✓ Step 5: Capturing final state...');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/debug-01-console.png',
      fullPage: true
    });

    // Step 6: Extract FileTree logs
    console.log('\n=== FileTree Debug Logs ===');
    const fileTreeLogs = consoleLogs.filter(log => log.includes('[FileTree]'));
    fileTreeLogs.forEach(log => console.log(log));

    // Parse log data
    let entryCount = 'N/A';
    let nodeCount = 'N/A';
    let firstNodes = [];

    fileTreeLogs.forEach(log => {
      // Extract entry count
      const entryMatch = log.match(/entryCount:\s*(\d+)/);
      if (entryMatch) entryCount = entryMatch[1];

      // Extract node count
      const nodeMatch = log.match(/Converted to tree nodes:\s*(\d+)\s*nodes/);
      if (nodeMatch) nodeCount = nodeMatch[1];

      // Extract first few nodes
      const nodesMatch = log.match(/First few nodes:\s*\[(.*?)\]/);
      if (nodesMatch) {
        const nodesList = nodesMatch[1];
        const titleMatches = nodesList.matchAll(/"title":"([^"]+)"/g);
        firstNodes = Array.from(titleMatches, m => m[1]);
      }
    });

    // Check UI elements
    const fileTreeVisible = await page.evaluate(() => {
      const elements = document.querySelectorAll('.ant-tree, .file-tree, [data-testid="file-tree"]');
      return elements.length > 0;
    });

    const treeNodeCount = await page.evaluate(() => {
      return document.querySelectorAll('.ant-tree-treenode, .ant-tree-node-content-wrapper').length;
    });

    // Extract actual file names from the DOM
    const fileNames = await page.evaluate(() => {
      const titleElements = document.querySelectorAll('.ant-tree-title, .ant-tree-node-content-wrapper-normal');
      return Array.from(titleElements).map(el => el.textContent?.trim()).filter(Boolean);
    });

    // Generate report
    console.log('\n=== DIAGNOSTIC REPORT ===');
    console.log('Entry count from API:', entryCount);
    console.log('Node count after conversion:', nodeCount);
    console.log('Files visible in UI:', fileTreeVisible ? 'YES' : 'NO');
    console.log('Tree nodes in DOM:', treeNodeCount);
    console.log('File names from DOM:', fileNames.slice(0, 10).join(', ') || 'None found');
    console.log('First 5 file/folder names from logs:', firstNodes.slice(0, 5).join(', ') || 'None found');
    console.log('Console errors:', consoleErrors.length > 0 ? 'YES' : 'NO');

    if (consoleErrors.length > 0) {
      console.log('\nErrors:');
      consoleErrors.forEach(err => console.log('  -', err));
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      entryCount,
      nodeCount,
      filesVisible: fileTreeVisible,
      treeNodesInDOM: treeNodeCount,
      fileNamesFromDOM: fileNames,
      firstFiveFiles: firstNodes.slice(0, 5),
      hasErrors: consoleErrors.length > 0,
      allFileTreeLogs: fileTreeLogs,
      allConsoleLogs: consoleLogs,
      consoleErrors
    };

    fs.writeFileSync(
      '/home/master/projects/mi-ai-coding/debug-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Test complete!');
    console.log('Screenshots saved:');
    console.log('  - debug-01-console.png');
    console.log('  - debug-02-file-tree.png');
    console.log('  - debug-step1-login.png');
    console.log('  - debug-step2-credentials.png');
    console.log('Report saved: debug-report.json');

    // Keep browser open for 5 seconds to view
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/home/master/projects/mi-ai-coding/debug-error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }
})();
