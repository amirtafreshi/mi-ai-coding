#!/bin/bash

# MI AI Coding Platform - External Access Diagnostic Script
# Checks firewall, VNC servers, and port accessibility

echo "========================================="
echo "MI AI Coding Platform - Access Diagnostic"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

SUCCESS="${GREEN}✓${NC}"
FAILURE="${RED}✗${NC}"
WARNING="${YELLOW}!${NC}"

echo "Date: $(date)"
echo "Server IP: $(hostname -I | awk '{print $1}')"
echo ""

echo "========================================="
echo "1. Firewall Status (UFW)"
echo "========================================="
echo ""

if command -v ufw &> /dev/null; then
  if [ "$EUID" -eq 0 ]; then
    ufw status verbose | grep -E "Status|3000|3001|6080|6081"
  else
    echo -e "${WARNING} UFW check requires root access"
    echo "Run: sudo ufw status verbose"
  fi
else
  echo -e "${WARNING} UFW not installed"
fi

echo ""
echo "========================================="
echo "2. VNC Server Processes"
echo "========================================="
echo ""

echo "X11VNC Processes:"
if ps aux | grep -E 'x11vnc' | grep -v grep; then
  echo -e "${SUCCESS} VNC servers are running"

  # Check for -nopw flag
  if ps aux | grep x11vnc | grep -q '\-nopw'; then
    echo -e "${SUCCESS} Passwordless access enabled (-nopw flag present)"
  else
    echo -e "${FAILURE} Password protection enabled (missing -nopw flag)"
    echo "  ACTION REQUIRED: Restart VNC servers with -nopw flag"
  fi

  # Check listening interface
  if ps aux | grep x11vnc | grep -q 'listen 0.0.0.0'; then
    echo -e "${SUCCESS} Listening on all interfaces (0.0.0.0)"
  elif ps aux | grep x11vnc | grep -q 'listen localhost'; then
    echo -e "${FAILURE} Listening on localhost only (external access blocked)"
    echo "  ACTION REQUIRED: Restart with -listen 0.0.0.0"
  fi
else
  echo -e "${FAILURE} No VNC servers running"
fi

echo ""
echo "Websockify Processes:"
if ps aux | grep -E 'websockify' | grep -v grep; then
  echo -e "${SUCCESS} Websockify proxies are running"
else
  echo -e "${FAILURE} No websockify processes running"
fi

echo ""
echo "========================================="
echo "3. Listening Ports"
echo "========================================="
echo ""

check_port() {
  local PORT=$1
  local NAME=$2
  local BIND_IP=$(ss -tulpn 2>/dev/null | grep ":$PORT " | awk '{print $5}' | cut -d: -f1)

  if [ -n "$BIND_IP" ]; then
    if [ "$BIND_IP" = "0.0.0.0" ] || [ "$BIND_IP" = "*" ]; then
      echo -e "${SUCCESS} Port $PORT ($NAME) - Listening on ALL interfaces"
    elif [ "$BIND_IP" = "127.0.0.1" ] || [ "$BIND_IP" = "::1" ]; then
      echo -e "${WARNING} Port $PORT ($NAME) - Listening on LOCALHOST only"
      echo "    External access: BLOCKED"
    else
      echo -e "${SUCCESS} Port $PORT ($NAME) - Listening on $BIND_IP"
    fi
  else
    echo -e "${FAILURE} Port $PORT ($NAME) - NOT listening"
  fi
}

check_port 3000 "Next.js"
check_port 3001 "WebSocket"
check_port 5900 "VNC :99 direct"
check_port 5901 "VNC :98 direct"
check_port 6080 "VNC Playwright (noVNC)"
check_port 6081 "VNC Terminal (noVNC)"

echo ""
echo "Full port listing:"
ss -tulpn 2>/dev/null | grep -E '3000|3001|5900|5901|6080|6081' || netstat -tulpn 2>/dev/null | grep -E '3000|3001|5900|5901|6080|6081'

echo ""
echo "========================================="
echo "4. Local Port Connectivity Tests"
echo "========================================="
echo ""

test_local_port() {
  local PORT=$1
  local NAME=$2

  if timeout 3 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
    echo -e "${SUCCESS} localhost:$PORT ($NAME) - Accessible"
  else
    echo -e "${FAILURE} localhost:$PORT ($NAME) - Not accessible"
  fi
}

test_local_port 3000 "Next.js"
test_local_port 3001 "WebSocket"
test_local_port 6080 "VNC Playwright"
test_local_port 6081 "VNC Terminal"

echo ""
echo "========================================="
echo "5. Xvfb Virtual Displays"
echo "========================================="
echo ""

if pgrep -f "Xvfb :98" > /dev/null; then
  echo -e "${SUCCESS} Xvfb :98 is running"
else
  echo -e "${FAILURE} Xvfb :98 is NOT running"
fi

if pgrep -f "Xvfb :99" > /dev/null; then
  echo -e "${SUCCESS} Xvfb :99 is running"
else
  echo -e "${FAILURE} Xvfb :99 is NOT running"
fi

echo ""
echo "========================================="
echo "6. Summary & Recommendations"
echo "========================================="
echo ""

ISSUES_FOUND=0

# Check VNC password
if ! ps aux | grep x11vnc | grep -q '\-nopw'; then
  echo -e "${FAILURE} ISSUE: VNC servers require password authentication"
  echo "  FIX: Run 'sudo /home/master/projects/mi-ai-coding/scripts/fix-external-access.sh'"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check VNC listen interface
if ps aux | grep x11vnc | grep -q 'listen localhost'; then
  echo -e "${FAILURE} ISSUE: VNC servers only listening on localhost"
  echo "  FIX: Run 'sudo /home/master/projects/mi-ai-coding/scripts/fix-external-access.sh'"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check UFW
if [ "$EUID" -eq 0 ] && command -v ufw &> /dev/null; then
  for PORT in 3000 3001 6080 6081; do
    if ! ufw status | grep -q "$PORT"; then
      echo -e "${FAILURE} ISSUE: Port $PORT may not be open in firewall"
      echo "  FIX: Run 'sudo ufw allow $PORT/tcp'"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  done
fi

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}No issues found!${NC} External access should be working."
  echo ""
  echo "Access URLs (replace SERVER_IP with your server IP):"
  echo "  - Next.js App:      http://SERVER_IP:3000"
  echo "  - WebSocket:        ws://SERVER_IP:3001"
  echo "  - VNC Playwright:   http://SERVER_IP:6080/vnc.html"
  echo "  - VNC Terminal:     http://SERVER_IP:6081/vnc.html"
else
  echo -e "${RED}Found $ISSUES_FOUND issue(s)${NC} that need to be fixed."
  echo ""
  echo "Quick Fix:"
  echo "  sudo /home/master/projects/mi-ai-coding/scripts/fix-external-access.sh"
fi

echo ""
