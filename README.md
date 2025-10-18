# MI AI Coding Platform

[![CI](https://github.com/amirtafreshi/mi-ai-coding/actions/workflows/ci.yml/badge.svg)](https://github.com/amirtafreshi/mi-ai-coding/actions/workflows/ci.yml)
[![Release](https://github.com/amirtafreshi/mi-ai-coding/actions/workflows/release.yml/badge.svg)](https://github.com/amirtafreshi/mi-ai-coding/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)

A production-ready, mobile-responsive AI Coding Platform built with Next.js 15, Refine framework, Ant Design, Prisma ORM, and VNC integration. This platform provides dual VNC displays, file management, code editing, and real-time agent activity logging.

## Features

- **Dual VNC Displays**: Terminal (DISPLAY :98) and Playwright (DISPLAY :99) for visual debugging
- **File Management**: Complete CRUD operations with tree-based file explorer
- **Code Editor**: Monaco editor integration with syntax highlighting and auto-save
- **Real-time Activity Log**: WebSocket-powered agent activity stream
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Resizable Panels**: Customizable layout with persistent panel sizes
- **Authentication**: Secure login with NextAuth
- **Multi-Agent System**: Coordinated AI agents for development, testing, debugging, and documentation

## Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19.2** - UI library
- **TypeScript 5.9** - Type-safe JavaScript
- **Ant Design 5.27.4** - UI component library
- **Tailwind CSS 4.1** - Utility-first CSS
- **Refine 5.x** - Admin panel framework
- **Monaco Editor** - Code editor (VS Code engine)
- **react-resizable-panels 3.0** - Resizable layout panels

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma 6.16.3** - Database ORM
- **PostgreSQL** - Relational database
- **NextAuth 4.24** - Authentication
- **WebSocket (ws 8.18)** - Real-time communication
- **Zod 4.1** - Schema validation

### VNC Integration
- **noVNC** - HTML5 VNC client
- **VNC Servers** - Remote desktop access
  - Terminal: Display :98 (port 6081)
  - Playwright: Display :99 (port 6080)
- **xclip** - X11 clipboard integration
- **xdotool** - X11 automation

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **PostgreSQL** 14+
- **VNC Servers** running on displays :98 and :99
- **Git** for version control

## Quick Start

### ⚡ One-Command Installation

```bash
git clone https://github.com/amirtafreshi/mi-ai-coding.git
cd mi-ai-coding
sudo ./scripts/install-all.sh
```

**Installation time: ~10 minutes** | Installs Node.js, PostgreSQL, VNC servers, and all dependencies.

### 📚 Installation Guides

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 10 minutes
- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide
- **[DOMAIN-SETUP.md](DOMAIN-SETUP.md)** - Configure domain and SSL

### Quick Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/amirtafreshi/mi-ai-coding.git
cd mi-ai-coding

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials (avoid special characters in password)

# 4. Initialize database
npm run db:generate
npm run db:push
npm run db:seed  # Creates default admin and user accounts

# 5. Post-installation setup (creates directories, configures firewall)
./scripts/post-install.sh

# 6. Start VNC servers (optional, for VNC features)
./scripts/start-vnc.sh

# 7. Run development server
npm run dev
```

**Access the application:**
- Local: [http://localhost:3000](http://localhost:3000)
- External: http://YOUR_SERVER_IP:3000

**Need help?** See [INSTALL.md](INSTALL.md) for complete step-by-step instructions.

### 7. Login Credentials

**Test Accounts**:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

### 8. VNC Access (Once Configured)

When VNC servers are running:
- **Terminal VNC**: http://localhost:6081/vnc.html (Display :98)
- **Playwright VNC**: http://localhost:6080/vnc.html (Display :99)

Note: VNC servers are not yet configured. See `PROGRESS.md` for current status.

## Project Structure

```
mi-ai-coding/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   └── login/
│   ├── (dashboard)/         # Main application
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── files/          # File CRUD endpoints
│   │   ├── vnc/            # VNC integration endpoints
│   │   └── activity/       # Activity log endpoints
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── layout/             # Layout components
│   │   ├── AppShell.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── vnc/                # VNC viewer components
│   │   ├── VNCViewer.tsx
│   │   ├── TerminalVNC.tsx
│   │   └── PlaywrightVNC.tsx
│   ├── file-explorer/      # File management
│   │   ├── FileTree.tsx
│   │   └── FileActions.tsx
│   ├── code-editor/        # Monaco editor
│   │   └── MonacoEditor.tsx
│   └── activity-log/       # Activity stream
│       └── ActivityStream.tsx
├── lib/                     # Utilities and helpers
│   ├── prisma.ts           # Prisma client
│   └── auth.ts             # Auth utilities
├── providers/               # React context providers
│   └── refine-provider.tsx
├── prisma/                  # Database schema
│   └── schema.prisma
├── agents/                  # Agent documentation
│   ├── full-stack-developer/
│   ├── debugging/
│   ├── orchestrating/
│   ├── frontend-testing/
│   ├── documentation/
│   ├── github-manager/
│   └── ubuntu-system-admin/
├── scripts/                 # Utility scripts
│   ├── setup.sh
│   ├── start-vnc.sh
│   └── deploy.sh
├── PROJECT.md               # Architecture documentation
├── PROGRESS.md              # Development progress tracker
└── START-PROJECT-PROMPT.md  # Agent initialization guide
```

## Available Scripts

```bash
npm run dev          # Start development server on port 3000
npm run build        # Build production bundle
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Agent System

This project uses multiple coordinated AI agents:

- **Full-Stack Developer**: Implements features end-to-end
- **Frontend Testing**: Runs E2E tests with Playwright on DISPLAY :99
- **Debugging**: Investigates and fixes errors
- **Documentation**: Maintains docs and progress tracking
- **GitHub Manager**: Manages commits, PRs, and releases
- **Ubuntu System Admin**: Manages server configuration, firewall (UFW), Nginx, SSL certificates, and system security
- **Orchestrating**: Coordinates all agents and assigns tasks

See `agents/` directory for detailed documentation on each agent.

## Development Workflow

### Starting Development
```bash
# Read the project overview
cat START-PROJECT-PROMPT.md

# Check current progress
cat PROGRESS.md

# Start development server
npm run dev
```

### Making Changes
1. Create a feature branch
2. Implement the feature
3. Test locally
4. Update PROGRESS.md
5. Commit with conventional commit message
6. Create pull request

### Testing
```bash
# Run E2E tests on DISPLAY :99 (visible in VNC)
export DISPLAY=:99
npx playwright test

# Run specific test
npx playwright test tests/e2e/file-explorer.spec.ts

# Run with UI mode
npx playwright test --ui
```

## VNC Configuration

### Terminal VNC (Display :98)
- **Port**: 6081
- **Purpose**: Terminal access
- **Access**: http://localhost:3000 (embedded viewer)

### Playwright VNC (Display :99)
- **Port**: 6080
- **Purpose**: Visual browser testing
- **Access**: http://localhost:3000 (embedded viewer)

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Server
```bash
# Clone repository
git clone https://github.com/amirtafreshi/mi-ai-coding.git
cd mi-ai-coding

# Run setup script
./scripts/setup.sh

# Start services
./scripts/start-vnc.sh
npm start
```

## Contributing

We welcome contributions! Please read our **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- Development workflow
- Code style guide
- Testing requirements
- Pull request process
- Commit message conventions

**Quick Links:**
- [CONTRIBUTING.md](CONTRIBUTING.md) - Complete contribution guide
- [Bug Reports](.github/ISSUE_TEMPLATE/bug_report.md) - Report a bug
- [Feature Requests](.github/ISSUE_TEMPLATE/feature_request.md) - Request a feature
- [Questions](.github/ISSUE_TEMPLATE/question.md) - Ask a question

## Documentation

This project has comprehensive documentation:

### Getting Started
- **[INSTALL.md](INSTALL.md)** - Complete installation and deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to this project
- **[README.md](README.md)** - This file (overview and quick start)

### Technical Documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, component design, API specs
- **[docs/README.md](docs/README.md)** - Documentation directory index
- **[docs/AUTH_SETUP.md](docs/AUTH_SETUP.md)** - Authentication system details
- **[docs/VNC-SETUP.md](docs/VNC-SETUP.md)** - VNC integration setup guide

### Project Management
- **[PROGRESS.md](PROGRESS.md)** - Current project status and task tracking
- **[PROJECT.md](PROJECT.md)** - Technical overview (see docs/ARCHITECTURE.md for details)
- **[START-PROJECT-PROMPT.md](START-PROJECT-PROMPT.md)** - Agent initialization guide

### Agent Documentation
- **[agents/](agents/)** - Individual agent responsibilities and workflows
  - Full-Stack Developer, Frontend Testing, Debugging, Documentation
  - GitHub Manager, Ubuntu System Admin, Orchestrating

## Troubleshooting

### Database Connection Issues
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U youruser -d mi_ai_coding
```

### VNC Not Connecting
```bash
# Check VNC servers are running
ps aux | grep vnc

# Verify ports are listening
netstat -tulpn | grep -E '6080|6081'

# Restart VNC servers
./scripts/start-vnc.sh
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/amirtafreshi/mi-ai-coding/issues)
- Check existing documentation in `PROJECT.md`
- Review agent guides in `agents/` directory

---

**Built with Claude Code** | **Powered by Next.js, Refine, and Ant Design**
