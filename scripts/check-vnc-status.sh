#!/bin/bash

# MI AI Coding Platform - VNC Status Check Script
# Verifies VNC server status and connectivity

echo "========================================="
echo "VNC Infrastructure Status Check"
echo "========================================="
echo ""

# Check installed tools
echo "1. Checking VNC Tools Installation:"
echo "   x11vnc:    $(which x11vnc 2>/dev/null || echo 'NOT FOUND')"
echo "   Xvfb:      $(which Xvfb 2>/dev/null || echo 'NOT FOUND')"
echo "   websockify: $(which websockify 2>/dev/null || echo 'NOT FOUND')"
echo "   xclip:     $(which xclip 2>/dev/null || echo 'NOT FOUND')"
echo "   xdotool:   $(which xdotool 2>/dev/null || echo 'NOT FOUND')"
echo ""

# Check running processes
echo "2. VNC Server Processes:"
XVFB_98=$(pgrep -f "Xvfb :98" | wc -l)
XVFB_99=$(pgrep -f "Xvfb :99" | wc -l)
X11VNC_98=$(pgrep -f "x11vnc.*:98" | wc -l)
X11VNC_99=$(pgrep -f "x11vnc.*:99" | wc -l)

echo "   Xvfb :98:       $([[ $XVFB_98 -gt 0 ]] && echo 'RUNNING' || echo 'NOT RUNNING')"
echo "   Xvfb :99:       $([[ $XVFB_99 -gt 0 ]] && echo 'RUNNING' || echo 'NOT RUNNING')"
echo "   x11vnc :98:     $([[ $X11VNC_98 -gt 0 ]] && echo 'RUNNING' || echo 'NOT RUNNING')"
echo "   x11vnc :99:     $([[ $X11VNC_99 -gt 0 ]] && echo 'RUNNING' || echo 'NOT RUNNING')"
echo ""

# Check websockify
echo "3. Websockify Processes:"
WS_6080=$(pgrep -f "websockify.*6080" | wc -l)
WS_6081=$(pgrep -f "websockify.*6081" | wc -l)
echo "   Port 6080:      $([[ $WS_6080 -gt 0 ]] && echo "RUNNING ($WS_6080 processes)" || echo 'NOT RUNNING')"
echo "   Port 6081:      $([[ $WS_6081 -gt 0 ]] && echo "RUNNING ($WS_6081 processes)" || echo 'NOT RUNNING')"
echo ""

# Check port accessibility
echo "4. Port Status:"
PORT_6080=$(ss -tlnp 2>/dev/null | grep -c ':6080' || netstat -tlnp 2>/dev/null | grep -c ':6080' || echo "0")
PORT_6081=$(ss -tlnp 2>/dev/null | grep -c ':6081' || netstat -tlnp 2>/dev/null | grep -c ':6081' || echo "0")
echo "   Port 6080:      $([[ $PORT_6080 -gt 0 ]] && echo 'LISTENING' || echo 'NOT LISTENING')"
echo "   Port 6081:      $([[ $PORT_6081 -gt 0 ]] && echo 'LISTENING' || echo 'NOT LISTENING')"
echo ""

# Check display resolutions
echo "5. Display Resolutions:"
if [[ $XVFB_98 -gt 0 ]]; then
  RES_98=$(DISPLAY=:98 xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}')
  echo "   Display :98:    ${RES_98:-'Unable to detect'}"
else
  echo "   Display :98:    N/A (not running)"
fi

if [[ $XVFB_99 -gt 0 ]]; then
  RES_99=$(DISPLAY=:99 xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}')
  echo "   Display :99:    ${RES_99:-'Unable to detect'}"
else
  echo "   Display :99:    N/A (not running)"
fi
echo ""

# Summary
echo "========================================="
echo "Summary"
echo "========================================="
VNC_STATUS="OK"
RESOLUTION_STATUS="OK"

if [[ $XVFB_98 -eq 0 ]] || [[ $XVFB_99 -eq 0 ]] || [[ $X11VNC_98 -eq 0 ]] || [[ $X11VNC_99 -eq 0 ]]; then
  VNC_STATUS="ISSUES DETECTED"
fi

if [[ "$RES_98" != "1920x1080" ]] || [[ "$RES_99" != "1920x1080" ]]; then
  RESOLUTION_STATUS="NEEDS UPGRADE"
fi

echo "VNC Servers:     $VNC_STATUS"
echo "Resolutions:     $RESOLUTION_STATUS"
echo ""

if [[ "$VNC_STATUS" == "OK" ]] && [[ "$RESOLUTION_STATUS" == "OK" ]]; then
  echo "All VNC infrastructure is properly configured!"
elif [[ "$RESOLUTION_STATUS" == "NEEDS UPGRADE" ]]; then
  echo "VNC servers are running but need resolution upgrade to 1920x1080"
  echo "Run: sudo ./scripts/restart-vnc-1920x1080.sh"
else
  echo "Some VNC components are not running properly"
  echo "Run: sudo ./scripts/start-vnc.sh"
fi
echo ""

# Access URLs
echo "Web Access URLs:"
echo "  Playwright (Display :99): http://localhost:6080"
echo "  Terminal (Display :98):   http://localhost:6081"
echo ""
