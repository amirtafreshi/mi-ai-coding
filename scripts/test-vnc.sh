#!/bin/bash

###############################################################################
# VNC Playwright Test Runner
#
# ⚠️ CRITICAL: This script ensures all Playwright tests run on DISPLAY=:99
# for VNC visibility at http://localhost:6080
#
# Usage:
#   ./scripts/test-vnc.sh                    # Run all tests
#   ./scripts/test-vnc.sh --ui               # Run with UI mode
#   ./scripts/test-vnc.sh --headed           # Run headed browser
#   ./scripts/test-vnc.sh file.spec.ts       # Run specific test
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}VNC Playwright Test Runner${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if VNC server is running on DISPLAY :99
if ! xdpyinfo -display :99 &>/dev/null; then
    echo -e "${RED}ERROR: VNC server not running on DISPLAY :99${NC}"
    echo -e "${YELLOW}Starting VNC server...${NC}"
    ./scripts/start-vnc.sh
    sleep 2
fi

# Verify VNC is accessible
if xdpyinfo -display :99 &>/dev/null; then
    echo -e "${GREEN}✓ VNC server running on DISPLAY :99${NC}"
    echo -e "${GREEN}✓ View tests at: http://localhost:6080${NC}"
else
    echo -e "${RED}ERROR: Failed to start VNC server${NC}"
    exit 1
fi

# Set DISPLAY environment variable
export DISPLAY=:99

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Running Playwright tests on DISPLAY :99${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Run playwright with all passed arguments
npx playwright test "$@"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Tests completed!${NC}"
echo -e "${GREEN}View results at: http://localhost:6080${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
