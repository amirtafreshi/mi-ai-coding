#!/bin/bash
# Script to fix aggressive Nginx caching during development
# This ensures browser gets fresh JavaScript chunks from Next.js dev server

echo "Fixing Nginx cache configuration for development mode..."

# Backup current config
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
sudo cp /etc/nginx/sites-enabled/code.miglobal.com.mx /tmp/nginx-backup-$TIMESTAMP.conf
echo "✓ Backup created: /tmp/nginx-backup-$TIMESTAMP.conf"

# Check if development cache fix is already applied
if grep -q "Next.js dynamic chunks (development mode - no cache)" /etc/nginx/sites-enabled/code.miglobal.com.mx; then
    echo "✓ Development cache fix already applied"
    exit 0
fi

# Update Nginx configuration
# This adds a separate location block for /_next/ (without /static/) that disables caching
# while keeping the aggressive cache for /_next/static/ (content-hashed files)

echo "Updating Nginx configuration..."

# Note: This requires manual verification that the config is correct
# The key change is adding this block before the /api location:
cat << 'EOF'

Required changes to /etc/nginx/sites-enabled/code.miglobal.com.mx:

Replace:
    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

With:
    # Next.js static files (content-hashed, can cache aggressively)
    location /_next/static/ {
        proxy_pass http://nextjs_app;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Next.js dynamic chunks (development mode - no cache)
    location /_next/ {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

EOF

echo ""
echo "After making changes manually, run:"
echo "  sudo nginx -t"
echo "  sudo nginx -s reload"
echo ""
echo "Note: For production, switch back to caching or use production build."
