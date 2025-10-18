#!/bin/bash

# MI AI Coding Platform - VNC Server Startup Script
# Starts VNC servers on displays :98 (Terminal) and :99 (Playwright)
# Version: 2.0 - Enhanced with retry logic and better error handling
# Last Updated: 2025-10-12

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# VNC Configuration
TERMINAL_DISPLAY=":98"
TERMINAL_PORT="6081"
TERMINAL_RESOLUTION="1920x1080"

PLAYWRIGHT_DISPLAY=":99"
PLAYWRIGHT_PORT="6080"
PLAYWRIGHT_RESOLUTION="1920x1080"

# Retry configuration
MAX_RETRIES=3
RETRY_DELAY=2

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

# =============================================================================
# DEPENDENCY CHECKS
# =============================================================================

check_dependencies() {
  print_step "Checking VNC dependencies..."

  local missing_deps=()

  if ! command -v x11vnc &> /dev/null; then
    missing_deps+=("x11vnc")
  fi

  if ! command -v Xvfb &> /dev/null; then
    missing_deps+=("xvfb")
  fi

  if ! command -v xclip &> /dev/null; then
    missing_deps+=("xclip")
  fi

  if ! command -v xdotool &> /dev/null; then
    missing_deps+=("xdotool")
  fi

  if ! command -v fluxbox &> /dev/null; then
    missing_deps+=("fluxbox")
  fi

  if [ ${#missing_deps[@]} -gt 0 ]; then
    print_error "Missing dependencies: ${missing_deps[*]}"
    print_info "Install with: sudo apt-get install ${missing_deps[*]}"
    exit 1
  fi

  print_status "All VNC dependencies installed"
}

# =============================================================================
# PORT AND PROCESS MANAGEMENT
# =============================================================================

check_port_available() {
  local port=$1

  if lsof -i:$port > /dev/null 2>&1; then
    return 1
  fi
  return 0
}

kill_process_on_port() {
  local port=$1

  if lsof -ti:$port > /dev/null 2>&1; then
    print_warning "Port $port is in use. Attempting to free it..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1

    if lsof -i:$port > /dev/null 2>&1; then
      print_error "Failed to free port $port"
      return 1
    fi
    print_status "Port $port freed"
  fi
  return 0
}

stop_display() {
  local display=$1

  print_info "Stopping existing processes for display $display..."

  # Kill Xvfb
  if pgrep -f "Xvfb $display" > /dev/null; then
    pkill -f "Xvfb $display" || true
    print_info "Stopped Xvfb on $display"
  fi

  # Kill x11vnc
  if pgrep -f "x11vnc.*display $display" > /dev/null; then
    pkill -f "x11vnc.*display $display" || true
    print_info "Stopped x11vnc on $display"
  fi

  # Kill fluxbox
  if pgrep -f "fluxbox.*$display" > /dev/null; then
    pkill -f "fluxbox.*$display" || true
    print_info "Stopped fluxbox on $display"
  fi

  # Wait for processes to terminate
  sleep 1
}

# =============================================================================
# VNC SERVER FUNCTIONS
# =============================================================================

start_xvfb() {
  local display=$1
  local resolution=$2

  print_step "Starting Xvfb on display $display..."

  # Check if already running
  if pgrep -f "Xvfb $display" > /dev/null; then
    print_status "Xvfb already running on $display"
    return 0
  fi

  # Start Xvfb
  Xvfb $display -screen 0 ${resolution}x24 -ac +extension GLX +render -noreset &
  XVFB_PID=$!

  # Wait for Xvfb to start
  sleep 2

  # Verify it's running
  if ps -p $XVFB_PID > /dev/null 2>&1; then
    print_status "Xvfb started successfully (PID: $XVFB_PID)"
    return 0
  else
    print_error "Failed to start Xvfb on $display"
    return 1
  fi
}

start_x11vnc() {
  local display=$1
  local port=$2

  print_step "Starting x11vnc on display $display (port $port)..."

  # Check if already running
  if lsof -i:$port > /dev/null 2>&1; then
    print_status "x11vnc already running on port $port"
    return 0
  fi

  # Start x11vnc with quality level 0 (JPEG Q15) for instant encoding and compression level 9
  x11vnc -display $display -forever -shared -rfbport $port -nopw -listen 0.0.0.0 -bg -o /tmp/x11vnc-${display}.log -quality 0 -compresslevel 9

  # Wait for x11vnc to start
  sleep 2

  # Verify it's running
  if lsof -i:$port > /dev/null 2>&1; then
    X11VNC_PID=$(lsof -ti:$port | head -n1)
    print_status "x11vnc started successfully (PID: $X11VNC_PID, port: $port)"
    return 0
  else
    print_error "Failed to start x11vnc on port $port"
    print_info "Check log: /tmp/x11vnc-${display}.log"
    return 1
  fi
}

start_fluxbox() {
  local display=$1
  local startup_script=""

  print_step "Starting window manager (fluxbox) on display $display..."

  # Check if already running
  if pgrep -f "fluxbox.*$display" > /dev/null; then
    print_status "Fluxbox already running on $display"
    return 0
  fi

  # Select appropriate startup script based on display
  if [ "$display" = ":98" ]; then
    startup_script="/home/master/.fluxbox/startup-98"
  elif [ "$display" = ":99" ]; then
    startup_script="/home/master/.fluxbox/startup-99"
  fi

  # Start fluxbox with custom startup script if available
  if [ -n "$startup_script" ] && [ -f "$startup_script" ]; then
    print_info "Using custom startup script: $startup_script"
    DISPLAY=$display "$startup_script" &
    FLUXBOX_PID=$!
  else
    print_info "No custom startup script found, using default fluxbox"
    DISPLAY=$display fluxbox &
    FLUXBOX_PID=$!
  fi

  # Wait for fluxbox to start
  sleep 1

  # Verify it's running
  if ps -p $FLUXBOX_PID > /dev/null 2>&1; then
    print_status "Fluxbox started successfully (PID: $FLUXBOX_PID)"
    return 0
  else
    print_warning "Fluxbox may not have started properly"
    return 0  # Non-critical, return success
  fi
}

start_terminal() {
  local display=$1

  print_step "Starting terminal on display $display..."

  # Check if xterm is already running on this display
  if pgrep -f "xterm.*DISPLAY=$display" > /dev/null; then
    print_status "Terminal already running on $display"
    return 0
  fi

  # Check if xterm is available
  if ! command -v xterm &> /dev/null; then
    print_warning "xterm not installed. Terminal will not be available."
    print_info "Install with: sudo apt-get install xterm"
    return 0  # Non-critical
  fi

  # Start xterm
  DISPLAY=$display xterm -geometry 120x40 &
  XTERM_PID=$!

  sleep 1

  if ps -p $XTERM_PID > /dev/null 2>&1; then
    print_status "Terminal started successfully (PID: $XTERM_PID)"
  else
    print_warning "Terminal may not have started properly"
  fi

  return 0
}

# =============================================================================
# MAIN VNC SETUP FUNCTIONS
# =============================================================================

start_vnc_display() {
  local display=$1
  local port=$2
  local display_name=$3
  local resolution=$4
  local start_terminal=$5

  print_header "Setting up $display_name"
  print_info "Display: $display, Port: $port, Resolution: $resolution"

  # Attempt to start with retries
  local attempt=1

  while [ $attempt -le $MAX_RETRIES ]; do
    if [ $attempt -gt 1 ]; then
      print_warning "Retry attempt $attempt of $MAX_RETRIES..."
      stop_display $display
      kill_process_on_port $port
      sleep $RETRY_DELAY
    fi

    # Start components
    if ! start_xvfb $display $resolution; then
      print_error "Failed to start Xvfb (attempt $attempt)"
      ((attempt++))
      continue
    fi

    if ! start_x11vnc $display $port; then
      print_error "Failed to start x11vnc (attempt $attempt)"
      ((attempt++))
      continue
    fi

    # Start window manager
    start_fluxbox $display

    # Start terminal if requested
    if [ "$start_terminal" = "yes" ]; then
      start_terminal $display
    fi

    # Success
    print_status "$display_name setup completed successfully"
    return 0
  done

  # All retries failed
  print_error "Failed to start $display_name after $MAX_RETRIES attempts"
  return 1
}

# =============================================================================
# STATUS VERIFICATION
# =============================================================================

verify_vnc_status() {
  print_header "Verifying VNC Status"

  local all_ok=true

  # Check Terminal VNC
  print_step "Checking Terminal VNC..."
  if pgrep -f "Xvfb $TERMINAL_DISPLAY" > /dev/null; then
    print_status "Xvfb running on $TERMINAL_DISPLAY"
  else
    print_error "Xvfb not running on $TERMINAL_DISPLAY"
    all_ok=false
  fi

  if lsof -i:$TERMINAL_PORT > /dev/null 2>&1; then
    print_status "x11vnc listening on port $TERMINAL_PORT"
  else
    print_error "x11vnc not listening on port $TERMINAL_PORT"
    all_ok=false
  fi

  # Check Playwright VNC
  print_step "Checking Playwright VNC..."
  if pgrep -f "Xvfb $PLAYWRIGHT_DISPLAY" > /dev/null; then
    print_status "Xvfb running on $PLAYWRIGHT_DISPLAY"
  else
    print_error "Xvfb not running on $PLAYWRIGHT_DISPLAY"
    all_ok=false
  fi

  if lsof -i:$PLAYWRIGHT_PORT > /dev/null 2>&1; then
    print_status "x11vnc listening on port $PLAYWRIGHT_PORT"
  else
    print_error "x11vnc not listening on port $PLAYWRIGHT_PORT"
    all_ok=false
  fi

  # Process summary
  print_step "Process Summary"
  XVFB_COUNT=$(pgrep -f Xvfb | wc -l)
  X11VNC_COUNT=$(pgrep -f x11vnc | wc -l)
  print_info "Xvfb processes: $XVFB_COUNT"
  print_info "x11vnc processes: $X11VNC_COUNT"

  if [ "$all_ok" = true ]; then
    print_status "All VNC services are running correctly"
    return 0
  else
    print_warning "Some VNC services failed to start"
    return 1
  fi
}

# =============================================================================
# COMMAND-LINE OPTIONS
# =============================================================================

show_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --restart     Stop and restart all VNC servers"
  echo "  --stop        Stop all VNC servers"
  echo "  --status      Show VNC server status"
  echo "  --help        Show this help message"
  echo ""
  echo "Default: Start VNC servers if not already running"
}

stop_all_vnc() {
  print_header "Stopping All VNC Servers"

  stop_display $TERMINAL_DISPLAY
  stop_display $PLAYWRIGHT_DISPLAY

  kill_process_on_port $TERMINAL_PORT
  kill_process_on_port $PLAYWRIGHT_PORT

  print_status "All VNC servers stopped"
}

show_status() {
  print_header "VNC Server Status"

  # Terminal VNC
  print_step "Terminal VNC (Display $TERMINAL_DISPLAY, Port $TERMINAL_PORT)"
  if pgrep -f "Xvfb $TERMINAL_DISPLAY" > /dev/null; then
    XVFB_PID=$(pgrep -f "Xvfb $TERMINAL_DISPLAY" | head -n1)
    print_status "Xvfb: Running (PID: $XVFB_PID)"
  else
    print_error "Xvfb: Not running"
  fi

  if lsof -i:$TERMINAL_PORT > /dev/null 2>&1; then
    VNC_PID=$(lsof -ti:$TERMINAL_PORT | head -n1)
    print_status "x11vnc: Running (PID: $VNC_PID, Port: $TERMINAL_PORT)"
  else
    print_error "x11vnc: Not running"
  fi

  # Playwright VNC
  print_step "Playwright VNC (Display $PLAYWRIGHT_DISPLAY, Port $PLAYWRIGHT_PORT)"
  if pgrep -f "Xvfb $PLAYWRIGHT_DISPLAY" > /dev/null; then
    XVFB_PID=$(pgrep -f "Xvfb $PLAYWRIGHT_DISPLAY" | head -n1)
    print_status "Xvfb: Running (PID: $XVFB_PID)"
  else
    print_error "Xvfb: Not running"
  fi

  if lsof -i:$PLAYWRIGHT_PORT > /dev/null 2>&1; then
    VNC_PID=$(lsof -ti:$PLAYWRIGHT_PORT | head -n1)
    print_status "x11vnc: Running (PID: $VNC_PID, Port: $PLAYWRIGHT_PORT)"
  else
    print_error "x11vnc: Not running"
  fi

  # Connection info
  print_step "Connection Information"
  print_info "Terminal VNC:   ws://localhost:$TERMINAL_PORT"
  print_info "Playwright VNC: ws://localhost:$PLAYWRIGHT_PORT"
  print_info "External access: Replace 'localhost' with server IP"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  # Parse command-line options
  case "${1:-}" in
    --restart)
      stop_all_vnc
      sleep 2
      ;;
    --stop)
      stop_all_vnc
      exit 0
      ;;
    --status)
      show_status
      exit 0
      ;;
    --help)
      show_usage
      exit 0
      ;;
    "")
      # Default: start VNC
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac

  print_header "MI AI Coding Platform - VNC Server Startup"

  # Check dependencies
  check_dependencies

  # Start Terminal VNC (Display :98, Port 6081)
  if ! start_vnc_display "$TERMINAL_DISPLAY" "$TERMINAL_PORT" "Terminal VNC" "$TERMINAL_RESOLUTION" "yes"; then
    print_error "Failed to start Terminal VNC"
    exit 1
  fi

  echo ""

  # Start Playwright VNC (Display :99, Port 6080)
  if ! start_vnc_display "$PLAYWRIGHT_DISPLAY" "$PLAYWRIGHT_PORT" "Playwright VNC" "$PLAYWRIGHT_RESOLUTION" "no"; then
    print_error "Failed to start Playwright VNC"
    exit 1
  fi

  echo ""

  # Verify status
  verify_vnc_status

  echo ""

  # Start websockify processes using PID-based management
  print_header "Starting WebSocket Proxies (websockify)"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ -f "$SCRIPT_DIR/manage-websockify.sh" ]; then
    print_info "Using PID-based websockify management to prevent duplicates"
    "$SCRIPT_DIR/manage-websockify.sh" restart
  else
    print_warning "manage-websockify.sh not found, skipping websockify setup"
    print_info "VNC servers are running but WebSocket access may not work"
  fi

  # Display connection information
  print_header "VNC Servers Started Successfully"

  echo ""
  echo "Connection Information:"
  echo "  Terminal VNC:   ws://localhost:$TERMINAL_PORT   (Display $TERMINAL_DISPLAY)"
  echo "  Playwright VNC: ws://localhost:$PLAYWRIGHT_PORT   (Display $PLAYWRIGHT_DISPLAY)"
  echo ""
  echo "For external access, replace 'localhost' with your server IP:"
  echo "  ws://$(hostname -I | awk '{print $1}'):$TERMINAL_PORT"
  echo "  ws://$(hostname -I | awk '{print $1}'):$PLAYWRIGHT_PORT"
  echo ""
  echo "Testing and Monitoring:"
  echo "  Run Playwright tests: DISPLAY=$PLAYWRIGHT_DISPLAY npx playwright test"
  echo "  Open terminal:        DISPLAY=$TERMINAL_DISPLAY xterm &"
  echo ""
  echo "Management Commands:"
  echo "  Show status:   $0 --status"
  echo "  Restart:       $0 --restart"
  echo "  Stop:          $0 --stop"
  echo ""
  echo "Process Management:"
  echo "  View processes: ps aux | grep -E 'Xvfb|x11vnc'"
  echo "  View ports:     netstat -tulpn | grep -E '$TERMINAL_PORT|$PLAYWRIGHT_PORT'"
  echo "  View logs:      tail -f /tmp/x11vnc-*.log"
  echo ""
  echo "Troubleshooting:"
  echo "  If VNC doesn't work, try restarting: $0 --restart"
  echo "  Check logs in /tmp/x11vnc-*.log for errors"
  echo "  Ensure ports $TERMINAL_PORT and $PLAYWRIGHT_PORT are not blocked by firewall"
  echo ""
}

# Run main function
main "$@"

exit 0
