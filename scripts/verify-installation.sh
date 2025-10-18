#!/bin/bash

# MI AI Coding Platform - Installation Verification Script
# Verifies that all components are installed and running correctly
# Version: 1.0
# Last Updated: 2025-10-18

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

PROJECT_DIR="/home/master/projects/mi-ai-coding"
APP_PORT="3002"
WS_PORT="3003"
TERMINAL_VNC_PORT="6081"
PLAYWRIGHT_VNC_PORT="6080"
DISPLAY_98=":98"
DISPLAY_99=":99"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

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
  ((CHECKS_PASSED++))
}

print_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1"
  ((CHECKS_WARNING++))
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
  ((CHECKS_FAILED++))
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
# SYSTEM CHECKS
# =============================================================================

check_system_dependencies() {
  print_header "System Dependencies"

  print_step "Checking essential tools..."

  # Node.js
  if command_exists node; then
    version=$(node -v)
    major_version=$(echo $version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$major_version" -ge 18 ]; then
      print_status "Node.js $version installed (minimum: v18.x)"
    else
      print_warning "Node.js $version installed (recommended: v20.x+)"
    fi
  else
    print_error "Node.js not installed"
  fi

  # npm
  if command_exists npm; then
    print_status "npm $(npm -v) installed"
  else
    print_error "npm not installed"
  fi

  # PostgreSQL
  if command_exists psql; then
    print_status "PostgreSQL $(psql --version | awk '{print $3}') installed"
  else
    print_error "PostgreSQL not installed"
  fi

  # PM2
  if command_exists pm2; then
    print_status "PM2 $(pm2 -v) installed"
  else
    print_error "PM2 not installed"
  fi

  # VNC tools
  print_step "Checking VNC dependencies..."

  local vnc_tools=("x11vnc" "Xvfb" "xclip" "xdotool" "fluxbox")
  for tool in "${vnc_tools[@]}"; do
    if command_exists "$tool"; then
      print_status "$tool installed"
    else
      print_error "$tool not installed"
    fi
  done
}

# =============================================================================
# DATABASE CHECKS
# =============================================================================

check_database() {
  print_header "Database Connection"

  print_step "Checking PostgreSQL service..."
  if sudo systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL service is running"
  else
    print_error "PostgreSQL service is not running"
    print_info "Start with: sudo systemctl start postgresql"
    return
  fi

  print_step "Testing database connection..."

  # Read .env file to get database URL
  if [ -f "$PROJECT_DIR/.env" ]; then
    cd "$PROJECT_DIR"

    # Extract database credentials from .env
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2 | tr -d '"')

    if [ -n "$DB_URL" ]; then
      # Parse connection string
      if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"

        # Test connection
        if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
          print_status "Database connection successful"
          print_info "Database: $DB_NAME"
          print_info "User: $DB_USER"
          print_info "Host: $DB_HOST:$DB_PORT"

          # Check tables
          table_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
          if [ "$table_count" -gt 0 ]; then
            print_status "Database has $table_count tables"
          else
            print_warning "Database has no tables (schema may not be pushed yet)"
          fi
        else
          print_error "Failed to connect to database"
          print_info "Check DATABASE_URL in .env file"
        fi
      else
        print_error "Invalid DATABASE_URL format in .env"
      fi
    else
      print_error "DATABASE_URL not found in .env"
    fi
  else
    print_error ".env file not found"
    print_info "Create .env from .env.example"
  fi
}

# =============================================================================
# APPLICATION CHECKS
# =============================================================================

check_application() {
  print_header "Application Status"

  cd "$PROJECT_DIR"

  print_step "Checking application files..."

  # Check if node_modules exists
  if [ -d "node_modules" ]; then
    print_status "node_modules directory exists"
  else
    print_error "node_modules directory not found"
    print_info "Run: npm install"
  fi

  # Check if .next build exists
  if [ -d ".next" ]; then
    print_status ".next build directory exists"
  else
    print_error ".next build directory not found"
    print_info "Run: npm run build"
  fi

  # Check Prisma client
  if [ -d "node_modules/.prisma/client" ]; then
    print_status "Prisma client generated"
  else
    print_error "Prisma client not generated"
    print_info "Run: npx prisma generate"
  fi

  print_step "Checking PM2 processes..."

  if command_exists pm2; then
    if pm2 list | grep -q "mi-ai-coding"; then
      status=$(pm2 jlist | grep -A20 "mi-ai-coding" | grep "pm2_env" -A5 | grep "status" | cut -d'"' -f4)
      if [ "$status" = "online" ]; then
        print_status "Application is running via PM2 (status: online)"
      else
        print_warning "Application found in PM2 but not online (status: $status)"
        print_info "Restart with: pm2 restart mi-ai-coding"
      fi
    else
      print_warning "Application not found in PM2"
      print_info "Start with: pm2 start ecosystem.config.js"
    fi
  else
    print_error "PM2 not installed"
  fi
}

# =============================================================================
# PORT CHECKS
# =============================================================================

check_ports() {
  print_header "Port Availability"

  print_step "Checking application ports..."

  # Check main app port
  if lsof -i:$APP_PORT > /dev/null 2>&1; then
    pid=$(lsof -ti:$APP_PORT | head -n1)
    process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
    print_status "Port $APP_PORT is in use (PID: $pid, Process: $process)"
  else
    print_warning "Port $APP_PORT is not in use"
    print_info "Application may not be running"
  fi

  # Check WebSocket port
  if lsof -i:$WS_PORT > /dev/null 2>&1; then
    pid=$(lsof -ti:$WS_PORT | head -n1)
    process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
    print_status "Port $WS_PORT is in use (PID: $pid, Process: $process)"
  else
    print_warning "Port $WS_PORT is not in use"
    print_info "WebSocket server may not be running"
  fi

  # Test HTTP connection
  print_step "Testing HTTP connection..."
  if nc -z localhost $APP_PORT 2>/dev/null; then
    print_status "Application is accessible on http://localhost:$APP_PORT"

    # Try to fetch the page
    if command_exists curl; then
      status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT 2>/dev/null || echo "000")
      if [ "$status_code" = "200" ] || [ "$status_code" = "301" ] || [ "$status_code" = "302" ]; then
        print_status "HTTP endpoint responding (status: $status_code)"
      else
        print_warning "HTTP endpoint returned status: $status_code"
      fi
    fi
  else
    print_error "Cannot connect to application on port $APP_PORT"
  fi
}

# =============================================================================
# VNC CHECKS
# =============================================================================

check_vnc() {
  print_header "VNC Servers"

  print_step "Checking VNC displays..."

  # Check Terminal VNC (Display :98)
  echo ""
  print_info "Terminal VNC (Display $DISPLAY_98, Port $TERMINAL_VNC_PORT)"

  if pgrep -f "Xvfb $DISPLAY_98" > /dev/null; then
    pid=$(pgrep -f "Xvfb $DISPLAY_98" | head -n1)
    print_status "Xvfb running on $DISPLAY_98 (PID: $pid)"
  else
    print_error "Xvfb not running on $DISPLAY_98"
  fi

  if lsof -i:$TERMINAL_VNC_PORT > /dev/null 2>&1; then
    pid=$(lsof -ti:$TERMINAL_VNC_PORT | head -n1)
    print_status "x11vnc listening on port $TERMINAL_VNC_PORT (PID: $pid)"
  else
    print_error "x11vnc not listening on port $TERMINAL_VNC_PORT"
  fi

  # Check Playwright VNC (Display :99)
  echo ""
  print_info "Playwright VNC (Display $DISPLAY_99, Port $PLAYWRIGHT_VNC_PORT)"

  if pgrep -f "Xvfb $DISPLAY_99" > /dev/null; then
    pid=$(pgrep -f "Xvfb $DISPLAY_99" | head -n1)
    print_status "Xvfb running on $DISPLAY_99 (PID: $pid)"
  else
    print_error "Xvfb not running on $DISPLAY_99"
  fi

  if lsof -i:$PLAYWRIGHT_VNC_PORT > /dev/null 2>&1; then
    pid=$(lsof -ti:$PLAYWRIGHT_VNC_PORT | head -n1)
    print_status "x11vnc listening on port $PLAYWRIGHT_VNC_PORT (PID: $pid)"
  else
    print_error "x11vnc not listening on port $PLAYWRIGHT_VNC_PORT"
  fi

  # Test VNC connections
  print_step "Testing VNC connectivity..."

  if nc -z localhost $TERMINAL_VNC_PORT 2>/dev/null; then
    print_status "Terminal VNC is accessible on ws://localhost:$TERMINAL_VNC_PORT"
  else
    print_error "Cannot connect to Terminal VNC on port $TERMINAL_VNC_PORT"
  fi

  if nc -z localhost $PLAYWRIGHT_VNC_PORT 2>/dev/null; then
    print_status "Playwright VNC is accessible on ws://localhost:$PLAYWRIGHT_VNC_PORT"
  else
    print_error "Cannot connect to Playwright VNC on port $PLAYWRIGHT_VNC_PORT"
  fi
}

# =============================================================================
# SERVICE CHECKS
# =============================================================================

check_services() {
  print_header "System Services"

  print_step "Checking service status..."

  # PostgreSQL
  if sudo systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL service: active"
  else
    print_error "PostgreSQL service: inactive"
  fi

  # Nginx
  if command_exists nginx; then
    if sudo systemctl is-active --quiet nginx; then
      print_status "Nginx service: active"
    else
      print_warning "Nginx service: inactive"
    fi
  else
    print_info "Nginx not installed (optional)"
  fi

  # PM2
  if command_exists pm2; then
    if pm2 list | grep -q "mi-ai-coding"; then
      print_status "PM2 managing application"
    else
      print_warning "PM2 not managing application"
    fi
  fi
}

# =============================================================================
# CONFIGURATION CHECKS
# =============================================================================

check_configuration() {
  print_header "Configuration Files"

  cd "$PROJECT_DIR"

  print_step "Checking configuration files..."

  # .env file
  if [ -f ".env" ]; then
    print_status ".env file exists"

    # Check required variables
    required_vars=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "APP_PORT")
    for var in "${required_vars[@]}"; do
      if grep -q "^${var}=" .env; then
        print_status "$var is set in .env"
      else
        print_error "$var is missing in .env"
      fi
    done
  else
    print_error ".env file not found"
    print_info "Create from .env.example"
  fi

  # ecosystem.config.js
  if [ -f "ecosystem.config.js" ]; then
    print_status "ecosystem.config.js exists"
  else
    print_warning "ecosystem.config.js not found"
  fi

  # package.json
  if [ -f "package.json" ]; then
    print_status "package.json exists"
  else
    print_error "package.json not found"
  fi

  # Prisma schema
  if [ -f "prisma/schema.prisma" ]; then
    print_status "prisma/schema.prisma exists"
  else
    print_error "prisma/schema.prisma not found"
  fi
}

# =============================================================================
# NETWORK CHECKS
# =============================================================================

check_network() {
  print_header "Network Configuration"

  print_step "Checking external accessibility..."

  # Get local IP
  local_ip=$(hostname -I | awk '{print $1}')
  if [ -n "$local_ip" ]; then
    print_status "Local IP address: $local_ip"
    echo ""
    print_info "External Access URLs:"
    print_info "  Application:    http://$local_ip:$APP_PORT"
    print_info "  Terminal VNC:   ws://$local_ip:$TERMINAL_VNC_PORT"
    print_info "  Playwright VNC: ws://$local_ip:$PLAYWRIGHT_VNC_PORT"
  else
    print_warning "Could not determine local IP address"
  fi

  # Check firewall
  if command_exists ufw; then
    print_step "Checking firewall rules..."
    if sudo ufw status | grep -q "Status: active"; then
      print_info "UFW is active"

      # Check if ports are allowed
      for port in $APP_PORT $WS_PORT $TERMINAL_VNC_PORT $PLAYWRIGHT_VNC_PORT; do
        if sudo ufw status | grep -q "$port"; then
          print_status "Port $port allowed in firewall"
        else
          print_warning "Port $port not explicitly allowed in firewall"
        fi
      done
    else
      print_info "UFW is not active"
    fi
  fi
}

# =============================================================================
# SUMMARY
# =============================================================================

print_summary() {
  print_header "Verification Summary"

  total_checks=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

  echo -e "${GREEN}Passed:${NC}   $CHECKS_PASSED checks"
  echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING checks"
  echo -e "${RED}Failed:${NC}   $CHECKS_FAILED checks"
  echo -e "Total:    $total_checks checks"
  echo ""

  if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
      echo -e "${GREEN}All checks passed! Installation is complete and working correctly.${NC}"
      echo ""
      echo "Next Steps:"
      echo "  1. Access the application: http://localhost:$APP_PORT"
      echo "  2. View Terminal VNC: ws://localhost:$TERMINAL_VNC_PORT"
      echo "  3. View Playwright VNC: ws://localhost:$PLAYWRIGHT_VNC_PORT"
      echo "  4. Check logs: pm2 logs mi-ai-coding"
    else
      echo -e "${YELLOW}Installation verified with warnings.${NC}"
      echo "Review the warnings above and address them if needed."
    fi
  else
    echo -e "${RED}Installation verification failed.${NC}"
    echo "Please review the errors above and fix them before proceeding."
    echo ""
    echo "Common fixes:"
    echo "  - Install missing dependencies: sudo apt-get install <package>"
    echo "  - Start PostgreSQL: sudo systemctl start postgresql"
    echo "  - Run npm install: cd $PROJECT_DIR && npm install"
    echo "  - Build application: npm run build"
    echo "  - Start VNC servers: ./scripts/start-vnc.sh"
    echo "  - Start application: pm2 start ecosystem.config.js"
  fi

  echo ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  print_header "MI AI Coding Platform - Installation Verification"
  print_info "Project directory: $PROJECT_DIR"
  print_info "Date: $(date)"
  echo ""

  check_system_dependencies
  check_database
  check_configuration
  check_application
  check_ports
  check_vnc
  check_services
  check_network
  print_summary
}

# Run main function
main

exit 0
