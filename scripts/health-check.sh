#!/bin/bash

# MI AI Coding Platform - Health Check Script
# Comprehensive system and application health verification
# Version: 1.0
# Last Updated: 2025-10-12

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Thresholds
DISK_WARNING_THRESHOLD=80
DISK_CRITICAL_THRESHOLD=90
MEMORY_WARNING_THRESHOLD=85
CPU_WARNING_THRESHOLD=80

# Required ports
REQUIRED_PORTS=(3000 3001 6080 6081 5432)

# Exit codes
EXIT_OK=0
EXIT_WARNING=1
EXIT_CRITICAL=2
EXIT_UNKNOWN=3

# Global counters
PASSED=0
WARNINGS=0
ERRORS=0
CRITICAL=0

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

print_header() {
  echo -e "\n${CYAN}=========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}=========================================${NC}\n"
}

print_ok() {
  echo -e "${GREEN}[✓]${NC} $1"
  ((PASSED++))
}

print_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1"
  ((WARNINGS++))
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
  ((ERRORS++))
}

print_critical() {
  echo -e "${RED}[‼]${NC} $1"
  ((CRITICAL++))
}

print_info() {
  echo -e "${BLUE}[i]${NC} $1"
}

print_section() {
  echo -e "\n${CYAN}▶${NC} $1"
}

# =============================================================================
# SYSTEM CHECKS
# =============================================================================

check_system_info() {
  print_section "System Information"

  # OS information
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    print_info "OS: $NAME $VERSION_ID"
  fi

  # Kernel version
  print_info "Kernel: $(uname -r)"

  # Uptime
  UPTIME=$(uptime -p)
  print_info "Uptime: $UPTIME"

  # Load average
  LOAD=$(uptime | awk -F'load average:' '{print $2}' | xargs)
  print_info "Load Average: $LOAD"
}

check_disk_space() {
  print_section "Disk Space"

  while IFS= read -r line; do
    MOUNT=$(echo "$line" | awk '{print $6}')
    USED=$(echo "$line" | awk '{print $5}' | sed 's/%//')
    SIZE=$(echo "$line" | awk '{print $2}')
    AVAIL=$(echo "$line" | awk '{print $4}')

    if [ "$USED" -ge "$DISK_CRITICAL_THRESHOLD" ]; then
      print_critical "Disk $MOUNT: ${USED}% used (${AVAIL} available of ${SIZE}) - CRITICAL"
    elif [ "$USED" -ge "$DISK_WARNING_THRESHOLD" ]; then
      print_warning "Disk $MOUNT: ${USED}% used (${AVAIL} available of ${SIZE})"
    else
      print_ok "Disk $MOUNT: ${USED}% used (${AVAIL} available of ${SIZE})"
    fi
  done < <(df -h | grep -E '^/dev/')
}

check_memory() {
  print_section "Memory Usage"

  # Total and available memory
  TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
  USED_MEM=$(free -h | awk '/^Mem:/ {print $3}')
  AVAIL_MEM=$(free -h | awk '/^Mem:/ {print $7}')

  # Calculate percentage
  USED_PERCENT=$(free | awk '/^Mem:/ {printf "%.0f", ($3/$2) * 100}')

  if [ "$USED_PERCENT" -ge "$MEMORY_WARNING_THRESHOLD" ]; then
    print_warning "Memory: ${USED_MEM}/${TOTAL_MEM} used (${USED_PERCENT}%), ${AVAIL_MEM} available"
  else
    print_ok "Memory: ${USED_MEM}/${TOTAL_MEM} used (${USED_PERCENT}%), ${AVAIL_MEM} available"
  fi

  # Swap usage
  SWAP_TOTAL=$(free -h | awk '/^Swap:/ {print $2}')
  SWAP_USED=$(free -h | awk '/^Swap:/ {print $3}')

  if [ "$SWAP_TOTAL" != "0B" ]; then
    SWAP_PERCENT=$(free | awk '/^Swap:/ {if ($2 > 0) printf "%.0f", ($3/$2) * 100; else print 0}')
    print_info "Swap: ${SWAP_USED}/${SWAP_TOTAL} used (${SWAP_PERCENT}%)"
  else
    print_info "Swap: Not configured"
  fi
}

check_cpu() {
  print_section "CPU Usage"

  # Get CPU usage (1 second average)
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
  CPU_USAGE_INT=${CPU_USAGE%.*}

  if [ "$CPU_USAGE_INT" -ge "$CPU_WARNING_THRESHOLD" ]; then
    print_warning "CPU Usage: ${CPU_USAGE}%"
  else
    print_ok "CPU Usage: ${CPU_USAGE}%"
  fi

  # CPU cores
  CPU_CORES=$(nproc)
  print_info "CPU Cores: $CPU_CORES"
}

check_network() {
  print_section "Network Connectivity"

  # Check internet connectivity
  if ping -c 1 -W 2 8.8.8.8 &> /dev/null; then
    print_ok "Internet connectivity: Available"
  else
    print_warning "Internet connectivity: Not available"
  fi

  # Check DNS resolution
  if host google.com &> /dev/null; then
    print_ok "DNS resolution: Working"
  else
    print_warning "DNS resolution: Failed"
  fi
}

# =============================================================================
# SERVICE CHECKS
# =============================================================================

check_postgresql() {
  print_section "PostgreSQL Database"

  # Check if PostgreSQL is installed
  if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL: Not installed"
    return
  fi

  # Check if service is running
  if systemctl is-active --quiet postgresql; then
    print_ok "PostgreSQL service: Running"

    # Get version
    PG_VERSION=$(psql --version | awk '{print $3}')
    print_info "PostgreSQL version: $PG_VERSION"

    # Check if listening on port 5432
    if lsof -i:5432 > /dev/null 2>&1; then
      print_ok "PostgreSQL port 5432: Listening"
    else
      print_warning "PostgreSQL port 5432: Not listening"
    fi

    # Check connection
    if sudo -u postgres psql -c "SELECT 1" &> /dev/null; then
      print_ok "PostgreSQL connection: Successful"

      # Get database list count
      DB_COUNT=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_database WHERE datistemplate = false;")
      print_info "Databases: $DB_COUNT"

      # Check if mi_ai_coding database exists
      if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw mi_ai_coding; then
        print_ok "Database 'mi_ai_coding': Exists"

        # Get table count
        TABLE_COUNT=$(sudo -u postgres psql -d mi_ai_coding -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
        print_info "Tables in mi_ai_coding: $TABLE_COUNT"
      else
        print_warning "Database 'mi_ai_coding': Not found"
      fi
    else
      print_error "PostgreSQL connection: Failed"
    fi
  else
    print_error "PostgreSQL service: Not running"
  fi
}

check_nodejs() {
  print_section "Node.js Environment"

  # Check if Node.js is installed
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_ok "Node.js: $NODE_VERSION"

    # Check version requirement
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
      print_ok "Node.js version: Meets requirements (>= 18)"
    else
      print_warning "Node.js version: Below recommended (>= 18)"
    fi
  else
    print_error "Node.js: Not installed"
  fi

  # Check npm
  if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_ok "npm: v$NPM_VERSION"
  else
    print_warning "npm: Not installed"
  fi

  # Check if PM2 is installed
  if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    print_ok "PM2: v$PM2_VERSION"
  else
    print_info "PM2: Not installed (optional)"
  fi
}

check_application() {
  print_section "Application Status"

  # Check if project directory exists
  if [ -d "$(dirname "$0")/.." ]; then
    cd "$(dirname "$0")/.."
    PROJECT_DIR=$(pwd)
    print_ok "Project directory: $PROJECT_DIR"

    # Check package.json
    if [ -f "package.json" ]; then
      print_ok "package.json: Present"

      # Get app version
      if command -v jq &> /dev/null; then
        APP_VERSION=$(jq -r '.version' package.json 2>/dev/null || echo "unknown")
        print_info "Application version: $APP_VERSION"
      fi
    else
      print_error "package.json: Not found"
    fi

    # Check node_modules
    if [ -d "node_modules" ]; then
      MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
      print_ok "node_modules: Present ($MODULE_COUNT packages)"
    else
      print_error "node_modules: Not found - run npm install"
    fi

    # Check .env file
    if [ -f ".env" ]; then
      print_ok ".env file: Present"

      # Check for required variables
      MISSING_VARS=()
      for var in DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL; do
        if ! grep -q "^$var=" .env; then
          MISSING_VARS+=($var)
        fi
      done

      if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        print_ok "Environment variables: All required variables set"
      else
        print_warning "Environment variables: Missing ${MISSING_VARS[*]}"
      fi
    else
      print_error ".env file: Not found"
    fi

    # Check build directory
    if [ -d ".next" ]; then
      BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
      print_ok "Application build: Present ($BUILD_SIZE)"
    else
      print_warning "Application build: Not found - run npm run build"
    fi

    # Check Prisma client
    if [ -d "node_modules/.prisma" ]; then
      print_ok "Prisma client: Generated"
    else
      print_warning "Prisma client: Not generated - run npx prisma generate"
    fi
  else
    print_error "Project directory: Not found"
  fi
}

check_ports() {
  print_section "Port Status"

  for port in "${REQUIRED_PORTS[@]}"; do
    if lsof -i:$port > /dev/null 2>&1; then
      PROCESS=$(lsof -ti:$port 2>/dev/null | head -n1)
      PROCESS_NAME=$(ps -p $PROCESS -o comm= 2>/dev/null || echo "Unknown")
      print_ok "Port $port: In use by $PROCESS_NAME (PID: $PROCESS)"
    else
      case $port in
        3000)
          print_warning "Port $port: Not in use (Application not running)"
          ;;
        3001)
          print_warning "Port $port: Not in use (WebSocket server not running)"
          ;;
        6080)
          print_info "Port $port: Not in use (VNC Playwright)"
          ;;
        6081)
          print_info "Port $port: Not in use (VNC Terminal)"
          ;;
        5432)
          print_warning "Port $port: Not in use (PostgreSQL not listening)"
          ;;
        *)
          print_info "Port $port: Not in use"
          ;;
      esac
    fi
  done
}

check_vnc() {
  print_section "VNC Services"

  # Check VNC dependencies
  VNC_DEPS=("x11vnc" "Xvfb" "xclip" "xdotool" "fluxbox")
  MISSING_DEPS=()

  for dep in "${VNC_DEPS[@]}"; do
    if command -v $dep &> /dev/null; then
      print_ok "VNC dependency '$dep': Installed"
    else
      MISSING_DEPS+=($dep)
      print_warning "VNC dependency '$dep': Not installed"
    fi
  done

  # Check if VNC servers are running
  if pgrep -f "Xvfb :98" > /dev/null; then
    print_ok "VNC Display :98 (Terminal): Running"
  else
    print_info "VNC Display :98 (Terminal): Not running"
  fi

  if pgrep -f "Xvfb :99" > /dev/null; then
    print_ok "VNC Display :99 (Playwright): Running"
  else
    print_info "VNC Display :99 (Playwright): Not running"
  fi

  # Check x11vnc processes
  VNC_COUNT=$(pgrep -f x11vnc | wc -l)
  if [ "$VNC_COUNT" -gt 0 ]; then
    print_ok "x11vnc processes: $VNC_COUNT running"
  else
    print_info "x11vnc processes: None running"
  fi
}

check_nginx() {
  print_section "Nginx Web Server"

  if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $3}')
    print_ok "Nginx: $NGINX_VERSION"

    # Check if service is running
    if systemctl is-active --quiet nginx; then
      print_ok "Nginx service: Running"

      # Test configuration
      if nginx -t &> /dev/null; then
        print_ok "Nginx configuration: Valid"
      else
        print_error "Nginx configuration: Invalid"
      fi

      # Check if listening on port 80/443
      if lsof -i:80 > /dev/null 2>&1; then
        print_ok "Nginx port 80: Listening"
      else
        print_warning "Nginx port 80: Not listening"
      fi

      if lsof -i:443 > /dev/null 2>&1; then
        print_ok "Nginx port 443: Listening (HTTPS)"
      else
        print_info "Nginx port 443: Not listening"
      fi
    else
      print_warning "Nginx service: Not running"
    fi
  else
    print_info "Nginx: Not installed (optional)"
  fi
}

check_firewall() {
  print_section "Firewall Status"

  if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -n1 | awk '{print $2}')

    if [ "$UFW_STATUS" = "active" ]; then
      print_ok "UFW Firewall: Active"

      # Count rules
      RULE_COUNT=$(sudo ufw status numbered | grep -c "^\[" || echo 0)
      print_info "Firewall rules: $RULE_COUNT configured"

      # Check if essential ports are allowed
      if sudo ufw status | grep -q "22.*ALLOW"; then
        print_ok "SSH port 22: Allowed"
      else
        print_warning "SSH port 22: Not explicitly allowed"
      fi
    else
      print_warning "UFW Firewall: Inactive"
    fi
  else
    print_info "UFW: Not installed"
  fi

  # Check Fail2ban
  if command -v fail2ban-client &> /dev/null; then
    if systemctl is-active --quiet fail2ban; then
      print_ok "Fail2ban: Running"

      # Get banned IPs count
      BANNED_COUNT=$(sudo fail2ban-client status 2>/dev/null | grep -c "Banned" || echo 0)
      print_info "Fail2ban banned IPs: $BANNED_COUNT"
    else
      print_warning "Fail2ban: Not running"
    fi
  else
    print_info "Fail2ban: Not installed (recommended for production)"
  fi
}

check_ssl() {
  print_section "SSL Certificates"

  if command -v certbot &> /dev/null; then
    print_ok "Certbot: Installed"

    # List certificates
    CERT_COUNT=$(sudo certbot certificates 2>/dev/null | grep -c "Certificate Name:" || echo 0)

    if [ "$CERT_COUNT" -gt 0 ]; then
      print_ok "SSL certificates: $CERT_COUNT configured"

      # Check expiry
      sudo certbot certificates 2>/dev/null | grep -A2 "Certificate Name:" | while read -r line; do
        if echo "$line" | grep -q "Expiry Date:"; then
          print_info "$line"
        fi
      done
    else
      print_info "SSL certificates: None configured"
    fi
  else
    print_info "Certbot: Not installed (required for Let's Encrypt SSL)"
  fi
}

check_logs() {
  print_section "Recent Logs"

  # Check for errors in application logs
  if [ -f "/var/log/mi-ai-coding/error.log" ]; then
    ERROR_COUNT=$(tail -n 100 /var/log/mi-ai-coding/error.log 2>/dev/null | grep -ic "error" || echo 0)
    if [ "$ERROR_COUNT" -gt 0 ]; then
      print_warning "Application errors: $ERROR_COUNT in last 100 lines"
    else
      print_ok "Application errors: None in last 100 lines"
    fi
  else
    print_info "Application log: Not found at /var/log/mi-ai-coding/error.log"
  fi

  # Check system logs for critical issues
  CRITICAL_COUNT=$(journalctl -p 3 --since "1 hour ago" 2>/dev/null | wc -l || echo 0)
  if [ "$CRITICAL_COUNT" -gt 0 ]; then
    print_warning "System critical errors (last hour): $CRITICAL_COUNT"
  else
    print_ok "System critical errors (last hour): None"
  fi
}

# =============================================================================
# HEALTH CHECK ENDPOINT TEST
# =============================================================================

check_http_endpoint() {
  print_section "HTTP Endpoint Check"

  # Check if application is responding
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    print_ok "Application endpoint: Responding"

    # Measure response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000 2>/dev/null || echo "N/A")
    print_info "Response time: ${RESPONSE_TIME}s"
  else
    print_warning "Application endpoint: Not responding on http://localhost:3000"
  fi

  # Check health endpoint if exists
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    print_ok "Health endpoint: Responding"
  else
    print_info "Health endpoint: Not configured"
  fi
}

# =============================================================================
# SUMMARY AND EXIT
# =============================================================================

print_summary() {
  print_header "Health Check Summary"

  echo ""
  echo -e "${GREEN}Passed checks:${NC} $PASSED"
  echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
  echo -e "${RED}Errors:${NC} $ERRORS"
  echo -e "${RED}Critical issues:${NC} $CRITICAL"
  echo ""

  # Overall health status
  if [ $CRITICAL -gt 0 ]; then
    echo -e "Overall Status: ${RED}CRITICAL${NC}"
    echo "Action required: Address critical issues immediately"
    return $EXIT_CRITICAL
  elif [ $ERRORS -gt 0 ]; then
    echo -e "Overall Status: ${RED}ERROR${NC}"
    echo "Action required: Fix errors to ensure proper operation"
    return $EXIT_CRITICAL
  elif [ $WARNINGS -gt 0 ]; then
    echo -e "Overall Status: ${YELLOW}WARNING${NC}"
    echo "System is operational but has warnings that should be addressed"
    return $EXIT_WARNING
  else
    echo -e "Overall Status: ${GREEN}HEALTHY${NC}"
    echo "All systems operational"
    return $EXIT_OK
  fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  print_header "MI AI Coding Platform - Health Check"
  print_info "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"

  # System checks
  check_system_info
  check_disk_space
  check_memory
  check_cpu
  check_network

  # Service checks
  check_postgresql
  check_nodejs
  check_application
  check_ports
  check_vnc

  # Production services (optional)
  check_nginx
  check_firewall
  check_ssl

  # Monitoring
  check_logs
  check_http_endpoint

  # Summary
  print_summary
  EXIT_CODE=$?

  echo ""
  print_info "Health check complete"
  echo ""

  exit $EXIT_CODE
}

# Run main function
main
