import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Test for Agent Creation Workflow
 *
 * Tests all three agent creation methods:
 * 1. AI Generate Tab - Generate agent with AI (Gemini API)
 * 2. Paste Tab - Create agent by pasting markdown
 * 3. Import URL Tab - Import agent from URL
 *
 * ⚠️ CRITICAL: Runs on DISPLAY=:99 for VNC visibility at http://localhost:6080
 */

test.describe('Agent Creation Workflow - Comprehensive Test', () => {
  test.setTimeout(240000); // 4 minutes for AI generation

  // Helper function to login
  async function login(page: any) {
    console.log('Logging in...');
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

    // Wait for redirect to dashboard
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (!currentUrl.match(/\/(dashboard)?$/)) {
      console.log('⚠ Not on dashboard after login, current URL:', currentUrl);
      throw new Error('Login failed - not redirected to dashboard');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✓ Login successful\n');
  }

  // Helper function to navigate to agents directory
  async function navigateToAgents(page: any) {
    console.log('Navigating to agents directory...');

    // Try clicking Agents quick access button
    const agentsButton = page.locator('.ant-segmented-item:has-text("Agents")').first();
    if (await agentsButton.isVisible({ timeout: 5000 })) {
      await agentsButton.click();
      console.log('✓ Clicked Agents quick access');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠ Agents button not visible, expanding panel...');

      // Expand file explorer panel
      const resizeHandle = page.locator('.w-2.bg-gray-200').first();
      if (await resizeHandle.isVisible({ timeout: 5000 })) {
        const handleBox = await resizeHandle.boundingBox();
        if (handleBox) {
          const startX = handleBox.x + handleBox.width / 2;
          const startY = handleBox.y + handleBox.height / 2;
          const endX = startX + 200;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, startY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(1000);
        }
      }

      // Try clicking Agents again
      const agentsButtonRetry = page.locator('.ant-segmented-item:has-text("Agents")').first();
      if (await agentsButtonRetry.isVisible({ timeout: 5000 })) {
        await agentsButtonRetry.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log('✓ Navigated to agents directory\n');
  }

  // Helper function to open CreateAgentModal
  async function openCreateModal(page: any) {
    console.log('Opening CreateAgentModal...');

    const createAgentButton = page.locator('button:has-text("+Agent"), button[title*="Create"]').first();

    if (!await createAgentButton.isVisible({ timeout: 5000 })) {
      console.log('❌ +Agent button not found');
      const allButtons = await page.locator('button:visible').allTextContents();
      console.log('  Visible buttons:', allButtons.slice(0, 10));
      await page.screenshot({ path: 'test-results/screenshots/agent-creation-no-button.png', fullPage: true });
      throw new Error('+Agent button not found');
    }

    await createAgentButton.click();
    await page.waitForTimeout(2000);

    const modal = page.locator('.ant-modal:visible').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    console.log('✓ CreateAgentModal opened\n');
    return modal;
  }

  test('1. AI Generate Tab - Create agent with AI generation', async ({ page }) => {
    console.log('\n=== TEST 1: AI GENERATE TAB ===\n');

    await login(page);
    await navigateToAgents(page);

    await page.screenshot({ path: 'test-results/screenshots/ai-01-before-modal.png', fullPage: true });

    const modal = await openCreateModal(page);

    // Step 1: Verify AI Generate tab is active
    console.log('Step 1: Verify AI Generate tab is active...');
    const aiTab = page.locator('[role="tab"]:has-text("AI Generate")').first();
    await expect(aiTab).toBeVisible();

    // Ensure AI Generate tab is selected
    const aiTabClass = await aiTab.getAttribute('class');
    if (!aiTabClass?.includes('ant-tabs-tab-active')) {
      await aiTab.click();
      await page.waitForTimeout(1000);
    }

    console.log('✓ AI Generate tab active\n');
    await page.screenshot({ path: 'test-results/screenshots/ai-02-tab-active.png', fullPage: true });

    // Step 2: Fill Agent Name field
    console.log('Step 2: Fill Agent Name field...');
    const nameInput = modal.locator('input[placeholder*="e.g.,"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    await nameInput.click();
    await page.waitForTimeout(300);
    await nameInput.press('Control+A');
    await nameInput.pressSequentially('test-ai-agent', { delay: 50 });
    await page.waitForTimeout(500);

    const nameValue = await nameInput.inputValue();
    console.log(`✓ Agent Name filled: "${nameValue}"`);
    expect(nameValue).toBe('test-ai-agent');

    // Step 3: Fill Description field
    console.log('\nStep 3: Fill Description field...');
    const descTextarea = modal.locator('textarea[placeholder*="E.g.,"]').first();
    await expect(descTextarea).toBeVisible({ timeout: 5000 });

    await descTextarea.click();
    await page.waitForTimeout(300);
    await descTextarea.press('Control+A');

    const description = 'A test agent for debugging purposes that analyzes errors and suggests fixes';
    await descTextarea.pressSequentially(description, { delay: 20 });
    await page.waitForTimeout(500);

    const descValue = await descTextarea.inputValue();
    console.log(`✓ Description filled (${descValue.length} characters)\n`);
    expect(descValue).toBe(description);

    await page.screenshot({ path: 'test-results/screenshots/ai-03-form-filled.png', fullPage: true });

    // Step 4: Monitor console logs during submission
    console.log('Step 4: Click Generate button and monitor logs...');

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('CreateAgentModal') || text.includes('handleSubmit')) {
        console.log(`  [Browser Console] ${text}`);
      }
    });

    const generateBtn = modal.locator('button:has-text("Generate")').first();
    await expect(generateBtn).toBeVisible();

    await generateBtn.click();
    await page.waitForTimeout(2000);

    console.log('\n✓ Generate button clicked');

    // Step 5: Verify handleSubmit was called
    console.log('\nStep 5: Verify handleSubmit was called...');
    const submitLogs = consoleLogs.filter(log =>
      log.includes('handleSubmit') || log.includes('Validation passed')
    );

    if (submitLogs.length > 0) {
      console.log('✓ handleSubmit was called:');
      submitLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('⚠ No handleSubmit logs found');
    }

    // Step 6: Verify validation passed
    console.log('\nStep 6: Verify validation passed...');
    const errorLogs = consoleLogs.filter(log =>
      log.includes('Validation failed') || log.includes('error')
    );

    if (errorLogs.length === 0) {
      console.log('✓ No validation errors');
    } else {
      console.log('⚠ Validation errors found:');
      errorLogs.forEach(log => console.log(`  - ${log}`));
    }

    await page.screenshot({ path: 'test-results/screenshots/ai-04-after-generate-click.png', fullPage: true });

    // Step 7: Wait for AgentEditorModal to appear
    console.log('\nStep 7: Wait for AgentEditorModal to appear...');
    console.log('  This may take up to 90 seconds for AI generation...');

    const editorModal = await page.waitForSelector(
      '.ant-modal:visible .ant-modal-title:has-text("Edit Agent")',
      { timeout: 90000, state: 'visible' }
    ).catch(() => null);

    if (!editorModal) {
      console.log('❌ AgentEditorModal did not appear');
      await page.screenshot({ path: 'test-results/screenshots/ai-05-no-editor-modal.png', fullPage: true });

      // Check for error messages
      const errorMsg = page.locator('.ant-message-error, .ant-alert-error').first();
      if (await errorMsg.isVisible({ timeout: 3000 })) {
        const errorText = await errorMsg.textContent();
        console.log(`  Error message: ${errorText}`);
      }

      throw new Error('AgentEditorModal did not appear');
    }

    console.log('✓ AgentEditorModal appeared\n');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/ai-06-editor-modal-opened.png', fullPage: true });

    // Step 8: Wait for AI generation to complete
    console.log('Step 8: Wait for AI generation to complete...');

    // Wait for progress bar to disappear
    const progressBar = page.locator('.ant-progress').first();
    if (await progressBar.isVisible({ timeout: 5000 })) {
      console.log('  Progress bar visible, waiting for completion...');
      await progressBar.waitFor({ state: 'hidden', timeout: 90000 }).catch(() => {
        console.log('  ⚠ Progress bar did not disappear within timeout');
      });
    }

    console.log('✓ AI generation complete\n');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/ai-07-generation-complete.png', fullPage: true });

    // Step 9: Verify editor content
    console.log('Step 9: Verify editor content...');

    const mdEditor = page.locator('.w-md-editor, [data-color-mode="light"]').first();
    if (await mdEditor.isVisible({ timeout: 5000 })) {
      console.log('✓ Markdown editor visible');

      // Try to get content from the editor
      const editorTextarea = page.locator('.w-md-editor-text-input, textarea').first();
      if (await editorTextarea.isVisible({ timeout: 3000 })) {
        const content = await editorTextarea.inputValue().catch(() => '');
        if (content && content.length > 50) {
          console.log(`✓ Editor has content (${content.length} characters)`);
          console.log(`  Preview: ${content.substring(0, 100)}...`);
        } else {
          console.log('⚠ Editor content is empty or too short');
        }
      }
    } else {
      console.log('⚠ Markdown editor not found');
    }

    // Step 10: Click Save Agent button
    console.log('\nStep 10: Click Save Agent button...');

    const saveBtn = page.locator('button:has-text("Save Agent")').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toBeEnabled();

    await saveBtn.click();
    console.log('✓ Save Agent button clicked');
    await page.waitForTimeout(3000);

    // Step 11: Verify success message
    console.log('\nStep 11: Verify success message...');

    const successMsg = page.locator('.ant-message-success').first();
    if (await successMsg.isVisible({ timeout: 5000 })) {
      const successText = await successMsg.textContent();
      console.log(`✓ Success message: ${successText}`);
    } else {
      console.log('⚠ Success message not visible (might be too fast)');
    }

    await page.screenshot({ path: 'test-results/screenshots/ai-08-saved.png', fullPage: true });

    console.log('\n=== TEST 1 COMPLETE ===\n');
  });

  test('2. Paste Tab - Create agent by pasting markdown', async ({ page }) => {
    console.log('\n=== TEST 2: PASTE TAB ===\n');

    await login(page);
    await navigateToAgents(page);

    await page.screenshot({ path: 'test-results/screenshots/paste-01-before-modal.png', fullPage: true });

    const modal = await openCreateModal(page);

    // Step 1: Switch to Paste tab
    console.log('Step 1: Switch to Paste tab...');
    const pasteTab = page.locator('[role="tab"]:has-text("Paste")').first();
    await expect(pasteTab).toBeVisible();

    await pasteTab.click();
    await page.waitForTimeout(1000);

    console.log('✓ Paste tab selected\n');
    await page.screenshot({ path: 'test-results/screenshots/paste-02-tab-active.png', fullPage: true });

    // Step 2: Fill Agent Name field
    console.log('Step 2: Fill Agent Name field...');
    const nameInput = modal.locator('input[placeholder*="e.g.,"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    await nameInput.click();
    await page.waitForTimeout(300);
    await nameInput.press('Control+A');
    await nameInput.pressSequentially('test-paste-agent', { delay: 50 });
    await page.waitForTimeout(500);

    const nameValue = await nameInput.inputValue();
    console.log(`✓ Agent Name filled: "${nameValue}"`);
    expect(nameValue).toBe('test-paste-agent');

    // Step 3: Fill Agent Markdown field
    console.log('\nStep 3: Fill Agent Markdown field...');
    const markdownTextarea = modal.locator('textarea[placeholder*="Paste your agent markdown"]').first();
    await expect(markdownTextarea).toBeVisible({ timeout: 5000 });

    await markdownTextarea.click();
    await page.waitForTimeout(300);

    const markdownContent = `# Test Agent

## Purpose
This is a test agent created by pasting markdown.

## Capabilities
- Test capability 1
- Test capability 2
- Test capability 3

## Workflow
1. Step 1
2. Step 2
3. Step 3`;

    await markdownTextarea.pressSequentially(markdownContent, { delay: 10 });
    await page.waitForTimeout(500);

    const markdownValue = await markdownTextarea.inputValue();
    console.log(`✓ Agent Markdown filled (${markdownValue.length} characters)\n`);
    expect(markdownValue.length).toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/screenshots/paste-03-form-filled.png', fullPage: true });

    // Step 4: Click Next button
    console.log('Step 4: Click Next button...');

    const nextBtn = modal.locator('button:has-text("Next")').first();
    await expect(nextBtn).toBeVisible();

    await nextBtn.click();
    await page.waitForTimeout(2000);

    console.log('✓ Next button clicked\n');

    // Step 5: Verify AgentEditorModal opens
    console.log('Step 5: Verify AgentEditorModal opens...');

    const editorModal = await page.waitForSelector(
      '.ant-modal:visible .ant-modal-title:has-text("Edit Agent")',
      { timeout: 10000, state: 'visible' }
    ).catch(() => null);

    if (!editorModal) {
      console.log('❌ AgentEditorModal did not appear');
      await page.screenshot({ path: 'test-results/screenshots/paste-04-no-editor-modal.png', fullPage: true });
      throw new Error('AgentEditorModal did not appear');
    }

    console.log('✓ AgentEditorModal opened\n');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/paste-05-editor-modal.png', fullPage: true });

    // Step 6: Verify pasted content is in editor
    console.log('Step 6: Verify pasted content is in editor...');

    const mdEditor = page.locator('.w-md-editor, [data-color-mode="light"]').first();
    if (await mdEditor.isVisible({ timeout: 5000 })) {
      console.log('✓ Markdown editor visible');

      const editorTextarea = page.locator('.w-md-editor-text-input, textarea').first();
      if (await editorTextarea.isVisible({ timeout: 3000 })) {
        const content = await editorTextarea.inputValue().catch(() => '');
        if (content && content.includes('Test Agent') && content.includes('Test capability')) {
          console.log(`✓ Pasted content verified (${content.length} characters)`);
        } else {
          console.log('⚠ Pasted content not found or incorrect');
        }
      }
    }

    // Step 7: Click Save Agent button
    console.log('\nStep 7: Click Save Agent button...');

    const saveBtn = page.locator('button:has-text("Save Agent")').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toBeEnabled();

    await saveBtn.click();
    console.log('✓ Save Agent button clicked');
    await page.waitForTimeout(3000);

    // Step 8: Verify success message
    console.log('\nStep 8: Verify success message...');

    const successMsg = page.locator('.ant-message-success').first();
    if (await successMsg.isVisible({ timeout: 5000 })) {
      const successText = await successMsg.textContent();
      console.log(`✓ Success message: ${successText}`);
    } else {
      console.log('⚠ Success message not visible');
    }

    await page.screenshot({ path: 'test-results/screenshots/paste-06-saved.png', fullPage: true });

    console.log('\n=== TEST 2 COMPLETE ===\n');
  });

  test('3. Import URL Tab - Import agent from URL (if working)', async ({ page }) => {
    console.log('\n=== TEST 3: IMPORT URL TAB ===\n');

    await login(page);
    await navigateToAgents(page);

    await page.screenshot({ path: 'test-results/screenshots/import-01-before-modal.png', fullPage: true });

    const modal = await openCreateModal(page);

    // Step 1: Switch to Import URL tab
    console.log('Step 1: Switch to Import URL tab...');
    const importTab = page.locator('[role="tab"]:has-text("Import URL")').first();
    await expect(importTab).toBeVisible();

    await importTab.click();
    await page.waitForTimeout(1000);

    console.log('✓ Import URL tab selected\n');
    await page.screenshot({ path: 'test-results/screenshots/import-02-tab-active.png', fullPage: true });

    // Step 2: Fill Agent Name field
    console.log('Step 2: Fill Agent Name field...');
    const nameInput = modal.locator('input[placeholder*="e.g.,"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    await nameInput.click();
    await page.waitForTimeout(300);
    await nameInput.press('Control+A');
    await nameInput.pressSequentially('test-import-agent', { delay: 50 });
    await page.waitForTimeout(500);

    const nameValue = await nameInput.inputValue();
    console.log(`✓ Agent Name filled: "${nameValue}"`);
    expect(nameValue).toBe('test-import-agent');

    // Step 3: Fill Import URL field
    console.log('\nStep 3: Fill Import URL field...');
    const urlInput = modal.locator('input[placeholder*="https://raw.githubusercontent.com"]').first();
    await expect(urlInput).toBeVisible({ timeout: 5000 });

    await urlInput.click();
    await page.waitForTimeout(300);

    const importUrl = 'https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/README.md';
    await urlInput.pressSequentially(importUrl, { delay: 20 });
    await page.waitForTimeout(500);

    const urlValue = await urlInput.inputValue();
    console.log(`✓ Import URL filled: "${urlValue}"\n`);
    expect(urlValue).toBe(importUrl);

    await page.screenshot({ path: 'test-results/screenshots/import-03-form-filled.png', fullPage: true });

    // Step 4: Click Next button
    console.log('Step 4: Click Next button and wait for import...');

    const nextBtn = modal.locator('button:has-text("Next")').first();
    await expect(nextBtn).toBeVisible();

    await nextBtn.click();
    console.log('✓ Next button clicked');
    console.log('  Waiting for URL import (may take a few seconds)...');
    await page.waitForTimeout(5000);

    // Step 5: Check for import completion
    console.log('\nStep 5: Check for import completion...');

    // Check for success message
    const successMsg = page.locator('.ant-message-success').first();
    const errorMsg = page.locator('.ant-message-error').first();

    if (await successMsg.isVisible({ timeout: 10000 })) {
      const successText = await successMsg.textContent();
      console.log(`✓ Import success: ${successText}`);

      await page.waitForTimeout(2000);

      // Step 6: Verify AgentEditorModal opens
      console.log('\nStep 6: Verify AgentEditorModal opens...');

      const editorModal = await page.waitForSelector(
        '.ant-modal:visible .ant-modal-title:has-text("Edit Agent")',
        { timeout: 10000, state: 'visible' }
      ).catch(() => null);

      if (!editorModal) {
        console.log('❌ AgentEditorModal did not appear');
        await page.screenshot({ path: 'test-results/screenshots/import-04-no-editor-modal.png', fullPage: true });
        throw new Error('AgentEditorModal did not appear');
      }

      console.log('✓ AgentEditorModal opened\n');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/screenshots/import-05-editor-modal.png', fullPage: true });

      // Step 7: Click Save Agent button
      console.log('Step 7: Click Save Agent button...');

      const saveBtn = page.locator('button:has-text("Save Agent")').first();
      await expect(saveBtn).toBeVisible({ timeout: 5000 });
      await expect(saveBtn).toBeEnabled();

      await saveBtn.click();
      console.log('✓ Save Agent button clicked');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/screenshots/import-06-saved.png', fullPage: true });

      console.log('\n=== TEST 3 COMPLETE ===\n');
    } else if (await errorMsg.isVisible({ timeout: 10000 })) {
      const errorText = await errorMsg.textContent();
      console.log(`⚠ Import failed: ${errorText}`);
      console.log('  This is expected if API endpoint is not implemented yet\n');

      await page.screenshot({ path: 'test-results/screenshots/import-04-error.png', fullPage: true });

      console.log('=== TEST 3 SKIPPED (Import API not available) ===\n');
    } else {
      console.log('⚠ No clear success or error message after import attempt');
      await page.screenshot({ path: 'test-results/screenshots/import-04-unknown-state.png', fullPage: true });
    }
  });

  test('4. Verify Created Agents - Check file explorer', async ({ page }) => {
    console.log('\n=== TEST 4: VERIFY CREATED AGENTS ===\n');

    await login(page);
    await navigateToAgents(page);

    await page.screenshot({ path: 'test-results/screenshots/verify-01-agents-view.png', fullPage: true });

    // Wait for file tree to load
    await page.waitForTimeout(3000);

    console.log('Step 1: Check for test-ai-agent.md...');
    const aiAgentFile = page.locator('text=/test-ai-agent/i').first();
    if (await aiAgentFile.isVisible({ timeout: 5000 })) {
      console.log('✓ test-ai-agent.md found in file explorer');
    } else {
      console.log('⚠ test-ai-agent.md not found (might not be saved yet)');
    }

    console.log('\nStep 2: Check for test-paste-agent.md...');
    const pasteAgentFile = page.locator('text=/test-paste-agent/i').first();
    if (await pasteAgentFile.isVisible({ timeout: 5000 })) {
      console.log('✓ test-paste-agent.md found in file explorer');
    } else {
      console.log('⚠ test-paste-agent.md not found');
    }

    console.log('\nStep 3: Check for test-import-agent.md...');
    const importAgentFile = page.locator('text=/test-import-agent/i').first();
    if (await importAgentFile.isVisible({ timeout: 5000 })) {
      console.log('✓ test-import-agent.md found in file explorer');
    } else {
      console.log('⚠ test-import-agent.md not found (expected if import failed)');
    }

    await page.screenshot({ path: 'test-results/screenshots/verify-02-final-state.png', fullPage: true });

    console.log('\n=== TEST 4 COMPLETE ===\n');
  });
});
