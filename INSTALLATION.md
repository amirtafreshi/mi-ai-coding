# MI AI Coding Platform - Installation Guide

Complete step-by-step installation guide for quick deployment on multiple servers.

## Table of Contents

- [Quick Install (Automated)](#quick-install-automated)
- [Manual Installation](#manual-installation)
- [Server Requirements](#server-requirements)
- [Production Deployment](#production-deployment)
- [Domain & SSL Configuration](#domain--ssl-configuration)
- [Multi-Server Deployment](#multi-server-deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick Install (Automated)

**Installation time: ~10 minutes**

The quickest way to deploy MI AI Coding Platform on a fresh Ubuntu server:

```bash
# 1. Clone the repository
git clone https://github.com/amirtafreshi/mi-ai-coding.git
cd mi-ai-coding

# 2. Run the automated setup script
sudo chmod +x scripts/install-all.sh
sudo ./scripts/install-all.sh

# 3. Configure your environment
nano .env
# Update DATABASE_URL, NEXTAUTH_URL, and other settings

# 4. Start the application
npm run dev
```

The automated script installs:
- ✅ Node.js 20.x
- ✅ PostgreSQL 14+
- ✅ VNC servers (x11vnc, Xvfb, fluxbox)
- ✅ All system dependencies
- ✅ NPM packages
- ✅ Database setup

**Done!** Access your application at `http://localhost:3000`

---

## Server Requirements

### Minimum Requirements

- **OS**: Ubuntu 20.04+ (or Debian-based Linux)
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum, 4+ cores recommended
- **Disk**: 20GB minimum, 50GB+ recommended
- **Ports**: 3000, 6080, 6081, 80, 443 (firewall must allow these)

### Software Requirements

- Node.js 18+ (20+ recommended)
- PostgreSQL 14+
- Git
- Nginx (for production)
- VNC dependencies (x11vnc, Xvfb, fluxbox, xterm, chromium-browser)

---

## Manual Installation

### Step 1: Install System Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install VNC dependencies
sudo apt install -y x11vnc xvfb fluxbox xterm xclip xdotool chromium-browser

# Install Nginx (for production)
sudo apt install -y nginx

# Install build tools
sudo apt install -y build-essential git curl wget
```

### Step 2: Configure PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE mi_ai_coding;
CREATE USER mi_user WITH ENCRYPTED PASSWORD 'SecurePass123!';
GRANT ALL PRIVILEGES ON DATABASE mi_ai_coding TO mi_user;
\c mi_ai_coding
GRANT ALL ON SCHEMA public TO mi_user;
EOF

# Verify connection
psql -h localhost -U mi_user -d mi_ai_coding -c "SELECT version();"
```

### Step 3: Clone and Configure Application

```bash
# Clone repository
git clone https://github.com/amirtafreshi/mi-ai-coding.git
cd mi-ai-coding

# Install NPM dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required .env Configuration:**

```env
# Database
DATABASE_URL="postgresql://mi_user:SecurePass123!@localhost:5432/mi_ai_coding?schema=public"

# NextAuth (change for production)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# VNC Configuration
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"

# Application
APP_PORT=3000
NODE_ENV="development"

# WebSocket
WS_PORT=3001
```

### Step 4: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Seed database with test data
npm run db:seed
```

### Step 5: Start VNC Servers

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start VNC servers
./scripts/start-vnc.sh

# Verify VNC servers are running
ps aux | grep x11vnc
netstat -tlnp | grep -E '6080|6081'
```

### Step 6: Start Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

**Application URLs:**
- Main app: `http://localhost:3000`
- Terminal VNC: `http://localhost:6081`
- Playwright VNC: `http://localhost:6080`

---

## Production Deployment

### Option 1: Using PM2 (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start npm --name "mi-ai-coding" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Monitor application
pm2 logs mi-ai-coding
pm2 status
```

### Option 2: Using Systemd Service

Create `/etc/systemd/system/mi-ai-coding.service`:

```ini
[Unit]
Description=MI AI Coding Platform
After=network.target postgresql.service

[Service]
Type=simple
User=master
WorkingDirectory=/home/master/projects/mi-ai-coding
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mi-ai-coding
sudo systemctl start mi-ai-coding

# Check status
sudo systemctl status mi-ai-coding
```

---

## Domain & SSL Configuration

### Quick Domain Setup

```bash
# Run the automated domain setup script
sudo ./scripts/setup-domain-ssl.sh
```

This script will:
- ✅ Check for SSL certificates
- ✅ Configure Nginx reverse proxy
- ✅ Set up HTTPS with SSL
- ✅ Configure WebSocket proxies for VNC
- ✅ Enable HTTP to HTTPS redirect

### Manual Nginx Configuration

1. **Configure domain DNS** to point to your server IP

2. **Obtain SSL certificate** (using certbot):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **Use the provided Nginx configuration template:**

See `DOMAIN-SETUP.md` for complete Nginx configuration details.

4. **Update .env with production domain:**

```env
NEXTAUTH_URL="https://your-domain.com"
```

5. **Restart services:**

```bash
sudo systemctl reload nginx
pm2 restart mi-ai-coding
```

---

## Multi-Server Deployment

For deploying on multiple servers simultaneously:

### Using the Automated Script

1. **Prepare deployment package:**

```bash
# On your local machine
cd mi-ai-coding
tar -czf mi-ai-coding-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next \
  .

# Copy to servers
scp mi-ai-coding-deploy.tar.gz user@server1:/tmp/
scp mi-ai-coding-deploy.tar.gz user@server2:/tmp/
```

2. **Deploy to each server:**

```bash
# SSH to each server and run:
cd /home/master/projects
tar -xzf /tmp/mi-ai-coding-deploy.tar.gz
cd mi-ai-coding
sudo ./scripts/install-all.sh
```

3. **Configure per-server settings:**

Each server needs its own:
- Database credentials
- Domain name (if applicable)
- SSL certificate
- NEXTAUTH_SECRET

### Using Ansible (Advanced)

Create `deploy.yml`:

```yaml
---
- name: Deploy MI AI Coding Platform
  hosts: servers
  become: yes
  vars:
    app_user: master
    app_dir: /home/master/projects/mi-ai-coding

  tasks:
    - name: Clone repository
      git:
        repo: https://github.com/amirtafreshi/mi-ai-coding.git
        dest: "{{ app_dir }}"
        version: main

    - name: Run installation script
      command: "{{ app_dir }}/scripts/install-all.sh"

    - name: Configure environment
      template:
        src: .env.j2
        dest: "{{ app_dir }}/.env"

    - name: Start application
      command: pm2 start npm --name mi-ai-coding -- start
      args:
        chdir: "{{ app_dir }}"
      become_user: "{{ app_user }}"
```

Run deployment:

```bash
ansible-playbook -i inventory.ini deploy.yml
```

---

## Firewall Configuration

### UFW (Ubuntu Firewall)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (if needed)
sudo ufw allow 3000/tcp

# Allow VNC ports (optional, for external access)
sudo ufw allow 6080/tcp
sudo ufw allow 6081/tcp

# Check status
sudo ufw status numbered
```

### Security Best Practices

1. **Change default passwords** in `.env`
2. **Use strong NEXTAUTH_SECRET**: `openssl rand -base64 32`
3. **Restrict VNC access** to specific IPs if exposed
4. **Enable HTTPS** for production
5. **Regular updates**: `sudo apt update && sudo apt upgrade`
6. **Backup database** regularly: `pg_dump mi_ai_coding > backup.sql`

---

## Verification Checklist

After installation, verify everything works:

- [ ] Application accessible at http://localhost:3000
- [ ] Database connection successful
- [ ] Login works with test credentials
- [ ] VNC viewers accessible (Terminal & Playwright)
- [ ] File explorer loads
- [ ] Code editor works
- [ ] Activity log streams updates
- [ ] WebSocket connection established

---

## Troubleshooting

### Issue: PostgreSQL Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U mi_user -d mi_ai_coding

# Reset password if needed
sudo -u postgres psql
ALTER USER mi_user WITH PASSWORD 'NewPassword123!';
```

### Issue: VNC Servers Not Starting

```bash
# Check for errors
cat /tmp/x11vnc-:98.log
cat /tmp/x11vnc-:99.log

# Kill existing processes
pkill -9 x11vnc
pkill -9 Xvfb

# Restart VNC
./scripts/start-vnc.sh
```

### Issue: Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in .env
echo "APP_PORT=3001" >> .env
```

### Issue: npm install Fails

```bash
# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# If still fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### Issue: Database Migration Failed

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manual reset
sudo -u postgres psql
DROP DATABASE mi_ai_coding;
CREATE DATABASE mi_ai_coding;
\q

# Regenerate schema
npm run db:generate
npm run db:push
```

### Issue: SSL Certificate Errors

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Performance Optimization

### For Production Deployments

1. **Enable Node.js Production Mode:**

```env
NODE_ENV=production
```

2. **Increase PostgreSQL Connection Pool:**

```env
DATABASE_URL="postgresql://mi_user:pass@localhost:5432/mi_ai_coding?schema=public&connection_limit=20"
```

3. **Configure PM2 Cluster Mode:**

```bash
pm2 start npm --name mi-ai-coding -i max -- start
```

4. **Enable Nginx Caching:**

Add to Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;
```

5. **Database Optimization:**

```sql
-- Add indexes for frequently queried tables
CREATE INDEX idx_files_path ON "File"(path);
CREATE INDEX idx_activity_created ON "ActivityLog"("createdAt");
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check application status
pm2 status

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check disk space
df -h

# Check memory usage
free -h

# Check logs
pm2 logs mi-ai-coding
sudo tail -f /var/log/nginx/error.log
```

### Backup Strategy

```bash
# Backup database (automated with cron)
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -U mi_user mi_ai_coding > /backups/mi-ai-coding-$(date +\%Y\%m\%d).sql

# Backup application files
tar -czf /backups/mi-ai-coding-files-$(date +\%Y\%m\%d).tar.gz /home/master/projects/mi-ai-coding
```

---

## Next Steps

After installation:

1. **Configure your domain** - See [DOMAIN-SETUP.md](DOMAIN-SETUP.md)
2. **Set up SSL** - Run `sudo ./scripts/setup-domain-ssl.sh`
3. **Review documentation** - Read [README.md](README.md) and [PROJECT.md](PROJECT.md)
4. **Customize agents** - See `agents/` directory
5. **Deploy to production** - Follow the production deployment section

---

## Support & Resources

- **Documentation**: [README.md](README.md), [PROJECT.md](PROJECT.md), [PROGRESS.md](PROGRESS.md)
- **Domain Setup**: [DOMAIN-SETUP.md](DOMAIN-SETUP.md)
- **GitHub Issues**: https://github.com/amirtafreshi/mi-ai-coding/issues
- **Agent Guides**: See `agents/` directory

---

**Installation Complete!** 🎉

Your MI AI Coding Platform is ready to use. Access it at:
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`
