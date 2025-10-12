import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for MI AI Coding Platform
 *
 * ⚠️ CRITICAL: All tests run on DISPLAY=:99 for VNC visibility
 * Access VNC viewer at http://localhost:6080 to monitor tests in real-time
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Global setup runs once before all tests
  // globalSetup: require.resolve('./tests/global-setup.ts'), // Temporarily disabled for diagnostics

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.APP_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // ⚠️ CRITICAL: Run in headed mode on DISPLAY=:99 for VNC visibility
    headless: false,

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // ⚠️ Ensure browser is visible on DISPLAY=:99
        launchOptions: {
          env: {
            DISPLAY: ':99'
          }
        }
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          env: {
            DISPLAY: ':99'
          }
        }
      },
    },

    // Mobile viewports (also visible on DISPLAY=:99)
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          env: {
            DISPLAY: ':99'
          }
        }
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        launchOptions: {
          env: {
            DISPLAY: ':99'
          }
        }
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120000,
    env: {
      // Ensure dev server uses correct ports
      APP_PORT: '3000',
      PLAYWRIGHT_VNC_PORT: '6080',
      VNC_DISPLAY_99: ':99'
    }
  },
});
