# MI AI Coding Platform - Documentation Index

This directory contains all project documentation, including architecture guides and setup instructions.

## Quick Links

- **[QUICK START](./QUICK-START.md)** - Get running in 5 minutes
- **[ARCHITECTURE](./ARCHITECTURE.md)** - Complete technical architecture and API documentation
- [Installation Guide](../INSTALL.md) - Comprehensive setup guide
- [Project README](../README.md) - User-facing overview
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Current Progress](../PROGRESS.md) - Development status

---

## Directory Structure

```
docs/
├── README.md                          # This file - documentation index
├── QUICK-START.md                     # 5-minute quick start guide
├── ARCHITECTURE.md                    # Complete technical architecture
├── TROUBLESHOOTING.md                 # Common issues and solutions
├── SKILLS-WORKFLOW.md                 # Skills Management system workflow
├── architecture/                       # Additional architecture documentation
│   └── START-PROJECT-PROMPT.md        # Master instructions for agent initialization
├── reports/                            # Test reports and documentation
│   ├── SKILLS-MANAGEMENT-E2E-TEST-REPORT.md
│   └── SKILLS-TESTING-SUMMARY.md
├── AUTH_SETUP.md                      # Authentication setup guide
├── VNC-SETUP.md                       # VNC server setup guide
├── AGENT_CREATION_ALTERNATIVES.md     # Agent creation alternatives
├── AGENT_CREATION_IMPLEMENTATION_PLAN.md # Agent creation implementation plan
└── AGENT_CREATION_QUICK_START.md      # Agent creation quick start guide
```

## Core Documentation (in project root)

- **[CLAUDE.md](../CLAUDE.md)** - Essential guidance for Claude Code when working with this codebase
- **[README.md](../README.md)** - User-facing setup guide and features list
- **[INSTALL.md](../INSTALL.md)** - Complete installation and deployment guide
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines and development workflow
- **[PROJECT.md](../PROJECT.md)** - Project overview and technical details
- **[PROGRESS.md](../PROGRESS.md)** - Current project status and phase tracking

## Architecture Documentation

### [ARCHITECTURE.md](./ARCHITECTURE.md)
Complete technical architecture documentation covering:
- System architecture with ASCII diagrams
- Component hierarchy and relationships
- Database schema with entity relationships
- Full API documentation (11 endpoints)
- WebSocket communication patterns
- VNC integration architecture
- Authentication flow and security

### [QUICK-START.md](./QUICK-START.md)
5-minute quick start guide with:
- One-command setup
- Essential commands reference
- Common tasks and examples
- Quick troubleshooting (top 5 issues)

### [START-PROJECT-PROMPT.md](./architecture/START-PROJECT-PROMPT.md)
Master instructions for the multi-agent system:
- Project overview and objectives
- 7-phase implementation plan
- Agent roles and responsibilities
- Development workflow

### [AUTH_SETUP.md](./AUTH_SETUP.md)
Authentication system documentation:
- NextAuth.js configuration
- User authentication flow
- Session management
- API route protection

### [VNC-SETUP.md](./VNC-SETUP.md)
VNC integration guide:
- Dual display setup (:98 Terminal, :99 Playwright)
- noVNC HTML5 client configuration
- Clipboard integration
- Browser automation requirements

### [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
Comprehensive troubleshooting guide covering:
- WebSocket connection issues (Activity Stream, VNC)
- Skills Management issues (API methods, modal workflows)
- API endpoint debugging
- VNC connection problems
- Authentication issues
- File system operations
- Quick reference for port configurations
- Recent fixes log with solutions

### [SKILLS-WORKFLOW.md](./SKILLS-WORKFLOW.md)
Skills Management system documentation:
- Complete workflow with visual diagrams
- AI-generated vs. manual skill creation
- Resource upload automation
- Component architecture and data flow
- Recent improvements and fixes
- API endpoint specifications
- User guide with best practices
- Testing checklist

## Agent Documentation

Agent-specific documentation is located in `/agents/`:
- **orchestrating/** - Coordinates all agents and assigns tasks
- **full-stack-developer/** - Implements features end-to-end
- **frontend-testing/** - Runs E2E tests with Playwright
- **debugging/** - Investigates and fixes errors
- **documentation/** - Maintains docs and PROGRESS.md
- **github-manager/** - Manages commits, PRs, releases
- **ubuntu-system-admin/** - Server config, security, deployment

## How to Use This Documentation

1. **Quick Start**: Follow [QUICK-START.md](./QUICK-START.md) to get running in 5 minutes
2. **Initial Setup**: Follow [INSTALL.md](../INSTALL.md) for comprehensive installation
3. **Understanding Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
4. **Troubleshooting**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions
5. **Skills Management**: Read [SKILLS-WORKFLOW.md](./SKILLS-WORKFLOW.md) for complete workflow documentation
6. **Contributing**: Review [CONTRIBUTING.md](../CONTRIBUTING.md) for development workflow
7. **Phase Planning**: Check [PROGRESS.md](../PROGRESS.md) for current status
8. **Agent Coordination**: Check [agents/orchestrating/README.md](../agents/orchestrating/README.md)
9. **Running Tests**: Use npm scripts defined in [CLAUDE.md](../CLAUDE.md)

## Documentation Standards

All documentation follows these conventions:
- Markdown format with ATX headers
- Code blocks with language specification
- Tables for structured data
- Status emojis (✅ ⏳ 🔄 ⚠️ ❌)
- Absolute file paths in cross-references

## Updating Documentation

When adding new documentation:
1. Place architecture docs in `docs/` or `docs/architecture/`
2. Update this index file with new content
3. Ensure cross-references are accurate
4. Follow documentation standards above
5. Log documentation changes to ActivityLog database

## Additional Resources

- **[GitHub Repository](https://github.com/amirtafreshi/mi-ai-coding)** - Source code
- **[Issue Tracker](https://github.com/amirtafreshi/mi-ai-coding/issues)** - Bug reports and feature requests
- **[Changelog](../CHANGELOG.md)** - Version history
- **[License](../LICENSE)** - MIT License

---

## Recent Documentation Updates

### 2025-10-19
- Added **TROUBLESHOOTING.md** - Comprehensive guide for common issues
- Added **SKILLS-WORKFLOW.md** - Complete Skills Management workflow documentation
- Documented WebSocket port configuration fix
- Documented SkillResourceModal API method fix
- Documented Resource Modal auto-open enhancement

### 2025-10-12
- Updated ARCHITECTURE.md with complete system documentation
- Added QUICK-START.md for rapid onboarding
- Enhanced directory structure documentation

---

**Last Updated**: 2025-10-19
**Documentation Agent**: Claude Code
