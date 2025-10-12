# DISPLAY=:99 Enforcement Guide

## Overview
All Playwright and Puppeteer browser automation MUST run on DISPLAY=:99 to enable real-time VNC monitoring at http://localhost:6080 (or http://your-server-ip:6080).

## Why DISPLAY=:99?
- **VNC Display :98** (port 6081): Terminal access - xterm, bash, vim
- **VNC Display :99** (port 6080): Playwright/Browser automation - Chromium, Firefox, tests
- Real-time visual monitoring of E2E tests and browser automation
- Debug test failures by watching them execute live
- Verify UI interactions visually during development

## How to Ensure DISPLAY=:99

### Method 1: Use npm scripts (Recommended)
All test scripts in package.json automatically include DISPLAY=:99:

```bash
npm test                # Run all tests
npm run test:ui         # Interactive UI mode
npm run test:headed     # Headed browser mode
npm run test:report     # Show test report
npm run test:vnc        # Run with VNC auto-check
```

### Method 2: Use the VNC test script
```bash
./scripts/test-vnc.sh              # Auto-starts VNC if needed
./scripts/test-vnc.sh --ui         # UI mode
./scripts/test-vnc.sh file.spec.ts # Specific test
```

### Method 3: Manual DISPLAY=:99 prefix
```bash
DISPLAY=:99 npx playwright test
DISPLAY=:99 npx playwright test --ui
DISPLAY=:99 npx playwright test tests/e2e/login.spec.ts
```

## Playwright Configuration
The `playwright.config.ts` enforces DISPLAY=:99 in launch options:

```typescript
launchOptions: {
  env: {
    DISPLAY: ':99'
  }
}
```

And runs in headed mode by default:
```typescript
use: {
  headless: false,  // Always show browser on VNC
}
```

## Agent Instructions
All agents with browser automation capabilities have been updated:

### frontend-testing.md
- Critical warning section about DISPLAY=:99 requirement
- All command examples include DISPLAY=:99
- VNC access instructions included

### full-stack-developer.md
- Updated to use DISPLAY=:99 for UI testing
- Playwright workflow includes display enforcement

### orchestrating.md
- Awareness of DISPLAY=:99 requirement
- Can verify agents are using correct display

## Verification Checklist
Before running tests:
- [ ] VNC server running on :99 (check with `ps aux | grep vnc`)
- [ ] VNC port 6080 accessible (check with `netstat -tulpn | grep 6080`)
- [ ] DISPLAY=:99 set in command or npm script
- [ ] Browser visible at http://localhost:6080

## Common Issues

### Issue: Tests run but not visible in VNC
**Cause**: DISPLAY not set to :99  
**Fix**: Add `DISPLAY=:99` prefix or use npm scripts

### Issue: VNC shows blank screen
**Cause**: VNC server not running  
**Fix**: Run `./scripts/start-vnc.sh`

### Issue: Cannot connect to VNC viewer
**Cause**: Port 6080 not accessible  
**Fix**: Check firewall, verify VNC running with `netstat -tulpn | grep 6080`

## MCP Server Integration
When using mcp__playwright MCP server:
- Ensure DISPLAY=:99 is set in environment before invoking
- All browser automation through MCP should reference DISPLAY=:99
- MCP server respects environment variables

## Files Updated
1. `.claude/agents/frontend-testing.md` - Critical DISPLAY=:99 section added
2. `.claude/agents/full-stack-developer.md` - Updated workflow with DISPLAY=:99
3. `.claude/agents/orchestrating.md` - Added DISPLAY=:99 awareness
4. `playwright.config.ts` - Created with DISPLAY=:99 enforcement
5. `package.json` - Added test scripts with DISPLAY=:99
6. `scripts/test-vnc.sh` - Created VNC auto-check test runner
7. `CLAUDE.md` - Updated testing section with DISPLAY=:99 requirements

## Quick Reference

| Command | Display | Visible in VNC? |
|---------|---------|-----------------|
| `npm test` | :99 | ✅ Yes |
| `npm run test:ui` | :99 | ✅ Yes |
| `DISPLAY=:99 npx playwright test` | :99 | ✅ Yes |
| `npx playwright test` | default | ❌ No (DON'T USE) |
| `./scripts/test-vnc.sh` | :99 | ✅ Yes |

## Remember
🚨 **NEVER run Playwright/Puppeteer without DISPLAY=:99** 🚨

Without DISPLAY=:99, tests may run but won't be visible for monitoring and debugging, defeating the purpose of the VNC integration.
