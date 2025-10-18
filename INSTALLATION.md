# MI AI Coding Platform - Installation Guide

Complete guide for installing the MI AI Coding Platform on Ubuntu 22.04+ servers.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Installation](#quick-installation)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [VNC Setup](#vnc-setup)
- [SSL Configuration](#ssl-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS**: Ubuntu 22.04 LTS or 24.04 LTS (recommended)
- **RAM**: Minimum 4GB (8GB+ recommended)
- **CPU**: 2+ cores recommended
- **Disk**: 20GB+ free space
- **User**: Non-root user with sudo access (**do not install as root**)

### Required Directory Structure

The application requires these directories (automatically created by install.sh):

```
/home/USERNAME/
├── projects/
│   ├── mi-ai-coding/     # Main application
│   └── agents/           # Agent configurations (required)
```

Replace `USERNAME` with your Linux username.

### Required Software

The installation script will install these automatically:

- Node.js 20.x LTS
- PostgreSQL 14+
- Nginx
- PM2 (process manager)
- x11vnc, xvfb, xclip, xdotool (VNC dependencies)
- Git

---

## Quick Installation

### One-Command Install

**Step 1: Clone the repository**
\`\`\`bash
# Clone to the standard location
git clone https://github.com/yourusername/mi-ai-coding.git ~/projects/mi-ai-coding
cd ~/projects/mi-ai-coding
\`\`\`

**Step 2: Run the automated installation script**
\`\`\`bash
chmod +x scripts/install.sh
./scripts/install.sh
\`\`\`

**⚠️ Important:** Do NOT use `sudo` to run install.sh. Run as your regular user. The script will prompt for sudo when needed.

**Custom Installation Path** (optional):
\`\`\`bash
./scripts/install.sh /custom/path/mi-ai-coding
\`\`\`

The installation script will:
1. **Create required directories** (`~/projects/` and `~/projects/agents/`)
2. Auto-detect current user and configure paths
3. Install all system dependencies
4. Set up PostgreSQL database
5. Configure environment variables with correct paths
6. Install Node.js dependencies
7. Set up VNC displays (:98 and :99)
8. Configure Nginx reverse proxy
9. Set up PM2 for process management
10. Generate SSL certificates (Let's Encrypt)

**Installation Time**: 5-10 minutes (depending on internet speed)

---

See full documentation in the file for complete manual installation steps, configuration details, and troubleshooting guide.
