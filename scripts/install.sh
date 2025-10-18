#!/bin/bash

# MI AI Coding Platform - Automated Installation Script
# Installs all dependencies, sets up PostgreSQL, configures VNC, and builds the application
# Version: 1.1
# Last Updated: 2025-10-18
#
# Usage:
#   ./install.sh                              # Install to $HOME/projects/mi-ai-coding
#   ./install.sh /custom/path/mi-ai-coding    # Install to custom path
#
# Prerequisites:
#   - Ubuntu/Debian system
#   - Sudo access
#   - At least 2GB free disk space
#   - The script will create required directories:
#     - $HOME/projects/ (or parent of custom path)
#     - $HOME/projects/agents/ (sibling to installation directory)

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Auto-detect current user and home directory
CURRENT_USER="${USER:-$(whoami)}"
USER_HOME="${HOME:-/home/$CURRENT_USER}"

# Default paths (can be overridden by command line arguments)
PROJECT_DIR="${1:-$USER_HOME/projects/mi-ai-coding}"
AGENTS_DIR="$(dirname "$PROJECT_DIR")/agents"

# Database configuration
DB_NAME="mi_ai_coding"
DB_USER="mi_ai_coding_user"
DB_PASSWORD="secure_password_$(openssl rand -hex 12)"

# Application configuration
NODE_VERSION="20"
APP_PORT="3002"
WS_PORT="3003"
TERMINAL_VNC_PORT="6081"
PLAYWRIGHT_VNC_PORT="6080"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

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

print_step() {
  echo -e "\n${CYAN}▶${NC} $1"
}

command_exists() {
  command -v "$1" &> /dev/null
}

# =============================================================================
# PRE-INSTALLATION CHECKS
# =============================================================================

create_required_directories() {
  print_header "Creating Required Directories"

  print_info "Current user: ${CURRENT_USER}"
  print_info "Home directory: ${USER_HOME}"
  print_info "Project directory: ${PROJECT_DIR}"
  print_info "Agents directory: ${AGENTS_DIR}"
  echo ""

  # Create projects directory if it doesn't exist
  if [ ! -d "$(dirname "$PROJECT_DIR")" ]; then
    print_step "Creating projects directory..."
    mkdir -p "$(dirname "$PROJECT_DIR")"
    print_status "Created $(dirname "$PROJECT_DIR")"
  else
    print_status "Projects directory already exists: $(dirname "$PROJECT_DIR")"
  fi

  # Create agents directory if it doesn't exist
  if [ ! -d "$AGENTS_DIR" ]; then
    print_step "Creating agents directory..."
    mkdir -p "$AGENTS_DIR"
    print_status "Created $AGENTS_DIR"
  else
    print_status "Agents directory already exists: $AGENTS_DIR"
  fi

  # Verify directories are writable
  if [ ! -w "$(dirname "$PROJECT_DIR")" ]; then
    print_error "Projects directory is not writable: $(dirname "$PROJECT_DIR")"
    exit 1
  fi

  if [ ! -w "$AGENTS_DIR" ]; then
    print_error "Agents directory is not writable: $AGENTS_DIR"
    exit 1
  fi

  print_status "All required directories created and writable"
}

pre_installation_checks() {
  print_header "Pre-Installation Checks"

  # Check if running as root (should not be)
  if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root or with sudo"
    print_info "The script will prompt for sudo when needed"
    exit 1
  fi

  # Check Ubuntu/Debian
  if ! [ -f /etc/debian_version ]; then
    print_error "This script is designed for Ubuntu/Debian systems"
    exit 1
  fi

  print_status "Running on Ubuntu/Debian system"

  # Check sudo access
  if ! sudo -n true 2>/dev/null; then
    print_info "Testing sudo access (you may be prompted for password)..."
    if ! sudo true; then
      print_error "Sudo access required for installation"
      exit 1
    fi
  fi

  print_status "Sudo access confirmed"

  # Check disk space (need at least 2GB)
  parent_dir=$(dirname "$PROJECT_DIR")
  if [ -d "$parent_dir" ]; then
    available_space=$(df -BG "$parent_dir" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 2 ]; then
      print_warning "Low disk space: ${available_space}GB available (2GB+ recommended)"
    else
      print_status "Sufficient disk space: ${available_space}GB available"
    fi
  fi
}

# =============================================================================
# SYSTEM PACKAGES
# =============================================================================

install_system_packages() {
  print_header "Installing System Packages"

  print_step "Updating package lists..."
  sudo apt-get update -qq

  print_step "Installing essential build tools..."
  sudo apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    gnupg2 \
    ca-certificates \
    lsb-release \
    apt-transport-https \
    lsof \
    netcat-openbsd

  print_status "Essential build tools installed"
}

# =============================================================================
# NODE.JS INSTALLATION
# =============================================================================

install_nodejs() {
  print_header "Installing Node.js ${NODE_VERSION}.x"

  if command_exists node; then
    current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$current_version" -ge "$NODE_VERSION" ]; then
      print_status "Node.js $(node -v) already installed"
      return 0
    else
      print_warning "Node.js $(node -v) is outdated. Installing Node.js ${NODE_VERSION}.x..."
    fi
  fi

  print_step "Adding NodeSource repository..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -

  print_step "Installing Node.js and npm..."
  sudo apt-get install -y -qq nodejs

  # Verify installation
  if command_exists node && command_exists npm; then
    print_status "Node.js $(node -v) installed successfully"
    print_status "npm $(npm -v) installed successfully"
  else
    print_error "Failed to install Node.js"
    exit 1
  fi
}

# =============================================================================
# POSTGRESQL INSTALLATION
# =============================================================================

install_postgresql() {
  print_header "Installing PostgreSQL"

  if command_exists psql; then
    print_status "PostgreSQL already installed"
    print_info "Version: $(psql --version)"
  else
    print_step "Installing PostgreSQL..."
    sudo apt-get install -y -qq postgresql postgresql-contrib

    print_step "Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql

    print_status "PostgreSQL installed and started"
  fi

  # Verify PostgreSQL is running
  if sudo systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL service is running"
  else
    print_error "PostgreSQL service failed to start"
    exit 1
  fi
}

setup_database() {
  print_header "Setting Up Database"

  print_step "Creating database user and database..."

  # Create user and database
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
  sudo -u postgres psql -c "DROP USER IF EXISTS ${DB_USER};" 2>/dev/null || true

  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

  print_status "Database '${DB_NAME}' created successfully"
  print_status "Database user '${DB_USER}' created successfully"

  # Test connection
  if PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -c "\q" 2>/dev/null; then
    print_status "Database connection test successful"
  else
    print_error "Failed to connect to database"
    exit 1
  fi
}

# =============================================================================
# VNC DEPENDENCIES
# =============================================================================

install_vnc_dependencies() {
  print_header "Installing VNC Dependencies"

  print_step "Installing VNC server and utilities..."
  sudo apt-get install -y -qq \
    x11vnc \
    xvfb \
    xclip \
    xdotool \
    fluxbox \
    xterm \
    websockify

  print_status "VNC dependencies installed"

  # Create fluxbox startup scripts
  print_step "Creating Fluxbox startup scripts..."
  mkdir -p ~/.fluxbox

  # Startup script for display :98 (Terminal)
  cat > ~/.fluxbox/startup-98 << 'FLUXBOX98'
#!/bin/bash
# Fluxbox startup for display :98 (Terminal VNC)
xterm -geometry 120x40 &
exec fluxbox
FLUXBOX98

  # Startup script for display :99 (Playwright)
  cat > ~/.fluxbox/startup-99 << 'FLUXBOX99'
#!/bin/bash
# Fluxbox startup for display :99 (Playwright VNC)
# No terminal needed for Playwright display
exec fluxbox
FLUXBOX99

  chmod +x ~/.fluxbox/startup-98
  chmod +x ~/.fluxbox/startup-99

  print_status "Fluxbox startup scripts created"
}

# =============================================================================
# PM2 INSTALLATION
# =============================================================================

install_pm2() {
  print_header "Installing PM2 Process Manager"

  if command_exists pm2; then
    print_status "PM2 already installed (version $(pm2 -v))"
  else
    print_step "Installing PM2 globally..."
    sudo npm install -g pm2

    print_step "Setting up PM2 startup script..."
    sudo pm2 startup systemd -u $USER --hp $HOME
    sudo systemctl enable pm2-$USER

    print_status "PM2 installed successfully"
  fi
}

# =============================================================================
# NGINX INSTALLATION
# =============================================================================

install_nginx() {
  print_header "Installing Nginx"

  if command_exists nginx; then
    print_status "Nginx already installed"
    print_info "Version: $(nginx -v 2>&1 | cut -d'/' -f2)"
  else
    print_step "Installing Nginx..."
    sudo apt-get install -y -qq nginx

    print_step "Starting Nginx service..."
    sudo systemctl start nginx
    sudo systemctl enable nginx

    print_status "Nginx installed and started"
  fi

  # Verify Nginx is running
  if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx service is running"
  else
    print_warning "Nginx service is not running (this is non-critical)"
  fi
}

# =============================================================================
# APPLICATION SETUP
# =============================================================================

setup_application() {
  print_header "Setting Up Application"

  cd "$PROJECT_DIR" || exit 1

  # Create .env file
  print_step "Creating .env configuration file..."

  if [ -f .env ]; then
    print_warning ".env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
  fi

  NEXTAUTH_SECRET=$(openssl rand -base64 32)

  cat > .env << ENV_FILE
# MI AI Coding Platform - Environment Configuration
# Generated: $(date)

# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:${APP_PORT}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Application Ports
APP_PORT=${APP_PORT}
WS_PORT=${WS_PORT}

# VNC Configuration
TERMINAL_VNC_PORT=${TERMINAL_VNC_PORT}
PLAYWRIGHT_VNC_PORT=${PLAYWRIGHT_VNC_PORT}
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"

# Environment
NODE_ENV=production
ENV_FILE

  print_status ".env file created successfully"

  # Install npm dependencies
  print_step "Installing npm dependencies (this may take a few minutes)..."
  if npm install --silent; then
    print_status "npm dependencies installed successfully"
  else
    print_error "Failed to install npm dependencies"
    exit 1
  fi

  # Generate Prisma client
  print_step "Generating Prisma client..."
  if npm run db:generate --silent; then
    print_status "Prisma client generated successfully"
  else
    print_error "Failed to generate Prisma client"
    exit 1
  fi

  # Push database schema
  print_step "Pushing database schema..."
  if npm run db:push --silent; then
    print_status "Database schema pushed successfully"
  else
    print_error "Failed to push database schema"
    exit 1
  fi

  # Build application
  print_step "Building application (this may take a few minutes)..."
  if npm run build; then
    print_status "Application built successfully"
  else
    print_error "Failed to build application"
    exit 1
  fi
}

# =============================================================================
# VNC SETUP
# =============================================================================

setup_vnc() {
  print_header "Setting Up VNC Servers"

  cd "$PROJECT_DIR" || exit 1

  # Make start-vnc.sh executable if it exists
  if [ -f scripts/start-vnc.sh ]; then
    chmod +x scripts/start-vnc.sh
    print_status "start-vnc.sh script is executable"

    print_step "Starting VNC servers..."
    if ./scripts/start-vnc.sh; then
      print_status "VNC servers started successfully"
    else
      print_warning "Failed to start VNC servers (non-critical)"
      print_info "You can start them later with: ./scripts/start-vnc.sh"
    fi
  else
    print_warning "start-vnc.sh script not found"
    print_info "VNC servers will need to be configured manually"
  fi
}

# =============================================================================
# PM2 CONFIGURATION
# =============================================================================

configure_pm2() {
  print_header "Configuring PM2"

  cd "$PROJECT_DIR" || exit 1

  # Create PM2 ecosystem file
  print_step "Creating PM2 ecosystem configuration..."

  cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps: [
    {
      name: 'mi-ai-coding',
      script: 'server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
    },
  ],
};
PM2CONFIG

  print_status "PM2 ecosystem configuration created"

  # Create logs directory
  mkdir -p logs

  print_step "Starting application with PM2..."
  pm2 start ecosystem.config.js

  print_step "Saving PM2 configuration..."
  pm2 save

  print_status "Application configured with PM2"
}

# =============================================================================
# FIREWALL CONFIGURATION
# =============================================================================

configure_firewall() {
  print_header "Configuring Firewall (UFW)"

  if ! command_exists ufw; then
    print_warning "UFW not installed. Skipping firewall configuration."
    return 0
  fi

  print_step "Configuring UFW rules..."

  # Check if UFW is active
  if sudo ufw status | grep -q "Status: active"; then
    print_info "UFW is active. Adding rules..."

    sudo ufw allow ${APP_PORT}/tcp comment "MI AI Coding - App"
    sudo ufw allow ${WS_PORT}/tcp comment "MI AI Coding - WebSocket"
    sudo ufw allow ${TERMINAL_VNC_PORT}/tcp comment "MI AI Coding - Terminal VNC"
    sudo ufw allow ${PLAYWRIGHT_VNC_PORT}/tcp comment "MI AI Coding - Playwright VNC"

    print_status "Firewall rules configured"
  else
    print_warning "UFW is not active. Firewall rules not applied."
    print_info "To enable UFW: sudo ufw enable"
  fi
}

# =============================================================================
# POST-INSTALLATION
# =============================================================================

post_installation() {
  print_header "Installation Complete"

  echo ""
  echo -e "${GREEN}MI AI Coding Platform has been successfully installed!${NC}"
  echo ""
  echo "Application Details:"
  echo "  Application URL:    http://localhost:${APP_PORT}"
  echo "  WebSocket URL:      ws://localhost:${WS_PORT}"
  echo "  Terminal VNC:       ws://localhost:${TERMINAL_VNC_PORT}"
  echo "  Playwright VNC:     ws://localhost:${PLAYWRIGHT_VNC_PORT}"
  echo ""
  echo "Database Information:"
  echo "  Database Name:      ${DB_NAME}"
  echo "  Database User:      ${DB_USER}"
  echo "  Database Password:  ${DB_PASSWORD}"
  echo "  Connection String:  See .env file"
  echo ""
  echo "Next Steps:"
  echo ""
  echo "  1. Verify installation:"
  echo "     cd ${PROJECT_DIR}"
  echo "     ./scripts/verify-installation.sh"
  echo ""
  echo "  2. Check application status:"
  echo "     pm2 status"
  echo "     pm2 logs mi-ai-coding"
  echo ""
  echo "  3. Access the application:"
  echo "     Open http://localhost:${APP_PORT} in your browser"
  echo ""
  echo "  4. View VNC displays:"
  echo "     Terminal:   http://localhost:${TERMINAL_VNC_PORT}"
  echo "     Playwright: http://localhost:${PLAYWRIGHT_VNC_PORT}"
  echo ""
  echo "Useful Commands:"
  echo "  pm2 restart mi-ai-coding    # Restart application"
  echo "  pm2 stop mi-ai-coding       # Stop application"
  echo "  pm2 logs mi-ai-coding       # View logs"
  echo "  pm2 monit                   # Monitor resources"
  echo "  ./scripts/start-vnc.sh      # Start VNC servers"
  echo ""
  echo "Documentation:"
  echo "  README.md       - Quick start guide"
  echo "  PROJECT.md      - Architecture documentation"
  echo "  DEPLOYMENT.md   - Deployment guide"
  echo "  PROGRESS.md     - Current project status"
  echo ""
  echo "Important Files:"
  echo "  .env                      - Environment configuration"
  echo "  ecosystem.config.js       - PM2 configuration"
  echo "  logs/pm2-*.log           - Application logs"
  echo ""
  echo -e "${YELLOW}Note: Save the database password from above!${NC}"
  echo -e "${YELLOW}It has been saved to the .env file.${NC}"
  echo ""
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

cleanup_on_error() {
  print_error "Installation failed!"
  print_info "Check the error messages above for details"
  print_info "You can re-run this script to try again"
  exit 1
}

trap cleanup_on_error ERR

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  print_header "MI AI Coding Platform - Installation Script"
  print_info "This script will install all dependencies and set up the application"
  print_info "Installation directory: ${PROJECT_DIR}"
  echo ""

  # Confirm installation
  read -p "Continue with installation? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installation cancelled"
    exit 0
  fi

  # Run installation steps
  create_required_directories
  pre_installation_checks
  install_system_packages
  install_nodejs
  install_postgresql
  setup_database
  install_vnc_dependencies
  install_pm2
  install_nginx
  setup_application
  setup_vnc
  configure_pm2
  configure_firewall
  post_installation
}

# Run main function
main

exit 0
