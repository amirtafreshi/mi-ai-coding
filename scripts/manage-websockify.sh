#!/bin/bash

# manage-websockify.sh - PID-based websockify process management
# Prevents duplicate websockify processes by tracking PIDs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"
mkdir -p "$PID_DIR"

# VNC display configurations
DISPLAY_98_PORT=6081
DISPLAY_99_PORT=6080
VNC_98_PORT=5998
VNC_99_PORT=5999

# PID files
PID_FILE_98="$PID_DIR/websockify-98.pid"
PID_FILE_99="$PID_DIR/websockify-99.pid"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if process is running
is_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    if kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Stop websockify process
stop_websockify() {
    local display=$1
    local pid_file="$PID_DIR/websockify-$display.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if is_running "$pid"; then
            echo -e "${BLUE}▶${NC} Stopping websockify for display :$display (PID: $pid)..."
            kill "$pid" 2>/dev/null || sudo kill "$pid" 2>/dev/null || true
            sleep 1

            # Force kill if still running
            if is_running "$pid"; then
                echo -e "${YELLOW}⚠${NC} Process still running, force killing..."
                kill -9 "$pid" 2>/dev/null || sudo kill -9 "$pid" 2>/dev/null || true
            fi
            echo -e "${GREEN}✓${NC} Stopped websockify for display :$display"
        fi
        rm -f "$pid_file"
    fi

    # Clean up any remaining websockify processes for this display
    local port
    if [ "$display" = "98" ]; then
        port=$DISPLAY_98_PORT
    else
        port=$DISPLAY_99_PORT
    fi

    pkill -f "websockify.*:$port" 2>/dev/null || sudo pkill -f "websockify.*:$port" 2>/dev/null || true
}

# Start websockify process
start_websockify() {
    local display=$1
    local web_port=$2
    local vnc_port=$3
    local pid_file="$PID_DIR/websockify-$display.pid"

    # Check if already running
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if is_running "$pid"; then
            echo -e "${GREEN}✓${NC} websockify for display :$display already running (PID: $pid)"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} Stale PID file found, cleaning up..."
            rm -f "$pid_file"
        fi
    fi

    # Check if port is already in use
    if netstat -tuln | grep -q ":$web_port "; then
        echo -e "${YELLOW}⚠${NC} Port $web_port already in use, stopping existing process..."
        stop_websockify "$display"
        sleep 1
    fi

    echo -e "${BLUE}▶${NC} Starting websockify for display :$display..."
    echo -e "   Web port: $web_port, VNC port: $vnc_port"

    # Start websockify in background and capture PID
    websockify -D 0.0.0.0:$web_port localhost:$vnc_port &
    local pid=$!

    # Wait a moment for process to start
    sleep 1

    # Verify process is running
    if is_running "$pid"; then
        echo "$pid" > "$pid_file"
        echo -e "${GREEN}✓${NC} websockify started for display :$display (PID: $pid)"
    else
        echo -e "${RED}✗${NC} Failed to start websockify for display :$display"
        return 1
    fi
}

# Status check
status_websockify() {
    echo "========================================="
    echo "Websockify Process Status"
    echo "========================================="
    echo ""

    for display in 98 99; do
        local pid_file="$PID_DIR/websockify-$display.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if is_running "$pid"; then
                echo -e "${GREEN}✓${NC} Display :$display - Running (PID: $pid)"
            else
                echo -e "${RED}✗${NC} Display :$display - Stopped (stale PID file)"
            fi
        else
            echo -e "${YELLOW}⚠${NC} Display :$display - Not tracked (no PID file)"
        fi
    done

    echo ""
    echo "Active websockify processes:"
    ps aux | grep websockify | grep -v grep || echo "None"

    echo ""
    echo "Listening ports:"
    netstat -tuln | grep -E ":(6080|6081) " || echo "None"
}

# Main command handling
case "${1:-}" in
    start)
        echo "Starting websockify processes..."
        start_websockify 98 $DISPLAY_98_PORT $VNC_98_PORT
        start_websockify 99 $DISPLAY_99_PORT $VNC_99_PORT
        echo ""
        status_websockify
        ;;

    stop)
        echo "Stopping websockify processes..."
        stop_websockify 98
        stop_websockify 99
        echo -e "${GREEN}✓${NC} All websockify processes stopped"
        ;;

    restart)
        echo "Restarting websockify processes..."
        stop_websockify 98
        stop_websockify 99
        sleep 2
        start_websockify 98 $DISPLAY_98_PORT $VNC_98_PORT
        start_websockify 99 $DISPLAY_99_PORT $VNC_99_PORT
        echo ""
        status_websockify
        ;;

    status)
        status_websockify
        ;;

    clean)
        echo "Cleaning up stale PID files and processes..."
        stop_websockify 98
        stop_websockify 99
        rm -rf "$PID_DIR"
        mkdir -p "$PID_DIR"
        echo -e "${GREEN}✓${NC} Cleanup complete"
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Start websockify processes (if not already running)"
        echo "  stop    - Stop websockify processes"
        echo "  restart - Restart websockify processes"
        echo "  status  - Show status of websockify processes"
        echo "  clean   - Clean up all websockify processes and PID files"
        exit 1
        ;;
esac

exit 0
