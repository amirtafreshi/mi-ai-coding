# MI AI Coding Platform - Scripts Documentation

Comprehensive guide to all installation, setup, and management scripts for the MI AI Coding Platform.

## Table of Contents

- [Setup Scripts](#setup-scripts)
- [VNC Management Scripts](#vnc-management-scripts)
- [Health and Monitoring Scripts](#health-and-monitoring-scripts)
- [Production Scripts](#production-scripts)
- [Deployment Scripts](#deployment-scripts)
- [Utility Scripts](#utility-scripts)

---

## Setup Scripts

### setup.sh

**Enhanced comprehensive development setup script** with full system checks and optional security configuration.

**Features:**
- OS detection (Ubuntu/Debian version check)
- Comprehensive system requirements validation
- Automatic dependency installation
- Database connection testing
- Optional firewall and SSL setup
- Detailed logging to `/tmp/mi-ai-coding-setup-*.log`
- Colored output for better UX
- Health check at completion

**Usage:**
```bash
./scripts/setup.sh
```

**What it does:**
1. System Requirements Check
   - OS version and compatibility
   - User privileges verification
   - Disk space (minimum 5GB required)
   - Memory (2GB+ recommended)
   - Network connectivity
   - Port availability (3000, 3001, 6080, 6081, 5432)

2. Dependency Installation
   - Node.js 18+ (with version check)
   - PostgreSQL 12+
   - VNC dependencies (x11vnc, xvfb, xclip, xdotool, fluxbox)
   - Git
   - Build tools (make, g++)

3. Project Setup
   - npm dependency installation
   - Environment file creation (.env)
   - Automatic NEXTAUTH_SECRET generation
   - Database connection testing
   - Prisma client generation
   - Database schema initialization

4. Optional Security Configuration
   - UFW firewall setup with pre-configured rules
   - SSL certificate generation (Let's Encrypt)
   - Nginx installation and configuration

**Requirements:**
- Ubuntu 18.04+ or Debian-based system
- Regular user with sudo privileges
- Internet connection for package downloads

**Exit Codes:**
- `0`: Success
- `1`: Error (dependency missing, validation failed, etc.)

---

## VNC Management Scripts

### start-vnc.sh

**Enhanced VNC server startup script** with automatic retry, error handling, and management commands.

**Features:**
- Automatic dependency checking
- Retry logic (3 attempts with 2-second delay)
- Process and port conflict resolution
- Status verification after startup
- Multiple management commands
- Comprehensive logging to `/tmp/x11vnc-*.log`

**Usage:**
```bash
# Start VNC servers (default)
./scripts/start-vnc.sh

# Show current status
./scripts/start-vnc.sh --status

# Restart VNC servers
./scripts/start-vnc.sh --restart

# Stop all VNC servers
./scripts/start-vnc.sh --stop

# Show help
./scripts/start-vnc.sh --help
```

**VNC Displays:**
- **Display :98** - Terminal VNC
  - Port: 6081
  - Resolution: 1920x1080
  - Includes: xterm terminal
  - Purpose: Manual terminal access via VNC

- **Display :99** - Playwright VNC
  - Port: 6080
  - Resolution: 1920x1080
  - Purpose: Visual E2E test monitoring
  - **CRITICAL**: All Playwright tests MUST use `DISPLAY=:99`

**Connection:**
```bash
# Local access
ws://localhost:6081  # Terminal
ws://localhost:6080  # Playwright

# External access (replace with your server IP)
ws://192.168.1.100:6081
ws://192.168.1.100:6080
```

**Testing:**
```bash
# Run Playwright tests on VNC display
DISPLAY=:99 npx playwright test

# Open terminal on VNC display
DISPLAY=:98 xterm &
```

**Troubleshooting:**
```bash
# View VNC processes
ps aux | grep -E 'Xvfb|x11vnc'

# Check ports
netstat -tulpn | grep -E '6080|6081'

# View logs
tail -f /tmp/x11vnc-*.log

# Restart if having issues
./scripts/start-vnc.sh --restart
```

### restart-vnc-1920x1080.sh

Quick script to restart VNC with 1920x1080 resolution.

**Usage:**
```bash
./scripts/restart-vnc-1920x1080.sh
```

### test-vnc.sh

Test VNC connectivity and functionality.

**Usage:**
```bash
./scripts/test-vnc.sh
```

---

## Health and Monitoring Scripts

### health-check.sh

**Comprehensive system health check** for both development and production environments.

**Features:**
- System resource monitoring (disk, memory, CPU)
- Service status verification
- Port availability checks
- Application readiness validation
- Log analysis for recent errors
- Exit codes for automation integration
- Colored output with status indicators

**Usage:**
```bash
# Run health check
./scripts/health-check.sh

# Use in automation (check exit code)
if ./scripts/health-check.sh; then
  echo "System healthy"
else
  echo "System has issues"
fi
```

**What it checks:**

1. **System Information**
   - OS version and kernel
   - System uptime
   - Load average

2. **Resource Usage**
   - Disk space (warns at 80%, critical at 90%)
   - Memory usage (warns at 85%)
   - CPU usage (warns at 80%)
   - Swap usage

3. **Network**
   - Internet connectivity
   - DNS resolution

4. **Services**
   - PostgreSQL (service, port, connection, database existence)
   - Node.js and npm versions
   - PM2 process manager (if installed)
   - Application (package.json, node_modules, .env, build)

5. **Ports**
   - 3000 (Application)
   - 3001 (WebSocket)
   - 6080 (VNC Playwright)
   - 6081 (VNC Terminal)
   - 5432 (PostgreSQL)

6. **VNC Services**
   - VNC dependencies
   - Xvfb processes
   - x11vnc processes

7. **Production Services** (if installed)
   - Nginx (service, configuration, ports 80/443)
   - UFW firewall status and rules
   - Fail2ban status
   - SSL certificates and expiry

8. **Monitoring**
   - Recent application errors
   - System critical errors
   - HTTP endpoint responsiveness

**Exit Codes:**
- `0`: All checks passed (HEALTHY)
- `1`: Warnings found (WARNING)
- `2`: Errors or critical issues (CRITICAL/ERROR)
- `3`: Unknown status

**Output Format:**
```
[✓] Check passed
[⚠] Warning
[✗] Error
[‼] Critical issue
[i] Information
```

**Automation Example:**
```bash
# Daily health check via cron
0 8 * * * /path/to/health-check.sh >> /var/log/health-check.log 2>&1

# Monitoring script
#!/bin/bash
if ! ./scripts/health-check.sh > /tmp/health.log 2>&1; then
  # Send alert (email, Slack, etc.)
  mail -s "Health Check Failed" admin@example.com < /tmp/health.log
fi
```

---

## Production Scripts

### production-setup.sh

**Production-optimized installation** with comprehensive security hardening.

**WARNING:** This script is for production servers only. It makes significant system changes.

**Features:**
- Full system update and package installation
- Security hardening (SSH, firewall, Fail2ban)
- Nginx reverse proxy configuration
- SSL certificate setup (Let's Encrypt)
- PM2 process manager installation
- Automatic backup configuration (daily at 2 AM)
- Log rotation setup (14-day retention)
- System monitoring (checks every 5 minutes)
- Database optimization
- System resource optimization

**Usage:**
```bash
# MUST be run as root/sudo
sudo ./scripts/production-setup.sh
```

**What it does:**

1. **System Update**
   - Updates all system packages
   - Installs essential packages

2. **Node.js Installation**
   - Installs Node.js 20.x from NodeSource
   - Installs PM2 globally
   - Configures PM2 startup script

3. **User and Directory Setup**
   - Creates dedicated `mi-app` user
   - Sets up `/opt/mi-ai-coding` directory
   - Configures proper permissions

4. **Security Hardening**
   - UFW firewall with restrictive rules
     - SSH: Port 22
     - HTTP/HTTPS: Ports 80, 443
     - Application: localhost only (3000, 3001)
     - VNC: Optional (6080, 6081)
     - PostgreSQL: localhost only (5432)
   - Fail2ban for intrusion prevention
     - SSH protection
     - Nginx HTTP auth protection
     - Bot and bad client blocking
   - SSH hardening
     - Root login disabled
     - Password authentication disabled (key-only)
     - Login grace time: 30 seconds
     - Max auth attempts: 3

5. **Database Configuration**
   - PostgreSQL optimization
     - max_connections: 100
     - shared_buffers: 256MB
   - Database and user creation
   - Connection testing

6. **Nginx Configuration**
   - Reverse proxy for application
   - WebSocket support
   - Rate limiting
     - Application: 10 req/s (burst 20)
     - API: 5 req/s (burst 10)
   - Security headers
   - SSL/TLS support
   - Static file caching
   - Gzip compression

7. **SSL Certificate Setup**
   - Let's Encrypt via Certbot
   - Automatic HTTPS redirect
   - Auto-renewal cron job (daily at 3 AM)

8. **Backup Configuration**
   - Daily backups at 2 AM
   - Backs up:
     - PostgreSQL database
     - Application files
     - .env configuration
   - 7-day retention
   - Backup location: `/var/backups/mi-ai-coding`

9. **Log Rotation**
   - Application logs: 14-day retention
   - Nginx logs: 14-day retention
   - Automatic compression

10. **System Monitoring**
    - Health checks every 5 minutes
    - Automatic service restart
    - Disk space monitoring (85% threshold)
    - Email alerts (configurable)

11. **System Optimization**
    - Increased file descriptor limits
    - Kernel parameter tuning
    - Network stack optimization

**Configuration Files Created:**
- `/etc/nginx/sites-available/mi-ai-coding` - Nginx config
- `/etc/fail2ban/jail.local` - Fail2ban config
- `/usr/local/bin/mi-ai-coding-backup.sh` - Backup script
- `/usr/local/bin/mi-ai-coding-monitor.sh` - Monitoring script
- `/etc/logrotate.d/mi-ai-coding` - Log rotation config
- `/etc/systemd/system/mi-ai-coding.service` - Systemd service

**Post-Installation Steps:**
1. Deploy application to `/opt/mi-ai-coding`
2. Configure `.env` with production values
3. Install dependencies: `npm install`
4. Build application: `npm run build`
5. Start with PM2: `pm2 start npm --name mi-ai-coding -- start`
6. Save PM2 config: `pm2 save`

**Management Commands:**
```bash
# PM2 management
pm2 status
pm2 logs mi-ai-coding
pm2 restart mi-ai-coding
pm2 stop mi-ai-coding

# Nginx management
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload config
sudo systemctl status nginx      # Check status

# Firewall management
sudo ufw status numbered         # Show rules
sudo ufw allow 8080/tcp         # Add rule
sudo ufw delete 5                # Delete rule

# Fail2ban management
sudo fail2ban-client status      # Overall status
sudo fail2ban-client status sshd # SSH jail status
sudo fail2ban-client unban IP    # Unban IP

# SSL certificate management
sudo certbot certificates        # List certificates
sudo certbot renew --dry-run    # Test renewal
sudo certbot delete             # Remove certificate

# Backup management
ls -lh /var/backups/mi-ai-coding/
sudo /usr/local/bin/mi-ai-coding-backup.sh  # Manual backup

# Monitoring
sudo /usr/local/bin/mi-ai-coding-monitor.sh  # Manual health check
tail -f /var/log/mi-ai-coding/monitor.log   # View monitor log
```

**Security Considerations:**
- Firewall is enabled and restrictive by default
- SSH password authentication is disabled
- Application is only accessible via Nginx reverse proxy
- Database connections restricted to localhost
- Regular security updates via unattended-upgrades (recommended)
- Fail2ban protects against brute-force attacks

---

## Deployment Scripts

### deploy.sh

**Automated deployment script** for updates and continuous deployment.

**Features:**
- Git pull integration
- Dependency update (npm ci)
- Database migration support
- Application build
- VNC server management
- Process management (stop/start)
- PM2 integration
- Health check after deployment

**Usage:**
```bash
# Basic deployment
./scripts/deploy.sh

# Skip VNC startup
./scripts/deploy.sh --skip-vnc

# Skip build
./scripts/deploy.sh --skip-build

# Production mode (with PM2)
./scripts/deploy.sh --production
```

**Command-Line Options:**
- `--skip-vnc`: Don't start VNC servers
- `--skip-build`: Skip npm build step
- `--production`: Start with PM2 process manager

**Deployment Flow:**
1. Pull latest code from git (if .git exists)
2. Install/update dependencies
3. Check environment configuration
4. Generate Prisma client
5. Run database migrations (optional)
6. Build application (unless --skip-build)
7. Start VNC servers (unless --skip-vnc)
8. Stop existing application
9. Start application (npm start or PM2)
10. Health check

**Continuous Deployment Example:**
```bash
# Via GitHub webhook or CI/CD
#!/bin/bash
cd /opt/mi-ai-coding
git pull origin main
./scripts/deploy.sh --production --skip-vnc
```

---

## Utility Scripts

### check-vnc-status.sh

Check the current status of VNC servers.

**Usage:**
```bash
./scripts/check-vnc-status.sh
```

### check-external-access.sh

Verify VNC is accessible from external networks.

**Usage:**
```bash
./scripts/check-external-access.sh
```

### fix-external-access.sh

Attempt to fix VNC external access issues.

**Usage:**
```bash
./scripts/fix-external-access.sh
```

### cleanup-old-screenshots.sh

Remove old Playwright test screenshots.

**Usage:**
```bash
./scripts/cleanup-old-screenshots.sh
```

### manual-diagnostic-test.js

Comprehensive Node.js diagnostic test.

**Usage:**
```bash
node ./scripts/manual-diagnostic-test.js
```

---

## Common Workflows

### Initial Setup (Development)

```bash
# 1. Run setup script
./scripts/setup.sh

# 2. Start VNC servers
./scripts/start-vnc.sh

# 3. Start development server
npm run dev

# 4. Run health check
./scripts/health-check.sh
```

### Initial Setup (Production)

```bash
# 1. Run production setup (as root)
sudo ./scripts/production-setup.sh

# 2. Deploy application
cd /opt/mi-ai-coding
git clone <repository-url> .
./scripts/deploy.sh --production

# 3. Configure SSL (if not done during setup)
sudo certbot --nginx -d yourdomain.com

# 4. Verify health
./scripts/health-check.sh
```

### Daily Development Workflow

```bash
# Start of day
./scripts/start-vnc.sh --status      # Check VNC
./scripts/health-check.sh            # System health
npm run dev                           # Start dev server

# Run tests
DISPLAY=:99 npm test                  # E2E tests on VNC

# End of day
./scripts/start-vnc.sh --stop        # Stop VNC (optional)
```

### Production Deployment Workflow

```bash
# 1. Pull latest changes
cd /opt/mi-ai-coding
git pull origin main

# 2. Deploy
./scripts/deploy.sh --production

# 3. Verify deployment
./scripts/health-check.sh
curl -I https://yourdomain.com

# 4. Check logs
pm2 logs mi-ai-coding --lines 50
```

### Troubleshooting Workflow

```bash
# 1. Run health check
./scripts/health-check.sh > /tmp/health.log 2>&1

# 2. Check VNC status
./scripts/start-vnc.sh --status

# 3. Check application logs
pm2 logs mi-ai-coding                # If using PM2
tail -f /var/log/mi-ai-coding/*.log  # Production logs

# 4. Check system resources
df -h                                 # Disk space
free -h                               # Memory
top                                   # CPU and processes

# 5. Check services
systemctl status postgresql
systemctl status nginx
systemctl status fail2ban

# 6. Restart services if needed
./scripts/start-vnc.sh --restart
pm2 restart mi-ai-coding
sudo systemctl restart nginx
```

---

## Environment Variables

All scripts respect these environment variables from `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mi_ai_coding?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-key"
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"
APP_PORT=3000
NODE_ENV="development"  # or "production"
WS_PORT=3001
```

---

## Logging

### Log Locations

**Development:**
- Setup: `/tmp/mi-ai-coding-setup-*.log`
- VNC: `/tmp/x11vnc-*.log`

**Production:**
- Application: `/var/log/mi-ai-coding/*.log`
- Nginx: `/var/log/nginx/mi-ai-coding-*.log`
- Backup: `/var/log/mi-ai-coding-backup.log`
- Monitoring: `/var/log/mi-ai-coding/monitor.log`
- PM2: `~/.pm2/logs/mi-ai-coding-*.log`

### Viewing Logs

```bash
# Development
tail -f /tmp/x11vnc-*.log

# Production
tail -f /var/log/mi-ai-coding/error.log
tail -f /var/log/nginx/mi-ai-coding-access.log
pm2 logs mi-ai-coding
journalctl -u mi-ai-coding -f
```

---

## Maintenance Tasks

### Daily
- Automated backups (2 AM)
- SSL certificate renewal check (3 AM)
- Health monitoring (every 5 minutes)

### Weekly
- Review application logs for errors
- Check disk space and clean up if needed
- Review Fail2ban banned IPs
- Review backup integrity

### Monthly
- Update system packages
- Review and update dependencies
- Test backup restoration
- Security audit
- Performance review

---

## Security Best Practices

1. **Always use SSH keys** - Password authentication disabled in production
2. **Keep firewall enabled** - UFW with restrictive rules
3. **Monitor Fail2ban logs** - Review blocked IPs regularly
4. **Use SSL/TLS** - HTTPS only in production
5. **Regular updates** - Keep system and dependencies updated
6. **Backup verification** - Test restores periodically
7. **Log monitoring** - Review logs for suspicious activity
8. **Principle of least privilege** - Run services as non-root user
9. **Strong passwords** - Use random, long passwords for database
10. **Environment variables** - Never commit .env to version control

---

## Troubleshooting Guide

### VNC Issues

**Problem:** VNC servers won't start
```bash
# Solution
./scripts/start-vnc.sh --restart
# Check logs
tail -f /tmp/x11vnc-*.log
```

**Problem:** Can't connect to VNC externally
```bash
# Check firewall
sudo ufw status
sudo ufw allow 6080/tcp
sudo ufw allow 6081/tcp
# Check x11vnc is listening on all interfaces (0.0.0.0)
netstat -tulpn | grep x11vnc
```

### Database Issues

**Problem:** Can't connect to database
```bash
# Check PostgreSQL is running
systemctl status postgresql
sudo systemctl start postgresql
# Test connection
psql -h localhost -U youruser -d mi_ai_coding
```

**Problem:** Prisma client out of sync
```bash
npx prisma generate
npx prisma db push
```

### Application Issues

**Problem:** Application won't start
```bash
# Check logs
npm run dev  # Development
pm2 logs mi-ai-coding  # Production
# Check port availability
lsof -i:3000
# Kill process if needed
lsof -ti:3000 | xargs kill -9
```

**Problem:** Build fails
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Production Issues

**Problem:** Nginx won't start
```bash
# Test configuration
sudo nginx -t
# Check error log
tail -f /var/log/nginx/error.log
```

**Problem:** SSL certificate issues
```bash
# Check certificates
sudo certbot certificates
# Renew manually
sudo certbot renew --force-renewal
```

---

## Support and Documentation

For more information, refer to:
- Main documentation: `/home/master/projects/mi-ai-coding/README.md`
- Project architecture: `/home/master/projects/mi-ai-coding/PROJECT.md`
- Development guide: `/home/master/projects/mi-ai-coding/CLAUDE.md`
- Progress tracking: `/home/master/projects/mi-ai-coding/PROGRESS.md`

---

## Script Maintenance

All scripts follow these conventions:
- Bash scripts with `.sh` extension
- Executable permissions (`chmod +x`)
- Comprehensive error handling
- Colored output for UX
- Logging for debugging
- Idempotent (safe to run multiple times)
- Comments for LLM understanding
- Version and last updated date in header

---

*Last Updated: 2025-10-12*
*Version: 1.0*
