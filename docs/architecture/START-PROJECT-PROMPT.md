# MI AI Coding Platform - Project Initialization Prompt

## 🎯 Mission
Build a production-ready, mobile-responsive AI Coding Platform using Next.js 14+, Refine framework, Ant Design, Prisma ORM, and VNC integration. This platform provides dual VNC displays (:98 Terminal, :99 Playwright), file management, code editing, and real-time agent activity logging.

## 📋 Current Status
✅ Project structure created
✅ Dependencies installed (Next.js, Refine, Ant Design, Prisma, Tailwind)
✅ Configuration files ready (tsconfig.json, next.config.js, tailwind.config.ts)
✅ Prisma schema defined
✅ Git repository initialized

## 🚀 Execution Instructions

### Phase 1: Foundation Setup (Priority: CRITICAL)
**Full-Stack Developer Agent + Orchestrating Agent**

1. **Initialize Database & Prisma**
   ```bash
   cp .env.example .env
   # Edit .env with actual DATABASE_URL
   npx prisma generate
   npx prisma db push
   ```

2. **Create Base Application Structure**
   - `app/layout.tsx` - Root layout with Refine providers, Ant Design ConfigProvider
   - `app/page.tsx` - Landing/dashboard page
   - `app/globals.css` - Global Tailwind styles + Ant Design imports
   - `lib/prisma.ts` - Prisma client singleton
   - `providers/refine-provider.tsx` - Refine configuration wrapper

3. **Implement Authentication**
   - `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
   - `app/(auth)/login/page.tsx` - Login page with Ant Design Form
   - `lib/auth.ts` - Auth utilities and session management

### Phase 2: Core Layout & UI (Priority: HIGH)
**Frontend Developer Agent + Full-Stack Agent**

1. **Responsive Layout Components**
   - `components/layout/AppShell.tsx` - Main responsive shell with react-resizable-panels
   - `components/layout/Header.tsx` - Top navigation bar
   - `components/layout/Sidebar.tsx` - Collapsible sidebar (mobile-friendly)
   - Panel layout: File Explorer (20%) | Terminal VNC (25%) | Playwright VNC (30%) | Activity Log (25%)
   - Persist panel sizes to localStorage

2. **File Explorer Component**
   - `components/file-explorer/FileTree.tsx` - Ant Design Tree component
   - `components/file-explorer/FileActions.tsx` - CRUD context menu
   - API Routes:
     - `app/api/files/list/route.ts` - Browse directories
     - `app/api/files/create/route.ts` - Create file/folder
     - `app/api/files/read/route.ts` - Read file content
     - `app/api/files/update/route.ts` - Save file
     - `app/api/files/delete/route.ts` - Delete file/folder

3. **Code Editor**
   - `components/code-editor/MonacoEditor.tsx` - Monaco editor integration
   - File tabs, syntax highlighting, auto-save

### Phase 3: VNC Integration (Priority: HIGH)
**Full-Stack Developer Agent + Frontend Testing Agent**

1. **VNC Components**
   - `components/vnc/VNCViewer.tsx` - noVNC wrapper component
   - `components/vnc/TerminalVNC.tsx` - Display :98 (port 6081)
   - `components/vnc/PlaywrightVNC.tsx` - Display :99 (port 6080)
   - WebSocket connection management
   - Clipboard integration:
     - `app/api/vnc/copy/route.ts` - Copy from VNC (xclip)
     - `app/api/vnc/paste/route.ts` - Paste to VNC (xdotool)

2. **Activity Log**
   - `components/activity-log/ActivityStream.tsx` - Real-time log display
   - WebSocket server for live updates
   - Filter by agent/severity
   - `app/api/activity/route.ts` - CRUD for activity logs

### Phase 4: Agent System (Priority: MEDIUM)
**Orchestrating Agent + Documentation Agent**

1. **Create Agent Definitions** (in `/agents` folder)
   Each agent needs:
   - README.md with purpose, capabilities, usage
   - Example scripts/prompts
   - Integration points with activity log

   Agents to create:
   - **Full-Stack Developer** (`agents/full-stack-developer/`)
     - Builds features end-to-end
     - Updates PROGRESS.md

   - **Frontend Testing** (`agents/frontend-testing/`)
     - Playwright E2E tests on DISPLAY=:99
     - Reports to activity log

   - **Debugging** (`agents/debugging/`)
     - Analyzes errors, suggests fixes
     - Logs findings

   - **Documentation** (`agents/documentation/`)
     - Maintains PROJECT.md, PROGRESS.md, API docs
     - Updates README.md

   - **GitHub Version Manager** (`agents/github-manager/`)
     - Commits, PRs, releases
     - Changelog generation

2. **Agent Activity Broadcasting**
   - `lib/activity-broadcaster.ts` - WebSocket broadcast utility
   - Each agent calls this to log actions

### Phase 5: Documentation & Testing (Priority: MEDIUM)
**Documentation Agent + Frontend Testing Agent**

1. **Create Core Documentation**
   - `PROJECT.md` - Full architecture, tech stack, deployment guide
   - `PROGRESS.md` - Task tracking, completion status
   - `README.md` - Quick start, features, setup instructions
   - `API_DOCS.md` - API endpoints documentation

2. **E2E Testing**
   - `tests/e2e/` - Playwright tests
   - Run on DISPLAY=:99
   - Test VNC integration, file operations, auth

### Phase 6: Deployment Preparation (Priority: LOW)
**Full-Stack Developer + GitHub Manager**

1. **Setup Scripts**
   - `scripts/setup.sh` - Install dependencies, Prisma migrate, build
   - `scripts/start-vnc.sh` - Start VNC servers on :98 and :99
   - `scripts/deploy.sh` - Pull from git, rebuild, restart

2. **GitHub Actions**
   - `.github/workflows/ci.yml` - CI/CD pipeline
   - Automated testing
   - Docker containerization (optional)

## 📁 Project Structure
```
/home/master/projects/mi-ai-coding/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Main app
│   ├── api/               # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/            # React components
│   ├── layout/
│   ├── vnc/
│   ├── file-explorer/
│   ├── code-editor/
│   └── activity-log/
├── lib/                   # Utilities
├── providers/             # React context providers
├── prisma/                # Database schema
├── agents/                # Agent definitions
├── scripts/               # Deployment scripts
├── PROJECT.md             # Full documentation
├── PROGRESS.md            # Task tracking
└── START-PROJECT-PROMPT.md # This file
```

## 🤖 Agent Coordination Protocol

### Orchestrating Agent Responsibilities
1. Read PROGRESS.md to understand current state
2. Assign tasks to appropriate specialized agents
3. Monitor progress, resolve conflicts
4. Update PROGRESS.md with status
5. Ensure documentation stays current

### Task Assignment Rules
- **Full-Stack**: Features requiring both FE + BE
- **Frontend Testing**: After FE changes, run E2E tests
- **Debugging**: When errors occur, investigate + fix
- **Documentation**: After features complete, update docs
- **GitHub Manager**: Ready to commit? Create PR

### Communication Protocol
- All agents log actions to ActivityLog (Prisma + WebSocket)
- Update PROGRESS.md after completing tasks
- Tag other agents in comments when handoff needed
- Use `window.addActivityLog()` in frontend for user visibility

## 🎯 Success Criteria
- [  ] User can login with NextAuth
- [  ] File explorer shows directory tree with CRUD operations
- [  ] Code editor opens files with syntax highlighting
- [  ] Both VNC displays visible and interactive
- [  ] Clipboard copy/paste works between VNC and browser
- [  ] Activity log shows real-time agent actions
- [  ] Responsive on mobile (collapsible panels)
- [  ] All panels resizable and persistent
- [  ] Deployment scripts work on fresh machine
- [  ] E2E tests pass on DISPLAY=:99

## 🚦 Getting Started Command
```bash
cd /home/master/projects/mi-ai-coding
# Read this file, then start with Phase 1
# Update PROGRESS.md as you go
# Coordinate with other agents via ActivityLog
```

## 📝 Important Notes
- VNC Display :98 = Terminal (port 6081)
- VNC Display :99 = Playwright (port 6080)
- App runs on port 3000
- WebSocket on port 3001
- PostgreSQL required for Prisma
- Node.js 18+ required (Refine needs 20, but 18 works)
- Always update PROGRESS.md after completing tasks
- Test on DISPLAY=:99 to show Playwright tests visually

## 🔗 Key Files to Reference
- `/prisma/schema.prisma` - Database models
- `/package.json` - Dependencies & scripts
- `/.env.example` - Environment variables template
- `/tsconfig.json` - TypeScript configuration
- This file (START-PROJECT-PROMPT.md) - Master instructions

---

**Last Updated:** 2025-10-04
**Project Status:** Initialized, Ready for Development
**Next Agent:** Full-Stack Developer + Orchestrating Agent (Phase 1)
