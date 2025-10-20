import { test, expect } from '@playwright/test'

/**
 * Quick Skills Management Test
 * Tests basic functionality to verify the system is working
 *
 * ⚠️ Runs on DISPLAY=:99 for VNC visibility
 */

test.describe('Skills Management - Quick Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000')

    const loginVisible = await page.locator('text=Sign in to access your workspace').isVisible().catch(() => false)

    if (loginVisible) {
      console.log('[Test] Logging in...')
      await page.locator('input[placeholder*="email"]').fill('admin@example.com')
      await page.locator('input[placeholder*="password"]').fill('admin123')
      await page.locator('button:has-text("Sign In")').click()
      await page.waitForTimeout(3000)
    }
  })

  test('should open Skills selector and Create Skill modal', async ({ page }) => {
    console.log('[Test] Looking for Skills button...')

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/skills-initial.png', fullPage: true })

    // Look for Skills button in the quick access area
    const skillsButton = page.locator('button').filter({ hasText: 'Skills' }).first()

    console.log('[Test] Waiting for Skills button...')
    await expect(skillsButton).toBeVisible({ timeout: 15000 })

    console.log('[Test] Clicking Skills button...')
    await skillsButton.click()

    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/skills-after-click.png', fullPage: true })

    // Wait for Skills Selector modal
    console.log('[Test] Waiting for Skills Selector modal...')
    await expect(page.locator('text=Skills Selector')).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'test-results/skills-selector-modal.png', fullPage: true })

    // Click Create New Skill button
    console.log('[Test] Looking for Create New Skill button...')
    const createButton = page.locator('button:has-text("Create New Skill")')
    await expect(createButton).toBeVisible({ timeout: 5000 })

    console.log('[Test] Clicking Create New Skill...')
    await createButton.click()

    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/skills-create-modal.png', fullPage: true })

    // Verify Create Skill modal opened
    await expect(page.locator('text=Create New Skill')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=AI Generate')).toBeVisible()
    await expect(page.locator('text=Paste')).toBeVisible()
    await expect(page.locator('text=Import URL')).toBeVisible()

    console.log('[Test] ✓ All modals opened successfully!')
  })

  test('should fill AI Generate form', async ({ page }) => {
    console.log('[Test] Opening Create Skill modal...')

    // Open Skills selector
    const skillsButton = page.locator('button').filter({ hasText: 'Skills' }).first()
    await skillsButton.click()
    await page.waitForTimeout(1000)

    // Open Create modal
    await page.locator('button:has-text("Create New Skill")').click()
    await page.waitForTimeout(1000)

    // Ensure AI Generate tab is active
    await page.locator('text=AI Generate').click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'test-results/skills-ai-form.png', fullPage: true })

    // Fill form
    console.log('[Test] Filling form...')
    const nameInput = page.locator('input[placeholder*="Document Analyzer"]')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Test Skill Quick')

    const descInput = page.locator('textarea[placeholder*="Analyzes documents"]')
    await expect(descInput).toBeVisible()
    await descInput.fill('This is a quick test skill to verify the form works correctly.')

    await page.screenshot({ path: 'test-results/skills-ai-form-filled.png', fullPage: true })

    // Verify Generate button is visible
    const generateButton = page.locator('button:has-text("Generate Skill with AI")')
    await expect(generateButton).toBeVisible()
    await expect(generateButton).toBeEnabled()

    console.log('[Test] ✓ AI Generate form filled successfully!')
  })

  test('should switch between tabs', async ({ page }) => {
    console.log('[Test] Testing tab switching...')

    // Open Create Skill modal
    const skillsButton = page.locator('button').filter({ hasText: 'Skills' }).first()
    await skillsButton.click()
    await page.waitForTimeout(1000)

    await page.locator('button:has-text("Create New Skill")').click()
    await page.waitForTimeout(1000)

    // Test AI Generate tab
    await page.locator('text=AI Generate').click()
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("Generate Skill with AI")')).toBeVisible()
    await page.screenshot({ path: 'test-results/skills-tab-ai.png', fullPage: true })

    // Test Paste tab
    await page.locator('text=Paste').click()
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("Save Skill")')).toBeVisible()
    await page.screenshot({ path: 'test-results/skills-tab-paste.png', fullPage: true })

    // Test Import URL tab
    await page.locator('text=Import URL').click()
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("Import Skill")')).toBeVisible()
    await page.screenshot({ path: 'test-results/skills-tab-import.png', fullPage: true })

    console.log('[Test] ✓ All tabs working correctly!')
  })

  test('should test Paste mode with valid YAML', async ({ page }) => {
    console.log('[Test] Testing Paste mode...')

    // Open Create Skill modal
    const skillsButton = page.locator('button').filter({ hasText: 'Skills' }).first()
    await skillsButton.click()
    await page.waitForTimeout(1000)

    await page.locator('button:has-text("Create New Skill")').click()
    await page.waitForTimeout(1000)

    // Switch to Paste tab
    await page.locator('text=Paste').click()
    await page.waitForTimeout(500)

    // Fill form
    const skillName = `quick-test-${Date.now()}`
    await page.locator('input[placeholder*="my-skill"]').fill(skillName)

    const validYaml = `---
name: ${skillName}
description: Quick test skill created via paste mode
---

# Quick Test Skill

## Overview
This is a test skill.

## Instructions
1. Step one
2. Step two

## When to Use
Use when testing.
`

    await page.locator('textarea[placeholder*="---"]').fill(validYaml)

    await page.screenshot({ path: 'test-results/skills-paste-filled.png', fullPage: true })

    // Click Save
    console.log('[Test] Saving skill...')
    await page.locator('button:has-text("Save Skill")').click()

    // Wait for response
    await page.waitForTimeout(3000)

    await page.screenshot({ path: 'test-results/skills-paste-after-save.png', fullPage: true })

    // Check for success or error message
    const successMsg = page.locator('.ant-message-success')
    const errorMsg = page.locator('.ant-message-error')

    const isSuccess = await successMsg.isVisible().catch(() => false)
    const isError = await errorMsg.isVisible().catch(() => false)

    if (isSuccess) {
      console.log('[Test] ✓ Skill saved successfully!')
    } else if (isError) {
      console.log('[Test] ✗ Error occurred during save')
      throw new Error('Save failed with error message')
    } else {
      console.log('[Test] ⚠ No success or error message visible')
    }
  })
})
