#!/bin/bash
# Verification script for GitHub release preparation

echo "==================================="
echo "GitHub Release Setup Verification"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        return 1
    fi
}

# Counter
total=0
passed=0

echo "Checking GitHub Workflows..."
total=$((total+1)); check_file ".github/workflows/ci.yml" && passed=$((passed+1))
total=$((total+1)); check_file ".github/workflows/release.yml" && passed=$((passed+1))
echo ""

echo "Checking Issue Templates..."
total=$((total+1)); check_file ".github/ISSUE_TEMPLATE/bug_report.md" && passed=$((passed+1))
total=$((total+1)); check_file ".github/ISSUE_TEMPLATE/feature_request.md" && passed=$((passed+1))
total=$((total+1)); check_file ".github/ISSUE_TEMPLATE/question.md" && passed=$((passed+1))
echo ""

echo "Checking Pull Request Template..."
total=$((total+1)); check_file ".github/PULL_REQUEST_TEMPLATE.md" && passed=$((passed+1))
echo ""

echo "Checking Project Files..."
total=$((total+1)); check_file "LICENSE" && passed=$((passed+1))
total=$((total+1)); check_file "CHANGELOG.md" && passed=$((passed+1))
total=$((total+1)); check_file ".gitignore" && passed=$((passed+1))
total=$((total+1)); check_file "package.json" && passed=$((passed+1))
total=$((total+1)); check_file "README.md" && passed=$((passed+1))
echo ""

echo "Checking Documentation..."
total=$((total+1)); check_file "GITHUB-RELEASE-SUMMARY.md" && passed=$((passed+1))
echo ""

echo "==================================="
echo "Results: $passed/$total files present"
echo "==================================="

if [ $passed -eq $total ]; then
    echo -e "${GREEN}✓ All GitHub release files are in place!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update repository URLs in package.json"
    echo "2. Update badge URLs in README.md"
    echo "3. Push to GitHub"
    echo "4. Enable GitHub Actions"
    echo "5. Create first release tag: git tag v1.0.0 && git push --tags"
    exit 0
else
    echo -e "${RED}✗ Some files are missing!${NC}"
    exit 1
fi
