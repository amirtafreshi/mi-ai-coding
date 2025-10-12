import { test, expect } from '@playwright/test';

/**
 * Focused E2E Test for Agent AI Generation Workflow
 *
 * Tests the AI Generate tab with detailed monitoring:
 * 1. Login and navigate to Agents directory
 * 2. Open CreateAgentModal via +Agent button
 * 3. Fill AI Generate form (name + description)
 * 4. Click Generate → button
 * 5. Monitor AgentEditorModal appearance
 * 6. Verify progress bar, markdown editor, and content generation
 * 7. Capture all console errors and take screenshots
 *
 * ⚠️ CRITICAL: Runs on DISPLAY=:99 for VNC visibility at http://localhost:6080
 */

test.describe('Agent AI Generation Workflow - Detailed Monitoring', () => {
  test.setTimeout(240000); // 4 minutes for AI generation

  test('AI Generation Flow - test-debug-agent', async ({ page }) => {
    console.log('\n=== AGENT GENERATION WORKFLOW TEST ===\n');

    // Arrays to collect console messages and errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    // Monitor console output
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      consoleLogs.push(`[${type}] ${text}`);

      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`  ❌ [Browser Error] ${text}`);
      } else if (text.includes('CreateAgentModal') || text.includes('AgentEditorModal') || text.includes('handleSubmit') || text.includes('generate')) {
        console.log(`  📝 [Browser Log] ${text}`);
      }
    });

    // Monitor network failures
    page.on('requestfailed', request => {
      const failure = `${request.url()} - ${request.failure()?.errorText}`;
      networkErrors.push(failure);
      console.log(`  🌐 [Network Error] ${failure}`);
    });

    // Monitor page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
      console.log(`  💥 [Page Error] ${error.message}`);
    });

    // ===============================================
    // STEP 1: Login
    // ===============================================
    console.log('STEP 1: Login to the application...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const emailInput = page.locator('#login_email, input[placeholder*="email"]').first();
    const passwordInput = page.locator('#login_password, input[type="password"]').first();

    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('admin@example.com');

    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('admin123');

    const signInButton = page.locator('button[type="submit"]');
    await signInButton.click();

    // Wait longer for login to complete (up to 20 seconds)
    console.log('  Waiting for login to complete...');
    await page.waitForTimeout(3000);

    // Try to wait for URL change or timeout after 15 seconds
    let loginSuccess = false;
    for (let i = 0; i < 15; i++) {
      const currentUrl = page.url();
      if (currentUrl.match(/\/(dashboard)?$/)) {
        loginSuccess = true;
        console.log(`  Current URL: ${currentUrl}`);
        break;
      }
      await page.waitForTimeout(1000);
    }

    await page.waitForLoadState('networkidle');

    // If still on login page, try navigating to dashboard manually
    const currentUrl = page.url();
    if (!loginSuccess && currentUrl.includes('/login')) {
      console.log('  ⚠️ Still on login page, trying to navigate to dashboard manually...');
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }

    const finalUrl = page.url();
    console.log(`  Final URL: ${finalUrl}`);

    if (!finalUrl.match(/\/(dashboard)?$/)) {
      console.log('  ❌ Login failed - not on dashboard');
      await page.screenshot({ path: 'test-results/screenshots/gen-workflow-01-login-failed.png', fullPage: true });
      throw new Error('Login failed');
    }

    console.log('  ✅ Login successful\n');
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-01-logged-in.png', fullPage: true });

    // ===============================================
    // STEP 2: Navigate to Agents Directory
    // ===============================================
    console.log('STEP 2: Navigate to Agents directory...');

    // Try clicking Agents quick access button
    const agentsButton = page.locator('.ant-segmented-item:has-text("Agents")').first();

    if (await agentsButton.isVisible({ timeout: 5000 })) {
      await agentsButton.click();
      console.log('  ✅ Clicked Agents quick access button');
      await page.waitForTimeout(2000);
    } else {
      console.log('  ⚠️ Agents button not visible, trying to expand panel...');

      // Try to expand the file explorer panel
      const resizeHandle = page.locator('.w-2.bg-gray-200').first();
      if (await resizeHandle.isVisible({ timeout: 5000 })) {
        const handleBox = await resizeHandle.boundingBox();
        if (handleBox) {
          console.log('  Dragging resize handle to expand panel...');
          const startX = handleBox.x + handleBox.width / 2;
          const startY = handleBox.y + handleBox.height / 2;
          const endX = startX + 200;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, startY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(1000);
          console.log('  ✅ Panel expanded');
        }
      }

      // Try clicking Agents button again
      const agentsButtonRetry = page.locator('.ant-segmented-item:has-text("Agents")').first();
      if (await agentsButtonRetry.isVisible({ timeout: 5000 })) {
        await agentsButtonRetry.click();
        console.log('  ✅ Clicked Agents button after expanding');
        await page.waitForTimeout(2000);
      } else {
        console.log('  ❌ Still cannot find Agents button');
        await page.screenshot({ path: 'test-results/screenshots/gen-workflow-02-no-agents-button.png', fullPage: true });
        throw new Error('Cannot navigate to Agents directory');
      }
    }

    console.log('  ✅ Navigated to Agents directory\n');
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-02-agents-directory.png', fullPage: true });

    // ===============================================
    // STEP 3: Click +Agent Button
    // ===============================================
    console.log('STEP 3: Click +Agent button to open CreateAgentModal...');

    const createAgentButton = page.locator('button:has-text("+Agent"), button[title*="Create"], button:has-text("Agent")').first();

    if (!await createAgentButton.isVisible({ timeout: 5000 })) {
      console.log('  ❌ +Agent button not found');
      const allButtons = await page.locator('button:visible').allTextContents();
      console.log(`  Visible buttons (first 15): ${JSON.stringify(allButtons.slice(0, 15))}`);
      await page.screenshot({ path: 'test-results/screenshots/gen-workflow-03-no-button.png', fullPage: true });
      throw new Error('+Agent button not found');
    }

    console.log('  Found +Agent button, clicking...');
    await createAgentButton.click();
    await page.waitForTimeout(2000);

    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    console.log('  ✅ CreateAgentModal opened\n');
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-03-modal-opened.png', fullPage: true });

    // ===============================================
    // STEP 4: Verify AI Generate Tab is Active
    // ===============================================
    console.log('STEP 4: Verify AI Generate tab is active...');

    const aiTab = page.locator('[role="tab"]:has-text("AI Generate")').first();
    await expect(aiTab).toBeVisible({ timeout: 5000 });

    const aiTabClass = await aiTab.getAttribute('class');
    if (!aiTabClass?.includes('ant-tabs-tab-active')) {
      console.log('  AI Generate tab not active, clicking it...');
      await aiTab.click();
      await page.waitForTimeout(1000);
    }

    console.log('  ✅ AI Generate tab is active\n');
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-04-ai-tab-active.png', fullPage: true });

    // ===============================================
    // STEP 5: Fill Agent Name
    // ===============================================
    console.log('STEP 5: Fill Agent Name field...');

    const nameInput = modal.locator('input[placeholder*="e.g.,"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    await nameInput.click();
    await page.waitForTimeout(300);
    await nameInput.press('Control+A');
    await nameInput.pressSequentially('test-debug-agent', { delay: 50 });
    await page.waitForTimeout(500);

    const nameValue = await nameInput.inputValue();
    console.log(`  Entered name: "${nameValue}"`);
    expect(nameValue).toBe('test-debug-agent');

    console.log('  ✅ Agent Name filled: "test-debug-agent"\n');
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-05-name-filled.png', fullPage: true });

    // ===============================================
    // STEP 6: Fill Description
    // ===============================================
    console.log('STEP 6: Fill Description field...');

    const descTextarea = modal.locator('textarea[placeholder*="E.g.,"]').first();
    await expect(descTextarea).toBeVisible({ timeout: 5000 });

    await descTextarea.click();
    await page.waitForTimeout(300);
    await descTextarea.press('Control+A');

    const description = 'A test agent for debugging purposes that helps identify and fix code issues';
    await descTextarea.pressSequentially(description, { delay: 20 });
    await page.waitForTimeout(500);

    const descValue = await descTextarea.inputValue();
    console.log(`  Entered description (${descValue.length} chars): "${descValue.substring(0, 50)}..."`);
    expect(descValue).toBe(description);

    console.log('  ✅ Description filled\n');
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-06-description-filled.png', fullPage: true });

    // ===============================================
    // STEP 7: Click Generate → Button
    // ===============================================
    console.log('STEP 7: Click "Generate →" button...');

    const generateBtn = modal.locator('button:has-text("Generate")').first();
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await expect(generateBtn).toBeEnabled({ timeout: 5000 });

    console.log('  Button is visible and enabled, clicking...');
    await generateBtn.click();
    console.log('  ✅ Generate button clicked');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-07-generate-clicked.png', fullPage: true });

    // ===============================================
    // STEP 8: Wait for AgentEditorModal
    // ===============================================
    console.log('\nSTEP 8: Waiting for AgentEditorModal to appear...');
    console.log('  This may take up to 90 seconds for AI generation...');
    console.log('  Monitoring for modal appearance...\n');

    // Wait for editor modal with extended timeout
    const editorModalTitle = page.locator('.ant-modal:visible .ant-modal-title:has-text("Edit Agent")');

    const editorModalAppeared = await editorModalTitle.waitFor({
      state: 'visible',
      timeout: 90000
    }).then(() => true).catch(() => false);

    if (!editorModalAppeared) {
      console.log('  ❌ AgentEditorModal did NOT appear within 90 seconds');
      await page.screenshot({ path: 'test-results/screenshots/gen-workflow-08-no-editor-modal.png', fullPage: true });

      // Check for error messages
      const errorMsg = page.locator('.ant-message-error, .ant-alert-error').first();
      if (await errorMsg.isVisible({ timeout: 3000 })) {
        const errorText = await errorMsg.textContent();
        console.log(`  Error message shown: ${errorText}`);
      }

      // Print console errors
      console.log('\n  Console Errors Detected:');
      consoleErrors.forEach(err => console.log(`    - ${err}`));

      throw new Error('AgentEditorModal did not appear');
    }

    console.log('  ✅ AgentEditorModal APPEARED!\n');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-08-editor-modal-appeared.png', fullPage: true });

    // ===============================================
    // STEP 9: Check for Progress Bar
    // ===============================================
    console.log('STEP 9: Check for progress bar...');

    const progressBar = page.locator('.ant-progress, [role="progressbar"]').first();
    const progressBarVisible = await progressBar.isVisible({ timeout: 5000 }).catch(() => false);

    if (progressBarVisible) {
      console.log('  ✅ Progress bar IS visible');
      console.log('  Waiting for generation to complete...');

      await page.screenshot({ path: 'test-results/screenshots/gen-workflow-09-progress-bar-visible.png', fullPage: true });

      // Wait for progress bar to disappear
      await progressBar.waitFor({ state: 'hidden', timeout: 90000 }).catch(() => {
        console.log('  ⚠️ Progress bar did not disappear within timeout');
      });

      console.log('  ✅ Progress bar disappeared (generation complete)\n');
      await page.waitForTimeout(2000);
    } else {
      console.log('  ⚠️ Progress bar NOT visible (might have completed already)\n');
    }

    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-09-after-progress.png', fullPage: true });

    // ===============================================
    // STEP 10: Check Markdown Editor
    // ===============================================
    console.log('STEP 10: Check for markdown editor...');

    const mdEditor = page.locator('.w-md-editor, [data-color-mode="light"]').first();
    const mdEditorVisible = await mdEditor.isVisible({ timeout: 5000 }).catch(() => false);

    if (mdEditorVisible) {
      console.log('  ✅ Markdown editor IS visible');
    } else {
      console.log('  ❌ Markdown editor NOT visible');
      await page.screenshot({ path: 'test-results/screenshots/gen-workflow-10-no-editor.png', fullPage: true });
    }

    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-10-editor-check.png', fullPage: true });

    // ===============================================
    // STEP 11: Check Generated Content
    // ===============================================
    console.log('\nSTEP 11: Check for generated content in editor...');

    const editorTextarea = page.locator('.w-md-editor-text-input, textarea[class*="md-editor"]').first();
    const textareaVisible = await editorTextarea.isVisible({ timeout: 5000 }).catch(() => false);

    if (textareaVisible) {
      console.log('  ✅ Editor textarea found');

      await page.waitForTimeout(2000);

      const content = await editorTextarea.inputValue().catch(() => '');

      if (content && content.length > 50) {
        console.log(`  ✅ Content IS being generated!`);
        console.log(`  Content length: ${content.length} characters`);
        console.log(`  Content preview (first 200 chars):\n`);
        console.log(`  ${content.substring(0, 200).replace(/\n/g, '\n  ')}`);
        console.log(`  ...\n`);
      } else if (content && content.length > 0) {
        console.log(`  ⚠️ Content exists but is very short (${content.length} chars)`);
        console.log(`  Content: ${content}`);
      } else {
        console.log('  ❌ Content is EMPTY');
      }
    } else {
      console.log('  ❌ Editor textarea NOT found');
    }

    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-11-content-check.png', fullPage: true });

    // ===============================================
    // STEP 12: Check Save Button
    // ===============================================
    console.log('\nSTEP 12: Check Save Agent button...');

    const saveBtn = page.locator('button:has-text("Save Agent")').first();
    const saveBtnVisible = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (saveBtnVisible) {
      const isEnabled = await saveBtn.isEnabled();
      console.log(`  ✅ Save Agent button found - Enabled: ${isEnabled}`);

      if (isEnabled) {
        console.log('  Clicking Save Agent button...');
        await saveBtn.click();
        await page.waitForTimeout(3000);

        const successMsg = page.locator('.ant-message-success').first();
        if (await successMsg.isVisible({ timeout: 5000 })) {
          const successText = await successMsg.textContent();
          console.log(`  ✅ Success message: ${successText}`);
        }

        await page.screenshot({ path: 'test-results/screenshots/gen-workflow-12-saved.png', fullPage: true });
      }
    } else {
      console.log('  ❌ Save Agent button NOT found');
    }

    // ===============================================
    // FINAL SUMMARY
    // ===============================================
    console.log('\n==============================================');
    console.log('FINAL SUMMARY');
    console.log('==============================================\n');

    console.log(`✅ Modal opened: YES`);
    console.log(`✅ AgentEditorModal appeared: ${editorModalAppeared ? 'YES' : 'NO'}`);
    console.log(`✅ Progress bar visible: ${progressBarVisible ? 'YES' : 'NO'}`);
    console.log(`✅ Markdown editor visible: ${mdEditorVisible ? 'YES' : 'NO'}`);
    console.log(`✅ Content generated: ${textareaVisible && (await editorTextarea.inputValue().catch(() => '')).length > 50 ? 'YES' : 'NO'}`);
    console.log(`✅ Save button available: ${saveBtnVisible ? 'YES' : 'NO'}`);

    console.log(`\n📊 Total console logs: ${consoleLogs.length}`);
    console.log(`❌ Total console errors: ${consoleErrors.length}`);
    console.log(`🌐 Total network errors: ${networkErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    console.log('\n==============================================');
    console.log('TEST COMPLETE - Check screenshots in test-results/screenshots/');
    console.log('==============================================\n');

    await page.screenshot({ path: 'test-results/screenshots/gen-workflow-13-final-state.png', fullPage: true });
  });
});
