# MI AI Coding Platform - Deployment Guide

**Version**: 1.0
**Last Updated**: 2025-10-18

This guide provides comprehensive deployment instructions for the MI AI Coding Platform on Ubuntu/Debian servers.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment](#quick-deployment)
3. [Manual Deployment](#manual-deployment)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)
8. [Production Considerations](#production-considerations)
9. [Maintenance](#maintenance)

---

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Disk Space**: Minimum 10GB available
- **CPU**: 2+ cores recommended
- **Network**: Stable internet connection for package installation

### Required Access

- Sudo/root access to the server
- SSH access for remote deployment
- Ability to open ports: 3002, 3003, 6080, 6081
- Non-root user account (recommended: do not install as root)

### Directory Structure Requirements

The application requires the following directory structure:

```
/home/USERNAME/
├── projects/
│   ├── mi-ai-coding/     # Main application
│   └── agents/           # Agent configurations (required for multi-agent system)
```

**Important Notes:**
- Replace `USERNAME` with your actual Linux username
- The install.sh script will automatically create these directories
- Both directories must be writable by your user
- The `agents/` folder is required for the multi-agent system to function

### Before You Begin

1. **Create a non-root user** (if not already exists):
   ```bash
   sudo adduser youruser
   sudo usermod -aG sudo youruser
   ```

2. **Switch to your user account**:
   ```bash
   su - youruser
   ```

3. **Update system packages**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

4. **Ensure git is installed**:
   ```bash
   sudo apt-get install -y git
   ```

5. **Clone the project** (the script will create the directories):
   ```bash
   cd ~
   git clone https://github.com/amirtafreshi/mi-ai-coding.git ~/projects/mi-ai-coding
   cd ~/projects/mi-ai-coding
   ```

---

## Quick Deployment

The automated installation script handles all setup steps including directory creation.

### Step 1: Run Installation Script

**Default Installation** (installs to `~/projects/mi-ai-coding`):
```bash
cd ~/projects/mi-ai-coding
chmod +x scripts/install.sh
./scripts/install.sh
```

**Custom Path Installation**:
```bash
chmod +x scripts/install.sh
./scripts/install.sh /custom/path/mi-ai-coding
```

The script will:
- **Create required directories** (`~/projects/` and `~/projects/agents/`)
- Auto-detect current user and configure paths accordingly
- Install Node.js 20.x, PostgreSQL, Nginx, PM2
- Install VNC dependencies (x11vnc, Xvfb, etc.)
- Create PostgreSQL database and user
- Generate .env configuration file with correct paths
- Install npm dependencies
- Build the application
- Start VNC servers on displays :98 and :99
- Configure PM2 to manage the application
- Set up firewall rules (if UFW is active)

### Step 2: Verify Installation

```bash
./scripts/verify-installation.sh
```

Review the output to ensure all checks pass.

### Step 3: Access the Application

- **Application**: http://localhost:3002
- **Terminal VNC**: ws://localhost:6081
- **Playwright VNC**: ws://localhost:6080

---

## Manual Deployment

If you prefer manual installation or need to customize the process:

### 1. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verify installation
npm -v
```

### 2. Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
CREATE USER mi_ai_coding_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE mi_ai_coding OWNER mi_ai_coding_user;
GRANT ALL PRIVILEGES ON DATABASE mi_ai_coding TO mi_ai_coding_user;
\q
```

### 4. Install VNC Dependencies

```bash
sudo apt-get install -y x11vnc xvfb xclip xdotool fluxbox xterm websockify
```

### 5. Install PM2

```bash
sudo npm install -g pm2
pm2 startup systemd
# Run the command that PM2 outputs
```

### 6. Install Nginx (Optional)

```bash
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7. Configure Environment

```bash
cd /home/master/projects/mi-ai-coding

# Copy .env.example to .env
cp .env.example .env

# Edit .env file
nano .env
```

Update the following variables:
```env
DATABASE_URL="postgresql://mi_ai_coding_user:your_secure_password@localhost:5432/mi_ai_coding?schema=public"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
APP_PORT=3002
WS_PORT=3003
NODE_ENV=production
```

### 8. Install Dependencies & Build

```bash
npm install
npm run db:generate
npm run db:push
npm run build
```

### 9. Start VNC Servers

```bash
chmod +x scripts/start-vnc.sh
./scripts/start-vnc.sh
```

### 10. Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## Post-Deployment Verification

### Automated Verification

Run the verification script:
```bash
./scripts/verify-installation.sh
```

### Manual Verification Checklist

- [ ] **PostgreSQL Connection**
  ```bash
  PGPASSWORD='your_password' psql -h localhost -U mi_ai_coding_user -d mi_ai_coding -c "\dt"
  ```

- [ ] **Node.js Version**
  ```bash
  node -v  # Should be v20.x or higher
  ```

- [ ] **Application Running**
  ```bash
  pm2 status
  pm2 logs mi-ai-coding
  ```

- [ ] **Application Accessible**
  ```bash
  curl http://localhost:3002
  ```

- [ ] **VNC Servers Running**
  ```bash
  ps aux | grep -E 'Xvfb|x11vnc'
  netstat -tulpn | grep -E '6080|6081'
  ```

- [ ] **Ports Open**
  ```bash
  sudo ufw status
  # Should show ports 3002, 3003, 6080, 6081 allowed
  ```

### Health Check Endpoints

- Application health: `http://localhost:3002/api/health` (if implemented)
- WebSocket status: Check `ws://localhost:3003` connectivity
- VNC accessibility: Connect via VNC client to ports 6080, 6081

---

## Configuration

### Environment Variables

All configuration is managed through the `.env` file. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3002` |
| `NEXTAUTH_SECRET` | Auth secret key | Required (auto-generated) |
| `APP_PORT` | Main application port | `3002` |
| `WS_PORT` | WebSocket server port | `3003` |
| `TERMINAL_VNC_PORT` | Terminal VNC port | `6081` |
| `PLAYWRIGHT_VNC_PORT` | Playwright VNC port | `6080` |
| `VNC_DISPLAY_98` | Terminal display number | `:98` |
| `VNC_DISPLAY_99` | Playwright display number | `:99` |
| `NODE_ENV` | Environment mode | `production` |

### PM2 Configuration

Edit `ecosystem.config.js` to customize PM2 settings:
```javascript
module.exports = {
  apps: [
    {
      name: 'mi-ai-coding',
      script: 'server.js',
      instances: 1,  // Increase for clustering
      exec_mode: 'cluster',
      max_memory_restart: '1G',  // Adjust based on server RAM
      // ... other settings
    },
  ],
};
```

### Nginx Reverse Proxy (Optional)

Create Nginx configuration for production:

```bash
sudo nano /etc/nginx/sites-available/mi-ai-coding
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Main application
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # VNC endpoints
    location /vnc/terminal {
        proxy_pass http://localhost:6081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /vnc/playwright {
        proxy_pass http://localhost:6080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mi-ai-coding /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Firewall Configuration

```bash
# Allow application ports
sudo ufw allow 3002/tcp comment "MI AI Coding - App"
sudo ufw allow 3003/tcp comment "MI AI Coding - WebSocket"
sudo ufw allow 6080/tcp comment "MI AI Coding - Playwright VNC"
sudo ufw allow 6081/tcp comment "MI AI Coding - Terminal VNC"

# If using Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## Troubleshooting

### Application Won't Start

**Symptom**: PM2 shows app as errored or offline

**Solutions**:
1. Check logs:
   ```bash
   pm2 logs mi-ai-coding --lines 100
   ```

2. Verify .env file exists and is valid:
   ```bash
   cat .env | grep -E "DATABASE_URL|NEXTAUTH"
   ```

3. Check database connection:
   ```bash
   PGPASSWORD='password' psql -h localhost -U mi_ai_coding_user -d mi_ai_coding -c "SELECT 1"
   ```

4. Rebuild application:
   ```bash
   npm run build
   pm2 restart mi-ai-coding
   ```

### Database Connection Fails

**Symptom**: Cannot connect to PostgreSQL

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. Check pg_hba.conf authentication:
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Ensure this line exists:
   # host    all             all             127.0.0.1/32            md5
   sudo systemctl restart postgresql
   ```

3. Test connection manually:
   ```bash
   psql -h localhost -U mi_ai_coding_user -d mi_ai_coding
   ```

### VNC Not Accessible

**Symptom**: Cannot connect to VNC displays

**Solutions**:
1. Restart VNC servers:
   ```bash
   ./scripts/start-vnc.sh --restart
   ```

2. Check VNC processes:
   ```bash
   ps aux | grep -E 'Xvfb|x11vnc'
   ```

3. Check ports:
   ```bash
   netstat -tulpn | grep -E '6080|6081'
   ```

4. View VNC logs:
   ```bash
   tail -f /tmp/x11vnc-*.log
   ```

### Port Already in Use

**Symptom**: Error about port already bound

**Solutions**:
1. Find process using the port:
   ```bash
   lsof -i:3002
   ```

2. Kill the process:
   ```bash
   lsof -ti:3002 | xargs kill -9
   ```

3. Or change port in .env file

### Build Failures

**Symptom**: `npm run build` fails

**Solutions**:
1. Clear cache and rebuild:
   ```bash
   rm -rf node_modules .next package-lock.json
   npm install
   npm run build
   ```

2. Check Node.js version:
   ```bash
   node -v  # Should be v18+ (v20+ recommended)
   ```

3. Increase Node memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

---

## Rollback Procedures

### Quick Rollback

If deployment fails, restore previous version:

1. **Stop current application**:
   ```bash
   pm2 stop mi-ai-coding
   ```

2. **Restore backup**:
   ```bash
   # If you made a backup
   cd /home/master/projects
   rm -rf mi-ai-coding
   mv mi-ai-coding.backup mi-ai-coding
   cd mi-ai-coding
   ```

3. **Restart application**:
   ```bash
   pm2 start ecosystem.config.js
   ```

### Database Rollback

If database migration fails:

1. **Restore database backup**:
   ```bash
   # If you made a backup
   PGPASSWORD='password' psql -h localhost -U mi_ai_coding_user -d mi_ai_coding < backup.sql
   ```

2. **Reset Prisma migrations**:
   ```bash
   npx prisma migrate reset
   npx prisma db push
   ```

### Pre-Deployment Backup

Always backup before deploying:

```bash
# Backup code
cd /home/master/projects
cp -r mi-ai-coding mi-ai-coding.backup.$(date +%Y%m%d_%H%M%S)

# Backup database
PGPASSWORD='password' pg_dump -h localhost -U mi_ai_coding_user mi_ai_coding > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup .env
cp mi-ai-coding/.env mi-ai-coding/.env.backup.$(date +%Y%m%d_%H%M%S)
```

---

## Production Considerations

### Security Hardening

1. **Use strong passwords**:
   - Database password: At least 32 characters
   - NEXTAUTH_SECRET: Generated with `openssl rand -base64 32`

2. **Restrict VNC access**:
   ```bash
   # Only allow from specific IPs
   sudo ufw delete allow 6080/tcp
   sudo ufw delete allow 6081/tcp
   sudo ufw allow from 192.168.1.0/24 to any port 6080
   sudo ufw allow from 192.168.1.0/24 to any port 6081
   ```

3. **Enable HTTPS**:
   ```bash
   # Install Certbot
   sudo apt-get install -y certbot python3-certbot-nginx

   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Secure PostgreSQL**:
   ```bash
   # Edit postgresql.conf
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Set: ssl = on
   # Set: listen_addresses = 'localhost'
   ```

5. **Disable unnecessary services**:
   ```bash
   sudo systemctl disable avahi-daemon
   sudo systemctl disable cups
   ```

### Performance Optimization

1. **Enable PM2 clustering**:
   Edit `ecosystem.config.js`:
   ```javascript
   instances: 'max',  // Use all CPU cores
   ```

2. **Configure Nginx caching**:
   Add to Nginx config:
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;
   proxy_cache my_cache;
   proxy_cache_valid 200 60m;
   ```

3. **PostgreSQL tuning**:
   ```bash
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Adjust based on RAM:
   shared_buffers = 256MB
   effective_cache_size = 1GB
   maintenance_work_mem = 64MB
   ```

4. **Enable Node.js production optimizations**:
   In .env:
   ```env
   NODE_ENV=production
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

### Monitoring

1. **PM2 monitoring**:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **System monitoring**:
   ```bash
   # Install htop
   sudo apt-get install -y htop

   # Monitor resources
   htop
   ```

3. **Application monitoring** (optional):
   - Set up Sentry for error tracking
   - Use PM2 Plus for advanced monitoring
   - Configure log aggregation (ELK stack, etc.)

### Backup Strategy

1. **Automated database backups**:
   Create cron job:
   ```bash
   crontab -e
   # Add:
   0 2 * * * PGPASSWORD='password' pg_dump -h localhost -U mi_ai_coding_user mi_ai_coding > /backup/db_$(date +\%Y\%m\%d).sql
   ```

2. **Application backups**:
   ```bash
   # Weekly backup
   0 3 * * 0 tar -czf /backup/app_$(date +\%Y\%m\%d).tar.gz /home/master/projects/mi-ai-coding
   ```

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Check application status: `pm2 status`
- Monitor logs: `pm2 logs mi-ai-coding --lines 50`
- Check disk space: `df -h`

#### Weekly
- Update system packages: `sudo apt-get update && sudo apt-get upgrade -y`
- Rotate logs: `pm2 flush`
- Check database size: `psql -c "SELECT pg_size_pretty(pg_database_size('mi_ai_coding'));"`

#### Monthly
- Review and clean old logs
- Update npm dependencies (carefully): `npm outdated`
- Test backup restoration procedure
- Review security updates

### Updating the Application

1. **Stop application**:
   ```bash
   pm2 stop mi-ai-coding
   ```

2. **Backup current version**:
   ```bash
   cd /home/master/projects
   tar -czf mi-ai-coding.backup.$(date +%Y%m%d).tar.gz mi-ai-coding
   ```

3. **Pull latest changes**:
   ```bash
   cd mi-ai-coding
   git pull origin main
   ```

4. **Update dependencies**:
   ```bash
   npm install
   npm run db:generate
   ```

5. **Run migrations** (if needed):
   ```bash
   npm run db:migrate
   ```

6. **Rebuild application**:
   ```bash
   npm run build
   ```

7. **Restart application**:
   ```bash
   pm2 restart mi-ai-coding
   ```

8. **Verify deployment**:
   ```bash
   ./scripts/verify-installation.sh
   ```

### Scaling

#### Vertical Scaling (Increase Resources)
- Upgrade server RAM and CPU
- Increase PM2 instances in `ecosystem.config.js`
- Tune PostgreSQL configuration

#### Horizontal Scaling (Multiple Servers)
- Set up load balancer (Nginx, HAProxy)
- Use external PostgreSQL server (RDS, managed service)
- Implement session storage (Redis)
- Consider containerization (Docker, Kubernetes)

---

## Support & Resources

- **Documentation**: See `PROJECT.md` for architecture details
- **API Reference**: See `API_DOCS.md` for API endpoints
- **Progress Tracking**: Check `PROGRESS.md` for current status
- **GitHub Issues**: Report bugs at repository issue tracker
- **Agent Documentation**: See `agents/` directory for agent-specific docs

---

## Environment-Specific Notes

### Development Environment
```env
NODE_ENV=development
APP_PORT=3000
WS_PORT=3001
```
- Hot reload enabled
- Debug logging active
- Database can use `db:push` instead of migrations

### Staging Environment
```env
NODE_ENV=staging
APP_PORT=3002
WS_PORT=3003
```
- Similar to production but with debug features
- Test migrations before production
- Use separate database

### Production Environment
```env
NODE_ENV=production
APP_PORT=3002
WS_PORT=3003
SECURE_COOKIES=true
```
- HTTPS required (via Nginx)
- Proper database migrations
- Firewall rules enforced
- Monitoring enabled
- Regular backups

---

## Quick Reference Commands

```bash
# Application Management
pm2 start ecosystem.config.js
pm2 stop mi-ai-coding
pm2 restart mi-ai-coding
pm2 logs mi-ai-coding
pm2 monit

# VNC Management
./scripts/start-vnc.sh
./scripts/start-vnc.sh --status
./scripts/start-vnc.sh --restart
./scripts/start-vnc.sh --stop

# Database Management
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema (dev)
npm run db:migrate         # Run migrations (prod)
npm run db:studio          # Open Prisma Studio

# Build & Test
npm run build              # Build application
npm run dev                # Run in development
npm test                   # Run Playwright tests
npm run lint               # Lint code

# Verification
./scripts/verify-installation.sh
```

---

**Last Updated**: 2025-10-18
**Version**: 1.0
**Maintained By**: Documentation Agent
