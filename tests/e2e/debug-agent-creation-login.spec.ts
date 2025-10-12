import { test, expect } from '@playwright/test';

/**
 * Debug test to understand login flow before agent creation tests
 */

test.describe('Debug Login for Agent Creation', () => {
  test('Debug login flow', async ({ page }) => {
    console.log('\n=== DEBUG LOGIN TEST ===\n');

    // Step 1: Go to login
    console.log('Step 1: Navigate to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/debug-login-01-page-loaded.png', fullPage: true });
    console.log('✓ Login page loaded\n');

    // Step 2: Check what form fields exist
    console.log('Step 2: Inspect form fields...');
    const allInputs = await page.locator('input').count();
    console.log(`Found ${allInputs} input fields`);

    for (let i = 0; i < allInputs; i++) {
      const input = page.locator('input').nth(i);
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`  Input ${i}: type="${type}", id="${id}", placeholder="${placeholder}"`);
    }

    // Step 3: Fill form
    console.log('\nStep 3: Fill login form...');
    const emailInput = page.locator('#login_email, input[placeholder*="email"]').first();
    const passwordInput = page.locator('#login_password, input[type="password"]').first();

    console.log('Filling email...');
    await emailInput.fill('admin@example.com');
    await page.waitForTimeout(500);

    console.log('Filling password...');
    await passwordInput.fill('admin123');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/screenshots/debug-login-02-form-filled.png', fullPage: true });
    console.log('✓ Form filled\n');

    // Step 4: Look for submit button
    console.log('Step 4: Inspect submit button...');
    const submitButton = page.locator('button[type="submit"]');
    const buttonCount = await submitButton.count();
    console.log(`Found ${buttonCount} submit button(s)`);

    if (buttonCount > 0) {
      const buttonText = await submitButton.textContent();
      const isDisabled = await submitButton.isDisabled();
      console.log(`  Button text: "${buttonText}"`);
      console.log(`  Button disabled: ${isDisabled}`);
    }

    // Step 5: Monitor console and network
    console.log('\nStep 5: Click submit and monitor response...');

    page.on('console', msg => {
      console.log(`  [Browser Console ${msg.type()}] ${msg.text()}`);
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('api') || url.includes('auth') || url.includes('login')) {
        console.log(`  [Network] ${response.status()} ${url}`);
      }
    });

    await submitButton.click();
    console.log('✓ Submit button clicked');

    // Wait and observe
    await page.waitForTimeout(8000);

    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);

    await page.screenshot({ path: 'test-results/screenshots/debug-login-03-after-submit.png', fullPage: true });

    // Step 6: Check for error messages
    console.log('\nStep 6: Check for error messages...');
    const errorMessages = page.locator('.ant-message-error, .ant-alert-error, .ant-form-item-explain-error');
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      console.log(`Found ${errorCount} error message(s):`);
      for (let i = 0; i < errorCount; i++) {
        const msg = await errorMessages.nth(i).textContent();
        console.log(`  - ${msg}`);
      }
    } else {
      console.log('No error messages found');
    }

    // Step 7: Check if redirected
    if (currentUrl.includes('dashboard') || currentUrl.endsWith('/')) {
      console.log('\n✓ LOGIN SUCCESSFUL - Redirected to dashboard');
      await page.screenshot({ path: 'test-results/screenshots/debug-login-04-dashboard.png', fullPage: true });
    } else if (currentUrl.includes('login')) {
      console.log('\n❌ LOGIN FAILED - Still on login page');
      console.log('Possible reasons:');
      console.log('- Invalid credentials');
      console.log('- Database not seeded');
      console.log('- Auth API not working');
      console.log('- Form validation error');
    }

    console.log('\n=== DEBUG TEST COMPLETE ===\n');
  });
});
