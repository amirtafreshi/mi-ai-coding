#!/bin/bash

# Script to stop the old VNC server running on port 6001
# This is a standalone VNC server, NOT part of the current mi-ai-coding

echo "=================================================="
echo "Stopping VNC Server on Port 6001"
echo "=================================================="
echo ""

# Find process on port 6001
PID=$(sudo lsof -ti:6001 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✓ No process found on port 6001"
    exit 0
fi

echo "Found process on port 6001: PID $PID"
ps aux | grep $PID | grep -v grep

echo ""
read -p "Do you want to stop this process? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping process $PID..."
    sudo kill -9 $PID

    sleep 2

    # Verify it's stopped
    if sudo lsof -ti:6001 > /dev/null 2>&1; then
        echo "✗ Failed to stop process on port 6001"
        exit 1
    else
        echo "✓ Successfully stopped process on port 6001"
        echo ""
        echo "Port 6001 is now free"
    fi
else
    echo "Cancelled - no changes made"
    exit 0
fi

echo ""
echo "Current mi-ai-coding status:"
echo "  App running on port 3000: $(ss -tlnp 2>/dev/null | grep :3000 > /dev/null && echo '✓ Running' || echo '✗ Not running')"
echo "  WebSocket on port 3001:   $(ss -tlnp 2>/dev/null | grep :3001 > /dev/null && echo '✓ Running' || echo '✗ Not running')"
echo ""
