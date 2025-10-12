#!/bin/bash

#############################################
# Screenshot Cleanup Script
# Purpose: Delete old screenshots from previous days
# Keeps only today's screenshots to conserve disk space
# Run before each test session
#############################################

set -e  # Exit on error

SCREENSHOT_DIR="/home/master/projects/mi-ai-coding/screenshots"
TODAY=$(date +%Y-%m-%d)
TODAY_DIR="$SCREENSHOT_DIR/$TODAY"

echo "==========================================="
echo "Screenshot Cleanup - $(date)"
echo "==========================================="
echo ""

# Create screenshots directory if it doesn't exist
if [ ! -d "$SCREENSHOT_DIR" ]; then
    echo "Creating screenshots directory: $SCREENSHOT_DIR"
    mkdir -p "$SCREENSHOT_DIR"
fi

# Create today's directory if it doesn't exist
if [ ! -d "$TODAY_DIR" ]; then
    echo "Creating today's screenshot directory: $TODAY_DIR"
    mkdir -p "$TODAY_DIR"
fi

# Count directories before cleanup
BEFORE_COUNT=$(find "$SCREENSHOT_DIR" -maxdepth 1 -type d ! -path "$SCREENSHOT_DIR" | wc -l)

echo "Current date: $TODAY"
echo "Screenshot directory: $SCREENSHOT_DIR"
echo "Today's screenshots: $TODAY_DIR"
echo ""
echo "Directories before cleanup: $BEFORE_COUNT"
echo ""

# Delete loose screenshot files in the root directory
LOOSE_FILES=$(find "$SCREENSHOT_DIR" -maxdepth 1 -type f -name "*.png" 2>/dev/null | wc -l)
if [ "$LOOSE_FILES" -gt 0 ]; then
    echo "Found $LOOSE_FILES loose screenshot files in root directory"
    echo "Moving loose files to today's directory..."
    find "$SCREENSHOT_DIR" -maxdepth 1 -type f -name "*.png" -exec mv {} "$TODAY_DIR/" \;
    echo "✓ Moved $LOOSE_FILES files to $TODAY_DIR"
    echo ""
fi

# Find and delete all screenshot directories except today's
DELETED_COUNT=0
for dir in "$SCREENSHOT_DIR"/*/ ; do
    if [ -d "$dir" ]; then
        dir_name=$(basename "$dir")

        # Skip if it's today's directory
        if [ "$dir_name" = "$TODAY" ]; then
            echo "✓ Keeping today's screenshots: $dir"
        else
            echo "✗ Deleting old screenshots: $dir"
            rm -rf "$dir"
            ((DELETED_COUNT++))
        fi
    fi
done

echo ""
echo "==========================================="
echo "Cleanup Summary"
echo "==========================================="
echo "Directories deleted: $DELETED_COUNT"
echo "Today's directory: $TODAY_DIR"
echo ""
echo "✓ Cleanup complete! Ready for testing."
echo ""
