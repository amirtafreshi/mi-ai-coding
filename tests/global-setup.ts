/**
 * Playwright Global Setup
 *
 * Runs once before all tests to setup authentication state
 * This creates reusable authentication sessions that tests can use
 */

import { chromium, FullConfig } from '@playwright/test'
import { setupUserAuth, AUTH_STATE_DIR } from './helpers/auth'
import { mkdir } from 'fs/promises'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...')

  // Create .auth directory if it doesn't exist
  try {
    await mkdir(AUTH_STATE_DIR, { recursive: true })
    console.log(`✓ Created auth directory: ${AUTH_STATE_DIR}`)
  } catch (error) {
    // Directory might already exist
    console.log(`✓ Auth directory exists: ${AUTH_STATE_DIR}`)
  }

  // Get base URL from config
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  console.log(`📍 Using baseURL: ${baseURL}`)

  // Launch browser on DISPLAY=:99 for VNC visibility
  const browser = await chromium.launch({
    headless: false,
    env: {
      DISPLAY: ':99'
    }
  })

  try {
    // Create a new page
    const page = await browser.newPage({
      baseURL
    })

    console.log('🔐 Setting up authentication for test user...')

    // Setup authentication for default test user
    await setupUserAuth(page)

    console.log('✅ Global setup complete!')

    // Close page and browser
    await page.close()
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
