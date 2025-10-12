# MI AI Coding Platform - Technical Documentation

**Version**: 1.0.0
**Last Updated**: 2025-10-04
**Status**: Development - Phase 1 Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [Component Architecture](#component-architecture)
6. [API Documentation](#api-documentation)
7. [VNC Integration](#vnc-integration)
8. [Agent System](#agent-system)
9. [Deployment Guide](#deployment-guide)
10. [Environment Configuration](#environment-configuration)
11. [Development Workflow](#development-workflow)

---

## Overview

### Project Mission
Build a production-ready, mobile-responsive AI Coding Platform that provides dual VNC displays for visual debugging, comprehensive file management, real-time code editing, and coordinated multi-agent development workflows.

### Key Features
- **Dual VNC Displays**: Terminal (:98) and Playwright (:99) for visual debugging and testing
- **File Management**: Full CRUD operations with tree-based explorer
- **Code Editor**: Monaco editor with syntax highlighting and auto-save
- **Real-time Activity**: WebSocket-powered agent activity logging
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Multi-Agent System**: Six specialized AI agents working in coordination
- **Authentication**: Secure session-based auth with NextAuth
- **Resizable Layout**: Customizable panels with persistent preferences

### Target Users
- Developers building and testing applications
- AI agents performing automated development tasks
- Teams requiring visual debugging capabilities
- Anyone needing remote code editing with VNC integration

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ File        │ │ Terminal VNC │ │ Playwright VNC     │  │
│  │ Explorer    │ │ (Display :98)│ │ (Display :99)      │  │
│  │             │ │              │ │                    │  │
│  └─────────────┘ └──────────────┘ └────────────────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Code Editor │ │              │ │ Activity Log       │  │
│  │ (Monaco)    │ │              │ │ (Real-time)        │  │
│  └─────────────┘ └──────────────┘ └────────────────────┘  │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/HTTPS + WebSocket
┌────────────┴────────────────────────────────────────────────┐
│                    Next.js Server                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ App Router                                           │  │
│  │  - Pages (app/)                                      │  │
│  │  - API Routes (app/api/)                             │  │
│  │  - Server Components                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Refine Framework                                     │  │
│  │  - Data Provider                                     │  │
│  │  - Auth Provider                                     │  │
│  │  - Router Provider                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket Server (ws)                                │  │
│  │  - Activity Log Broadcasting                         │  │
│  │  - Real-time Updates                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────┘
             │ Prisma ORM
┌────────────┴────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  - Users & Sessions                                         │
│  - Files & Folders                                          │
│  - Activity Logs                                            │
│  - VNC Configuration                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    VNC Servers                              │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ Terminal VNC     │      │ Playwright VNC   │           │
│  │ Display :98      │      │ Display :99      │           │
│  │ Port 6081        │      │ Port 6080        │           │
│  │ - xterm          │      │ - Chromium       │           │
│  │ - bash           │      │ - E2E Tests      │           │
│  └──────────────────┘      └──────────────────┘           │
│         │                           │                       │
│    ┌────┴────┐                 ┌───┴────┐                 │
│    │  xclip  │                 │ xclip  │                 │
│    │ xdotool │                 │xdotool │                 │
│    └─────────┘                 └────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### File Read Operation
```
Browser → GET /api/files/read?path=/foo/bar.ts
        → Next.js API Route
        → Prisma Query: File.findUnique()
        → PostgreSQL
        → Return file content
        → Monaco Editor displays content
```

#### Activity Log Update
```
Agent Action → prisma.activityLog.create()
            → PostgreSQL INSERT
            → WebSocket broadcast to all clients
            → Browser receives update
            → ActivityStream component updates UI
```

#### VNC Clipboard Copy
```
User clicks "Copy from VNC"
→ POST /api/vnc/copy
→ Execute: xclip -o -selection clipboard
→ Return clipboard text
→ navigator.clipboard.writeText()
→ Browser clipboard updated
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.4 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| Ant Design | 5.27.4 | UI component library |
| Tailwind CSS | 4.1.14 | Utility-first CSS framework |
| Refine | 5.0.4 | Admin panel framework |
| Monaco Editor | Latest | Code editor (VS Code engine) |
| react-resizable-panels | 3.0.6 | Resizable layout panels |
| noVNC | Latest | HTML5 VNC client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.5.4 | RESTful API endpoints |
| Prisma | 6.16.3 | Database ORM |
| PostgreSQL | 14+ | Relational database |
| NextAuth | 4.24.11 | Authentication library |
| WebSocket (ws) | 8.18.3 | Real-time communication |
| Zod | 4.1.11 | Schema validation |

### Development Tools

| Tool | Purpose |
|------|---------|
| Playwright | E2E testing framework |
| ESLint | Code linting |
| Prettier | Code formatting |
| Git | Version control |
| GitHub Actions | CI/CD pipeline |

### Infrastructure

| Component | Configuration |
|-----------|--------------|
| Node.js | 18+ (20+ recommended) |
| VNC Display :98 | Terminal (port 6081) |
| VNC Display :99 | Playwright (port 6080) |
| Application Port | 3000 |
| WebSocket Port | 3001 |
| Database Port | 5432 (PostgreSQL) |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ email (unique)  │
│ name            │
│ password        │
│ role            │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │ 1:N
         ├──────────────────┐
         │                  │
    ┌────┴────────┐   ┌─────┴──────────┐
    │   Session   │   │  ActivityLog   │
    ├─────────────┤   ├────────────────┤
    │ id (PK)     │   │ id (PK)        │
    │ userId (FK) │   │ userId (FK)    │
    │ token       │   │ agent          │
    │ expiresAt   │   │ action         │
    │ createdAt   │   │ details        │
    └─────────────┘   │ level          │
                      │ createdAt      │
                      └────────────────┘

┌─────────────────┐       ┌─────────────────┐
│      File       │       │     Folder      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ path (unique)   │       │ path (unique)   │
│ name            │       │ name            │
│ content (text)  │       │ parentId        │
│ size            │       │ createdAt       │
│ mimeType        │       │ updatedAt       │
│ createdAt       │       └─────────────────┘
│ updatedAt       │
└─────────────────┘

┌─────────────────┐
│   VNCConfig     │
├─────────────────┤
│ id (PK)         │
│ display (unique)│
│ port            │
│ resolution      │
│ isActive        │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

### Prisma Models

See `prisma/schema.prisma` for complete schema definition.

**Key Models:**
- **User**: Authentication and user management
- **Session**: Session tokens for auth
- **File**: Individual file storage
- **Folder**: Directory structure
- **ActivityLog**: Agent action tracking
- **VNCConfig**: VNC server configuration

---

## Component Architecture

### Layout Hierarchy

```
app/layout.tsx (Root Layout)
├── RefineProvider
├── AntDesignConfigProvider
└── NextAuthProvider
    └── {children}
        └── app/(dashboard)/layout.tsx
            └── AppShell
                ├── Header
                ├── Sidebar
                │   └── FileTree
                └── ResizablePanelGroup
                    ├── FileExplorerPanel
                    ├── TerminalVNCPanel
                    │   └── VNCViewer (display :98)
                    ├── PlaywrightVNCPanel
                    │   └── VNCViewer (display :99)
                    │   └── ActivityStream
                    └── CodeEditorPanel
                        └── MonacoEditor
```

### Component Responsibilities

#### Layout Components (`components/layout/`)

**AppShell.tsx**
- Main application container
- Manages resizable panel layout
- Persists panel sizes to localStorage
- Handles responsive breakpoints

**Header.tsx**
- Top navigation bar
- User menu and logout
- Application title
- Breadcrumbs

**Sidebar.tsx**
- Collapsible file explorer
- Mobile-friendly drawer on small screens
- Toggle button

#### VNC Components (`components/vnc/`)

**VNCViewer.tsx**
- Base VNC client wrapper
- noVNC integration
- Connection management
- Clipboard controls

**TerminalVNC.tsx**
- Connects to display :98 (port 6081)
- Terminal access
- Copy/paste integration

**PlaywrightVNC.tsx**
- Connects to display :99 (port 6080)
- Visual browser testing
- Screenshot capabilities

#### File Management (`components/file-explorer/`)

**FileTree.tsx**
- Ant Design Tree component
- Lazy loading for performance
- File/folder icons
- Click to open files

**FileActions.tsx**
- Context menu for CRUD operations
- Create file/folder dialog
- Rename dialog
- Delete confirmation

#### Code Editor (`components/code-editor/`)

**MonacoEditor.tsx**
- Monaco editor integration
- Syntax highlighting by file extension
- Auto-save on change (debounced)
- Multi-file tabs
- Keyboard shortcuts

#### Activity Log (`components/activity-log/`)

**ActivityStream.tsx**
- WebSocket connection to server
- Real-time log display
- Color-coded by severity (info/warning/error)
- Filter by agent
- Auto-scroll with manual override
- Timestamp formatting

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/[...nextauth]
NextAuth configuration and endpoints.

**Login**: POST /api/auth/signin
**Logout**: POST /api/auth/signout
**Session**: GET /api/auth/session

### File Management Endpoints

#### GET /api/files/list
List files and folders in a directory.

**Query Parameters:**
- `path` (string, required): Directory path

**Response:**
```json
{
  "files": [
    {
      "id": "clx123",
      "name": "example.ts",
      "path": "/project/example.ts",
      "type": "file",
      "size": 1024,
      "mimeType": "text/typescript",
      "updatedAt": "2025-10-04T14:00:00Z"
    }
  ],
  "folders": [
    {
      "id": "clx456",
      "name": "components",
      "path": "/project/components",
      "type": "folder"
    }
  ]
}
```

#### GET /api/files/read
Read file content.

**Query Parameters:**
- `path` (string, required): File path

**Response:**
```json
{
  "content": "export const example = () => { ... }",
  "file": {
    "id": "clx123",
    "name": "example.ts",
    "path": "/project/example.ts",
    "size": 1024,
    "mimeType": "text/typescript"
  }
}
```

#### POST /api/files/create
Create a new file or folder.

**Request Body:**
```json
{
  "path": "/project/newfile.ts",
  "type": "file",
  "content": "// New file content"
}
```

**Response:**
```json
{
  "id": "clx789",
  "path": "/project/newfile.ts",
  "created": true
}
```

#### PUT /api/files/update
Update file content.

**Request Body:**
```json
{
  "path": "/project/example.ts",
  "content": "// Updated content"
}
```

#### DELETE /api/files/delete
Delete a file or folder.

**Query Parameters:**
- `path` (string, required): Path to delete

### VNC Integration Endpoints

#### POST /api/vnc/copy
Copy text from VNC display to browser clipboard.

**Request Body:**
```json
{
  "display": ":98"
}
```

**Response:**
```json
{
  "text": "Clipboard content from VNC"
}
```

#### POST /api/vnc/paste
Paste text from browser to VNC display.

**Request Body:**
```json
{
  "display": ":99",
  "text": "Text to paste"
}
```

### Activity Log Endpoints

#### GET /api/activity
Get activity logs with filtering.

**Query Parameters:**
- `agent` (string, optional): Filter by agent name
- `level` (string, optional): Filter by level (info/warning/error)
- `limit` (number, optional): Max results (default 100)

**Response:**
```json
{
  "logs": [
    {
      "id": "clx999",
      "agent": "full-stack-developer",
      "action": "create_component",
      "details": "Created FileTree component",
      "level": "info",
      "createdAt": "2025-10-04T14:30:00Z"
    }
  ]
}
```

#### POST /api/activity
Create activity log entry.

**Request Body:**
```json
{
  "agent": "full-stack-developer",
  "action": "create_component",
  "details": "Implemented FileTree with Ant Design",
  "level": "info"
}
```

---

## VNC Integration

### VNC Server Configuration

#### Display :98 - Terminal
```bash
# Port: 6081
# Purpose: Terminal access for command execution
# Applications: xterm, bash, vim
# Resolution: 1024x768
```

#### Display :99 - Playwright
```bash
# Port: 6080
# Purpose: Visual browser testing with Playwright
# Applications: Chromium, Playwright tests
# Resolution: 1280x720
```

### Clipboard Integration

**Copy from VNC (Server → Browser):**
```bash
# Execute on server
xclip -o -selection clipboard -display :98

# Transfer to browser via API
POST /api/vnc/copy → navigator.clipboard.writeText()
```

**Paste to VNC (Browser → Server):**
```bash
# Get from browser
navigator.clipboard.readText()

# Execute on server via API
echo "text" | xclip -selection clipboard -display :98
xdotool type --display :98 --clearmodifiers "text"
```

### noVNC Client Configuration

```javascript
const rfb = new RFB(
  canvasElement,
  `ws://localhost:6080/websockify`,
  {
    credentials: { password: '' },
    shared: true,
    focusContainer: canvasElement
  }
)
```

---

## Agent System

### Agent Roles

| Agent | Responsibilities | Triggers |
|-------|-----------------|----------|
| **Full-Stack Developer** | Implement features end-to-end | Task assigned by Orchestrator |
| **Frontend Testing** | E2E tests with Playwright | After feature completion |
| **Debugging** | Investigate and fix errors | Error detected or reported |
| **Documentation** | Update docs and progress | After milestones |
| **GitHub Manager** | Commits, PRs, releases | Ready to deploy |
| **Ubuntu System Admin** | Server config, firewall, Nginx, security | Infrastructure changes needed |
| **Orchestrating** | Coordinate all agents | Always monitoring |

### Communication Protocol

1. **Activity Logging**: All agents log to ActivityLog database
2. **PROGRESS.md Updates**: Status changes documented
3. **Handoff Comments**: Tag next agent in PROGRESS.md
4. **WebSocket Broadcast**: Real-time updates to UI

---

## Deployment Guide

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install VNC dependencies
sudo apt-get install x11vnc xvfb xclip xdotool
```

### Setup Steps

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/mi-ai-coding.git
cd mi-ai-coding
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your values
```

4. **Initialize Database**
```bash
npx prisma generate
npx prisma db push
```

5. **Start VNC Servers**
```bash
./scripts/start-vnc.sh
```

6. **Build and Run**
```bash
npm run build
npm start
```

---

## Environment Configuration

Required environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mi_ai_coding?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-key"

# VNC Configuration
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"

# Application
APP_PORT=3000
NODE_ENV="production"

# WebSocket
WS_PORT=3001
```

---

## Development Workflow

See [PROGRESS.md](PROGRESS.md) for current status and [START-PROJECT-PROMPT.md](START-PROJECT-PROMPT.md) for initialization guide.

### Quick Reference

**Start Development:**
```bash
npm run dev
```

**Run Tests:**
```bash
DISPLAY=:99 npx playwright test
```

**Database Operations:**
```bash
npx prisma studio      # Visual database browser
npx prisma generate    # Regenerate client
npx prisma db push     # Push schema changes
```

**Check Logs:**
```bash
# Server logs in terminal
# Activity logs in database or UI
```

---

**Last Updated**: 2025-10-04
**Maintained By**: Documentation Agent
