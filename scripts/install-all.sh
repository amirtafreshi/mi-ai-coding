#!/bin/bash

# MI AI Coding Platform - Automated Installation Script
# This script installs all dependencies and configures the application
# Designed for quick deployment on multiple Ubuntu servers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
  echo -e "\n${CYAN}=========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}=========================================${NC}\n"
}

print_status() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

print_info() {
  echo -e "${BLUE}[i]${NC} $1"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  print_error "This script must be run with sudo"
  print_info "Usage: sudo $0"
  exit 1
fi

print_header "MI AI Coding Platform - Automated Installation"

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)
APP_DIR="$ACTUAL_HOME/projects/mi-ai-coding"

print_info "Installation directory: $APP_DIR"
print_info "User: $ACTUAL_USER"

# Step 1: Update system
print_info "Step 1: Updating system packages..."
apt update && apt upgrade -y
print_status "System updated"

# Step 2: Install Node.js 20.x
print_info "Step 2: Installing Node.js 20.x..."

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  print_warning "Node.js already installed: $NODE_VERSION"
  read -p "Do you want to reinstall Node.js 20.x? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
  fi
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

print_status "Node.js installed: $(node --version)"
print_status "NPM installed: $(npm --version)"

# Step 3: Install PostgreSQL
print_info "Step 3: Installing PostgreSQL..."

if command -v psql &> /dev/null; then
  print_warning "PostgreSQL already installed"
else
  apt install -y postgresql postgresql-contrib
  systemctl start postgresql
  systemctl enable postgresql
  print_status "PostgreSQL installed and started"
fi

# Step 4: Install VNC dependencies
print_info "Step 4: Installing VNC dependencies..."

apt install -y \
  x11vnc \
  xvfb \
  fluxbox \
  xterm \
  xclip \
  xdotool \
  chromium-browser \
  fonts-liberation \
  fonts-noto

print_status "VNC dependencies installed"

# Step 5: Install Nginx
print_info "Step 5: Installing Nginx..."

if command -v nginx &> /dev/null; then
  print_warning "Nginx already installed"
else
  apt install -y nginx
  systemctl enable nginx
  print_status "Nginx installed"
fi

# Step 6: Install build tools
print_info "Step 6: Installing build tools..."

apt install -y build-essential git curl wget python3 python3-pip

print_status "Build tools installed"

# Step 7: Configure PostgreSQL database
print_info "Step 7: Configuring PostgreSQL database..."

DB_NAME="mi_ai_coding"
DB_USER="mi_user"
DB_PASS="SecurePass123!"

print_info "Creating database: $DB_NAME"
print_info "Creating user: $DB_USER"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

print_status "Database configured"

# Step 8: Install NPM dependencies
print_info "Step 8: Installing NPM dependencies..."

cd "$APP_DIR"

if [ -f "package.json" ]; then
  print_info "Installing packages as user $ACTUAL_USER..."
  sudo -u $ACTUAL_USER npm install
  print_status "NPM dependencies installed"
else
  print_error "package.json not found in $APP_DIR"
  print_info "Please run this script from the mi-ai-coding directory"
  exit 1
fi

# Step 9: Create .env file if not exists
print_info "Step 9: Configuring environment variables..."

if [ ! -f ".env" ]; then
  print_info "Creating .env file..."

  # Generate random secret
  NEXTAUTH_SECRET=$(openssl rand -base64 32)

  cat > .env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# VNC Configuration
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"

# Application
APP_PORT=3000
NODE_ENV="development"

# WebSocket
WS_PORT=3001
EOF

  chown $ACTUAL_USER:$ACTUAL_USER .env
  print_status ".env file created"
else
  print_warning ".env file already exists, skipping"
fi

# Step 10: Initialize database
print_info "Step 10: Initializing database schema..."

sudo -u $ACTUAL_USER npm run db:generate
sudo -u $ACTUAL_USER npm run db:push

print_status "Database schema initialized"

# Step 11: Make scripts executable
print_info "Step 11: Setting script permissions..."

chmod +x scripts/*.sh
chown -R $ACTUAL_USER:$ACTUAL_USER scripts/

print_status "Script permissions set"

# Step 12: Start VNC servers
print_info "Step 12: Starting VNC servers..."

sudo -u $ACTUAL_USER ./scripts/start-vnc.sh

print_status "VNC servers started"

# Step 13: Configure firewall (optional)
print_info "Step 13: Configuring firewall..."

if command -v ufw &> /dev/null; then
  read -p "Do you want to configure UFW firewall? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    ufw allow 22/tcp comment "SSH"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    ufw allow 3000/tcp comment "Next.js App"
    ufw allow 6080/tcp comment "Playwright VNC"
    ufw allow 6081/tcp comment "Terminal VNC"
    print_status "Firewall configured"
  else
    print_warning "Firewall configuration skipped"
  fi
else
  print_warning "UFW not installed, skipping firewall configuration"
fi

# Step 14: Install PM2 (optional)
print_info "Step 14: Installing PM2 process manager..."

read -p "Do you want to install PM2 for production deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm install -g pm2
  print_status "PM2 installed"

  # Build application
  print_info "Building application for production..."
  sudo -u $ACTUAL_USER npm run build
  print_status "Application built"
else
  print_warning "PM2 installation skipped"
fi

# Installation complete
print_header "Installation Complete!"

print_status "MI AI Coding Platform successfully installed"

echo ""
print_info "Installation Summary:"
echo "  - Node.js: $(node --version)"
echo "  - PostgreSQL: Installed and configured"
echo "  - Database: $DB_NAME"
echo "  - VNC Servers: Running on displays :98 and :99"
echo "  - Application directory: $APP_DIR"
echo ""

print_info "Next Steps:"
echo ""
echo "  1. Review and update .env file:"
echo "     nano $APP_DIR/.env"
echo ""
echo "  2. Start development server:"
echo "     cd $APP_DIR"
echo "     npm run dev"
echo ""
echo "  3. Or start with PM2 (production):"
echo "     cd $APP_DIR"
echo "     pm2 start npm --name mi-ai-coding -- start"
echo ""
echo "  4. Configure domain and SSL (optional):"
echo "     sudo ./scripts/setup-domain-ssl.sh"
echo ""

print_info "Access URLs:"
echo "  - Application: http://localhost:3000"
echo "  - Terminal VNC: http://localhost:6081"
echo "  - Playwright VNC: http://localhost:6080"
echo ""

print_info "Documentation:"
echo "  - Installation Guide: $APP_DIR/INSTALLATION.md"
echo "  - Domain Setup: $APP_DIR/DOMAIN-SETUP.md"
echo "  - README: $APP_DIR/README.md"
echo ""

print_info "Database Credentials (save these!):"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo "  - Password: $DB_PASS"
echo "  - Connection: postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""

print_warning "SECURITY REMINDER:"
echo "  - Change the default database password in .env"
echo "  - Update NEXTAUTH_SECRET for production"
echo "  - Configure SSL certificate for HTTPS"
echo ""

print_status "Happy coding! 🚀"
