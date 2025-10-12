/**
 * Debug Authentication Test
 *
 * Simple test to debug authentication flow and take screenshots
 */

import { test, expect } from '@playwright/test'

test('debug login flow', async ({ page }) => {
  console.log('Navigating to login page...')
  await page.goto('/login')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Take screenshot of login page
  await page.screenshot({
    path: 'test-results/debug-screenshots/01-login-page.png',
    fullPage: true
  })
  console.log('Screenshot saved: 01-login-page.png')

  // Wait for login form
  await page.waitForTimeout(2000)

  // Find email and password inputs - Ant Design forms use id pattern: formname_fieldname
  const emailInput = page.locator('#login_email')
  const passwordInput = page.locator('#login_password')

  console.log('Email input count:', await emailInput.count())
  console.log('Password input count:', await passwordInput.count())

  // Fill credentials - use type() instead of fill() for better compatibility with Ant Design
  console.log('Filling email: test@example.com')
  await emailInput.click()
  await emailInput.fill('')
  await emailInput.type('test@example.com', { delay: 50 })

  console.log('Filling password')
  await passwordInput.click()
  await passwordInput.fill('')
  await passwordInput.type('password123', { delay: 50 })

  // Take screenshot before submit
  await page.screenshot({
    path: 'test-results/debug-screenshots/02-before-submit.png',
    fullPage: true
  })
  console.log('Screenshot saved: 02-before-submit.png')

  // Find and click submit button
  const submitButton = page.locator('button[type="submit"]')
  console.log('Submit button count:', await submitButton.count())

  console.log('Clicking submit button...')

  // Listen for console messages
  page.on('console', msg => console.log('Browser console:', msg.text()))

  // Listen for requests
  page.on('request', request => {
    if (request.url().includes('api/auth') || request.url().includes('api')) {
      console.log('API request:', request.method(), request.url())
    }
  })

  // Listen for responses
  page.on('response', response => {
    if (response.url().includes('api/auth')) {
      console.log('Auth response:', response.status(), response.url())
    }
    if (response.status() === 404) {
      console.log('404 Error:', response.url())
    }
  })

  await submitButton.first().click()

  // Wait a moment for navigation or error
  await page.waitForTimeout(8000)

  // Take screenshot after submit
  await page.screenshot({
    path: 'test-results/debug-screenshots/03-after-submit.png',
    fullPage: true
  })
  console.log('Screenshot saved: 03-after-submit.png')

  // Check current URL
  const currentUrl = page.url()
  console.log('Current URL:', currentUrl)

  // Wait for network to be idle
  await page.waitForLoadState('networkidle')

  // Take final screenshot
  await page.screenshot({
    path: 'test-results/debug-screenshots/04-final-state.png',
    fullPage: true
  })
  console.log('Screenshot saved: 04-final-state.png')

  // Print page title
  const title = await page.title()
  console.log('Page title:', title)

  // Check if we're on dashboard
  const isDashboard = /\/(dashboard)?$/.test(currentUrl)
  console.log('Is on dashboard:', isDashboard)

  // If not on dashboard, check for error messages
  if (!isDashboard) {
    const errorElements = page.locator('.ant-message-error, .ant-alert-error, [role="alert"]')
    const errorCount = await errorElements.count()
    console.log('Error elements found:', errorCount)

    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent()
      console.log('Error message:', errorText)
    }
  }
})
