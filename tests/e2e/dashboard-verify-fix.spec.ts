import { test, expect } from '@playwright/test';

test.describe('Dashboard - Verify Fix', () => {
  test('dashboard loads without React errors and shows all components', async ({ page }) => {
    // Navigate
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check for ACTUAL error overlays (not dev tools)
    const actualErrors = await page.evaluate(() => {
      // Look for Next.js ERROR dialog specifically
      const errorDialog = document.querySelector('[data-nextjs-dialog-header]');
      const errorBody = document.querySelector('[data-nextjs-dialog-body]');
      
      if (errorDialog || errorBody) {
        return {
          hasError: true,
          title: errorDialog?.textContent,
          message: errorBody?.textContent
        };
      }
      
      return { hasError: false };
    });
    
    console.log('Error check:', JSON.stringify(actualErrors));
    expect(actualErrors.hasError).toBe(false);
    
    // Verify components are visible
    await expect(page.locator('.ant-card').filter({ hasText: 'File Explorer' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-card').filter({ hasText: 'Code Editor' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-card').filter({ hasText: 'Activity Log' })).toBeVisible({ timeout: 10000 });
    
    // Check panels exist
    const panelCount = await page.locator('[data-panel-id]').count();
    console.log('Panel count:', panelCount);
    expect(panelCount).toBeGreaterThan(0);
    
    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/dashboard-fixed.png', fullPage: true });
    
    console.log('✅ Dashboard working correctly - no React errors, all components visible');
  });
});
