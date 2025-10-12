# Quick Start Guide - MI AI Coding Platform

Get up and running in 5 minutes with this streamlined setup guide. For comprehensive documentation, see [INSTALL.md](./architecture/INSTALL.md).

---

## Prerequisites

Quick checklist before you begin:

- **Node.js 18+** (20+ recommended) - `node --version`
- **PostgreSQL 14+** installed and running - `psql --version`
- **Git** for version control
- **Ubuntu/Linux** for VNC features (optional on other platforms)

---

## 5-Minute Setup

Copy and paste these commands to get started:

```bash
# 1. Clone and navigate
git clone https://github.com/yourusername/mi-ai-coding.git
cd mi-ai-coding

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with:
- **Email**: admin@example.com
- **Password**: admin123

---

## Essential Commands

### Development
```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm start                # Run production server
```

### Database
```bash
npm run db:generate      # Generate Prisma client (after schema changes)
npm run db:push          # Push schema to database (dev/prototyping)
npm run db:migrate       # Run migrations (production)
npm run db:studio        # Open visual database browser
```

### Testing
```bash
npm test                 # Run all E2E tests on DISPLAY=:99
npm run test:ui          # Interactive test UI mode
npm run test:headed      # Run tests with visible browser
```

### VNC (Optional)
```bash
./scripts/start-vnc.sh   # Start VNC servers on :98 and :99
./scripts/check-vnc-status.sh  # Check VNC server status
```

---

## Common Tasks

### Create a New Component

```bash
# 1. Create component file
touch components/my-feature/MyComponent.tsx

# 2. Use this template:
```

```typescript
'use client'

import React from 'react'

export default function MyComponent() {
  return (
    <div>
      <h1>My Component</h1>
    </div>
  )
}
```

```bash
# 3. Import in your page:
import MyComponent from '@/components/my-feature/MyComponent'
```

### Add an API Route

```bash
# 1. Create route file
mkdir -p app/api/my-endpoint
touch app/api/my-endpoint/route.ts

# 2. Use this template:
```

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.yourModel.findMany()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await prisma.yourModel.create({ data: body })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
```

### Test a Feature

```bash
# Create test file in tests/e2e/
touch tests/e2e/my-feature.spec.ts

# Use this template:
```

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })
})
```

```bash
# Run your test
DISPLAY=:99 npx playwright test tests/e2e/my-feature.spec.ts
```

### Update Database Schema

```bash
# 1. Edit prisma/schema.prisma
# Add your new model or field

# 2. Generate Prisma client
npm run db:generate

# 3. Push to database (dev)
npm run db:push

# OR create migration (production)
npx prisma migrate dev --name add_my_feature
```

---

## Quick Troubleshooting

### Issue: Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
npm run dev                     # Restart server
```

### Issue: Database connection failed
```bash
sudo systemctl status postgresql  # Check PostgreSQL is running
sudo systemctl start postgresql   # Start if stopped
psql -h localhost -U youruser -d mi_ai_coding  # Test connection
```

### Issue: Prisma client out of sync
```bash
rm -rf node_modules package-lock.json  # Clean install
npm install
npx prisma generate                     # Regenerate client
```

### Issue: Build fails with errors
```bash
npm run lint          # Check for linting errors
npx tsc --noEmit     # Check TypeScript errors
npm run db:generate  # Ensure Prisma client is current
npm run build        # Retry build
```

### Issue: VNC not connecting
```bash
ps aux | grep vnc                    # Check VNC servers running
./scripts/start-vnc.sh              # Restart VNC servers
netstat -tulpn | grep -E '6080|6081' # Verify ports listening
```

---

## Environment Variables

Minimum required in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mi_ai_coding?schema=public"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-key-here"

# VNC (optional)
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"

# App
APP_PORT=3000
WS_PORT=3001
NODE_ENV="development"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Project Structure

```
mi-ai-coding/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login)
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── layout/           # AppShell, Header, Sidebar
│   ├── file-explorer/    # File tree component
│   ├── code-editor/      # Monaco editor
│   ├── vnc/              # VNC viewers
│   └── activity-log/     # Activity stream
├── prisma/               # Database schema
│   └── schema.prisma
├── lib/                  # Utilities
│   ├── prisma.ts        # Database client
│   └── auth.ts          # Auth helpers
├── tests/               # E2E tests
│   └── e2e/
└── scripts/            # Deployment scripts
```

---

## Next Steps

### Learn More
- [Complete Installation Guide](./architecture/INSTALL.md) - Comprehensive setup instructions
- [Architecture Documentation](../PROJECT.md) - System design and technical details
- [API Documentation](../PROJECT.md#api-endpoints) - Complete API reference
- [Agent System Guide](../agents/README.md) - Multi-agent coordination

### Development Workflow
- Read [PROGRESS.md](../PROGRESS.md) for current project status
- Check [CLAUDE.md](../CLAUDE.md) for Claude Code guidance
- Review [START-PROJECT-PROMPT.md](./architecture/START-PROJECT-PROMPT.md) for phase instructions

### Testing
- [E2E Test Reports](./reports/) - Comprehensive test results
- [Manual Test Guide](./reports/MANUAL-TEST-GUIDE.md) - Manual testing procedures
- [Quick Test Checklist](./reports/QUICK-TEST-CHECKLIST.md) - Fast verification

### Deployment
- [VNC Setup Guide](./VNC-SETUP.md) - Dual display configuration
- [Auth Setup Guide](./AUTH_SETUP.md) - Authentication system
- Production deployment: Run `./scripts/deploy.sh`

---

## Default Test Accounts

After running `npx prisma db push`, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| user@example.com | user123 | user |

**Note**: Change these credentials in production!

---

## Key Technologies

- **Next.js 15.5** with App Router
- **React 19.2** with TypeScript 5.9
- **Ant Design 5.27** for UI components
- **Prisma 6.16** ORM with PostgreSQL
- **Refine 5.0** admin framework
- **Monaco Editor** for code editing
- **Playwright** for E2E testing
- **VNC + noVNC** for remote displays

---

## Getting Help

### Documentation
- Check [PROJECT.md](../PROJECT.md) for architecture details
- Review [docs/reports/](./reports/) for debugging examples
- Read agent docs in [agents/](../agents/) directory

### Common Issues
- See [PROGRESS.md](../PROGRESS.md) "Resolved Issues" section
- Check test reports in [docs/reports/](./reports/)
- Review [CLAUDE.md](../CLAUDE.md) "Common Pitfalls" section

### Support
- Open an issue on [GitHub](https://github.com/yourusername/mi-ai-coding/issues)
- Review existing [bug fix reports](./reports/)

---

**Last Updated**: 2025-10-12
**Documentation Agent**: Claude Code
**Version**: 1.0.0

For detailed information, see the complete [Installation Guide](./architecture/INSTALL.md).
