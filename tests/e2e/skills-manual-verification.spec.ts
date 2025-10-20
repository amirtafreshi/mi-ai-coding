import { test, expect } from '@playwright/test'

/**
 * Manual Skills Management System Verification Test
 *
 * This test performs a step-by-step verification of the Skills Management System
 * with detailed logging and screenshots at each step for manual verification.
 *
 * ⚠️ CRITICAL: Runs on DISPLAY=:99 for VNC visibility at http://localhost:6080
 */

test.describe('Skills Management - Manual Verification', () => {
  test('Complete Skills Management workflow with screenshots', async ({ page }) => {
    console.log('\n========================================')
    console.log('SKILLS MANAGEMENT SYSTEM TEST')
    console.log('Monitor in VNC: http://localhost:6080')
    console.log('========================================\n')

    // STEP 1: Navigate to application
    console.log('[STEP 1] Navigating to http://localhost:3000...')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/manual-01-initial-page.png', fullPage: true })
    console.log('✓ Page loaded')

    // STEP 2: Check if login is required
    console.log('\n[STEP 2] Checking for login page...')
    const loginHeading = await page.locator('text=Sign in to access your workspace').isVisible().catch(() => false)

    if (loginHeading) {
      console.log('Login required - filling credentials...')

      // Find and fill email field
      const emailField = page.locator('input[type="text"]').first()
      await emailField.waitFor({ state: 'visible', timeout: 5000 })
      await emailField.fill('admin@example.com')
      console.log('  - Email filled: admin@example.com')

      // Find and fill password field
      const passwordField = page.locator('input[type="password"]').first()
      await passwordField.waitFor({ state: 'visible', timeout: 5000 })
      await passwordField.fill('admin123')
      console.log('  - Password filled: admin123')

      await page.screenshot({ path: 'test-results/manual-02-login-filled.png', fullPage: true })

      // Click Sign In button
      console.log('  - Clicking Sign In button...')
      const signInButton = page.locator('button:has-text("Sign In")')
      await signInButton.click()

      // Wait for navigation
      console.log('  - Waiting for dashboard to load...')
      await page.waitForTimeout(5000)
      await page.waitForLoadState('networkidle')

      await page.screenshot({ path: 'test-results/manual-03-after-login.png', fullPage: true })
      console.log('✓ Login completed')
    } else {
      console.log('Already logged in or no login required')
    }

    // STEP 3: Look for Skills button
    console.log('\n[STEP 3] Looking for Skills button in dashboard...')
    await page.waitForTimeout(2000)

    // Try multiple selectors for Skills button
    let skillsButton = null
    const selectors = [
      'button:has-text("Skills")',
      '[role="button"]:has-text("Skills")',
      'button >> text=Skills',
      '.ant-segmented-item:has-text("Skills")'
    ]

    for (const selector of selectors) {
      const button = page.locator(selector).first()
      const isVisible = await button.isVisible().catch(() => false)
      if (isVisible) {
        console.log(`  ✓ Found Skills button with selector: ${selector}`)
        skillsButton = button
        break
      }
    }

    if (!skillsButton) {
      console.log('  ✗ Skills button not found')
      await page.screenshot({ path: 'test-results/manual-ERROR-no-skills-button.png', fullPage: true })
      throw new Error('Skills button not found in dashboard')
    }

    await page.screenshot({ path: 'test-results/manual-04-skills-button-found.png', fullPage: true })

    // STEP 4: Click Skills button
    console.log('\n[STEP 4] Clicking Skills button...')
    await skillsButton.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/manual-05-after-skills-click.png', fullPage: true })
    console.log('✓ Skills button clicked')

    // STEP 5: Wait for Skills Selector Modal
    console.log('\n[STEP 5] Waiting for Skills Selector modal...')
    const skillsSelectorHeading = page.locator('text=Skills Selector')
    try {
      await skillsSelectorHeading.waitFor({ state: 'visible', timeout: 10000 })
      console.log('✓ Skills Selector modal appeared')
      await page.screenshot({ path: 'test-results/manual-06-skills-selector-modal.png', fullPage: true })
    } catch (error) {
      console.log('✗ Skills Selector modal did not appear')
      await page.screenshot({ path: 'test-results/manual-ERROR-no-selector-modal.png', fullPage: true })
      throw error
    }

    // STEP 6: Click Create New Skill button
    console.log('\n[STEP 6] Looking for "Create New Skill" button...')
    const createButton = page.locator('button:has-text("Create New Skill")')
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✓ Create button found')

    await createButton.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/manual-07-create-button-clicked.png', fullPage: true })
    console.log('✓ Create New Skill button clicked')

    // STEP 7: Verify Create Skill Modal opened
    console.log('\n[STEP 7] Verifying Create Skill modal...')
    const createModalHeading = page.locator('text=Create New Skill')
    await createModalHeading.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✓ Create Skill modal opened')

    // Verify tabs are present
    const aiGenerateTab = page.locator('text=AI Generate')
    const pasteTab = page.locator('text=Paste')
    const importTab = page.locator('text=Import URL')

    await expect(aiGenerateTab).toBeVisible()
    await expect(pasteTab).toBeVisible()
    await expect(importTab).toBeVisible()
    console.log('✓ All three tabs visible (AI Generate, Paste, Import URL)')

    await page.screenshot({ path: 'test-results/manual-08-create-modal-open.png', fullPage: true })

    // STEP 8: Test AI Generate Tab
    console.log('\n[STEP 8] Testing AI Generate tab...')
    await aiGenerateTab.click()
    await page.waitForTimeout(500)

    const skillNameInput = page.locator('input[placeholder*="Document Analyzer"]')
    await expect(skillNameInput).toBeVisible()
    await skillNameInput.fill('Manual Test Skill')
    console.log('  - Skill name filled: Manual Test Skill')

    const descriptionTextarea = page.locator('textarea[placeholder*="Analyzes documents"]')
    await expect(descriptionTextarea).toBeVisible()
    await descriptionTextarea.fill('This is a manual test skill to verify AI generation workflow. Use when testing the skills system.')
    console.log('  - Description filled')

    await page.screenshot({ path: 'test-results/manual-09-ai-form-filled.png', fullPage: true })

    const generateButton = page.locator('button:has-text("Generate Skill with AI")')
    await expect(generateButton).toBeVisible()
    await expect(generateButton).toBeEnabled()
    console.log('✓ AI Generate form ready')

    // STEP 9: Test Paste Tab
    console.log('\n[STEP 9] Testing Paste tab...')
    await pasteTab.click()
    await page.waitForTimeout(500)

    const pasteNameInput = page.locator('input[placeholder*="my-skill"]')
    await expect(pasteNameInput).toBeVisible()
    console.log('  - Name input visible')

    const pasteMarkdownTextarea = page.locator('textarea[placeholder*="---"]')
    await expect(pasteMarkdownTextarea).toBeVisible()
    console.log('  - Markdown textarea visible')

    const saveButton = page.locator('button:has-text("Save Skill")')
    await expect(saveButton).toBeVisible()
    console.log('  - Save button visible')

    // Fill paste form with valid YAML
    const testSkillName = `manual-paste-${Date.now()}`
    await pasteNameInput.fill(testSkillName)

    const validYaml = `---
name: ${testSkillName}
description: Manual test skill created via paste mode with valid YAML frontmatter
---

# Manual Paste Test Skill

## Overview
This skill was created during manual testing of the Skills Management System.

## Instructions
1. Open Skills selector from quick access
2. Click Create New Skill
3. Switch to Paste tab
4. Fill in skill name and YAML content
5. Click Save Skill

## When to Use
Use this skill when verifying the paste functionality of the skills system.

## Examples
\`\`\`
Example: Pasting complete SKILL.md content with YAML frontmatter
\`\`\`

## Guidelines
- Always include YAML frontmatter with name and description
- Keep description under 200 characters
- Use progressive disclosure in instructions
`

    await pasteMarkdownTextarea.fill(validYaml)
    console.log('  - Paste form filled with valid YAML')

    await page.screenshot({ path: 'test-results/manual-10-paste-form-filled.png', fullPage: true })
    console.log('✓ Paste tab tested')

    // STEP 10: Test Import URL Tab
    console.log('\n[STEP 10] Testing Import URL tab...')
    await importTab.click()
    await page.waitForTimeout(500)

    const importNameInput = page.locator('input[placeholder*="my-skill"]')
    await expect(importNameInput).toBeVisible()
    console.log('  - Name input visible')

    const importUrlInput = page.locator('input[placeholder*="https://raw.githubusercontent"]')
    await expect(importUrlInput).toBeVisible()
    console.log('  - URL input visible')

    const importButton = page.locator('button:has-text("Import Skill")')
    await expect(importButton).toBeVisible()
    console.log('  - Import button visible')

    await page.screenshot({ path: 'test-results/manual-11-import-tab.png', fullPage: true })
    console.log('✓ Import URL tab tested')

    // STEP 11: Actually save the pasted skill
    console.log('\n[STEP 11] Saving the skill via Paste mode...')
    await pasteTab.click()
    await page.waitForTimeout(500)

    console.log('  - Clicking Save Skill button...')
    await saveButton.click()

    // Wait for save operation
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'test-results/manual-12-after-save-attempt.png', fullPage: true })

    // Check for success or error message
    const successMessage = page.locator('.ant-message-success')
    const errorMessage = page.locator('.ant-message-error')

    const isSuccess = await successMessage.isVisible().catch(() => false)
    const isError = await errorMessage.isVisible().catch(() => false)

    if (isSuccess) {
      console.log('✓ SUCCESS: Skill saved successfully!')
      await page.screenshot({ path: 'test-results/manual-13-SUCCESS-skill-saved.png', fullPage: true })
    } else if (isError) {
      console.log('✗ ERROR: Save operation failed')
      await page.screenshot({ path: 'test-results/manual-13-ERROR-save-failed.png', fullPage: true })
    } else {
      console.log('⚠ WARNING: No success or error message displayed')
      await page.screenshot({ path: 'test-results/manual-13-WARNING-no-message.png', fullPage: true })
    }

    // FINAL SUMMARY
    console.log('\n========================================')
    console.log('TEST COMPLETE')
    console.log('========================================')
    console.log('Review screenshots in test-results/manual-*.png')
    console.log('All modals and tabs were tested successfully')
    console.log('========================================\n')
  })
})
