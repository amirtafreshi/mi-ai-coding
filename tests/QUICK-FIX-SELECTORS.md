# Quick Fix: Update Test Selectors for Ant Design

## Problem
Tests are failing because they look for `input[name="email"]` but Ant Design Form generates `input[id="email"]`.

## Solution
Update all input selectors in `tests/e2e/auth.spec.ts` to use ID selectors instead.

## Changes Required

### File: `/home/master/projects/mi-ai-coding/tests/e2e/auth.spec.ts`

#### Change 1: Line 31-32 (Display login page test)
```typescript
// BEFORE:
const emailInput = page.locator('input[name="email"], input[type="email"]')

// AFTER:
const emailInput = page.locator('#email')
```

#### Change 2: Line 35 (Display login page test)
```typescript
// BEFORE:
const passwordInput = page.locator('input[name="password"], input[type="password"]')

// AFTER:
const passwordInput = page.locator('#password')
```

#### Change 3: Line 50-51 (Login successfully test)
```typescript
// BEFORE:
await page.fill('input[name="email"], input[type="email"]', testUsers.user.email)
await page.fill('input[name="password"], input[type="password"]', testUsers.user.password)

// AFTER:
await page.fill('#email', testUsers.user.email)
await page.fill('#password', testUsers.user.password)
```

#### Change 4: Line 73-74 (Invalid credentials test)
```typescript
// BEFORE:
await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com')
await page.fill('input[name="password"], input[type="password"]', 'wrongpassword')

// AFTER:
await page.fill('#email', 'invalid@example.com')
await page.fill('#password', 'wrongpassword')
```

#### Change 5: Line 120-121 (Logout test)
```typescript
// BEFORE:
await page.fill('input[name="email"], input[type="email"]', testUsers.user.email)
await page.fill('input[name="password"], input[type="password"]', testUsers.user.password)

// AFTER:
await page.fill('#email', testUsers.user.email)
await page.fill('#password', testUsers.user.password)
```

#### Change 6: Line 167-168 (Session management test)
```typescript
// BEFORE:
await page.fill('input[name="email"], input[type="email"]', testUsers.user.email)
await page.fill('input[name="password"], input[type="password"]', testUsers.user.password)

// AFTER:
await page.fill('#email', testUsers.user.email)
await page.fill('#password', testUsers.user.password)
```

#### Change 7: Line 199-200 (Security test)
```typescript
// BEFORE:
await page.fill('input[name="email"], input[type="email"]', testUsers.user.email)
await page.fill('input[name="password"], input[type="password"]', testUsers.user.password)

// AFTER:
await page.fill('#email', testUsers.user.email)
await page.fill('#password', testUsers.user.password)
```

### File: `/home/master/projects/mi-ai-coding/tests/e2e/file-explorer.spec.ts`

#### Change 8: Line 29-30 (File explorer beforeEach)
```typescript
// BEFORE:
await page.fill('input[name="email"], input[type="email"]', testUser.email)
await page.fill('input[name="password"], input[type="password"]', testUser.password)

// AFTER:
await page.fill('#email', testUser.email)
await page.fill('#password', testUser.password)
```

## Quick Apply Script

Run this to apply all changes automatically:

```bash
cd /home/master/projects/mi-ai-coding

# Backup original file
cp tests/e2e/auth.spec.ts tests/e2e/auth.spec.ts.backup
cp tests/e2e/file-explorer.spec.ts tests/e2e/file-explorer.spec.ts.backup

# Apply fixes using sed
sed -i "s/input\[name=\"email\"\], input\[type=\"email\"\]/#email/g" tests/e2e/auth.spec.ts
sed -i "s/input\[name=\"password\"\], input\[type=\"password\"\]/#password/g" tests/e2e/auth.spec.ts
sed -i "s/input\[name=\"email\"\], input\[type=\"email\"\]/#email/g" tests/e2e/file-explorer.spec.ts
sed -i "s/input\[name=\"password\"\], input\[type=\"password\"\]/#password/g" tests/e2e/file-explorer.spec.ts

# Re-run tests
DISPLAY=:99 npx playwright test --project=chromium
```

## Expected Results After Fix

### Should Pass:
- ✅ should display login page
- ✅ should login successfully with valid credentials
- ✅ should show error with invalid credentials
- ✅ should show validation errors for empty fields
- ✅ should logout successfully
- ✅ should redirect to login when accessing protected route
- ✅ should maintain session after page reload
- ✅ should not expose password in network requests

### Will Still Fail (Expected):
- ❌ File explorer tests (dashboard not implemented yet)
- ❌ Responsive tests (need to update header selector)

## Verify Fix Works

```bash
# Test just the login functionality
DISPLAY=:99 npx playwright test tests/e2e/auth.spec.ts -g "should login successfully"

# If it passes, you should see:
# ✓ should login successfully with valid credentials (3-5s)
```

## Time Required
- 5 minutes to apply changes
- 2 minutes to run tests
- Total: 7 minutes

## Next Steps After Fix
1. Verify all auth tests pass
2. Update responsive test selectors (look for page title instead of header)
3. Wait for dashboard API implementation before testing file features
