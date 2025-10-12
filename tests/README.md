# E2E Testing Documentation

## Overview
This directory contains End-to-End (E2E) tests for the MI AI Coding Platform using Playwright. All tests are configured to run on `DISPLAY=:99` for VNC visibility.

## Directory Structure
```
tests/
├── e2e/                    # E2E test specs
│   ├── auth.spec.ts       # Authentication tests
│   └── file-explorer.spec.ts  # File management tests
├── fixtures/              # Test fixtures and helpers
│   ├── helpers.ts        # Common test utilities
│   └── test-users.ts     # Test user data
└── screenshots/          # Test screenshots (auto-generated)
```

## Prerequisites

1. **VNC Servers Running**
   - Display :98 (Terminal VNC) on port 6081
   - Display :99 (Playwright VNC) on port 6080
   ```bash
   ./scripts/start-vnc.sh
   ```

2. **Application Running**
   ```bash
   npm run dev  # Runs on http://localhost:3000
   ```

3. **Database Seeded**
   ```bash
   npm run db:seed
   ```

## Running Tests

### Using npm scripts (Recommended)
```bash
# Run all tests (DISPLAY=:99 pre-configured)
npm test

# Run tests in UI mode (interactive debugging)
npm run test:ui

# Run tests with visible browser
npm run test:headed

# Show test report
npm run test:report

# Run tests with VNC auto-check
npm run test:vnc
```

### Using Playwright CLI directly
```bash
# ⚠️ CRITICAL: Always include DISPLAY=:99
export DISPLAY=:99

# Run all tests
DISPLAY=:99 npx playwright test

# Run specific test file
DISPLAY=:99 npx playwright test tests/e2e/auth.spec.ts

# Run specific test by name
DISPLAY=:99 npx playwright test -g "should login successfully"

# Run tests in specific browser
DISPLAY=:99 npx playwright test --project=chromium

# Run in debug mode
DISPLAY=:99 npx playwright test --debug

# Show trace viewer for failed tests
npx playwright show-trace trace.zip
```

## Viewing Tests in VNC

1. Open VNC viewer in browser: `http://localhost:6080`
2. Run tests with DISPLAY=:99
3. Watch browser automation in real-time
4. Debug failures visually

## Test Configuration

See `playwright.config.ts` in the root directory for:
- Base URL configuration
- Browser settings (Chromium, Firefox, Mobile)
- Screenshot and video capture settings
- Timeout configurations
- DISPLAY=:99 environment variables

## Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
  })

  test('should do something', async ({ page }) => {
    // Test implementation
  })
})
```

### Using Helpers
```typescript
import { loginAsTestUser, createFile, takeScreenshot } from '../fixtures/helpers'

test('example test', async ({ page }) => {
  await loginAsTestUser(page)
  await createFile(page, 'test.txt', 'content')
  await takeScreenshot(page, 'test-completed')
})
```

### Best Practices
1. Use meaningful test descriptions
2. Test user workflows, not implementation details
3. Keep tests independent and isolated
4. Use data-testid attributes for reliable selectors
5. Take screenshots on failures for debugging
6. Use `test.skip()` for unimplemented features
7. Clean up test data after tests
8. Use fixtures for common setup

## Test Coverage

### Current Tests
- **Authentication**: Login, logout, session management, validation
- **File Explorer**: File CRUD operations, responsive design
- **Responsive Design**: Desktop, tablet, mobile viewports

### Planned Tests
- Code editor functionality
- VNC clipboard integration
- Activity log updates
- Real-time WebSocket communication
- Panel resizing and persistence

## Debugging Failed Tests

### View Screenshots
```bash
ls tests/screenshots/
# Screenshots are auto-generated with timestamps
```

### View Video Recordings
```bash
ls test-results/
# Videos saved for failed tests
```

### View HTML Report
```bash
npm run test:report
# Opens interactive HTML report
```

### Debug Specific Test
```bash
DISPLAY=:99 npx playwright test --debug tests/e2e/auth.spec.ts
```

### View Trace
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

## Continuous Integration

For CI/CD pipelines:
```bash
# Set CI environment variable
export CI=true

# Run tests (will use CI-specific settings)
DISPLAY=:99 npx playwright test

# Generate report
npx playwright show-report
```

## Common Issues

### Tests not visible in VNC
- Ensure DISPLAY=:99 is set
- Check VNC server is running: `ps aux | grep vnc`
- Verify port 6080 is accessible

### Tests timing out
- Increase timeout in playwright.config.ts
- Check application is running on port 3000
- Verify database connection

### Browser not found
```bash
npx playwright install chromium
npx playwright install-deps
```

### Permission errors
```bash
# Fix ownership if needed
sudo chown -R $USER:$USER /home/master/projects/mi-ai-coding
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generators](https://playwright.dev/docs/codegen)
- [Debugging Guide](https://playwright.dev/docs/debug)
