import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('File Explorer Debug Test', () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];

  test('diagnostic test for file explorer', async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      console.log(`Browser console [${msg.type()}]:`, text);
    });

    // Capture errors
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log('Browser error:', error.message);
    });

    // Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Login
    console.log('Step 2: Logging in with admin credentials...');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    console.log('Step 3: Waiting for dashboard to load...');
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Give extra time for file tree to load
    console.log('Step 4: Waiting for file tree to load...');
    await page.waitForTimeout(3000);

    // Check if file explorer panel is visible
    const fileExplorerVisible = await page.locator('.file-explorer-panel, [data-testid="file-explorer"]').isVisible().catch(() => false);
    console.log('File explorer panel visible:', fileExplorerVisible);

    // Open DevTools Console by pressing F12
    console.log('Step 5: Opening DevTools...');
    await page.keyboard.press('F12');
    await page.waitForTimeout(1000);

    // Take screenshot of the full page with console
    console.log('Step 6: Taking screenshot of console...');
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/debug-01-console.png',
      fullPage: true
    });

    // Close DevTools for cleaner UI screenshot
    await page.keyboard.press('F12');
    await page.waitForTimeout(500);

    // Take screenshot of file explorer panel
    console.log('Step 7: Taking screenshot of file tree...');
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/debug-02-file-tree.png',
      fullPage: true
    });

    // Extract FileTree debug logs
    const fileTreeLogs = consoleLogs.filter(log => log.includes('[FileTree]'));
    console.log('\n=== FileTree Debug Logs ===');
    fileTreeLogs.forEach(log => console.log(log));

    // Parse the logs for specific information
    let entryCount = 'N/A';
    let nodeCount = 'N/A';
    let firstNodes: string[] = [];

    fileTreeLogs.forEach(log => {
      // Extract entry count
      const entryMatch = log.match(/entryCount:\s*(\d+)/);
      if (entryMatch) {
        entryCount = entryMatch[1];
      }

      // Extract node count
      const nodeMatch = log.match(/Converted to tree nodes:\s*(\d+)\s*nodes/);
      if (nodeMatch) {
        nodeCount = nodeMatch[1];
      }

      // Extract first few nodes
      const nodesMatch = log.match(/First few nodes:\s*\[(.*?)\]/);
      if (nodesMatch) {
        const nodesList = nodesMatch[1];
        // Extract file/folder names (looking for "title":"name" pattern)
        const titleMatches = nodesList.matchAll(/"title":"([^"]+)"/g);
        firstNodes = Array.from(titleMatches, m => m[1]);
      }
    });

    // Check for visible files in the UI
    const fileTreeNodes = await page.locator('.ant-tree-node-content-wrapper, .file-tree-node').count();
    const filesVisible = fileTreeNodes > 0;

    // Check for errors
    const hasErrors = consoleErrors.length > 0 || consoleLogs.some(log => log.includes('[error]'));

    // Generate report
    console.log('\n=== DIAGNOSTIC REPORT ===');
    console.log('Entry count from API:', entryCount);
    console.log('Node count after conversion:', nodeCount);
    console.log('Files visible in UI:', filesVisible ? 'YES' : 'NO');
    console.log('Visible tree nodes:', fileTreeNodes);
    console.log('First 5 file/folder names from logs:', firstNodes.slice(0, 5).join(', ') || 'None found');
    console.log('Errors found:', hasErrors ? 'YES' : 'NO');
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors.join('\n'));
    }

    // Write detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      entryCount,
      nodeCount,
      filesVisible,
      visibleTreeNodes: fileTreeNodes,
      firstFiveFiles: firstNodes.slice(0, 5),
      hasErrors,
      allFileTreeLogs: fileTreeLogs,
      allConsoleLogs: consoleLogs,
      consoleErrors
    };

    fs.writeFileSync(
      '/home/master/projects/mi-ai-coding/debug-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\nReport saved to debug-report.json');
    console.log('Screenshots saved:');
    console.log('- debug-01-console.png');
    console.log('- debug-02-file-tree.png');
  });
});
