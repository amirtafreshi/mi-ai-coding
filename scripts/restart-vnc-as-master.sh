#!/bin/bash

# Script to restart VNC servers as 'master' user instead of 'root'
# This ensures xterm and other applications open with the correct user

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

print_header "Restart VNC Servers as Master User"

# Check current user
if [ "$(whoami)" != "master" ]; then
  print_error "This script must be run as the 'master' user"
  print_info "Current user: $(whoami)"
  exit 1
fi

print_status "Running as master user"

# Step 1: Stop all root-owned VNC processes
print_info "Step 1: Stopping root-owned VNC processes..."

# Kill root Xvfb processes
ROOT_XVFB_PIDS=$(ps aux | grep "root.*Xvfb" | grep -v grep | awk '{print $2}')
if [ ! -z "$ROOT_XVFB_PIDS" ]; then
  echo "$ROOT_XVFB_PIDS" | while read pid; do
    print_info "Stopping root Xvfb (PID: $pid)..."
    sudo kill -9 $pid 2>/dev/null || true
  done
  print_status "Stopped root Xvfb processes"
else
  print_info "No root Xvfb processes found"
fi

# Kill root x11vnc processes
ROOT_X11VNC_PIDS=$(ps aux | grep "root.*x11vnc" | grep -v grep | awk '{print $2}')
if [ ! -z "$ROOT_X11VNC_PIDS" ]; then
  echo "$ROOT_X11VNC_PIDS" | while read pid; do
    print_info "Stopping root x11vnc (PID: $pid)..."
    sudo kill -9 $pid 2>/dev/null || true
  done
  print_status "Stopped root x11vnc processes"
else
  print_info "No root x11vnc processes found"
fi

# Kill root fluxbox processes
ROOT_FLUXBOX_PIDS=$(ps aux | grep "root.*fluxbox" | grep -v grep | awk '{print $2}')
if [ ! -z "$ROOT_FLUXBOX_PIDS" ]; then
  echo "$ROOT_FLUXBOX_PIDS" | while read pid; do
    print_info "Stopping root fluxbox (PID: $pid)..."
    sudo kill -9 $pid 2>/dev/null || true
  done
  print_status "Stopped root fluxbox processes"
else
  print_info "No root fluxbox processes found"
fi

# Wait for processes to terminate
print_info "Waiting for processes to terminate..."
sleep 3

# Step 2: Start VNC servers as master user
print_info "Step 2: Starting VNC servers as master user..."

# Use the existing start-vnc.sh script
if [ -f "/home/master/projects/mi-ai-coding/scripts/start-vnc.sh" ]; then
  print_info "Running start-vnc.sh as master user..."
  /home/master/projects/mi-ai-coding/scripts/start-vnc.sh
else
  print_error "start-vnc.sh not found"
  exit 1
fi

# Step 3: Verify new processes
print_header "Verification"

print_info "Checking VNC processes..."
echo ""

# Check Xvfb
XVFB_COUNT=$(ps aux | grep "master.*Xvfb" | grep -v grep | wc -l)
if [ $XVFB_COUNT -ge 2 ]; then
  print_status "Xvfb running as master user ($XVFB_COUNT displays)"
  ps aux | grep "master.*Xvfb" | grep -v grep
else
  print_error "Xvfb not running as master user"
fi

echo ""

# Check x11vnc
X11VNC_COUNT=$(ps aux | grep "master.*x11vnc" | grep -v grep | wc -l)
if [ $X11VNC_COUNT -ge 2 ]; then
  print_status "x11vnc running as master user ($X11VNC_COUNT instances)"
  ps aux | grep "master.*x11vnc" | grep -v grep
else
  print_error "x11vnc not running as master user"
fi

echo ""

# Check ports
print_info "Checking VNC ports..."
netstat -tlnp 2>/dev/null | grep -E "6080|6081" || ss -tlnp 2>/dev/null | grep -E "6080|6081"

print_header "VNC Restart Complete"
print_status "VNC servers now running as 'master' user"
print_info "xterm and other applications will now open with the correct user"
echo ""
print_info "Access VNC viewers at:"
echo "  - Terminal VNC:   http://localhost:6081"
echo "  - Playwright VNC: http://localhost:6080"
echo ""
