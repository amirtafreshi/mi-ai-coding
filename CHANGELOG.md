# Changelog

All notable changes to the MI AI Coding Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Agent system integration for multi-agent workflows
- Advanced VNC clipboard operations
- Activity log filtering UI
- Real-time collaboration features
- Performance optimizations

## [1.0.0] - 2025-10-12

### Added
- Complete authentication system with NextAuth
  - Credentials provider with bcrypt password hashing
  - Session management with JWT tokens
  - Protected route middleware
  - Login/logout functionality
- File management system with CRUD operations
  - File explorer with tree navigation
  - File and folder creation
  - File content editing
  - File and folder deletion
  - Monaco code editor integration
- Dual VNC display integration
  - Terminal VNC on display :98 (port 6081)
  - Playwright VNC on display :99 (port 6080)
  - noVNC HTML5 client integration
  - VNC clipboard API (copy/paste with xclip/xdotool)
- Real-time activity logging
  - WebSocket server for live updates
  - Activity log API with filtering
  - Real-time activity stream component
  - Agent action tracking
- Responsive UI with Ant Design
  - Mobile-optimized layout
  - Desktop, tablet, and mobile support
  - Resizable panels with persistence
  - Header, sidebar, and content areas
- Multi-agent system documentation
  - 7 coordinated AI agents
  - Agent-specific README files
  - Task coordination via PROGRESS.md
- Comprehensive E2E testing
  - Playwright test suite (14 tests)
  - Authentication tests (7 tests)
  - Dashboard verification tests
  - Responsive design tests
  - All tests running on DISPLAY :99
- Production deployment infrastructure
  - VNC server management scripts
  - Setup and deployment automation
  - Environment configuration
  - Database migrations

### Changed
- Next.js upgraded to 15.5.4 with App Router
- React upgraded to 19.2
- TypeScript 5.9 with strict mode
- Prisma ORM 6.16.3 for database management
- Ant Design 5.27.4 with custom theme
- Tailwind CSS 4.1.14 for styling

### Fixed
- React error overlay blocking dashboard (nested PanelGroup issue)
- NextAuth session route conflict
- MonacoEditor useEffect dependencies
- VNCViewer canvas clearing errors
- Console warnings for Ant Design + React 19 compatibility
- Favicon 404 errors
- WebSocket reconnection handling

### Security
- bcrypt password hashing for user credentials
- JWT session tokens with expiration
- Protected API routes with middleware
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention in file content

## [0.1.0] - 2025-10-04

### Added
- Initial project setup
- Next.js 15 with App Router
- Prisma database schema
- PostgreSQL integration
- Basic authentication structure
- Project documentation
  - START-PROJECT-PROMPT.md
  - PROJECT.md
  - PROGRESS.md
  - README.md
  - CLAUDE.md

## Types of Changes

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

## Version History

- **1.0.0** - First production release with complete feature set
- **0.1.0** - Initial project setup and foundation

## Upgrade Guide

### Upgrading to 1.0.0 from 0.1.0

1. **Update dependencies:**
   ```bash
   npm install
   ```

2. **Update database schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Update environment variables:**
   ```bash
   cp .env.example .env
   # Update .env with your configuration
   ```

4. **Start VNC servers:**
   ```bash
   ./scripts/start-vnc.sh
   ```

5. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Release Notes

For detailed release notes, see the [Releases](https://github.com/yourusername/mi-ai-coding/releases) page.

---

**Maintained by**: MI AI Coding Team
**Generated with**: Claude Code
**Last Updated**: 2025-10-12
