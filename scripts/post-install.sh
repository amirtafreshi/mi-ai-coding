#!/bin/bash
set -e

echo "========================================="
echo "MI AI Coding - Post-Installation Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 1. Create required directories
echo -e "${BLUE}▶${NC} Creating required directories..."
if [ ! -d "/home/master/projects" ]; then
  mkdir -p /home/master/projects
  chown master:master /home/master/projects 2>/dev/null || echo -e "${YELLOW}⚠${NC} Could not set ownership (run with sudo if needed)"
  chmod 755 /home/master/projects
  echo -e "${GREEN}✓${NC} Directory created: /home/master/projects"
else
  echo -e "${GREEN}✓${NC} Directory already exists: /home/master/projects"
fi

# 2. Create .claude/agents directory structure for all projects
echo -e "${BLUE}▶${NC} Creating .claude/agents directory structure..."
for project_dir in /home/master/projects/*/; do
  if [ -d "$project_dir" ] && [ "$(basename "$project_dir")" != "agents" ]; then
    mkdir -p "$project_dir/.claude/agents"
    chown -R master:master "$project_dir/.claude" 2>/dev/null || true
    chmod -R 755 "$project_dir/.claude" 2>/dev/null || true
  fi
done
# Also create for sample project (will be created later)
echo -e "${GREEN}✓${NC} .claude/agents directories created"

# 3. Create symlink to agents
echo -e "${BLUE}▶${NC} Creating symlink to agents folder..."
if [ ! -L "/home/master/projects/agents" ]; then
  ln -s "$PROJECT_DIR/agents" /home/master/projects/agents
  chown -h master:master /home/master/projects/agents 2>/dev/null || echo -e "${YELLOW}⚠${NC} Could not set ownership (run with sudo if needed)"
  echo -e "${GREEN}✓${NC} Symlink created: /home/master/projects/agents -> $PROJECT_DIR/agents"
else
  echo -e "${GREEN}✓${NC} Symlink already exists"
fi

# 4. Seed database
echo -e "${BLUE}▶${NC} Seeding database with default users..."
cd "$PROJECT_DIR"
if npm run db:seed; then
  echo -e "${GREEN}✓${NC} Database seeded successfully"
else
  echo -e "${RED}✗${NC} Database seeding failed. Please run manually: npm run db:seed"
fi

# 5. Configure firewall (only if UFW is available)
echo -e "${BLUE}▶${NC} Configuring firewall..."
if command -v ufw &> /dev/null; then
  if sudo ufw status | grep -q "Status: active"; then
    PORTS_OPENED=0
    if sudo ufw allow 3000/tcp &> /dev/null; then
      echo -e "${GREEN}✓${NC} Port 3000/tcp allowed (Next.js app)"
      PORTS_OPENED=$((PORTS_OPENED + 1))
    fi
    if sudo ufw allow 3001/tcp &> /dev/null; then
      echo -e "${GREEN}✓${NC} Port 3001/tcp allowed (WebSocket server)"
      PORTS_OPENED=$((PORTS_OPENED + 1))
    fi
    if sudo ufw allow 6080/tcp &> /dev/null; then
      echo -e "${GREEN}✓${NC} Port 6080/tcp allowed (VNC Playwright)"
      PORTS_OPENED=$((PORTS_OPENED + 1))
    fi
    if sudo ufw allow 6081/tcp &> /dev/null; then
      echo -e "${GREEN}✓${NC} Port 6081/tcp allowed (VNC Terminal)"
      PORTS_OPENED=$((PORTS_OPENED + 1))
    fi
    if [ $PORTS_OPENED -gt 0 ]; then
      echo -e "${GREEN}✓${NC} Firewall configured ($PORTS_OPENED ports opened)"
    else
      echo -e "${YELLOW}⚠${NC} Could not configure firewall (run with sudo if needed)"
    fi
  else
    echo -e "${YELLOW}⚠${NC} UFW is installed but not active. Skipping firewall configuration."
    echo -e "   To enable: sudo ufw enable && sudo ufw allow 3000/tcp 3001/tcp 6080/tcp 6081/tcp"
  fi
else
  echo -e "${YELLOW}⚠${NC} UFW not installed, skipping firewall configuration"
fi

# 6. Create sample project
echo -e "${BLUE}▶${NC} Creating sample project..."
if [ ! -d "/home/master/projects/sample-project" ]; then
  mkdir -p /home/master/projects/sample-project
  mkdir -p /home/master/projects/sample-project/.claude/agents
  cat > /home/master/projects/sample-project/README.md <<EOF
# Sample Project

This is a sample project created by MI AI Coding Platform.

## Getting Started

You can use this folder to test the file explorer, code editor, and other features.

## Features

- File management
- Code editing with Monaco Editor
- VNC integration for visual debugging
- Real-time activity logging

## Documentation

- [Installation Guide](https://github.com/amirtafreshi/mi-ai-coding/blob/main/INSTALL.md)
- [Contributing Guide](https://github.com/amirtafreshi/mi-ai-coding/blob/main/CONTRIBUTING.md)
- [Architecture](https://github.com/amirtafreshi/mi-ai-coding/blob/main/docs/ARCHITECTURE.md)
EOF
  chown -R master:master /home/master/projects/sample-project 2>/dev/null || true
  echo -e "${GREEN}✓${NC} Sample project created"
else
  echo -e "${GREEN}✓${NC} Sample project already exists"
fi

# 6. Verify installation
echo ""
echo -e "${BLUE}▶${NC} Verifying installation..."

# Check PostgreSQL
if systemctl is-active --quiet postgresql 2>/dev/null || pgrep -x postgres > /dev/null; then
  echo -e "${GREEN}✓${NC} PostgreSQL is running"
else
  echo -e "${RED}✗${NC} PostgreSQL is not running. Please start it: sudo systemctl start postgresql"
fi

# Check VNC servers
if pgrep -f "Xvfb.*:98" > /dev/null && pgrep -f "Xvfb.*:99" > /dev/null; then
  echo -e "${GREEN}✓${NC} VNC servers are running"
else
  echo -e "${YELLOW}⚠${NC} VNC servers not detected. Start them: ./scripts/start-vnc.sh"
fi

# Check node_modules
if [ -d "$PROJECT_DIR/node_modules" ]; then
  echo -e "${GREEN}✓${NC} Node modules installed"
else
  echo -e "${RED}✗${NC} Node modules not found. Run: npm install"
fi

# Check Prisma client
if [ -d "$PROJECT_DIR/node_modules/.prisma/client" ]; then
  echo -e "${GREEN}✓${NC} Prisma client generated"
else
  echo -e "${RED}✗${NC} Prisma client not generated. Run: npm run db:generate"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ Post-installation setup complete${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Start VNC servers (if not running): ./scripts/start-vnc.sh"
echo "  2. Build application: npm run build"
echo "  3. Start server: npm start"
echo ""
echo "Default login credentials:"
echo "  Admin: admin@example.com / admin123"
echo "  User:  user@example.com / user123"
echo ""
echo "Access the application:"
echo "  Local:    http://localhost:3000"
echo "  External: http://YOUR_SERVER_IP:3000"
echo ""
