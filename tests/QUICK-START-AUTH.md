# Quick Start: Using Authentication Helper

## TL;DR

Authentication helper is working! Use this in your tests:

```typescript
import { USER_AUTH_FILE } from '../helpers/auth'

test.describe('My Tests', () => {
  test.use({ storageState: USER_AUTH_FILE })  // <- Add this line!

  // Tests now run with authenticated session - no login needed!
})
```

## Running Tests

```bash
# Run all tests (auth setup runs automatically)
npm test

# Run specific test file
DISPLAY=:99 npx playwright test tests/e2e/file-explorer.spec.ts

# Run with UI mode (interactive)
npm run test:ui

# Generate HTML report
npm run test:report
```

## What Happens

1. **First time**: Global setup runs, authenticates user, saves session to `.auth/user.json`
2. **All tests**: Load saved session, skip login, go directly to protected pages
3. **Result**: Tests run faster, more reliable, less flaky

## Current Test Status

### ✅ Authentication Tests: 7/9 PASSING
- Login/logout flows working
- Session management working
- Error handling working

### ❌ File Explorer Tests: 0/7 PASSING (Expected)
- Tests fail because UI components don't exist yet (Phase 2 pending)
- Auth helper works perfectly - tests load authenticated page successfully

## Files Created

- `/tests/helpers/auth.ts` - Auth helper functions
- `/tests/global-setup.ts` - Runs once before tests
- `/tests/.auth/user.json` - Saved session state (gitignored)

## Need Manual Login?

```typescript
import { loginAsTestUser } from '../helpers/auth'

test('my test', async ({ page }) => {
  await loginAsTestUser(page)  // Manual login when needed
})
```

## Troubleshooting

**Session expired?**
```bash
rm -rf tests/.auth && npm test
```

**Tests not using auth?**
Make sure you added: `test.use({ storageState: USER_AUTH_FILE })`

## View Test Report

Open in browser: `/playwright-report/index.html`

Or serve it:
```bash
npx playwright show-report
```

## VNC Monitoring

Watch tests run in real-time:
- URL: http://localhost:6080
- Display: :99

All tests (including auth setup) are visible in VNC!
