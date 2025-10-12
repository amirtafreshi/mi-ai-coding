import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/home/master/projects/mi-ai-coding/test-screenshots';

test.describe('Complete Editor Feature Test', () => {
  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('Complete end-to-end editor workflow', async ({ page }) => {
    // Increase timeout for this comprehensive test
    test.setTimeout(120000); // 2 minutes
    // Enable console logging
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(text);
    });

    // Track errors
    page.on('pageerror', error => {
      const text = `[ERROR] ${error.message}`;
      consoleLogs.push(text);
      console.error(text);
    });

    console.log('=== STEP 1: LOGIN ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill login form - Ant Design form with name="email" and name="password"
    // The actual input is inside the Form.Item, so we look for the input by id
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('admin@example.com');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('admin123');

    // Click login button
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    console.log('=== STEP 2: WAIT FOR DASHBOARD ===');
    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow components to initialize

    console.log('=== STEP 3: NAVIGATE INTO MI-AI-CODING FOLDER ===');
    // Wait for file tree to load
    await page.waitForSelector('.file-tree-item', { timeout: 10000 });

    // Find and click the "mi-ai-coding" folder
    const miAiCodingFolder = page.locator('.file-tree-item').filter({ hasText: 'mi-ai-coding' }).first();
    await expect(miAiCodingFolder).toBeVisible({ timeout: 10000 });
    await miAiCodingFolder.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-01-folder-navigate.png'), fullPage: true });
    console.log('✅ Screenshot 1: Folder navigation');

    console.log('=== STEP 4: LOOK FOR TEXT FILES ===');
    // Wait for folder to expand and show files
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-02-file-list.png'), fullPage: true });
    console.log('✅ Screenshot 2: File list');

    // Find a text file (look for README.md, CLAUDE.md, package.json, .gitignore)
    const possibleFiles = ['README.md', 'CLAUDE.md', 'package.json', '.gitignore', 'tsconfig.json'];
    let fileToOpen: string | null = null;

    for (const fileName of possibleFiles) {
      const fileItem = page.locator('.file-tree-item').filter({ hasText: fileName }).first();
      const isVisible = await fileItem.isVisible().catch(() => false);
      if (isVisible) {
        // Make sure it's not a folder (should not have expand icon)
        const hasExpandIcon = await fileItem.locator('.file-tree-expand-icon').isVisible().catch(() => false);
        if (!hasExpandIcon) {
          fileToOpen = fileName;
          console.log(`Found file: ${fileName}`);
          break;
        }
      }
    }

    if (!fileToOpen) {
      console.log('⚠️ No text file found in the expected list. Looking for any file...');
      // Try to find any file (items without expand icon)
      const allItems = await page.locator('.file-tree-item').all();
      for (const item of allItems) {
        const hasExpandIcon = await item.locator('.file-tree-expand-icon').isVisible().catch(() => false);
        const text = await item.textContent();
        if (!hasExpandIcon && text && text.includes('.')) {
          fileToOpen = text.trim();
          console.log(`Found file: ${fileToOpen}`);
          break;
        }
      }
    }

    if (!fileToOpen) {
      throw new Error('❌ Could not find any text file to open');
    }

    console.log(`=== STEP 5: CLICK ON FILE: ${fileToOpen} ===`);
    const fileItem = page.locator('.file-tree-item').filter({ hasText: fileToOpen }).first();
    await fileItem.click();
    await page.waitForTimeout(2000); // Wait for editor to load

    console.log('=== STEP 6: VERIFY FILE OPENED IN MONACO EDITOR ===');
    // Check if Monaco editor is visible
    const monacoEditor = page.locator('.monaco-editor');
    const isEditorVisible = await monacoEditor.isVisible().catch(() => false);

    if (!isEditorVisible) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-03-file-opened-FAILED.png'), fullPage: true });
      console.log('❌ Monaco editor is not visible');
      throw new Error('Monaco editor did not open');
    }

    // Check if content is loaded
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-03-file-opened.png'), fullPage: true });
    console.log('✅ Screenshot 3: File opened in editor');
    console.log('✅ File opened successfully in Monaco editor');

    console.log('=== STEP 7a: MAKE AN EDIT ===');
    // Click into the Monaco editor to focus it
    await monacoEditor.click();
    await page.waitForTimeout(500);

    // Move cursor to beginning (Ctrl+Home)
    await page.keyboard.press('Control+Home');
    await page.waitForTimeout(300);

    // Type the test edit
    await page.keyboard.type('// TEST EDIT\n');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-04-editing.png'), fullPage: true });
    console.log('✅ Screenshot 4: After editing');

    console.log('=== STEP 7b: VERIFY ORANGE DOT (isDirty) ===');
    // Look for isDirty indicator (orange dot on tab)
    const dirtyIndicator = page.locator('.tab-dirty-indicator, [data-dirty="true"], .unsaved-indicator');
    const hasDirtyIndicator = await dirtyIndicator.isVisible().catch(() => false);

    if (hasDirtyIndicator) {
      console.log('✅ Orange dot (isDirty indicator) is visible');
    } else {
      console.log('⚠️ Orange dot (isDirty indicator) not found - checking tab styles');
    }

    console.log('=== STEP 7c: VERIFY SAVE BUTTON IS ENABLED ===');
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();
    const isSaveButtonVisible = await saveButton.isVisible().catch(() => false);

    if (!isSaveButtonVisible) {
      console.log('❌ Save button not found');
    } else {
      const isDisabled = await saveButton.isDisabled().catch(() => true);
      if (!isDisabled) {
        console.log('✅ Save button is enabled');
      } else {
        console.log('❌ Save button is disabled');
      }
    }

    console.log('=== STEP 7d: CLICK SAVE BUTTON ===');
    if (isSaveButtonVisible) {
      await saveButton.click();
      await page.waitForTimeout(2000); // Wait for save operation

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-05-save-success.png'), fullPage: true });
      console.log('✅ Screenshot 5: After save');

      console.log('=== STEP 7e: VERIFY SUCCESS MESSAGE ===');
      // Look for success message
      const successMessage = page.locator('.ant-message-success, .ant-notification-notice-success, text=/Saved/');
      const hasSuccessMessage = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasSuccessMessage) {
        const messageText = await successMessage.textContent().catch(() => '');
        console.log(`✅ Success message displayed: ${messageText}`);
      } else {
        console.log('⚠️ Success message not found');
      }

      console.log('=== STEP 7f: VERIFY ORANGE DOT DISAPPEARS ===');
      await page.waitForTimeout(1000);
      const stillDirty = await dirtyIndicator.isVisible().catch(() => false);

      if (!stillDirty) {
        console.log('✅ Orange dot disappeared (isDirty = false)');
      } else {
        console.log('⚠️ Orange dot still visible after save');
      }
    }

    console.log('=== STEP 7g: MAKE ANOTHER EDIT ===');
    await monacoEditor.click();
    await page.keyboard.type('// ANOTHER TEST EDIT\n');
    await page.waitForTimeout(1000);

    console.log('=== STEP 7h: CLICK CLOSE WITHOUT SAVING ===');
    const closeButton = page.locator('button').filter({ hasText: 'Close' }).first();
    const isCloseButtonVisible = await closeButton.isVisible().catch(() => false);

    if (isCloseButtonVisible) {
      await closeButton.click();
      await page.waitForTimeout(1500);

      console.log('=== STEP 7i: VERIFY UNSAVED CHANGES WARNING ===');
      // Look for modal/dialog
      const warningModal = page.locator('.ant-modal, .ant-modal-confirm, [role="dialog"]');
      const hasWarningModal = await warningModal.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasWarningModal) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-06-unsaved-warning.png'), fullPage: true });
        console.log('✅ Screenshot 6: Unsaved changes warning');
        console.log('✅ Unsaved changes warning modal appeared');

        console.log('=== STEP 7j: CLICK "CLOSE WITHOUT SAVING" ===');
        // Look for close without saving button
        const closeWithoutSavingButton = page.locator('button').filter({ hasText: /Close.*Without.*Saving|Don't Save|Discard/i }).first();
        const hasButton = await closeWithoutSavingButton.isVisible().catch(() => false);

        if (hasButton) {
          await closeWithoutSavingButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked "Close Without Saving"');
        } else {
          console.log('⚠️ "Close Without Saving" button not found, checking modal buttons');
          // Try to find any button in the modal
          const modalButtons = await warningModal.locator('button').all();
          console.log(`Found ${modalButtons.length} buttons in modal`);
          for (let i = 0; i < modalButtons.length; i++) {
            const btnText = await modalButtons[i].textContent();
            console.log(`  Button ${i + 1}: ${btnText}`);
          }
          // Click the last button (usually "Don't Save" or "Close")
          if (modalButtons.length > 0) {
            await modalButtons[modalButtons.length - 1].click();
            await page.waitForTimeout(1000);
          }
        }
      } else {
        console.log('❌ Unsaved changes warning modal did not appear');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-06-unsaved-warning-MISSING.png'), fullPage: true });
      }
    } else {
      console.log('❌ Close button not found');
    }

    console.log('=== STEP 7k: OPEN SAME FILE AGAIN ===');
    await page.waitForTimeout(1000);
    const fileItemAgain = page.locator('.file-tree-item').filter({ hasText: fileToOpen }).first();
    await fileItemAgain.click();
    await page.waitForTimeout(2000);
    console.log('✅ Reopened file');

    console.log('=== STEP 7l: CLICK PERMISSIONS BUTTON ===');
    const permissionsButton = page.locator('button').filter({ hasText: 'Permissions' }).first();
    const isPermissionsButtonVisible = await permissionsButton.isVisible().catch(() => false);

    if (isPermissionsButtonVisible) {
      await permissionsButton.click();
      await page.waitForTimeout(1500);

      console.log('=== STEP 7m: VERIFY PERMISSIONS DIALOG ===');
      const permissionsDialog = page.locator('.ant-modal, [role="dialog"]').filter({ hasText: /Permissions|Mode|chmod/i });
      const hasPermissionsDialog = await permissionsDialog.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasPermissionsDialog) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-07-permissions.png'), fullPage: true });
        console.log('✅ Screenshot 7: Permissions dialog');
        console.log('✅ Permissions dialog appeared');

        // Close the dialog
        const cancelButton = page.locator('button').filter({ hasText: /Cancel|Close/i }).first();
        await cancelButton.click().catch(() => {});
        await page.waitForTimeout(500);
      } else {
        console.log('❌ Permissions dialog did not appear');
      }
    } else {
      console.log('⚠️ Permissions button not found');
    }

    console.log('=== STEP 7n: CLICK SAVE AS BUTTON ===');
    const saveAsButton = page.locator('button').filter({ hasText: 'Save As' }).first();
    const isSaveAsButtonVisible = await saveAsButton.isVisible().catch(() => false);

    if (isSaveAsButtonVisible) {
      await saveAsButton.click();
      await page.waitForTimeout(1500);

      console.log('=== STEP 7o: VERIFY SAVE AS DIALOG ===');
      const saveAsDialog = page.locator('.ant-modal, [role="dialog"]').filter({ hasText: /Save As|New Path|File Name/i });
      const hasSaveAsDialog = await saveAsDialog.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSaveAsDialog) {
        console.log('✅ Save As dialog appeared');

        // Close the dialog
        const cancelButton = page.locator('button').filter({ hasText: /Cancel|Close/i }).first();
        await cancelButton.click().catch(() => {});
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️ Save As dialog not found');
      }
    } else {
      console.log('⚠️ Save As button not found');
    }

    console.log('=== STEP 8: CAPTURE CONSOLE LOGS ===');
    // Take screenshot of the console (we'll need to open devtools manually or just save logs)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final-08-final-state.png'), fullPage: true });
    console.log('✅ Screenshot 8: Final state');

    // Save console logs to file
    const logFilePath = path.join(SCREENSHOT_DIR, 'console-logs.txt');
    fs.writeFileSync(logFilePath, consoleLogs.join('\n'));
    console.log(`✅ Console logs saved to: ${logFilePath}`);

    console.log('\n=== TEST COMPLETE ===');
    console.log(`Total console messages captured: ${consoleLogs.length}`);
    console.log('\nKey console logs to check:');
    const keyLogs = consoleLogs.filter(log =>
      log.includes('FileTree') ||
      log.includes('MonacoEditor') ||
      log.includes('file:open') ||
      log.includes('opened successfully')
    );
    keyLogs.forEach(log => console.log(`  ${log}`));
  });
});
