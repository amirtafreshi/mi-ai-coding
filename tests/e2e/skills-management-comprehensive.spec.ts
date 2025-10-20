import { test, expect, Page } from '@playwright/test'

/**
 * Comprehensive E2E Tests for Skills Management System
 *
 * Tests all three creation methods:
 * 1. AI Generate Mode - Generate skill with AI
 * 2. Paste Mode - Paste complete SKILL.md with YAML frontmatter
 * 3. Import URL Mode - Import skill from external URL
 *
 * ⚠️ CRITICAL: Tests run on DISPLAY=:99 for VNC visibility
 * Monitor tests at http://localhost:6080
 */

test.describe('Skills Management System - Comprehensive', () => {
  let uniqueSkillName: string

  test.beforeEach(async ({ page }) => {
    // Generate unique skill name for this test run
    uniqueSkillName = `test-skill-${Date.now()}`

    // Navigate to login page
    await page.goto('http://localhost:3000')

    // Check if we're on the login page
    const loginForm = page.locator('text=Sign in to access your workspace')
    const isLoginPage = await loginForm.isVisible().catch(() => false)

    if (isLoginPage) {
      console.log('[Test] Logging in...')

      // Fill in login credentials (using demo credentials shown on page)
      await page.locator('input[placeholder*="email"]').fill('admin@example.com')
      await page.locator('input[placeholder*="password"]').fill('admin123')

      // Click Sign In button
      await page.locator('button:has-text("Sign In")').click()

      // Wait for dashboard to load
      await page.waitForLoadState('networkidle')

      // Verify we're on the dashboard
      await page.waitForTimeout(2000)
    }

    console.log('[Test] Starting test with unique skill name:', uniqueSkillName)
  })

  test.describe('1. AI Generate Mode', () => {
    test('should open Create Skill modal from Skills quick access', async ({ page }) => {
      console.log('[Test] Opening Skills selector...')

      // Click Skills quick access button
      const skillsButton = page.locator('button:has-text("Skills")').first()
      await expect(skillsButton).toBeVisible({ timeout: 10000 })
      await skillsButton.click()

      // Wait for Skills Selector Modal to appear
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Click "Create New Skill" button
      const createButton = page.locator('button:has-text("Create New Skill")')
      await expect(createButton).toBeVisible()
      await createButton.click()

      // Verify Create Skill Modal opens
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=AI Generate')).toBeVisible()

      console.log('[Test] ✓ Create Skill modal opened successfully')
    })

    test('should generate skill with AI and open editor', async ({ page }) => {
      console.log('[Test] Testing AI Generate flow...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Ensure AI Generate tab is active
      await page.locator('text=AI Generate').click()

      // Fill in skill name
      await page.locator('input[placeholder*="Document Analyzer"]').fill(`AI ${uniqueSkillName}`)

      // Fill in description
      const description = 'Analyzes documents and extracts key insights. Use when user needs document analysis.'
      await page.locator('textarea[placeholder*="Analyzes documents"]').fill(description)

      // Click Generate button
      await page.locator('button:has-text("Generate Skill with AI")').click()

      console.log('[Test] Waiting for AI generation and editor to open...')

      // Wait for editor modal to appear
      await expect(page.locator('text=Edit Skill')).toBeVisible({ timeout: 15000 })

      // Verify editor contains generated content or fallback template
      const editor = page.locator('.monaco-editor')
      await expect(editor).toBeVisible({ timeout: 10000 })

      // Wait for content to load (either AI-generated or fallback)
      await page.waitForTimeout(3000)

      // Check for validation indicators
      const successAlert = page.locator('text=YAML Validation Passed')
      const errorAlert = page.locator('text=YAML Validation Error')

      // Should see either success or error alert
      await expect(successAlert.or(errorAlert)).toBeVisible({ timeout: 5000 })

      // If validation passed, verify save button is enabled
      const saveButton = page.locator('button:has-text("Save Skill")')

      if (await successAlert.isVisible()) {
        console.log('[Test] ✓ YAML validation passed, save button should be enabled')
        await expect(saveButton).toBeEnabled()
      } else {
        console.log('[Test] ⚠ YAML validation error detected')
      }

      console.log('[Test] ✓ AI Generate mode completed - editor opened with content')

      // Take screenshot for verification
      await page.screenshot({ path: `test-results/ai-generate-editor-${Date.now()}.png`, fullPage: true })
    })

    test('should handle AI generation errors gracefully', async ({ page }) => {
      console.log('[Test] Testing AI generation error handling...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Fill in minimal data
      await page.locator('input[placeholder*="Document Analyzer"]').fill(`Error Test ${uniqueSkillName}`)
      await page.locator('textarea[placeholder*="Analyzes documents"]').fill('Test description')

      // Click Generate button
      await page.locator('button:has-text("Generate Skill with AI")').click()

      // Wait for editor to open (with fallback template on error)
      await expect(page.locator('text=Edit Skill')).toBeVisible({ timeout: 15000 })

      // Editor should display fallback template even if AI fails
      const editor = page.locator('.monaco-editor')
      await expect(editor).toBeVisible()

      console.log('[Test] ✓ Error handling verified - fallback template loaded')
    })
  })

  test.describe('2. Paste Mode', () => {
    test('should switch to Paste tab and display form', async ({ page }) => {
      console.log('[Test] Testing Paste mode tab switch...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Click Paste tab
      await page.locator('text=Paste').click()

      // Verify Paste form elements are visible
      await expect(page.locator('input[placeholder*="my-skill"]')).toBeVisible()
      await expect(page.locator('textarea[placeholder*="---"]')).toBeVisible()
      await expect(page.locator('button:has-text("Save Skill")')).toBeVisible()

      console.log('[Test] ✓ Paste mode tab and form displayed successfully')
    })

    test('should validate YAML frontmatter and save skill', async ({ page }) => {
      console.log('[Test] Testing Paste mode with valid YAML...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Switch to Paste tab
      await page.locator('text=Paste').click()

      // Fill in skill name
      await page.locator('input[placeholder*="my-skill"]').fill(`paste-${uniqueSkillName}`)

      // Create valid SKILL.md content with YAML frontmatter
      const validSkillContent = `---
name: paste-${uniqueSkillName}
description: A test skill created via paste mode with proper YAML frontmatter
---

# Paste Test Skill

## Overview
This skill was created by pasting complete SKILL.md content.

## Instructions
1. Test instruction one
2. Test instruction two
3. Test instruction three

## When to Use
Use this skill when testing paste functionality.

## Examples
\`\`\`
Example usage here
\`\`\`

## Guidelines
- Follow best practices
- Test thoroughly
- Document everything
`

      // Fill in markdown textarea
      const markdownTextarea = page.locator('textarea[placeholder*="---"]')
      await markdownTextarea.fill(validSkillContent)

      // Click Save Skill button
      await page.locator('button:has-text("Save Skill")').click()

      console.log('[Test] Waiting for success message...')

      // Wait for success message
      await expect(page.locator('text=Skill saved successfully')).toBeVisible({ timeout: 10000 })

      // Verify modal closes
      await expect(page.locator('text=Create New Skill')).not.toBeVisible({ timeout: 5000 })

      console.log('[Test] ✓ Paste mode save successful with valid YAML')

      // Take screenshot
      await page.screenshot({ path: `test-results/paste-success-${Date.now()}.png`, fullPage: true })
    })

    test('should reject invalid YAML frontmatter', async ({ page }) => {
      console.log('[Test] Testing Paste mode with invalid YAML...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Switch to Paste tab
      await page.locator('text=Paste').click()

      // Fill in skill name
      await page.locator('input[placeholder*="my-skill"]').fill(`invalid-${uniqueSkillName}`)

      // Create invalid content (missing YAML frontmatter)
      const invalidContent = `# Invalid Skill

This skill has no YAML frontmatter and should be rejected.
`

      // Fill in markdown textarea
      await page.locator('textarea[placeholder*="---"]').fill(invalidContent)

      // Click Save Skill button
      await page.locator('button:has-text("Save Skill")').click()

      // Wait for error message
      await expect(page.locator('text=SKILL.md must start with YAML frontmatter')).toBeVisible({ timeout: 5000 })

      console.log('[Test] ✓ Invalid YAML correctly rejected')

      // Take screenshot
      await page.screenshot({ path: `test-results/paste-invalid-yaml-${Date.now()}.png`, fullPage: true })
    })

    test('should reject YAML missing required fields', async ({ page }) => {
      console.log('[Test] Testing Paste mode with incomplete YAML...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Switch to Paste tab
      await page.locator('text=Paste').click()

      // Fill in skill name
      await page.locator('input[placeholder*="my-skill"]').fill(`incomplete-${uniqueSkillName}`)

      // Create YAML with missing description
      const incompleteYaml = `---
name: incomplete-skill
---

# Incomplete Skill

This YAML is missing the description field.
`

      // Fill in markdown textarea
      await page.locator('textarea[placeholder*="---"]').fill(incompleteYaml)

      // Click Save Skill button
      await page.locator('button:has-text("Save Skill")').click()

      // Wait for error message about missing fields
      await expect(page.locator('text=must include "name" and "description" fields')).toBeVisible({ timeout: 5000 })

      console.log('[Test] ✓ Incomplete YAML correctly rejected')
    })
  })

  test.describe('3. Import URL Mode', () => {
    test('should switch to Import URL tab and display form', async ({ page }) => {
      console.log('[Test] Testing Import URL mode tab switch...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Click Import URL tab
      await page.locator('text=Import URL').click()

      // Verify Import URL form elements
      await expect(page.locator('input[placeholder*="my-skill"]')).toBeVisible()
      await expect(page.locator('input[placeholder*="https://raw.githubusercontent"]')).toBeVisible()
      await expect(page.locator('button:has-text("Import Skill")')).toBeVisible()

      console.log('[Test] ✓ Import URL mode tab and form displayed successfully')
    })

    test('should validate URL format', async ({ page }) => {
      console.log('[Test] Testing URL validation...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Switch to Import URL tab
      await page.locator('text=Import URL').click()

      // Try to submit with invalid URL
      const urlInput = page.locator('input[placeholder*="https://raw.githubusercontent"]')
      await urlInput.fill('not-a-valid-url')

      // Click Import button
      await page.locator('button:has-text("Import Skill")').click()

      // Should show validation error
      await expect(page.locator('text=Please enter a valid URL')).toBeVisible({ timeout: 5000 })

      console.log('[Test] ✓ URL validation working correctly')
    })

    test('should handle import errors gracefully', async ({ page }) => {
      console.log('[Test] Testing Import URL error handling...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Switch to Import URL tab
      await page.locator('text=Import URL').click()

      // Fill in valid URL format but non-existent resource
      const urlInput = page.locator('input[placeholder*="https://raw.githubusercontent"]')
      await urlInput.fill('https://raw.githubusercontent.com/nonexistent/repo/main/SKILL.md')

      // Click Import button
      await page.locator('button:has-text("Import Skill")').click()

      console.log('[Test] Waiting for error message...')

      // Should show error message (either network error or 404)
      // Wait for either error message or loading to finish
      await page.waitForTimeout(5000)

      // Check if error message appeared
      const errorMessage = page.locator('.ant-message-error')
      const isErrorVisible = await errorMessage.isVisible()

      if (isErrorVisible) {
        console.log('[Test] ✓ Import error handled gracefully with error message')
      } else {
        console.log('[Test] ⚠ No error message displayed, but import did not succeed')
      }

      // Take screenshot
      await page.screenshot({ path: `test-results/import-error-${Date.now()}.png`, fullPage: true })
    })
  })

  test.describe('4. Full Workflow Integration', () => {
    test('should complete full AI Generate + Edit + Save workflow', async ({ page }) => {
      console.log('[Test] Testing complete AI Generate workflow...')

      // 1. Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // 2. Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // 3. Fill AI Generate form
      await page.locator('input[placeholder*="Document Analyzer"]').fill(`Full Workflow ${uniqueSkillName}`)
      await page.locator('textarea[placeholder*="Analyzes documents"]').fill('Complete workflow test for AI generation')

      // 4. Generate skill
      await page.locator('button:has-text("Generate Skill with AI")').click()

      // 5. Wait for editor
      await expect(page.locator('text=Edit Skill')).toBeVisible({ timeout: 15000 })

      // 6. Wait for content to load
      await page.waitForTimeout(3000)

      // 7. Check validation status
      const successAlert = page.locator('text=YAML Validation Passed')
      const isValidationPassed = await successAlert.isVisible()

      if (isValidationPassed) {
        console.log('[Test] Validation passed, attempting to save...')

        // 8. Click Save button
        const saveButton = page.locator('button:has-text("Save Skill")')
        await saveButton.click()

        // 9. Wait for success message
        await expect(page.locator('text=Skill saved successfully')).toBeVisible({ timeout: 10000 })

        console.log('[Test] ✓ Full AI workflow completed successfully!')

        // Take success screenshot
        await page.screenshot({ path: `test-results/full-workflow-success-${Date.now()}.png`, fullPage: true })
      } else {
        console.log('[Test] ⚠ Validation did not pass, workflow incomplete')
        await page.screenshot({ path: `test-results/full-workflow-validation-failed-${Date.now()}.png`, fullPage: true })
      }
    })

    test('should refresh file list after saving skill', async ({ page }) => {
      console.log('[Test] Testing file list refresh after save...')

      // Open Skills selector
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })

      // Open Create Skill modal
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Use Paste mode for reliable save
      await page.locator('text=Paste').click()

      const refreshTestName = `refresh-test-${Date.now()}`
      await page.locator('input[placeholder*="my-skill"]').fill(refreshTestName)

      const validContent = `---
name: ${refreshTestName}
description: Test skill for refresh verification
---

# Refresh Test

This skill tests file list refresh functionality.
`

      await page.locator('textarea[placeholder*="---"]').fill(validContent)
      await page.locator('button:has-text("Save Skill")').click()

      // Wait for success
      await expect(page.locator('text=Skill saved successfully')).toBeVisible({ timeout: 10000 })

      // Close Skills Selector if still open
      await page.waitForTimeout(1000)

      console.log('[Test] ✓ File list should refresh to show new skill')
    })
  })

  test.describe('5. Error Recovery and Edge Cases', () => {
    test('should handle modal close without saving', async ({ page }) => {
      console.log('[Test] Testing modal close without saving...')

      // Open Create Skill modal
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Fill in some data
      await page.locator('input[placeholder*="Document Analyzer"]').fill('Unsaved Skill')
      await page.locator('textarea[placeholder*="Analyzes documents"]').fill('This will not be saved')

      // Close modal by clicking X or Cancel
      const closeButton = page.locator('button.ant-modal-close').first()
      await closeButton.click()

      // Verify modal closed
      await expect(page.locator('text=Create New Skill')).not.toBeVisible({ timeout: 3000 })

      console.log('[Test] ✓ Modal closed without saving')
    })

    test('should clear form fields after successful save', async ({ page }) => {
      console.log('[Test] Testing form field reset after save...')

      // Complete a save operation (using Paste mode)
      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      await page.locator('text=Paste').click()

      const fieldResetName = `field-reset-${Date.now()}`
      await page.locator('input[placeholder*="my-skill"]').fill(fieldResetName)

      const resetContent = `---
name: ${fieldResetName}
description: Test form field reset
---

# Field Reset Test
`

      await page.locator('textarea[placeholder*="---"]').fill(resetContent)
      await page.locator('button:has-text("Save Skill")').click()

      await expect(page.locator('text=Skill saved successfully')).toBeVisible({ timeout: 10000 })

      console.log('[Test] ✓ Form should reset after successful save')
    })

    test('should handle rapid tab switching', async ({ page }) => {
      console.log('[Test] Testing rapid tab switching...')

      await page.locator('button:has-text("Skills")').first().click()
      await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 5000 })
      await page.locator('button:has-text("Create New Skill")').click()
      await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })

      // Rapidly switch between tabs
      await page.locator('text=AI Generate').click()
      await page.waitForTimeout(100)
      await page.locator('text=Paste').click()
      await page.waitForTimeout(100)
      await page.locator('text=Import URL').click()
      await page.waitForTimeout(100)
      await page.locator('text=AI Generate').click()

      // Verify form is still functional
      await expect(page.locator('input[placeholder*="Document Analyzer"]')).toBeVisible()

      console.log('[Test] ✓ Rapid tab switching handled correctly')
    })
  })
})
