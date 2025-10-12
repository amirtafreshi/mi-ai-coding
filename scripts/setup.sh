#!/bin/bash

# MI AI Coding Platform - Enhanced Setup Script
# This script automates the complete setup process with comprehensive checks and options
# Version: 2.0
# Last Updated: 2025-10-12

set -e  # Exit on error

# =============================================================================
# CONFIGURATION
# =============================================================================

# Minimum required versions
MIN_NODE_VERSION=18
MIN_POSTGRES_VERSION=12
MIN_DISK_SPACE_GB=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="/tmp/mi-ai-coding-setup-$(date +%Y%m%d-%H%M%S).log"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Function to print status messages
print_header() {
  echo -e "\n${CYAN}=========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}=========================================${NC}\n"
}

print_status() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

print_info() {
  echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"
}

print_step() {
  echo -e "\n${CYAN}▶${NC} $1" | tee -a "$LOG_FILE"
}

# Function to log commands
log_command() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] COMMAND: $*" >> "$LOG_FILE"
}

# Function to check command success
check_success() {
  if [ $? -eq 0 ]; then
    print_status "$1"
    return 0
  else
    print_error "$1 failed"
    return 1
  fi
}

# Function to confirm action
confirm_action() {
  local prompt="$1"
  local default="${2:-n}"

  if [ "$default" = "y" ]; then
    read -p "$prompt (Y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Nn]$ ]] && return 1
  else
    read -p "$prompt (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || return 1
  fi
  return 0
}

# =============================================================================
# SYSTEM CHECKS
# =============================================================================

check_os() {
  print_step "Checking operating system..."

  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$NAME
    OS_VERSION=$VERSION_ID
    print_status "OS: $OS_NAME $OS_VERSION"

    # Check if Ubuntu/Debian
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
      print_warning "This script is optimized for Ubuntu/Debian. You may encounter issues on $OS_NAME"
    fi

    # Check Ubuntu version
    if [[ "$ID" == "ubuntu" ]]; then
      MAJOR_VERSION=$(echo "$OS_VERSION" | cut -d. -f1)
      if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_warning "Ubuntu 18.04+ is recommended. Current: $OS_VERSION"
      fi
    fi
  else
    print_warning "Cannot detect OS version"
    OS_NAME="Unknown"
    OS_VERSION="Unknown"
  fi
}

check_user() {
  print_step "Checking user privileges..."

  if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    print_info "Run as a regular user with sudo privileges"
    exit 1
  fi

  # Check if user has sudo privileges
  if sudo -n true 2>/dev/null; then
    print_status "User has sudo privileges"
  else
    print_warning "This script may require sudo privileges"
    print_info "You may be prompted for your password"
  fi
}

check_disk_space() {
  print_step "Checking disk space..."

  AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')

  if [ "$AVAILABLE_SPACE" -lt "$MIN_DISK_SPACE_GB" ]; then
    print_error "Insufficient disk space. Required: ${MIN_DISK_SPACE_GB}GB, Available: ${AVAILABLE_SPACE}GB"
    exit 1
  fi

  print_status "Available disk space: ${AVAILABLE_SPACE}GB"
}

check_memory() {
  print_step "Checking system memory..."

  TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
  AVAILABLE_MEM=$(free -g | awk '/^Mem:/{print $7}')

  print_info "Total memory: ${TOTAL_MEM}GB, Available: ${AVAILABLE_MEM}GB"

  if [ "$TOTAL_MEM" -lt 2 ]; then
    print_warning "Less than 2GB RAM detected. Application may run slowly"
  else
    print_status "Memory check passed"
  fi
}

check_network() {
  print_step "Checking network connectivity..."

  if ping -c 1 8.8.8.8 &> /dev/null; then
    print_status "Network connectivity OK"
  else
    print_warning "No network connectivity detected"
    print_info "You may need network access to install dependencies"
  fi
}

check_ports() {
  print_step "Checking required ports availability..."

  local ports_in_use=()

  # Check each required port
  for port in 3000 3001 6080 6081 5432; do
    if lsof -i:$port > /dev/null 2>&1; then
      ports_in_use+=($port)
    fi
  done

  if [ ${#ports_in_use[@]} -gt 0 ]; then
    print_warning "Ports in use: ${ports_in_use[*]}"
    print_info "These ports may need to be freed before starting the application"

    # Show what's using the ports
    for port in "${ports_in_use[@]}"; do
      PROCESS=$(lsof -ti:$port 2>/dev/null | head -n1)
      if [ -n "$PROCESS" ]; then
        PROCESS_NAME=$(ps -p $PROCESS -o comm= 2>/dev/null || echo "Unknown")
        print_info "  Port $port: $PROCESS_NAME (PID: $PROCESS)"
      fi
    done
  else
    print_status "All required ports are available (3000, 3001, 6080, 6081, 5432)"
  fi
}

# =============================================================================
# DEPENDENCY CHECKS AND INSTALLATION
# =============================================================================

check_node() {
  print_step "Checking Node.js..."

  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    print_info "Visit: https://nodejs.org/ or use nvm: https://github.com/nvm-sh/nvm"

    if confirm_action "Would you like installation instructions?"; then
      echo ""
      echo "Option 1: Install via NodeSource (recommended):"
      echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
      echo "  sudo apt-get install -y nodejs"
      echo ""
      echo "Option 2: Install via NVM:"
      echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
      echo "  nvm install 20"
      echo ""
    fi
    exit 1
  fi

  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  NPM_VERSION=$(npm -v)

  if [ "$NODE_VERSION" -lt "$MIN_NODE_VERSION" ]; then
    print_error "Node.js version must be $MIN_NODE_VERSION or higher. Current: $(node -v)"
    exit 1
  fi

  print_status "Node.js: $(node -v), npm: v$NPM_VERSION"
}

check_postgresql() {
  print_step "Checking PostgreSQL..."

  if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client is not installed"

    if confirm_action "Do you want to install PostgreSQL?"; then
      log_command "Installing PostgreSQL"
      sudo apt-get update
      sudo apt-get install -y postgresql postgresql-contrib
      sudo systemctl start postgresql
      sudo systemctl enable postgresql
      check_success "PostgreSQL installation"
    else
      print_error "PostgreSQL is required for this application"
      exit 1
    fi
  else
    print_status "PostgreSQL client is installed"
  fi

  # Check PostgreSQL version
  if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | awk '{print $3}' | cut -d'.' -f1)
    print_info "PostgreSQL version: $PG_VERSION"

    if [ "$PG_VERSION" -lt "$MIN_POSTGRES_VERSION" ]; then
      print_warning "PostgreSQL $MIN_POSTGRES_VERSION+ is recommended. Current: $PG_VERSION"
    fi
  fi

  # Check if PostgreSQL service is running
  if systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL service is running"
  else
    print_warning "PostgreSQL service is not running"

    if confirm_action "Start PostgreSQL service?"; then
      sudo systemctl start postgresql
      check_success "Starting PostgreSQL"
    fi
  fi
}

check_vnc_dependencies() {
  print_step "Checking VNC dependencies..."

  local MISSING_DEPS=()
  local REQUIRED_DEPS=("x11vnc" "xvfb" "xclip" "xdotool" "fluxbox")

  for dep in "${REQUIRED_DEPS[@]}"; do
    if ! command -v $dep &> /dev/null; then
      MISSING_DEPS+=($dep)
    fi
  done

  if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    print_warning "Missing VNC dependencies: ${MISSING_DEPS[*]}"

    if confirm_action "Do you want to install them?"; then
      log_command "Installing VNC dependencies: ${MISSING_DEPS[*]}"
      sudo apt-get update
      sudo apt-get install -y ${MISSING_DEPS[@]}
      check_success "VNC dependencies installation"
    else
      print_warning "VNC features will not work without these dependencies"
      print_info "You can install them later with: sudo apt-get install x11vnc xvfb xclip xdotool fluxbox"
    fi
  else
    print_status "All VNC dependencies are installed"
  fi
}

check_git() {
  print_step "Checking Git..."

  if ! command -v git &> /dev/null; then
    print_warning "Git is not installed"

    if confirm_action "Install Git?"; then
      sudo apt-get update
      sudo apt-get install -y git
      check_success "Git installation"
    fi
  else
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_status "Git version: $GIT_VERSION"
  fi
}

check_build_tools() {
  print_step "Checking build tools..."

  if ! command -v make &> /dev/null || ! command -v g++ &> /dev/null; then
    print_warning "Build tools (make, g++) are not installed"
    print_info "These may be required for some npm packages"

    if confirm_action "Install build-essential?"; then
      sudo apt-get update
      sudo apt-get install -y build-essential
      check_success "Build tools installation"
    fi
  else
    print_status "Build tools are installed"
  fi
}

# =============================================================================
# PROJECT SETUP
# =============================================================================

setup_project_directory() {
  print_step "Setting up project directory..."

  cd "$(dirname "$0")/.."
  PROJECT_DIR=$(pwd)
  print_info "Project directory: $PROJECT_DIR"

  # Verify we're in the right directory
  if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
  fi

  print_status "Project directory validated"
}

install_dependencies() {
  print_step "Installing npm dependencies..."

  # Check if node_modules exists
  if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
    print_info "Existing node_modules found"

    if confirm_action "Reinstall dependencies (clean install)?"; then
      log_command "rm -rf node_modules package-lock.json"
      rm -rf node_modules package-lock.json
      log_command "npm install"
      npm install | tee -a "$LOG_FILE"
    else
      log_command "npm ci"
      npm ci | tee -a "$LOG_FILE"
    fi
  else
    log_command "npm install"
    npm install | tee -a "$LOG_FILE"
  fi

  check_success "npm dependencies installation"
}

setup_environment() {
  print_step "Setting up environment file..."

  if [ ! -f ".env" ]; then
    if [ ! -f ".env.example" ]; then
      print_error ".env.example not found. Cannot create .env"
      exit 1
    fi

    log_command "cp .env.example .env"
    cp .env.example .env
    print_status ".env file created from .env.example"

    # Generate random NEXTAUTH_SECRET
    if command -v openssl &> /dev/null; then
      RANDOM_SECRET=$(openssl rand -base64 32)
    else
      RANDOM_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    fi

    if [ -n "$RANDOM_SECRET" ]; then
      sed -i "s/your-secret-key-change-this-in-production/$RANDOM_SECRET/" .env
      print_status "Generated random NEXTAUTH_SECRET"
    fi

    print_warning "Please review and update .env file with your actual values!"
    print_info "Important: Update DATABASE_URL with your PostgreSQL credentials"

    if confirm_action "Would you like to edit .env now?"; then
      ${EDITOR:-nano} .env
    fi
  else
    print_status ".env file already exists"

    # Validate .env has required variables
    local missing_vars=()
    for var in DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL; do
      if ! grep -q "^$var=" .env; then
        missing_vars+=($var)
      fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
      print_warning "Missing environment variables: ${missing_vars[*]}"
    fi
  fi
}

test_database_connection() {
  print_step "Testing database connection..."

  # Extract DATABASE_URL from .env
  if [ -f ".env" ]; then
    source .env 2>/dev/null || true

    if [[ "$DATABASE_URL" =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)\? ]]; then
      DB_USER="${BASH_REMATCH[1]}"
      DB_HOST="${BASH_REMATCH[3]}"
      DB_PORT="${BASH_REMATCH[4]}"
      DB_NAME="${BASH_REMATCH[5]}"

      # Test connection
      if PGPASSWORD="${BASH_REMATCH[2]}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" &> /dev/null; then
        print_status "Database connection successful"

        # Check if database exists
        if PGPASSWORD="${BASH_REMATCH[2]}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
          print_status "Database '$DB_NAME' exists"
        else
          print_warning "Database '$DB_NAME' does not exist"

          if confirm_action "Create database '$DB_NAME'?"; then
            PGPASSWORD="${BASH_REMATCH[2]}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
            check_success "Database creation"
          fi
        fi
      else
        print_warning "Cannot connect to database. Please check DATABASE_URL in .env"
        print_info "Connection details: $DB_USER@$DB_HOST:$DB_PORT"
        return 1
      fi
    else
      print_warning "Cannot parse DATABASE_URL. Please verify format"
      return 1
    fi
  fi
}

setup_database() {
  print_step "Setting up database..."

  if confirm_action "Initialize database schema?" "y"; then
    # Generate Prisma client
    print_info "Generating Prisma client..."
    log_command "npx prisma generate"
    npx prisma generate | tee -a "$LOG_FILE"
    check_success "Prisma client generation"

    # Push schema to database
    print_info "Pushing schema to database..."
    log_command "npx prisma db push"
    npx prisma db push | tee -a "$LOG_FILE"
    check_success "Database schema initialization"

    print_status "Database setup completed"
  else
    print_warning "Skipping database setup"
    print_info "Run manually later: npx prisma generate && npx prisma db push"
  fi
}

build_application() {
  print_step "Building application..."

  if confirm_action "Build the application now?" "y"; then
    log_command "npm run build"
    npm run build | tee -a "$LOG_FILE"
    check_success "Application build"
  else
    print_warning "Skipping build"
    print_info "Run manually later: npm run build"
  fi
}

# =============================================================================
# SECURITY AND FIREWALL SETUP
# =============================================================================

setup_firewall() {
  print_step "Firewall configuration (UFW)..."

  if ! command -v ufw &> /dev/null; then
    print_warning "UFW is not installed"

    if confirm_action "Install UFW?"; then
      sudo apt-get update
      sudo apt-get install -y ufw
      check_success "UFW installation"
    else
      print_info "Skipping firewall setup"
      return
    fi
  fi

  print_info "Current UFW status:"
  sudo ufw status | tee -a "$LOG_FILE"

  if confirm_action "Configure UFW firewall rules?"; then
    print_warning "This will configure firewall rules for the application"
    print_info "Required ports: 22 (SSH), 3000 (App), 6080-6081 (VNC)"

    if confirm_action "Continue with firewall configuration?" "y"; then
      # Allow SSH first (critical!)
      sudo ufw allow 22/tcp comment 'SSH'

      # Allow application ports
      sudo ufw allow 3000/tcp comment 'MI AI Coding App'
      sudo ufw allow 3001/tcp comment 'WebSocket'
      sudo ufw allow 6080/tcp comment 'VNC Playwright'
      sudo ufw allow 6081/tcp comment 'VNC Terminal'

      print_status "Firewall rules configured"

      if confirm_action "Enable UFW firewall now?"; then
        sudo ufw --force enable
        print_status "UFW firewall enabled"
        sudo ufw status numbered | tee -a "$LOG_FILE"
      fi
    fi
  fi
}

setup_ssl() {
  print_step "SSL Certificate setup..."

  print_info "SSL certificates are required for HTTPS access"
  print_info "This requires:"
  print_info "  - A domain name pointing to this server"
  print_info "  - Nginx or Apache web server"
  print_info "  - Let's Encrypt certbot"

  if confirm_action "Do you want to set up SSL certificates now?"; then
    # Check if Nginx is installed
    if ! command -v nginx &> /dev/null; then
      print_warning "Nginx is not installed"

      if confirm_action "Install Nginx?"; then
        sudo apt-get update
        sudo apt-get install -y nginx
        check_success "Nginx installation"
      else
        print_info "SSL setup requires a web server. Skipping."
        return
      fi
    fi

    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
      print_warning "Certbot is not installed"

      if confirm_action "Install Certbot?"; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        check_success "Certbot installation"
      else
        print_info "Skipping SSL certificate setup"
        return
      fi
    fi

    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME

    if [ -n "$DOMAIN_NAME" ]; then
      print_info "Obtaining SSL certificate for $DOMAIN_NAME..."
      print_warning "This will make changes to your Nginx configuration"

      if confirm_action "Continue?"; then
        sudo certbot --nginx -d "$DOMAIN_NAME"
        check_success "SSL certificate setup"

        # Test auto-renewal
        print_info "Testing certificate auto-renewal..."
        sudo certbot renew --dry-run
      fi
    else
      print_warning "No domain name provided. Skipping SSL setup"
    fi
  else
    print_info "Skipping SSL setup"
    print_info "You can set up SSL later with: sudo certbot --nginx -d yourdomain.com"
  fi
}

# =============================================================================
# HEALTH CHECK
# =============================================================================

run_health_check() {
  print_header "Running Health Check"

  local issues_found=0

  # Check Node.js
  if command -v node &> /dev/null; then
    print_status "Node.js: $(node -v)"
  else
    print_error "Node.js not found"
    ((issues_found++))
  fi

  # Check PostgreSQL
  if systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL: Running"
  else
    print_warning "PostgreSQL: Not running"
    ((issues_found++))
  fi

  # Check node_modules
  if [ -d "node_modules" ]; then
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    print_status "Node modules: $MODULE_COUNT packages installed"
  else
    print_error "node_modules not found"
    ((issues_found++))
  fi

  # Check .env
  if [ -f ".env" ]; then
    print_status ".env file: Present"
  else
    print_error ".env file: Missing"
    ((issues_found++))
  fi

  # Check build
  if [ -d ".next" ]; then
    print_status "Application build: Present"
  else
    print_warning "Application build: Not found (run npm run build)"
    ((issues_found++))
  fi

  # Check ports
  print_info "Checking ports..."
  for port in 3000 6080 6081 5432; do
    if lsof -i:$port > /dev/null 2>&1; then
      print_status "Port $port: In use"
    else
      print_info "Port $port: Available"
    fi
  done

  # Check VNC dependencies
  local vnc_ready=true
  for cmd in x11vnc Xvfb xclip xdotool; do
    if ! command -v $cmd &> /dev/null; then
      vnc_ready=false
      break
    fi
  done

  if [ "$vnc_ready" = true ]; then
    print_status "VNC dependencies: All installed"
  else
    print_warning "VNC dependencies: Incomplete"
    ((issues_found++))
  fi

  # Summary
  echo ""
  if [ $issues_found -eq 0 ]; then
    print_status "Health check passed! All systems ready."
  else
    print_warning "Health check found $issues_found issue(s). Review above for details."
  fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  print_header "MI AI Coding Platform - Setup"
  print_info "Setup log: $LOG_FILE"

  # System requirements check
  print_header "System Requirements Check"
  check_os
  check_user
  check_disk_space
  check_memory
  check_network
  check_ports

  # Dependency checks
  print_header "Dependency Checks"
  check_node
  check_postgresql
  check_vnc_dependencies
  check_git
  check_build_tools

  # Project setup
  print_header "Project Setup"
  setup_project_directory
  install_dependencies
  setup_environment

  # Database setup
  print_header "Database Setup"
  test_database_connection
  setup_database

  # Build
  print_header "Application Build"
  build_application

  # Security (optional)
  print_header "Security Configuration (Optional)"

  if confirm_action "Would you like to configure security settings (firewall, SSL)?"; then
    setup_firewall
    setup_ssl
  else
    print_info "Skipping security configuration"
    print_info "You can configure firewall later with: sudo ufw allow 3000/tcp"
  fi

  # Health check
  run_health_check

  # Completion
  print_header "Setup Complete!"

  echo ""
  echo "Next Steps:"
  echo ""
  echo "1. Review and verify your .env configuration"
  echo "   ${EDITOR:-nano} .env"
  echo ""
  echo "2. Start VNC servers (for visual testing and terminal):"
  echo "   ./scripts/start-vnc.sh"
  echo ""
  echo "3. Start the application:"
  echo "   - Development: npm run dev"
  echo "   - Production:  npm start"
  echo ""
  echo "4. Access the application:"
  echo "   - Application: http://localhost:3000"
  echo "   - Database UI: npx prisma studio"
  echo "   - VNC Terminal: ws://localhost:6081"
  echo "   - VNC Playwright: ws://localhost:6080"
  echo ""
  echo "Documentation:"
  echo "   - Quick Start: README.md"
  echo "   - Architecture: PROJECT.md"
  echo "   - Development: CLAUDE.md"
  echo ""
  print_info "Setup log saved to: $LOG_FILE"
  echo ""
}

# Run main function
main

exit 0
