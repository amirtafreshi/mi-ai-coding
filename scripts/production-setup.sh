#!/bin/bash

# MI AI Coding Platform - Production Setup Script
# Production-optimized installation with security hardening
# Version: 1.0
# Last Updated: 2025-10-12

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Application configuration
APP_NAME="mi-ai-coding"
APP_USER="mi-app"
APP_DIR="/opt/mi-ai-coding"
NODE_VERSION="20.x"

# Security configuration
SSH_PORT=22
FAIL2BAN_MAXRETRY=3
FAIL2BAN_BANTIME=3600

# Nginx configuration
NGINX_CLIENT_MAX_BODY_SIZE="50M"
NGINX_WORKER_CONNECTIONS=1024

# PostgreSQL configuration
PG_MAX_CONNECTIONS=100
PG_SHARED_BUFFERS="256MB"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Log file
LOG_FILE="/var/log/mi-ai-coding-production-setup-$(date +%Y%m%d-%H%M%S).log"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

print_header() {
  echo -e "\n${CYAN}=========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}=========================================${NC}\n"
}

print_status() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

print_info() {
  echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"
}

print_step() {
  echo -e "\n${CYAN}▶${NC} $1" | tee -a "$LOG_FILE"
}

log_command() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] COMMAND: $*" >> "$LOG_FILE"
}

check_success() {
  if [ $? -eq 0 ]; then
    print_status "$1"
    return 0
  else
    print_error "$1 failed"
    return 1
  fi
}

confirm_action() {
  local prompt="$1"
  local default="${2:-n}"

  if [ "$default" = "y" ]; then
    read -p "$prompt (Y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Nn]$ ]] && return 1
  else
    read -p "$prompt (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || return 1
  fi
  return 0
}

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

check_root() {
  print_step "Checking privileges..."

  if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root or with sudo"
    print_info "Usage: sudo ./production-setup.sh"
    exit 1
  fi

  print_status "Running with root privileges"
}

check_production_ready() {
  print_step "Checking production readiness..."

  print_warning "This script will:"
  echo "  - Install and configure system packages"
  echo "  - Configure firewall (UFW)"
  echo "  - Harden SSH configuration"
  echo "  - Install Fail2ban for intrusion prevention"
  echo "  - Configure Nginx as reverse proxy"
  echo "  - Set up SSL certificates (Let's Encrypt)"
  echo "  - Install PM2 for process management"
  echo "  - Configure automatic backups"
  echo "  - Set up log rotation"
  echo ""
  print_warning "This script is intended for production servers only!"

  if ! confirm_action "Continue with production setup?"; then
    print_info "Setup cancelled"
    exit 0
  fi
}

# =============================================================================
# SYSTEM UPDATE AND PACKAGES
# =============================================================================

update_system() {
  print_step "Updating system packages..."

  log_command "apt-get update && apt-get upgrade"
  apt-get update | tee -a "$LOG_FILE"
  DEBIAN_FRONTEND=noninteractive apt-get upgrade -y | tee -a "$LOG_FILE"
  check_success "System update"
}

install_essential_packages() {
  print_step "Installing essential packages..."

  local packages=(
    "build-essential"
    "curl"
    "wget"
    "git"
    "ufw"
    "fail2ban"
    "nginx"
    "postgresql"
    "postgresql-contrib"
    "certbot"
    "python3-certbot-nginx"
    "logrotate"
    "htop"
    "netstat-nat"
    "lsof"
    "x11vnc"
    "xvfb"
    "xclip"
    "xdotool"
    "fluxbox"
  )

  log_command "apt-get install -y ${packages[*]}"
  DEBIAN_FRONTEND=noninteractive apt-get install -y "${packages[@]}" | tee -a "$LOG_FILE"
  check_success "Essential packages installation"
}

install_nodejs() {
  print_step "Installing Node.js ${NODE_VERSION}..."

  if command -v node &> /dev/null; then
    print_info "Node.js already installed: $(node -v)"

    if ! confirm_action "Reinstall Node.js?"; then
      return
    fi
  fi

  log_command "Installing Node.js from NodeSource"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}" | bash - | tee -a "$LOG_FILE"
  apt-get install -y nodejs | tee -a "$LOG_FILE"
  check_success "Node.js installation"

  print_info "Node.js version: $(node -v)"
  print_info "npm version: $(npm -v)"
}

install_pm2() {
  print_step "Installing PM2 process manager..."

  if command -v pm2 &> /dev/null; then
    print_info "PM2 already installed: $(pm2 -v)"
    return
  fi

  log_command "npm install -g pm2"
  npm install -g pm2 | tee -a "$LOG_FILE"
  check_success "PM2 installation"

  # Set up PM2 startup script
  print_info "Configuring PM2 startup..."
  pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tee -a "$LOG_FILE"
}

# =============================================================================
# USER AND DIRECTORY SETUP
# =============================================================================

create_app_user() {
  print_step "Creating application user..."

  if id "$APP_USER" &>/dev/null; then
    print_info "User $APP_USER already exists"
    return
  fi

  log_command "useradd -r -m -s /bin/bash $APP_USER"
  useradd -r -m -s /bin/bash "$APP_USER"
  check_success "Application user creation"

  # Add user to necessary groups
  usermod -aG sudo "$APP_USER"
  print_status "User $APP_USER created and added to sudo group"
}

setup_app_directory() {
  print_step "Setting up application directory..."

  if [ ! -d "$APP_DIR" ]; then
    log_command "mkdir -p $APP_DIR"
    mkdir -p "$APP_DIR"
    check_success "Application directory creation"
  fi

  # Set ownership
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
  chmod 755 "$APP_DIR"

  print_status "Application directory: $APP_DIR"
}

# =============================================================================
# SECURITY HARDENING
# =============================================================================

configure_firewall() {
  print_step "Configuring UFW firewall..."

  # Reset UFW to defaults
  print_info "Resetting UFW to default configuration..."
  ufw --force reset | tee -a "$LOG_FILE"

  # Set default policies
  ufw default deny incoming | tee -a "$LOG_FILE"
  ufw default allow outgoing | tee -a "$LOG_FILE"

  # Allow SSH (critical!)
  print_info "Allowing SSH on port $SSH_PORT..."
  ufw allow "$SSH_PORT"/tcp comment 'SSH' | tee -a "$LOG_FILE"

  # Allow HTTP and HTTPS
  ufw allow 80/tcp comment 'HTTP' | tee -a "$LOG_FILE"
  ufw allow 443/tcp comment 'HTTPS' | tee -a "$LOG_FILE"

  # Allow application ports (only from localhost for security)
  print_info "Configuring application ports..."
  # Application runs on 3000 but only accessible via Nginx reverse proxy
  ufw allow from 127.0.0.1 to any port 3000 comment 'App (localhost only)' | tee -a "$LOG_FILE"
  ufw allow from 127.0.0.1 to any port 3001 comment 'WebSocket (localhost only)' | tee -a "$LOG_FILE"

  # Allow VNC ports (consider restricting to specific IPs in production)
  if confirm_action "Allow VNC ports (6080, 6081) from all IPs?"; then
    ufw allow 6080/tcp comment 'VNC Playwright' | tee -a "$LOG_FILE"
    ufw allow 6081/tcp comment 'VNC Terminal' | tee -a "$LOG_FILE"
  else
    print_warning "VNC ports not opened. Configure manually if needed."
  fi

  # Allow PostgreSQL only from localhost
  ufw allow from 127.0.0.1 to any port 5432 comment 'PostgreSQL (localhost only)' | tee -a "$LOG_FILE"

  # Enable firewall
  print_info "Enabling UFW firewall..."
  ufw --force enable | tee -a "$LOG_FILE"
  check_success "UFW firewall configuration"

  # Show status
  print_info "Current firewall rules:"
  ufw status numbered | tee -a "$LOG_FILE"
}

configure_fail2ban() {
  print_step "Configuring Fail2ban..."

  # Create local jail configuration
  cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = $FAIL2BAN_BANTIME
findtime = 600
maxretry = $FAIL2BAN_MAXRETRY
destemail = root@localhost
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = $SSH_PORT
logpath = /var/log/auth.log
maxretry = $FAIL2BAN_MAXRETRY

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
EOF

  # Restart Fail2ban
  systemctl restart fail2ban
  systemctl enable fail2ban
  check_success "Fail2ban configuration"

  print_info "Fail2ban status:"
  fail2ban-client status | tee -a "$LOG_FILE"
}

harden_ssh() {
  print_step "Hardening SSH configuration..."

  # Backup original config
  if [ -f /etc/ssh/sshd_config ]; then
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)
    print_info "SSH config backed up"
  fi

  print_warning "SSH hardening will:"
  echo "  - Disable root login"
  echo "  - Disable password authentication (use SSH keys only)"
  echo "  - Set login grace time to 30 seconds"
  echo "  - Allow maximum 3 authentication attempts"
  echo ""
  print_warning "Make sure you have SSH key authentication set up!"

  if ! confirm_action "Continue with SSH hardening?"; then
    print_info "Skipping SSH hardening"
    return
  fi

  # Apply security settings
  sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
  sed -i 's/^#\?LoginGraceTime.*/LoginGraceTime 30/' /etc/ssh/sshd_config
  sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
  sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config

  # Test configuration
  print_info "Testing SSH configuration..."
  sshd -t
  check_success "SSH configuration test"

  # Restart SSH
  systemctl restart sshd
  check_success "SSH service restart"

  print_status "SSH hardening complete"
  print_warning "Root login and password authentication are now disabled"
}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

configure_postgresql() {
  print_step "Configuring PostgreSQL..."

  # Ensure PostgreSQL is running
  systemctl start postgresql
  systemctl enable postgresql
  check_success "PostgreSQL service start"

  # Configure PostgreSQL for production
  PG_VERSION=$(psql --version | awk '{print $3}' | cut -d'.' -f1)
  PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"

  if [ -f "$PG_CONF" ]; then
    print_info "Backing up PostgreSQL configuration..."
    cp "$PG_CONF" "${PG_CONF}.backup.$(date +%Y%m%d)"

    # Optimize for production
    print_info "Applying production optimizations..."
    sed -i "s/^#\?max_connections =.*/max_connections = $PG_MAX_CONNECTIONS/" "$PG_CONF"
    sed -i "s/^#\?shared_buffers =.*/shared_buffers = $PG_SHARED_BUFFERS/" "$PG_CONF"

    # Restart PostgreSQL
    systemctl restart postgresql
    check_success "PostgreSQL configuration"
  else
    print_warning "PostgreSQL config not found at $PG_CONF"
  fi

  # Create database and user
  print_info "Setting up database..."
  read -p "Enter database name [mi_ai_coding]: " DB_NAME
  DB_NAME=${DB_NAME:-mi_ai_coding}

  read -p "Enter database user [mi_app]: " DB_USER
  DB_USER=${DB_USER:-mi_app}

  read -s -p "Enter database password: " DB_PASSWORD
  echo

  if [ -z "$DB_PASSWORD" ]; then
    print_error "Database password cannot be empty"
    return 1
  fi

  # Create user and database
  sudo -u postgres psql <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

  check_success "Database and user creation"

  print_info "Database URL: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
}

# =============================================================================
# NGINX CONFIGURATION
# =============================================================================

configure_nginx() {
  print_step "Configuring Nginx..."

  read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME

  if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required for Nginx configuration"
    return 1
  fi

  # Create Nginx configuration
  cat > "/etc/nginx/sites-available/$APP_NAME" <<EOF
# MI AI Coding Platform - Nginx Configuration
# Domain: $DOMAIN_NAME

upstream app_server {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream websocket_server {
    server 127.0.0.1:3001;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=app_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=5r/s;

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client upload size
    client_max_body_size $NGINX_CLIENT_MAX_BODY_SIZE;

    # Logging
    access_log /var/log/nginx/$APP_NAME-access.log;
    error_log /var/log/nginx/$APP_NAME-error.log;

    # Main application
    location / {
        limit_req zone=app_limit burst=20 nodelay;

        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://websocket_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api_limit burst=10 nodelay;

        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\$ {
        proxy_pass http://app_server;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://app_server;
        access_log off;
    }
}
EOF

  # Enable site
  ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"

  # Remove default site
  rm -f /etc/nginx/sites-enabled/default

  # Test Nginx configuration
  print_info "Testing Nginx configuration..."
  nginx -t
  check_success "Nginx configuration test"

  # Restart Nginx
  systemctl restart nginx
  systemctl enable nginx
  check_success "Nginx service restart"

  print_status "Nginx configured for $DOMAIN_NAME"
}

setup_ssl() {
  print_step "Setting up SSL certificate..."

  if [ -z "$DOMAIN_NAME" ]; then
    print_warning "Domain name not set. Skipping SSL setup."
    return
  fi

  print_info "Obtaining SSL certificate for $DOMAIN_NAME..."
  print_warning "Make sure DNS is properly configured and pointing to this server"

  if ! confirm_action "Continue with SSL certificate generation?"; then
    print_info "Skipping SSL setup"
    return
  fi

  # Obtain certificate
  certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos --redirect

  if [ $? -eq 0 ]; then
    print_status "SSL certificate obtained successfully"

    # Set up auto-renewal
    print_info "Setting up automatic certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    check_success "SSL auto-renewal setup"
  else
    print_error "Failed to obtain SSL certificate"
    print_info "You can try again manually: sudo certbot --nginx -d $DOMAIN_NAME"
  fi
}

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================

setup_backups() {
  print_step "Setting up automatic backups..."

  BACKUP_DIR="/var/backups/mi-ai-coding"
  mkdir -p "$BACKUP_DIR"

  # Create backup script
  cat > /usr/local/bin/mi-ai-coding-backup.sh <<'EOF'
#!/bin/bash
# MI AI Coding Platform - Backup Script

BACKUP_DIR="/var/backups/mi-ai-coding"
DATE=$(date +%Y%m%d-%H%M%S)
DB_NAME="mi_ai_coding"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup database
sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_DIR/$DATE/database.sql"

# Backup application files
tar -czf "$BACKUP_DIR/$DATE/app-files.tar.gz" -C /opt/mi-ai-coding .

# Backup .env
cp /opt/mi-ai-coding/.env "$BACKUP_DIR/$DATE/.env.backup"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null

echo "Backup completed: $BACKUP_DIR/$DATE"
EOF

  chmod +x /usr/local/bin/mi-ai-coding-backup.sh
  check_success "Backup script creation"

  # Schedule daily backups at 2 AM
  (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/mi-ai-coding-backup.sh >> /var/log/mi-ai-coding-backup.log 2>&1") | crontab -
  check_success "Backup scheduling"

  print_status "Daily backups configured (runs at 2 AM)"
  print_info "Backup directory: $BACKUP_DIR"
}

# =============================================================================
# LOG ROTATION
# =============================================================================

setup_log_rotation() {
  print_step "Setting up log rotation..."

  cat > /etc/logrotate.d/mi-ai-coding <<EOF
/var/log/mi-ai-coding/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/$APP_NAME-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

  # Create log directory
  mkdir -p /var/log/mi-ai-coding
  chown -R "$APP_USER:$APP_USER" /var/log/mi-ai-coding

  check_success "Log rotation configuration"
}

# =============================================================================
# MONITORING SETUP
# =============================================================================

setup_monitoring() {
  print_step "Setting up monitoring..."

  # Create monitoring script
  cat > /usr/local/bin/mi-ai-coding-monitor.sh <<'EOF'
#!/bin/bash
# MI AI Coding Platform - Monitoring Script

APP_NAME="mi-ai-coding"
LOG_FILE="/var/log/mi-ai-coding/monitor.log"

# Check if app is running
if ! pm2 list | grep -q "$APP_NAME.*online"; then
    echo "[$(date)] Application not running. Restarting..." >> "$LOG_FILE"
    pm2 restart "$APP_NAME" >> "$LOG_FILE" 2>&1
fi

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "[$(date)] PostgreSQL not running. Starting..." >> "$LOG_FILE"
    systemctl start postgresql >> "$LOG_FILE" 2>&1
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "[$(date)] Nginx not running. Starting..." >> "$LOG_FILE"
    systemctl start nginx >> "$LOG_FILE" 2>&1
fi

# Check disk space (alert if > 85%)
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "[$(date)] WARNING: Disk usage at ${DISK_USAGE}%" >> "$LOG_FILE"
fi
EOF

  chmod +x /usr/local/bin/mi-ai-coding-monitor.sh
  check_success "Monitoring script creation"

  # Schedule monitoring every 5 minutes
  (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/mi-ai-coding-monitor.sh") | crontab -
  check_success "Monitoring scheduling"

  print_status "Monitoring configured (checks every 5 minutes)"
}

# =============================================================================
# SYSTEM OPTIMIZATION
# =============================================================================

optimize_system() {
  print_step "Applying system optimizations..."

  # Increase file descriptor limit
  cat >> /etc/security/limits.conf <<EOF

# MI AI Coding Platform - Resource Limits
$APP_USER soft nofile 65536
$APP_USER hard nofile 65536
EOF

  # Optimize kernel parameters
  cat >> /etc/sysctl.conf <<EOF

# MI AI Coding Platform - Kernel Optimizations
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.ip_local_port_range = 10000 65000
net.ipv4.tcp_fin_timeout = 30
EOF

  sysctl -p | tee -a "$LOG_FILE"
  check_success "System optimization"
}

# =============================================================================
# FINAL SETUP
# =============================================================================

create_systemd_service() {
  print_step "Creating systemd service..."

  cat > /etc/systemd/system/mi-ai-coding.service <<EOF
[Unit]
Description=MI AI Coding Platform
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mi-ai-coding

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable mi-ai-coding.service
  check_success "Systemd service creation"
}

print_summary() {
  print_header "Production Setup Complete!"

  echo ""
  echo "System Configuration:"
  echo "  - Application directory: $APP_DIR"
  echo "  - Application user: $APP_USER"
  echo "  - Log directory: /var/log/mi-ai-coding"
  echo "  - Backup directory: /var/backups/mi-ai-coding"
  echo ""
  echo "Security:"
  echo "  - UFW firewall: Enabled"
  echo "  - Fail2ban: Enabled"
  echo "  - SSH: Hardened (key-only auth)"
  echo "  - SSL: ${DOMAIN_NAME:+Configured for $DOMAIN_NAME}"
  echo ""
  echo "Services:"
  echo "  - Nginx: Configured as reverse proxy"
  echo "  - PostgreSQL: Optimized for production"
  echo "  - PM2: Process manager installed"
  echo ""
  echo "Automation:"
  echo "  - Daily backups at 2 AM"
  echo "  - Log rotation (14 days retention)"
  echo "  - Health monitoring (every 5 minutes)"
  echo "  - SSL auto-renewal"
  echo ""
  echo "Next Steps:"
  echo ""
  echo "1. Deploy your application to $APP_DIR"
  echo "2. Configure .env file with production values"
  echo "3. Install dependencies: cd $APP_DIR && npm install"
  echo "4. Build application: npm run build"
  echo "5. Start with PM2: pm2 start npm --name $APP_NAME -- start"
  echo "6. Save PM2 config: pm2 save"
  echo ""
  echo "Useful Commands:"
  echo "  - View logs: pm2 logs $APP_NAME"
  echo "  - Restart app: pm2 restart $APP_NAME"
  echo "  - Check status: pm2 status"
  echo "  - Nginx test: sudo nginx -t"
  echo "  - Firewall status: sudo ufw status"
  echo "  - Fail2ban status: sudo fail2ban-client status"
  echo ""
  print_info "Setup log saved to: $LOG_FILE"
  echo ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  print_header "MI AI Coding Platform - Production Setup"

  # Pre-flight checks
  check_root
  check_production_ready

  # System setup
  print_header "System Update and Packages"
  update_system
  install_essential_packages
  install_nodejs
  install_pm2

  # User and directory
  print_header "Application Setup"
  create_app_user
  setup_app_directory

  # Security
  print_header "Security Hardening"
  configure_firewall
  configure_fail2ban
  harden_ssh

  # Database
  print_header "Database Configuration"
  configure_postgresql

  # Web server
  print_header "Nginx and SSL Configuration"
  configure_nginx
  setup_ssl

  # Automation
  print_header "Backup and Monitoring"
  setup_backups
  setup_log_rotation
  setup_monitoring

  # Optimization
  print_header "System Optimization"
  optimize_system
  create_systemd_service

  # Summary
  print_summary
}

# Run main function
main

exit 0
