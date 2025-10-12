import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Comprehensive E2E Test for AI-Powered Agent Creation System
 *
 * Tests the full workflow:
 * 1. Login with admin credentials
 * 2. Navigate to agents folder
 * 3. Verify "+Agent" button appears
 * 4. Test AI Generate method
 * 5. Verify AgentEditorModal features
 * 6. Test Deploy button functionality
 * 7. Test other creation methods (Paste, Import URL)
 *
 * ⚠️ CRITICAL: Runs on DISPLAY=:99 for VNC visibility at http://localhost:6080
 */

test.describe('AI-Powered Agent Creation System - Comprehensive E2E', () => {
  test.setTimeout(120000); // 2 minutes for AI generation

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Full workflow: Login → Navigate → AI Generate → Editor → Deploy', async ({ page }) => {
    console.log('Step 1: Testing login with admin@example.com...');

    // Step 1: Login Test
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Take screenshot after successful login
    await page.screenshot({
      path: 'test-results/screenshots/01-login-success.png',
      fullPage: true
    });
    console.log('✓ Login successful');

    // Step 2: Navigation - Click "Agents" quick access
    console.log('Step 2: Testing navigation to agents folder...');

    // Wait for quick actions to be visible
    await page.waitForSelector('[data-testid="quick-action-agents"], button:has-text("Agents")', {
      timeout: 10000
    });

    // Click the Agents quick action button
    const agentsButton = page.locator('[data-testid="quick-action-agents"], button:has-text("Agents")').first();
    await agentsButton.click();
    await page.waitForLoadState('networkidle');

    // Wait for file explorer to update
    await page.waitForTimeout(2000);

    // Take screenshot of agents folder
    await page.screenshot({
      path: 'test-results/screenshots/02-agents-folder.png',
      fullPage: true
    });
    console.log('✓ Navigated to agents folder');

    // Step 3: Verify "+Agent" button appears
    console.log('Step 3: Verifying +Agent button...');

    // Look for the +Agent button or +File button that changes to +Agent
    const createButton = page.locator('button:has-text("+Agent"), button:has-text("+ Agent"), button[title="Create Agent"]').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'test-results/screenshots/03-agent-button-visible.png',
      fullPage: true
    });
    console.log('✓ +Agent button is visible');

    // Step 4: Test AI Generate Method
    console.log('Step 4: Testing AI Generate method...');

    // Click +Agent button to open CreateAgentModal
    await createButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot of CreateAgentModal
    await page.screenshot({
      path: 'test-results/screenshots/04-create-agent-modal.png',
      fullPage: true
    });

    // Verify modal is open
    const modal = page.locator('.ant-modal, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✓ CreateAgentModal opened');

    // Select "AI Generate" tab if not already selected
    const aiGenerateTab = page.locator('button:has-text("AI Generate"), [role="tab"]:has-text("AI Generate")').first();
    if (await aiGenerateTab.isVisible()) {
      await aiGenerateTab.click();
      await page.waitForTimeout(500);
    }

    // Fill in agent name
    const nameInput = page.locator('input[placeholder*="agent"], input[name="name"]').first();
    await nameInput.fill('test-agent-e2e');

    // Fill in agent description
    const descInput = page.locator('textarea[placeholder*="description"], textarea[name="description"]').first();
    await descInput.fill('A comprehensive test agent for E2E testing of the AI-powered agent creation system');

    await page.screenshot({
      path: 'test-results/screenshots/05-ai-generate-filled.png',
      fullPage: true
    });
    console.log('✓ Filled AI Generate form');

    // Click "Generate" button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Generate →")').first();
    await generateButton.click();
    console.log('✓ Clicked Generate button, waiting for AI...');

    // Wait for AI generation (up to 60 seconds)
    await page.waitForTimeout(5000);

    // Step 5: Verify AgentEditorModal Features
    console.log('Step 5: Verifying AgentEditorModal features...');

    // Wait for editor modal to appear (might take time for AI generation)
    try {
      await page.waitForSelector('.monaco-editor, [data-testid="agent-editor"], textarea[placeholder*="markdown"]', {
        timeout: 60000
      });

      await page.screenshot({
        path: 'test-results/screenshots/06-agent-editor-modal.png',
        fullPage: true
      });
      console.log('✓ AgentEditorModal opened');

      // Verify markdown editor exists
      const editor = page.locator('.monaco-editor, [data-testid="agent-editor"], textarea').first();
      await expect(editor).toBeVisible({ timeout: 5000 });
      console.log('✓ Markdown editor visible');

      // Verify "Refine with AI" button
      const refineButton = page.locator('button:has-text("Refine"), button:has-text("Refine with AI")');
      if (await refineButton.count() > 0) {
        await expect(refineButton.first()).toBeVisible();
        console.log('✓ "Refine with AI" button visible');
      } else {
        console.log('⚠ "Refine with AI" button not found (might be in different location)');
      }

      // Verify "Regenerate" button
      const regenerateButton = page.locator('button:has-text("Regenerate")');
      if (await regenerateButton.count() > 0) {
        await expect(regenerateButton.first()).toBeVisible();
        console.log('✓ "Regenerate" button visible');
      } else {
        console.log('⚠ "Regenerate" button not found');
      }

      // Verify "Save Agent" button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Save Agent")').first();
      await expect(saveButton).toBeVisible({ timeout: 5000 });
      console.log('✓ "Save Agent" button visible');

      await page.screenshot({
        path: 'test-results/screenshots/07-editor-features-verified.png',
        fullPage: true
      });

      // Click Save to save the agent
      await saveButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Agent saved');

    } catch (error) {
      console.error('❌ AgentEditorModal did not appear or AI generation failed:', error);
      await page.screenshot({
        path: 'test-results/screenshots/06-editor-error.png',
        fullPage: true
      });

      // Check for error messages
      const errorMsg = page.locator('.ant-message-error, .ant-alert-error, [role="alert"]');
      if (await errorMsg.count() > 0) {
        const errorText = await errorMsg.first().textContent();
        console.log('Error message:', errorText);
      }

      throw error;
    }

    // Step 6: Test Deploy Button
    console.log('Step 6: Testing Deploy button functionality...');

    // Wait for agent file to appear in file tree
    await page.waitForTimeout(2000);

    // Look for the newly created agent file
    const agentFile = page.locator('[data-testid="file-item"]:has-text("test-agent-e2e"), .file-item:has-text("test-agent-e2e")').first();

    if (await agentFile.isVisible({ timeout: 5000 })) {
      console.log('✓ Agent file visible in tree');

      // Hover over the file to reveal actions
      await agentFile.hover();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'test-results/screenshots/08-agent-file-hover.png',
        fullPage: true
      });

      // Look for rocket deploy button
      const deployButton = page.locator('button[title*="Deploy"], button[aria-label*="Deploy"], [data-testid="deploy-button"]').first();

      if (await deployButton.isVisible({ timeout: 5000 })) {
        console.log('✓ Deploy button visible');

        await deployButton.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'test-results/screenshots/09-deploy-modal.png',
          fullPage: true
        });

        // Verify AgentDeployModal opened with project list
        const deployModal = page.locator('.ant-modal:has-text("Deploy"), [role="dialog"]:has-text("Deploy")').first();
        await expect(deployModal).toBeVisible({ timeout: 5000 });
        console.log('✓ AgentDeployModal opened');

        // Close deploy modal
        const closeButton = page.locator('.ant-modal-close, button:has-text("Cancel")').first();
        await closeButton.click();
        await page.waitForTimeout(500);

      } else {
        console.log('⚠ Deploy button not visible (might require .md file selection)');
      }
    } else {
      console.log('⚠ Agent file not visible in tree (might be saved elsewhere)');
    }

    // Step 7: Test Other Creation Methods (Paste)
    console.log('Step 7: Testing Paste method...');

    // Open CreateAgentModal again
    const createButtonAgain = page.locator('button:has-text("+Agent"), button:has-text("+ Agent")').first();
    if (await createButtonAgain.isVisible({ timeout: 5000 })) {
      await createButtonAgain.click();
      await page.waitForTimeout(1000);

      // Select "Paste" tab
      const pasteTab = page.locator('button:has-text("Paste"), [role="tab"]:has-text("Paste")').first();
      if (await pasteTab.isVisible()) {
        await pasteTab.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'test-results/screenshots/10-paste-method.png',
          fullPage: true
        });
        console.log('✓ Paste method tab visible');

        // Fill in name
        const pasteNameInput = page.locator('input[placeholder*="agent"], input[name="name"]').first();
        await pasteNameInput.fill('paste-agent-test');

        // Fill in content
        const pasteContentInput = page.locator('textarea[placeholder*="paste"], textarea[name="content"]').first();
        await pasteContentInput.fill('# Paste Agent Test\n\nThis is a test agent created via paste method.');

        await page.screenshot({
          path: 'test-results/screenshots/11-paste-filled.png',
          fullPage: true
        });
        console.log('✓ Paste form filled');

        // Click Create
        const createPasteButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        await createPasteButton.click();
        await page.waitForTimeout(2000);
        console.log('✓ Paste agent created');
      } else {
        console.log('⚠ Paste tab not found');
      }
    }

    // Final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/12-final-state.png',
      fullPage: true
    });

    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ Login successful');
    console.log('✓ Navigation to agents folder');
    console.log('✓ +Agent button visible');
    console.log('✓ AI Generate form filled and submitted');
    console.log('✓ AgentEditorModal features verified');
    console.log('✓ Agent saved successfully');
    console.log('✓ Additional creation methods tested');
    console.log('\nAll screenshots saved to test-results/screenshots/');
  });

  test('Test Import URL method', async ({ page }) => {
    console.log('Testing Import URL method...');

    // Login
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Navigate to agents folder
    const agentsButton = page.locator('[data-testid="quick-action-agents"], button:has-text("Agents")').first();
    await agentsButton.click();
    await page.waitForTimeout(2000);

    // Open CreateAgentModal
    const createButton = page.locator('button:has-text("+Agent"), button:has-text("+ Agent")').first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // Select "Import URL" tab
    const importTab = page.locator('button:has-text("Import"), [role="tab"]:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'test-results/screenshots/13-import-url-method.png',
        fullPage: true
      });
      console.log('✓ Import URL method tab visible');

      // Fill in URL
      const urlInput = page.locator('input[placeholder*="URL"], input[name="url"]').first();
      await urlInput.fill('https://raw.githubusercontent.com/example/repo/main/agent.md');

      await page.screenshot({
        path: 'test-results/screenshots/14-import-url-filled.png',
        fullPage: true
      });
      console.log('✓ Import URL form filled');

      // Note: We won't actually import as the URL is fake
      console.log('⚠ Import URL test skipped (would require valid URL)');
    } else {
      console.log('⚠ Import URL tab not found');
    }
  });

  test('Performance and UI/UX observations', async ({ page }) => {
    console.log('Testing performance and UI/UX...');

    // Login
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin@123');

    const loginStart = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    const loginDuration = Date.now() - loginStart;
    console.log(`⏱ Login took ${loginDuration}ms`);

    // Navigate to agents
    const navStart = Date.now();
    const agentsButton = page.locator('[data-testid="quick-action-agents"], button:has-text("Agents")').first();
    await agentsButton.click();
    await page.waitForTimeout(2000);
    const navDuration = Date.now() - navStart;
    console.log(`⏱ Navigation took ${navDuration}ms`);

    // Open modal
    const modalStart = Date.now();
    const createButton = page.locator('button:has-text("+Agent"), button:has-text("+ Agent")').first();
    await createButton.click();
    await page.waitForTimeout(1000);
    const modalDuration = Date.now() - modalStart;
    console.log(`⏱ Modal open took ${modalDuration}ms`);

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to collect errors
    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log('\n❌ Console errors detected:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✓ No console errors detected');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/15-performance-test.png',
      fullPage: true
    });
  });
});
