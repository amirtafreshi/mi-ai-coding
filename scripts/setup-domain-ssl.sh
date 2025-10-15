#!/bin/bash

# Script to configure code.miglobal.com.mx with SSL certificate
# This script requires sudo privileges

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
  echo -e "\n${CYAN}=========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}=========================================${NC}\n"
}

print_status() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

print_info() {
  echo -e "${BLUE}[i]${NC} $1"
}

print_header "Configure code.miglobal.com.mx Domain with SSL"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  print_error "This script must be run with sudo"
  print_info "Usage: sudo $0"
  exit 1
fi

print_status "Running with sudo privileges"

# Step 1: Check if wildcard SSL certificate exists
print_info "Step 1: Checking for wildcard SSL certificate..."

WILDCARD_CERT="/etc/letsencrypt/live/miglobal.com.mx"
if [ -d "$WILDCARD_CERT" ]; then
  print_status "Found wildcard SSL certificate at $WILDCARD_CERT"
  SSL_CERT_PATH="$WILDCARD_CERT/fullchain.pem"
  SSL_KEY_PATH="$WILDCARD_CERT/privkey.pem"
elif [ -d "/etc/letsencrypt/live/manifestdev.miglobal.com.mx" ]; then
  print_warning "Wildcard certificate not found, using manifestdev certificate"
  SSL_CERT_PATH="/etc/letsencrypt/live/manifestdev.miglobal.com.mx/fullchain.pem"
  SSL_KEY_PATH="/etc/letsencrypt/live/manifestdev.miglobal.com.mx/privkey.pem"
else
  print_error "No SSL certificate found for miglobal.com.mx"
  print_info "You need to obtain an SSL certificate first using certbot"
  print_info "Run: sudo certbot certonly --nginx -d code.miglobal.com.mx"
  exit 1
fi

# Step 2: Create Nginx configuration
print_info "Step 2: Creating Nginx configuration..."

cat > /etc/nginx/sites-available/code.miglobal.com.mx <<'EOF'
# Upstream for Next.js application
upstream nextjs_app {
    server localhost:3000;
    keepalive 64;
}

# Upstream for Terminal VNC WebSocket
upstream terminal_vnc {
    server localhost:6081;
}

# Upstream for Playwright VNC WebSocket
upstream playwright_vnc {
    server localhost:6080;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name code.miglobal.com.mx;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name code.miglobal.com.mx;

    # SSL Configuration
    ssl_certificate SSL_CERT_PATH;
    ssl_certificate_key SSL_KEY_PATH;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/code_miglobal_access.log;
    error_log /var/log/nginx/code_miglobal_error.log;

    # Increase client body size for file uploads
    client_max_body_size 100M;

    # Main Next.js application
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Terminal VNC WebSocket (port 6081)
    location /terminal-vnc/ {
        proxy_pass http://terminal_vnc/;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts (no timeout for VNC)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Playwright VNC WebSocket (port 6080)
    location /playwright-vnc/ {
        proxy_pass http://playwright_vnc/;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts (no timeout for VNC)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Next.js API routes and static files
    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /api {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Replace SSL paths in the config
sed -i "s|SSL_CERT_PATH|$SSL_CERT_PATH|g" /etc/nginx/sites-available/code.miglobal.com.mx
sed -i "s|SSL_KEY_PATH|$SSL_KEY_PATH|g" /etc/nginx/sites-available/code.miglobal.com.mx

print_status "Nginx configuration created"

# Step 3: Enable the site
print_info "Step 3: Enabling site..."

if [ -f /etc/nginx/sites-enabled/code.miglobal.com.mx ]; then
  print_warning "Site already enabled, removing old symlink"
  rm /etc/nginx/sites-enabled/code.miglobal.com.mx
fi

ln -s /etc/nginx/sites-available/code.miglobal.com.mx /etc/nginx/sites-enabled/
print_status "Site enabled"

# Step 4: Test Nginx configuration
print_info "Step 4: Testing Nginx configuration..."

if nginx -t; then
  print_status "Nginx configuration test passed"
else
  print_error "Nginx configuration test failed"
  print_info "Check the configuration at /etc/nginx/sites-available/code.miglobal.com.mx"
  exit 1
fi

# Step 5: Reload Nginx
print_info "Step 5: Reloading Nginx..."

if systemctl reload nginx; then
  print_status "Nginx reloaded successfully"
else
  print_error "Failed to reload Nginx"
  exit 1
fi

# Step 6: Check if ports are open
print_info "Step 6: Checking firewall rules..."

if command -v ufw &> /dev/null; then
  print_info "Checking UFW firewall..."
  ufw status | grep -E "80|443" || print_warning "Ports 80/443 may not be open in UFW"
fi

print_header "Configuration Complete"

print_status "Domain configured: https://code.miglobal.com.mx"
print_info "Next.js app: https://code.miglobal.com.mx"
print_info "Terminal VNC: https://code.miglobal.com.mx/terminal-vnc/"
print_info "Playwright VNC: https://code.miglobal.com.mx/playwright-vnc/"

echo ""
print_info "SSL Certificate: $SSL_CERT_PATH"
print_info "SSL Certificate Key: $SSL_KEY_PATH"

echo ""
print_info "Next steps:"
echo "  1. Update .env file with NEXTAUTH_URL=https://code.miglobal.com.mx"
echo "  2. Ensure DNS is pointing to this server"
echo "  3. Test the site: https://code.miglobal.com.mx"
echo ""
