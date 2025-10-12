#!/bin/bash

# MI AI Coding Platform - VNC Resolution Upgrade Script
# Restarts VNC servers with 1920x1080 resolution
# Must be run as root or with sudo

set -e

echo "========================================="
echo "Restarting VNC Servers with 1920x1080"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Error: This script must be run as root"
  echo "Usage: sudo ./restart-vnc-1920x1080.sh"
  exit 1
fi

# Stop existing VNC servers
echo "Stopping existing VNC servers..."
pkill -f 'Xvfb :98' || true
pkill -f 'Xvfb :99' || true
pkill -f 'x11vnc.*5900' || true
pkill -f 'x11vnc.*5901' || true
pkill -f 'websockify.*6080' || true
pkill -f 'websockify.*6081' || true
sleep 3

# Start Xvfb with 1920x1080 resolution
echo "Starting Xvfb displays..."
Xvfb :98 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2

# Start x11vnc servers
echo "Starting x11vnc servers..."
x11vnc -display :98 -forever -shared -rfbport 5901 -listen 0.0.0.0 &
sleep 2
x11vnc -display :99 -forever -shared -rfbport 5900 -listen 0.0.0.0 &
sleep 2

# Start websockify for web access
echo "Starting websockify for web access..."
if [ -d "/root/noVNC" ]; then
  websockify --web /root/noVNC 6080 localhost:5900 &
else
  websockify 6080 localhost:5900 &
fi
sleep 1
websockify 6081 localhost:5901 &
sleep 1

# Verify resolution
echo ""
echo "Verifying resolutions..."
DISPLAY=:98 xdpyinfo | grep dimensions
DISPLAY=:99 xdpyinfo | grep dimensions

echo ""
echo "========================================="
echo "VNC Servers Restarted Successfully"
echo "========================================="
echo ""
echo "Display :98 (Terminal)   - Port 6081 - 1920x1080"
echo "Display :99 (Playwright) - Port 6080 - 1920x1080"
echo ""
echo "Web Access:"
echo "  http://localhost:6080 (Playwright - Display :99)"
echo "  http://localhost:6081 (Terminal - Display :98)"
echo ""
echo "Status:"
ps aux | grep -E "(Xvfb|x11vnc|websockify)" | grep -v grep
echo ""
