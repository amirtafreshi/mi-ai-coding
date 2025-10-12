#!/bin/bash

# MI AI Coding Platform - Deployment Script
# Automates deployment on a fresh machine or update on existing installation

set -e

echo "========================================="
echo "MI AI Coding Platform - Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Parse command line arguments
SKIP_VNC=false
SKIP_BUILD=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-vnc)
      SKIP_VNC=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --production)
      PRODUCTION=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-vnc] [--skip-build] [--production]"
      exit 1
      ;;
  esac
done

# Navigate to project directory
cd "$(dirname "$0")/.."
PROJECT_DIR=$(pwd)
print_status "Project directory: $PROJECT_DIR"

# Check if this is a fresh deployment or update
if [ -d "node_modules" ]; then
  print_info "Existing installation detected - performing update"
  IS_UPDATE=true
else
  print_info "Fresh deployment detected"
  IS_UPDATE=false
fi

# Pull latest changes from git
if [ -d ".git" ]; then
  print_status "Pulling latest changes from git..."
  git pull origin main
else
  print_warning "Not a git repository. Skipping git pull."
fi

# Install/update dependencies
print_status "Installing dependencies..."
if [ "$IS_UPDATE" = true ]; then
  npm ci --production=false
else
  npm install
fi

# Check environment file
if [ ! -f ".env" ]; then
  print_warning ".env file not found!"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    print_status ".env file created from .env.example"
    print_error "Please configure .env file before continuing!"
    print_info "Edit .env with your actual values, then run this script again"
    exit 1
  else
    print_error ".env.example not found. Cannot create .env"
    exit 1
  fi
else
  print_status ".env file exists"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx prisma db push
  print_status "Database migrations completed"
else
  print_warning "Skipped database migrations"
fi

# Build the application
if [ "$SKIP_BUILD" = false ]; then
  print_status "Building the application..."
  npm run build
  print_status "Build completed"
else
  print_info "Skipping build (--skip-build flag)"
fi

# Start VNC servers
if [ "$SKIP_VNC" = false ]; then
  if [ -f "scripts/start-vnc.sh" ]; then
    print_status "Starting VNC servers..."
    bash scripts/start-vnc.sh
  else
    print_warning "start-vnc.sh not found. Skipping VNC startup."
  fi
else
  print_info "Skipping VNC startup (--skip-vnc flag)"
fi

# Stop existing Node.js process if running
print_status "Checking for existing Node.js processes..."
if pgrep -f "node.*next" > /dev/null; then
  print_warning "Existing Node.js process found. Stopping..."
  pkill -f "node.*next" || true
  sleep 2
fi

# Start the application
if [ "$PRODUCTION" = true ]; then
  print_status "Starting application in production mode..."

  # Check if PM2 is installed
  if command -v pm2 &> /dev/null; then
    print_status "Using PM2 process manager"
    pm2 delete mi-ai-coding 2>/dev/null || true
    pm2 start npm --name "mi-ai-coding" -- start
    pm2 save
    print_status "Application started with PM2"
    print_info "Useful PM2 commands:"
    print_info "  pm2 status"
    print_info "  pm2 logs mi-ai-coding"
    print_info "  pm2 restart mi-ai-coding"
    print_info "  pm2 stop mi-ai-coding"
  else
    print_warning "PM2 not installed. Starting with npm start..."
    print_info "Consider installing PM2 for better process management:"
    print_info "  npm install -g pm2"
    npm start &
    print_status "Application started in background"
  fi
else
  print_info "To start in development mode: npm run dev"
  print_info "To start in production mode: npm start"
  print_info "Or run this script with --production flag"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Deployment Completed Successfully!${NC}"
echo "========================================="
echo ""
echo "Application Information:"
echo "  URL: http://localhost:3000"
echo "  Terminal VNC: ws://localhost:6081 (Display :98)"
echo "  Playwright VNC: ws://localhost:6080 (Display :99)"
echo ""
echo "Useful Commands:"
echo "  View logs: tail -f ~/.pm2/logs/mi-ai-coding-out.log (if using PM2)"
echo "  Database: npx prisma studio"
echo "  Stop app: pm2 stop mi-ai-coding (or pkill -f 'node.*next')"
echo ""
echo "Documentation:"
echo "  - README.md"
echo "  - PROJECT.md"
echo "  - PROGRESS.md"
echo ""

# Health check
sleep 5
print_status "Performing health check..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  print_status "Application is responding!"
else
  print_warning "Application may not be running yet. Check logs."
fi

echo ""
print_status "Deployment complete!"
