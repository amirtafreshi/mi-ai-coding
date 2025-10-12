#!/bin/bash

# MI AI Coding Platform - Fix External Access Script
# This script configures firewall and VNC servers for external access

set -e

echo "========================================="
echo "MI AI Coding Platform - External Access Fix"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

print_status() {
  echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
  echo -e "${RED}Error:${NC} $1"
}

print_info() {
  echo -e "${BLUE}Info:${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  print_error "This script must be run as root (use sudo)"
  exit 1
fi

echo ""
echo "========================================="
echo "Step 1: Configure UFW Firewall"
echo "========================================="
echo ""

# Check UFW status
print_status "Checking UFW firewall status..."
UFW_STATUS=$(ufw status | head -1)
echo "$UFW_STATUS"

# Required ports
PORTS_TO_OPEN=(
  "3000/tcp comment 'Next.js Application'"
  "3001/tcp comment 'WebSocket Server'"
  "6080/tcp comment 'VNC Playwright (noVNC)'"
  "6081/tcp comment 'VNC Terminal (noVNC)'"
)

print_status "Opening required ports..."
for PORT_RULE in "${PORTS_TO_OPEN[@]}"; do
  print_info "Opening port: $PORT_RULE"
  ufw allow $PORT_RULE
done

# Reload UFW
print_status "Reloading UFW firewall..."
ufw reload

# Show status
echo ""
print_status "Current UFW status:"
ufw status verbose | grep -E "3000|3001|6080|6081"
echo ""

echo ""
echo "========================================="
echo "Step 2: Restart VNC Servers (Passwordless)"
echo "========================================="
echo ""

# Kill existing VNC servers
print_status "Stopping existing VNC servers..."
pkill -f 'x11vnc.*display :99' 2>/dev/null || true
pkill -f 'x11vnc.*display :98' 2>/dev/null || true
sleep 2

# Kill existing websockify processes
print_status "Stopping existing websockify processes..."
pkill -f 'websockify.*6080' 2>/dev/null || true
pkill -f 'websockify.*6081' 2>/dev/null || true
sleep 2

# Verify Xvfb displays are running
print_status "Checking Xvfb displays..."
if ! pgrep -f "Xvfb :98" > /dev/null; then
  print_warning "Xvfb :98 not running, starting it..."
  Xvfb :98 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
  sleep 2
fi

if ! pgrep -f "Xvfb :99" > /dev/null; then
  print_warning "Xvfb :99 not running, starting it..."
  Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
  sleep 2
fi

# Start VNC :98 (Terminal) on port 5901
print_status "Starting VNC server for display :98 (Terminal)..."
x11vnc -display :98 -forever -shared -rfbport 5901 -nopw -listen 0.0.0.0 -bg -o /var/log/x11vnc-98.log

# Start VNC :99 (Playwright) on port 5900
print_status "Starting VNC server for display :99 (Playwright)..."
x11vnc -display :99 -forever -shared -rfbport 5900 -nopw -listen 0.0.0.0 -bg -o /var/log/x11vnc-99.log

sleep 2

# Verify VNC servers started
if pgrep -f "x11vnc.*display :98" > /dev/null; then
  print_status "VNC :98 started successfully"
else
  print_error "Failed to start VNC :98"
fi

if pgrep -f "x11vnc.*display :99" > /dev/null; then
  print_status "VNC :99 started successfully"
else
  print_error "Failed to start VNC :99"
fi

# Start websockify for VNC :98 (port 6081)
print_status "Starting websockify for VNC :98 on port 6081..."
websockify --web=/root/noVNC 6081 localhost:5901 &
sleep 2

# Start websockify for VNC :99 (port 6080)
print_status "Starting websockify for VNC :99 on port 6080..."
websockify --web=/root/noVNC 6080 localhost:5900 &
sleep 2

echo ""
echo "========================================="
echo "Step 3: Verify Services"
echo "========================================="
echo ""

# Check VNC processes
print_status "VNC server processes:"
ps aux | grep -E 'x11vnc|websockify' | grep -v grep

echo ""

# Check listening ports
print_status "Listening ports:"
ss -tulpn | grep -E '3000|3001|5900|5901|6080|6081'

echo ""
echo "========================================="
echo "Step 4: Test Local Connections"
echo "========================================="
echo ""

# Test VNC ports
print_status "Testing VNC port 6080 (Playwright)..."
if timeout 5 bash -c "echo > /dev/tcp/localhost/6080" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Port 6080 is accessible"
else
  echo -e "${RED}✗${NC} Port 6080 is not accessible"
fi

print_status "Testing VNC port 6081 (Terminal)..."
if timeout 5 bash -c "echo > /dev/tcp/localhost/6081" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Port 6081 is accessible"
else
  echo -e "${RED}✗${NC} Port 6081 is not accessible"
fi

print_status "Testing WebSocket port 3001..."
if timeout 5 bash -c "echo > /dev/tcp/localhost/3001" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Port 3001 is accessible"
else
  echo -e "${RED}✗${NC} Port 3001 is not accessible"
fi

print_status "Testing Next.js port 3000..."
if timeout 5 bash -c "echo > /dev/tcp/localhost/3000" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Port 3000 is accessible"
else
  echo -e "${RED}✗${NC} Port 3000 is not accessible"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Configuration Complete!${NC}"
echo "========================================="
echo ""
echo "External Access URLs (replace SERVER_IP with your server's IP):"
echo "  - Next.js App:      http://SERVER_IP:3000"
echo "  - WebSocket:        ws://SERVER_IP:3001"
echo "  - VNC Playwright:   http://SERVER_IP:6080/vnc.html"
echo "  - VNC Terminal:     http://SERVER_IP:6081/vnc.html"
echo ""
echo "VNC Configuration:"
echo "  - Display :98 (Terminal):   Port 5901 → noVNC 6081"
echo "  - Display :99 (Playwright): Port 5900 → noVNC 6080"
echo "  - Password: NONE (passwordless access enabled)"
echo ""
echo "Firewall Status:"
echo "  - Ports 3000, 3001, 6080, 6081 are open"
echo ""
echo "Logs:"
echo "  - VNC :98: /var/log/x11vnc-98.log"
echo "  - VNC :99: /var/log/x11vnc-99.log"
echo ""
