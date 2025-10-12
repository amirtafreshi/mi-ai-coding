# MI AI Coding Platform - System Architecture

**Version**: 1.0.0
**Last Updated**: 2025-10-12
**Status**: Production Ready

This document provides comprehensive technical architecture documentation for the MI AI Coding Platform.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Architecture](#component-architecture)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [WebSocket Communication](#websocket-communication)
7. [VNC Integration](#vnc-integration)
8. [Authentication System](#authentication-system)
9. [File Management System](#file-management-system)
10. [Agent System](#agent-system)
11. [Technology Stack](#technology-stack)

---

## System Overview

### High-Level Architecture

The MI AI Coding Platform is a full-stack web application built on Next.js 15 with the following key components:

- **Frontend**: React 19 with Ant Design UI components
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL for persistent storage
- **Real-time**: WebSocket server for live updates
- **VNC Integration**: Dual VNC displays for visual debugging
- **Multi-Agent System**: Coordinated AI agents for development tasks

### Design Principles

1. **Type Safety**: Full TypeScript coverage with strict mode
2. **Real-time First**: WebSocket-based activity logging
3. **Mobile Responsive**: Works on desktop, tablet, and mobile
4. **API-First**: RESTful API design with clear contracts
5. **Security**: NextAuth authentication with session management
6. **Scalability**: Prisma ORM with connection pooling

---

## Architecture Diagrams

### System Architecture Diagram

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
│  │ App Router (app/)                                    │  │
│  │  - Pages & Layouts                                   │  │
│  │  - API Routes                                        │  │
│  │  - Server Components                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Refine Framework                                     │  │
│  │  - Data Provider (API abstraction)                   │  │
│  │  - Auth Provider (NextAuth integration)              │  │
│  │  - Router Provider (App Router integration)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket Server (ws)                                │  │
│  │  - Activity Log Broadcasting                         │  │
│  │  - Client Management                                 │  │
│  │  - Real-time Updates                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────┘
             │ Prisma ORM
┌────────────┴────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  - Users & Sessions (authentication)                        │
│  - Files & Folders (file management)                        │
│  - Activity Logs (agent tracking)                           │
│  - VNC Configuration (display settings)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    VNC Infrastructure                       │
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

### Data Flow Diagrams

#### File Read Operation
```
User clicks file in File Explorer
    ↓
GET /api/files/read?path=/foo/bar.ts
    ↓
Next.js API Route Handler
    ↓
Prisma: File.findUnique({ where: { path } })
    ↓
PostgreSQL query
    ↓
Return file content as JSON
    ↓
Monaco Editor displays content
```

#### Activity Log Update (Real-time)
```
Agent performs action
    ↓
POST /api/activity (create log entry)
    ↓
Prisma: ActivityLog.create({ data })
    ↓
PostgreSQL INSERT
    ↓
Call global.broadcastActivity(log)
    ↓
WebSocket server broadcasts to all clients
    ↓
Browser receives WebSocket message
    ↓
ActivityStream component updates UI
```

#### VNC Clipboard Copy
```
User clicks "Copy from VNC" button
    ↓
POST /api/vnc/copy { display: ":98" }
    ↓
Execute: xclip -o -selection clipboard -display :98
    ↓
Return clipboard text as JSON
    ↓
navigator.clipboard.writeText(text)
    ↓
Browser clipboard updated
```

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
                    └── CodeEditorPanel
                        ├── MonacoEditor
                        └── ActivityStream
```

### Component Responsibilities

#### Layout Components (`components/layout/`)

**AppShell.tsx**
- Main application container
- Manages resizable panel layout
- Persists panel sizes to localStorage
- Handles responsive breakpoints (desktop/tablet/mobile)
- Provides consistent wrapper for dashboard pages

**Header.tsx**
- Top navigation bar with branding
- User menu and profile dropdown
- Logout functionality
- Application breadcrumbs
- Responsive mobile menu toggle

**Sidebar.tsx**
- Collapsible file explorer sidebar
- Mobile-friendly drawer on small screens
- Toggle button for show/hide
- Persistent collapse state in localStorage

#### VNC Components (`components/vnc/`)

**VNCViewer.tsx**
- Base VNC client wrapper using noVNC
- Connection management (connect/disconnect)
- Canvas rendering for remote display
- Keyboard and mouse event handling
- Clipboard integration buttons

**VNCViewerDynamic.tsx**
- Dynamic import wrapper for VNCViewer
- Prevents SSR issues with browser-only code
- Loading state display
- Error boundary for VNC failures

**TerminalVNC.tsx**
- Connects to display :98 (port 6081)
- Terminal access with xterm
- Copy/paste integration via xclip
- Used for bash commands and system access

**PlaywrightVNC.tsx**
- Connects to display :99 (port 6080)
- Visual browser testing with Chromium
- E2E test observation
- Screenshot capabilities

#### File Management (`components/file-explorer/`)

**FileTree.tsx**
- Ant Design Tree component integration
- Lazy loading for large directory structures
- File/folder icons by type
- Click to open files in editor
- Context menu for CRUD operations
- Drag-and-drop support (planned)

**FileActions.tsx**
- Context menu for file operations
- Create file/folder dialog
- Rename file/folder dialog
- Delete confirmation modal
- File upload interface (planned)

#### Code Editor (`components/code-editor/`)

**MonacoEditor.tsx**
- Monaco editor integration (VS Code engine)
- Syntax highlighting by file extension (13+ languages)
- Auto-save on change (debounced)
- Multi-file tabs with dirty state indicators
- Keyboard shortcuts (Ctrl+S for save)
- Find and replace functionality
- Code folding and minimap

#### Activity Log (`components/activity-log/`)

**ActivityStream.tsx**
- WebSocket connection to activity stream
- Real-time log display with auto-scroll
- Color-coded by severity (info/warning/error)
- Filter by agent name
- Filter by log level
- Manual scroll override (stops auto-scroll)
- Timestamp formatting (relative time)
- Reconnection logic with backoff

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
│ password (hash) │
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

### Model Details

See `prisma/schema.prisma` for complete Prisma schema definition.

**User Model**
- Authentication and user management
- Password stored as bcrypt hash
- Role-based access control (admin/user)
- Session tracking with currentSessionToken

**Session Model**
- JWT session tokens
- Expiration tracking
- One user can have multiple active sessions

**File Model**
- Individual file storage in database (not filesystem)
- Path is unique identifier
- Content stored as text (supports all text-based files)
- MIME type for syntax highlighting

**Folder Model**
- Directory structure representation
- Parent-child relationships for nested folders
- Path is unique identifier

**ActivityLog Model**
- Agent action tracking
- Levels: info, warning, error
- JSON details for structured data
- Used for real-time activity stream

**VNCConfig Model**
- VNC server configuration
- Display identifier (:98, :99)
- Port mapping (6080, 6081)
- Resolution settings
- Active status tracking

---

## API Documentation

All API routes follow Next.js 15 App Router conventions with route handlers in `app/api/`.

### Authentication Endpoints

#### POST /api/auth/signin
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "clx123",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  },
  "token": "jwt-token-here"
}
```

#### POST /api/auth/signout
Logout and clear session.

#### GET /api/auth/session
Get current user session (handled by NextAuth).

---

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
      "updatedAt": "2025-10-12T14:00:00Z"
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

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "clx123",
    "path": "/project/example.ts",
    "updatedAt": "2025-10-12T14:30:00Z"
  }
}
```

#### DELETE /api/files/delete
Delete a file or folder.

**Query Parameters:**
- `path` (string, required): Path to delete

**Response:**
```json
{
  "success": true,
  "deletedPath": "/project/example.ts"
}
```

---

### VNC Integration Endpoints

#### POST /api/vnc/copy
Copy text from VNC display to browser clipboard.

**Request Body:**
```json
{
  "display": ":98"
}
```

**Implementation:**
```bash
xclip -o -selection clipboard -display :98
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

**Implementation:**
```bash
echo "text" | xclip -selection clipboard -display :99
xdotool type --display :99 --clearmodifiers "text"
```

**Response:**
```json
{
  "success": true
}
```

---

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
      "createdAt": "2025-10-12T14:30:00Z",
      "user": {
        "id": "clx001",
        "name": "Admin User"
      }
    }
  ],
  "total": 150,
  "page": 1
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

**Response:**
```json
{
  "success": true,
  "log": {
    "id": "clx999",
    "createdAt": "2025-10-12T14:30:00Z"
  }
}
```

**Side Effect**: Broadcasts to all connected WebSocket clients via `global.broadcastActivity()`

---

## WebSocket Communication

### Server Implementation

The WebSocket server runs on a separate port (default: 3001) using the `ws` package. Implementation is in `server.js` and `lib/websocket-server.ts`.

**Server Features:**
- Client connection management (add/remove)
- Broadcast to all connected clients
- Ping/pong for connection health
- Graceful error handling

**Global Broadcast Function:**
```javascript
global.broadcastActivity = (log) => {
  const message = {
    type: 'activity',
    data: log
  }

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}
```

### Client Implementation

Client WebSocket connection is in `components/activity-log/ActivityStream.tsx`.

**Connection URL:**
```typescript
const ws = new WebSocket('ws://localhost:3001')
```

**Message Types:**
```typescript
interface ActivityMessage {
  type: 'activity' | 'connected' | 'pong'
  data?: ActivityLog
  message?: string
  timestamp?: string
}
```

**Auto-reconnection:**
- Exponential backoff on disconnect
- Max retry attempts with timeout
- Visual indicator of connection status

---

## VNC Integration

### VNC Server Configuration

Two VNC servers run on separate X displays:

**Display :98 - Terminal**
- Port: 6081
- Purpose: Terminal access (xterm, bash)
- Resolution: 1024x768 (upgradeable to 1920x1080)
- Applications: xterm, vim, bash scripts

**Display :99 - Playwright**
- Port: 6080
- Purpose: Visual browser testing
- Resolution: 1024x768 (upgradeable to 1920x1080)
- Applications: Chromium, Playwright E2E tests

### noVNC Client Integration

**Package**: `novnc-next@1.0.0`

**Implementation** (`components/vnc/VNCViewer.tsx`):
```typescript
import RFB from 'novnc-next/lib/rfb/rfb.js'

const rfb = new RFB(
  canvasElement,
  `ws://localhost:${port}/websockify`,
  {
    credentials: { password: '' },
    shared: true,
    focusContainer: canvasElement
  }
)
```

### Clipboard Integration

**Architecture:**
1. User clicks "Copy from VNC"
2. Frontend calls `/api/vnc/copy`
3. Backend executes `xclip -o -selection clipboard`
4. Text returned to frontend
5. Frontend writes to browser clipboard via `navigator.clipboard.writeText()`

**Paste flow:**
1. User clicks "Paste to VNC"
2. Frontend reads browser clipboard via `navigator.clipboard.readText()`
3. Frontend calls `/api/vnc/paste` with text
4. Backend executes `xclip` to set VNC clipboard
5. Backend executes `xdotool type` to paste text

---

## Authentication System

### NextAuth Configuration

Authentication is handled by NextAuth v4 with custom configuration in `lib/auth.ts`.

**Provider**: Credentials (email/password)
**Strategy**: JWT with 30-day expiration
**Session Storage**: Database + JWT token

### Authentication Flow

```
1. User enters email/password on /login
    ↓
2. POST to /api/auth/signin (NextAuth)
    ↓
3. Credentials provider validates against database
    ↓
4. Password verified with bcrypt.compare()
    ↓
5. JWT token generated with user info
    ↓
6. Session token stored in User.currentSessionToken
    ↓
7. Activity log entry created (user_login)
    ↓
8. Redirect to /dashboard
    ↓
9. Middleware checks session on protected routes
```

### Session Management

**JWT Token Contents:**
```typescript
{
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  sessionToken: string  // Unique per login
  loginTime: number     // Timestamp
}
```

**Session Invalidation:**
- Logout clears `currentSessionToken` in database
- Prevents reuse of old JWT tokens
- Activity log entry created (user_logout)

---

## File Management System

### Storage Architecture

Files are stored **in the database** (not filesystem) as text content. This provides:
- Version control capabilities (future)
- Full-text search (future)
- Backup and replication
- Cross-platform compatibility

### Path-Based Identification

File paths are unique identifiers:
- `/project/components/FileTree.tsx`
- `/project/lib/prisma.ts`

**Important**: Paths are absolute and case-sensitive.

### MIME Type Detection

MIME types are stored for syntax highlighting:
```typescript
const mimeTypes = {
  '.ts': 'text/typescript',
  '.tsx': 'text/tsx',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown',
  // ... 13+ languages supported
}
```

---

## Agent System

### Agent Architecture

The platform includes 7 coordinated AI agents:

| Agent | Purpose | Triggers |
|-------|---------|----------|
| **Orchestrating** | Coordinates all agents, assigns tasks | Always monitoring |
| **Full-Stack Developer** | Implements features end-to-end | Task assignment |
| **Frontend Testing** | Runs E2E tests with Playwright | After feature completion |
| **Debugging** | Investigates and fixes errors | Error detection |
| **Documentation** | Updates docs and PROGRESS.md | After milestones |
| **GitHub Manager** | Manages commits, PRs, releases | Ready to deploy |
| **Ubuntu System Admin** | Server config, firewall, security | Infrastructure changes |

### Agent Communication

**Activity Logging:**
```typescript
await prisma.activityLog.create({
  data: {
    agent: 'full-stack-developer',
    action: 'create_component',
    details: 'Created FileTree component',
    level: 'info'
  }
})
```

**Real-time Broadcast:**
- Activity log creation triggers WebSocket broadcast
- All connected clients receive update instantly
- UI updates in real-time

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.4 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| Ant Design | 5.27.4 | UI component library |
| Tailwind CSS | 4.1.14 | Utility-first CSS |
| Refine | 5.0.4 | Admin panel framework |
| Monaco Editor | Latest | Code editor (VS Code engine) |
| react-resizable-panels | 3.0.6 | Resizable layout |
| noVNC (novnc-next) | 1.0.0 | HTML5 VNC client |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.5.4 | RESTful API |
| Prisma | 6.16.3 | Database ORM |
| PostgreSQL | 14+ | Relational database |
| NextAuth | 4.24.11 | Authentication |
| WebSocket (ws) | 8.18.3 | Real-time communication |
| Zod | 4.1.11 | Schema validation |
| bcryptjs | 2.4.3 | Password hashing |

### Development Tools

| Tool | Purpose |
|------|---------|
| Playwright | E2E testing |
| ESLint | Code linting |
| Prettier | Code formatting |
| TypeScript | Type checking |

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

## Performance Considerations

### Database Optimization

- **Indexes**: On unique fields (path, email, display)
- **Connection Pooling**: Prisma client singleton pattern
- **Query Optimization**: Select only needed fields

### WebSocket Optimization

- **Connection Limit**: Track and limit concurrent connections
- **Message Batching**: Batch multiple updates when possible
- **Compression**: Consider WebSocket compression for production

### Frontend Optimization

- **Code Splitting**: Dynamic imports for heavy components (VNC, Monaco)
- **Lazy Loading**: File tree loads on demand
- **Memoization**: React.memo for expensive components
- **Debouncing**: Editor auto-save debounced to 1 second

---

## Security Considerations

### Authentication Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 30-day expiration
- Session tokens invalidated on logout
- CSRF protection enabled in NextAuth

### API Security

- Protected routes require authentication
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- Rate limiting (recommended for production)

### VNC Security

- VNC servers bind to localhost only
- No password for internal access
- Should be behind reverse proxy in production
- Consider VPN for remote access

---

## Deployment Considerations

See [INSTALL.md](../INSTALL.md) for complete deployment guide.

**Key Points:**
- Use production build (`npm run build`)
- Set `NODE_ENV=production`
- Configure firewall (UFW) for ports 3000, 6080, 6081
- Use process manager (PM2) for server
- Set up Nginx reverse proxy with SSL
- Configure PostgreSQL for production
- Regular database backups

---

## Future Enhancements

Planned features for future releases:

1. **File System**:
   - Git integration for version control
   - File upload/download
   - Drag-and-drop file management

2. **Collaboration**:
   - Multi-user editing
   - Real-time cursor tracking
   - Comments and annotations

3. **Agent System**:
   - Custom agent creation
   - Agent marketplace
   - Agent performance metrics

4. **VNC**:
   - Multi-display support (beyond 2)
   - Screen recording
   - Remote control permissions

5. **Performance**:
   - Redis caching layer
   - Database query optimization
   - CDN for static assets

---

**Last Updated**: 2025-10-12
**Maintained By**: Documentation Agent

For questions or updates, see [CONTRIBUTING.md](../CONTRIBUTING.md)
