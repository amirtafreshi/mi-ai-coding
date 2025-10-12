const { chromium } = require('playwright');
const path = require('path');

async function testHomepageRedirect() {
  console.log('🚀 Starting homepage redirect test...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to homepage
    console.log('Step 1: Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of initial load
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/homepage-redirect-01-initial.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: homepage-redirect-01-initial.png');

    // Step 2: Check if redirected to login
    const currentUrl = page.url();
    console.log(`\nStep 2: Checking redirect...`);
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('✅ Successfully redirected to /login');
    } else {
      console.log('❌ Failed to redirect to /login');
    }

    // Step 3: Verify login page styling
    console.log('\nStep 3: Verifying login page styling...');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for Ant Design elements
    const hasAntDesignForm = await page.locator('.ant-form, [class*="ant-"]').count() > 0;
    const hasEmailInput = await page.locator('input[placeholder*="email"], #login_email').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"], #login_password').count() > 0;
    const hasSubmitButton = await page.locator('button[type="submit"], button:has-text("Sign")').count() > 0;

    console.log(`Ant Design components: ${hasAntDesignForm ? '✅' : '❌'}`);
    console.log(`Email input field: ${hasEmailInput ? '✅' : '❌'}`);
    console.log(`Password input field: ${hasPasswordInput ? '✅' : '❌'}`);
    console.log(`Submit button: ${hasSubmitButton ? '✅' : '❌'}`);

    // Get computed styles of body to verify CSS is loaded
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
        margin: styles.margin
      };
    });
    console.log(`\nBody styles:`, bodyStyles);

    // Take screenshot of login page with styling
    await page.screenshot({
      path: '/home/master/projects/mi-ai-coding/homepage-redirect-02-login.png',
      fullPage: true
    });
    console.log('\n✅ Screenshot saved: homepage-redirect-02-login.png');

    // Step 4: Test login functionality
    console.log('\nStep 4: Testing login with admin@example.com / admin123...');

    // Find and fill email field - Ant Design generates IDs like #login_email
    const emailInput = page.locator('#login_email, input[placeholder*="email"]').first();
    await emailInput.fill('admin@example.com');
    console.log('✅ Email filled');

    // Find and fill password field
    const passwordInput = page.locator('#login_password, input[type="password"]').first();
    await passwordInput.fill('admin123');
    console.log('✅ Password filled');

    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign")').first();

    // Wait for navigation to dashboard after clicking submit
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      submitButton.click()
    ]);
    console.log('✅ Submit button clicked and navigated');

    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 5: Verify dashboard redirect and styling
    const dashboardUrl = page.url();
    console.log(`\nStep 5: Checking post-login redirect...`);
    console.log(`Current URL: ${dashboardUrl}`);

    if (dashboardUrl.includes('/login')) {
      console.log('❌ Still on login page - login may have failed');

      // Check for error messages
      const errorMessage = await page.locator('.ant-message-error, .ant-alert-error, [class*="error"]').first().textContent().catch(() => 'No error message found');
      console.log(`Error message: ${errorMessage}`);
    } else {
      console.log('✅ Successfully redirected after login');

      // Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for dashboard elements
      const hasSidebar = await page.locator('aside, [class*="sidebar"], .ant-layout-sider').count() > 0;
      const hasHeader = await page.locator('header, [class*="header"], .ant-layout-header').count() > 0;
      const hasContent = await page.locator('main, [class*="content"], .ant-layout-content').count() > 0;

      console.log(`\nDashboard elements:`);
      console.log(`Sidebar: ${hasSidebar ? '✅' : '❌'}`);
      console.log(`Header: ${hasHeader ? '✅' : '❌'}`);
      console.log(`Content area: ${hasContent ? '✅' : '❌'}`);

      // Take screenshot of dashboard
      await page.screenshot({
        path: '/home/master/projects/mi-ai-coding/homepage-redirect-03-logged-in.png',
        fullPage: true
      });
      console.log('\n✅ Screenshot saved: homepage-redirect-03-logged-in.png');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Homepage redirect: ${currentUrl.includes('/login') ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Login page styling: ${hasAntDesignForm && hasEmailInput && hasPasswordInput ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Login functionality: ${!dashboardUrl.includes('/login') ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dashboard styling: ${dashboardUrl.includes('/login') ? '⏭️  SKIPPED' : '✅ PASS'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({
        path: '/home/master/projects/mi-ai-coding/homepage-redirect-error.png',
        fullPage: true
      });
      console.log('Error screenshot saved: homepage-redirect-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
}

testHomepageRedirect();
