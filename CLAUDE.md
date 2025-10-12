# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Links

- **[INSTALL.md](INSTALL.md)** - Complete installation and deployment guide
- **[README.md](README.md)** - User-facing overview and quick start
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to this project
- **[docs/](docs/)** - Comprehensive technical documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[PROGRESS.md](PROGRESS.md)** - Current project status and task tracking

## Project Overview

MI AI Coding Platform is a production-ready, mobile-responsive AI Coding Platform built with Next.js 15 (App Router), Refine framework, Ant Design, Prisma ORM, and VNC integration. The platform provides dual VNC displays for visual debugging, file management, code editing, and real-time agent activity logging.

**Current Status**: Phase 4 Near Complete (85%) - Check PROGRESS.md for latest status

**New Developer?** Start with [INSTALL.md](INSTALL.md) for setup, then read [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server on port 3000
npm run build            # Build production bundle (runs prisma generate first)
npm start                # Start production server on port 3000
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run db:generate      # Generate Prisma client (required after schema changes)
npm run db:push          # Push schema to database (dev/prototyping)
npm run db:migrate       # Run migrations (production)
npm run db:studio        # Open Prisma Studio GUI (visual DB browser)
npm run db:seed          # Seed database
```

### Testing
```bash
# ⚠️ CRITICAL: ALL Playwright/Puppeteer tests MUST run on DISPLAY=:99
# This makes browser automation visible in VNC viewer at http://localhost:6080

# Recommended: Use npm scripts (DISPLAY=:99 is pre-configured)
npm test                # Run all tests on DISPLAY=:99
npm run test:ui         # Interactive UI mode on DISPLAY=:99
npm run test:headed     # Run with visible browser on DISPLAY=:99
npm run test:report     # Show test report on DISPLAY=:99
npm run test:vnc        # Run tests with VNC auto-check

# Alternative: Direct Playwright commands (MUST include DISPLAY=:99)
DISPLAY=:99 npx playwright test
DISPLAY=:99 npx playwright test --ui
DISPLAY=:99 npx playwright test tests/e2e/file-explorer.spec.ts

# NEVER run Playwright without DISPLAY=:99 - tests won't be visible for monitoring
```

### VNC Management
```bash
./scripts/start-vnc.sh   # Start VNC servers on displays :98 and :99
ps aux | grep vnc        # Check VNC server status
netstat -tulpn | grep -E '6080|6081'  # Check VNC ports
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.5.4 (App Router), React 19.2, TypeScript 5.9, Ant Design 5.27.4, Tailwind CSS 4.1.14, Refine 5.0.4
- **Backend**: Next.js API Routes, Prisma 6.16.3 ORM, PostgreSQL 14+, NextAuth 4.24.11, WebSocket (ws 8.18.3), Zod 4.1.11
- **Infrastructure**: Dual VNC displays (:98 Terminal, :99 Playwright), noVNC HTML5 client, react-resizable-panels 3.0.6

### VNC Configuration
- **Display :98** - Terminal access (port 6081): xterm, bash, vim
- **Display :99** - Playwright visual testing (port 6080): Chromium, E2E tests ⚠️ REQUIRED for all browser automation
- **Clipboard Tools**: xclip (copy), xdotool (paste/type)

### ⚠️ CRITICAL Requirement: DISPLAY=:99 for Browser Automation
**ALL Playwright and Puppeteer commands MUST include `DISPLAY=:99`**
- This ensures browser automation is visible in the VNC viewer on port 6080
- Allows real-time monitoring and debugging of E2E tests
- Without DISPLAY=:99, browsers run headless and cannot be monitored
- VNC Access: `http://localhost:6080` or `http://your-server-ip:6080`

### Directory Structure
```
app/                    # Next.js App Router
  ├── (auth)/          # Auth pages (login)
  ├── (dashboard)/     # Main app pages
  ├── api/             # API routes (currently empty, to be implemented)
  ├── layout.tsx       # Root layout with providers
  └── page.tsx         # Landing page

components/            # React components (to be implemented)
  ├── layout/          # AppShell, Header, Sidebar
  ├── vnc/             # VNCViewer, TerminalVNC, PlaywrightVNC
  ├── file-explorer/   # FileTree, FileActions
  ├── code-editor/     # MonacoEditor
  └── activity-log/    # ActivityStream (WebSocket)

lib/                   # Utilities (to be implemented)
  ├── prisma.ts        # Prisma client singleton
  └── auth.ts          # Auth utilities

providers/             # React context providers (to be implemented)
  └── refine-provider.tsx

prisma/
  └── schema.prisma    # Database models (User, Session, File, Folder, ActivityLog, VNCConfig)

agents/                # Agent documentation (7 agents: full-stack-developer, frontend-testing, debugging, documentation, github-manager, ubuntu-system-admin, orchestrating)
scripts/               # setup.sh (5KB), start-vnc.sh (3.3KB), deploy.sh (5.4KB)
resources/             # Static resources
services/              # Service layer (to be implemented)
```

## Database Schema

### Core Models
- **User**: Authentication (email, password, role)
- **Session**: Auth tokens with expiration
- **File**: File storage (path unique, content as text, mimeType)
- **Folder**: Directory structure (path unique, parentId)
- **ActivityLog**: Agent action tracking (agent, action, details, level)
- **VNCConfig**: VNC server config (display unique, port, resolution, isActive)

### Important Notes
- Always run `npx prisma generate` after schema changes
- Use `npx prisma db push` for development/prototyping
- Use `npx prisma migrate dev` for production migrations
- File paths are unique identifiers in the database

## Multi-Agent System

This project uses 7 coordinated AI agents:

1. **Orchestrating** (`agents/orchestrating/`) - Coordinates all agents and assigns tasks
2. **Full-Stack Developer** (`agents/full-stack-developer/`) - Implements features end-to-end
3. **Frontend Testing** (`agents/frontend-testing/`) - Runs E2E tests with Playwright on DISPLAY :99
4. **Debugging** (`agents/debugging/`) - Investigates and fixes errors
5. **Documentation** (`agents/documentation/`) - Maintains docs and PROGRESS.md
6. **GitHub Manager** (`agents/github-manager/`) - Manages commits, PRs, releases
7. **Ubuntu System Admin** (`agents/ubuntu-system-admin/`) - Server config, UFW, Nginx, SSL, security

### Agent Communication
- All agents log to ActivityLog database (Prisma model)
- Updates broadcast via WebSocket to real-time UI
- PROGRESS.md tracks overall project status
- Agents reference START-PROJECT-PROMPT.md for master instructions

## Development Workflow

### Starting Development
1. Check `PROGRESS.md` for current status and next tasks
2. Read `START-PROJECT-PROMPT.md` for phase instructions
3. Review `PROJECT.md` for architecture details
4. Start dev server: `npm run dev`

### Making Changes
1. Read relevant agent documentation in `agents/` directory
2. Update code following Next.js 15 App Router patterns
3. Use Prisma for all database operations
4. Test changes (E2E tests on DISPLAY :99 for visual verification)
5. Update `PROGRESS.md` after completing tasks
6. Log important actions to ActivityLog for real-time tracking

### API Routes Pattern
All API routes in `app/api/` follow Next.js 15 App Router route handlers:
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Implementation
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Implementation
  return NextResponse.json({ success: true })
}
```

**Important**:
- Use `@/` path alias for imports (configured in tsconfig.json)
- Always import Prisma client from `@/lib/prisma` for singleton pattern
- API routes are currently empty and need to be implemented per PROJECT.md specs

### Component Patterns
- Use Ant Design components for UI (already configured with Refine)
- Server Components by default in App Router
- Use 'use client' for interactive components (Monaco, VNC, WebSocket)
- Resizable panels use react-resizable-panels with localStorage persistence

## Key Integration Points

### VNC Clipboard Integration
- **Copy from VNC**: POST `/api/vnc/copy` → executes `xclip -o -selection clipboard -display :XX` → returns text → browser clipboard
- **Paste to VNC**: POST `/api/vnc/paste` → receives text → executes `echo "text" | xclip -selection clipboard -display :XX` and `xdotool type`

### Activity Logging
Components/agents log activity:
```typescript
await prisma.activityLog.create({
  data: {
    agent: 'full-stack-developer',
    action: 'create_component',
    details: 'Created FileTree component',
    level: 'info' // info | warning | error
  }
})
// WebSocket broadcasts to all connected clients automatically
```

### File Operations
- File path is unique identifier
- Content stored as text in database (not filesystem)
- CRUD operations via `/api/files/*` endpoints
- Monaco editor integrates with file API for open/save operations

## Environment Variables

Required in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mi_ai_coding?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-key"
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"
APP_PORT=3000
WS_PORT=3001
```

## Important Constraints

- **PostgreSQL Required**: Must be installed and running before database operations
- **Node.js 18+**: Minimum version (20+ recommended for Refine and React 19)
- **VNC Dependencies**: x11vnc, xvfb, xclip, xdotool required for VNC features
- **Mobile Responsive**: All layouts must work on desktop, tablet, and mobile
- **Panel Persistence**: Layout panel sizes persist to localStorage
- **Path Alias**: Always use `@/` for imports (e.g., `@/lib/prisma`, `@/components/layout/Header`)
- **TypeScript Strict Mode**: Enabled in tsconfig.json - all code must be type-safe

## Testing Notes

- E2E tests run on DISPLAY :99 so they're visible in VNC viewer
- Set `DISPLAY=:99` environment variable before running Playwright
- Tests should verify: auth flow, file CRUD, VNC integration, activity logging
- Visual regression tests can use Playwright's screenshot capabilities

## Common Pitfalls

1. **Prisma Client Out of Sync**: Always run `npx prisma generate` after schema changes
2. **Database Not Connected**: Check PostgreSQL is running and DATABASE_URL is correct
3. **VNC Not Responding**: Check VNC servers are running with `ps aux | grep vnc`
4. **WebSocket Connection Failed**: Ensure WS_PORT is not in use
5. **Ant Design Styles Missing**: Import styles in `app/globals.css`: `@import 'antd/dist/reset.css';`

## Documentation Structure

This project uses a comprehensive documentation system for both humans and LLMs:

### Root Documentation
- **CLAUDE.md** (this file) - Claude Code guidance
- **README.md** - User-facing overview and quick start
- **INSTALL.md** - Complete installation guide
- **CONTRIBUTING.md** - Contribution guidelines
- **PROJECT.md** - Technical overview (being moved to docs/)
- **PROGRESS.md** - Current status and task tracking
- **START-PROJECT-PROMPT.md** - Agent initialization

### docs/ Directory
- **docs/ARCHITECTURE.md** - System architecture, component design, API specs
- **docs/README.md** - Documentation directory index
- **docs/AUTH_SETUP.md** - Authentication system setup
- **docs/VNC-SETUP.md** - VNC integration setup
- **docs/architecture/** - Detailed architecture documents
- **docs/reports/** - Test results and investigation reports

### Agent Documentation
- **agents/\*/README.md** - Individual agent responsibilities and workflows

**For New Developers**: Start with INSTALL.md, then CONTRIBUTING.md, then docs/ARCHITECTURE.md

## Quick Troubleshooting

**Build fails with Prisma errors**:
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

**Database connection issues**:
```bash
sudo systemctl status postgresql
psql -h localhost -U youruser -d mi_ai_coding
```

**VNC not connecting**:
```bash
./scripts/start-vnc.sh
netstat -tulpn | grep -E '6080|6081'
```

**Port already in use**:
```bash
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
```
