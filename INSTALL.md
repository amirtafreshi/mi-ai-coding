# MI AI Coding Platform - Installation Guide

Complete installation and deployment guide for the MI AI Coding Platform. This guide is designed to be LLM-friendly and covers all aspects from prerequisites to production deployment.

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Target OS**: Ubuntu 20.04+ / Debian 11+

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Dependencies](#system-dependencies)
3. [Quick Start](#quick-start)
4. [Manual Installation](#manual-installation)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [VNC Setup](#vnc-setup)
8. [First Run](#first-run)
9. [Domain Configuration](#domain-configuration)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance](#maintenance)

---

## Prerequisites

### Operating System
- Ubuntu 20.04 LTS or later (recommended: Ubuntu 22.04 LTS)
- Debian 11+ (Bullseye or later)
- Other Linux distributions may work but are not officially supported

### Software Requirements
- **Node.js**: Version 18.x or higher (20.x LTS recommended)
- **npm**: Version 9.x or higher (comes with Node.js)
- **PostgreSQL**: Version 14 or higher (15+ recommended)
- **Git**: Version 2.30+
- **Build tools**: gcc, g++, make (for native dependencies)

### Hardware Requirements

#### Development Environment
- CPU: 2 cores minimum (4 cores recommended)
- RAM: 4 GB minimum (8 GB recommended)
- Storage: 10 GB free space minimum
- Network: Internet connection for package installation

#### Production Environment
- CPU: 4 cores minimum (8 cores recommended for high traffic)
- RAM: 8 GB minimum (16 GB+ recommended)
- Storage: 20 GB free space minimum (50 GB+ for production data)
- Network: Static IP address, domain name (optional but recommended)

### Port Requirements

The following ports must be available:

| Port | Service | Description |
|------|---------|-------------|
| 3000 | Next.js App | Main application server |
| 3001 | WebSocket | Real-time activity log updates |
| 5432 | PostgreSQL | Database server (localhost only) |
| 6080 | VNC Display :99 | Playwright browser automation viewer |
| 6081 | VNC Display :98 | Terminal access viewer |

**Security Note**: Ports 3000, 6080, and 6081 should be accessible from your network. Port 5432 should ONLY be accessible from localhost unless you have a specific reason to expose it.

---

## System Dependencies

### Complete Dependency Installation (Ubuntu/Debian)

Run the following commands to install all required system dependencies:

```bash
# Update package lists
sudo apt-get update

# Install Node.js 20.x LTS (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15
sudo apt-get install -y postgresql postgresql-contrib

# Install VNC server and X11 tools
sudo apt-get install -y x11vnc xvfb

# Install clipboard and automation tools
sudo apt-get install -y xclip xdotool

# Install window manager and terminal (for VNC displays)
sudo apt-get install -y fluxbox xterm

# Install build tools (required for native Node.js modules)
sudo apt-get install -y build-essential

# Install Git (if not already installed)
sudo apt-get install -y git

# Install OpenSSL (for generating secrets)
sudo apt-get install -y openssl
```

### Verify Installations

```bash
# Check Node.js version (should be 18+ or 20+)
node --version

# Check npm version
npm --version

# Check PostgreSQL version (should be 14+)
psql --version

# Check VNC tools
x11vnc -version
Xvfb -help 2>&1 | head -n 1

# Check clipboard tools
xclip -version
xdotool version
```

### Individual Package Descriptions

| Package | Purpose | Required For |
|---------|---------|--------------|
| nodejs | JavaScript runtime | Application execution |
| npm | Package manager | Dependency installation |
| postgresql | Database server | Data persistence |
| postgresql-contrib | PostgreSQL extensions | Enhanced database features |
| x11vnc | VNC server | Remote display access |
| xvfb | Virtual framebuffer | Headless X11 display |
| xclip | Clipboard manager | Copy/paste between VNC and browser |
| xdotool | X11 automation | Paste text into VNC terminals |
| fluxbox | Lightweight window manager | VNC display management |
| xterm | Terminal emulator | Terminal access in VNC |
| build-essential | C/C++ compiler toolchain | Native module compilation |

---

## Quick Start

### One-Command Installation (Recommended)

Clone the repository and run the automated setup script:

```bash
# Clone the repository
git clone https://github.com/yourusername/mi-ai-coding.git
cd mi-ai-coding

# Run automated setup (installs dependencies, configures environment, builds app)
./scripts/setup.sh
```

The setup script will:
1. Check Node.js version (must be 18+)
2. Check PostgreSQL installation (offers to install if missing)
3. Check VNC dependencies (offers to install if missing)
4. Install npm dependencies
5. Create .env file from .env.example
6. Generate random NEXTAUTH_SECRET
7. Initialize database (if you confirm)
8. Build the application

### After Quick Start

```bash
# Start VNC servers for visual debugging
./scripts/start-vnc.sh

# Start the application in development mode
npm run dev

# Or start in production mode
npm start
```

Access the application at `http://localhost:3000`

---

## Manual Installation

If you prefer to install step-by-step or the automated script fails, follow these manual instructions.

### Step 1: Clone Repository

```bash
# Create project directory
mkdir -p ~/projects
cd ~/projects

# Clone repository
git clone https://github.com/yourusername/mi-ai-coding.git
cd mi-ai-coding

# Verify files
ls -la
```

### Step 2: Install Node.js Dependencies

```bash
# Install all dependencies (uses package-lock.json for deterministic installs)
npm ci

# Or use npm install if package-lock.json doesn't exist
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Generate secure NEXTAUTH_SECRET
openssl rand -base64 32

# Edit .env file with your preferred editor
nano .env
# or
vim .env
```

See [Configuration](#configuration) section for detailed environment variable explanations.

### Step 4: Configure PostgreSQL

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres

# Create database and user
psql
```

Inside psql:
```sql
-- Create database
CREATE DATABASE mi_ai_coding;

-- Create user with password
CREATE USER your_username WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mi_ai_coding TO your_username;

-- Grant schema privileges (PostgreSQL 15+)
\c mi_ai_coding
GRANT ALL ON SCHEMA public TO your_username;

-- Exit psql
\q
```

Exit postgres user:
```bash
exit
```

Update DATABASE_URL in .env:
```env
DATABASE_URL="postgresql://your_username:your_secure_password@localhost:5432/mi_ai_coding?schema=public"
```

### Step 5: Initialize Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development/prototyping)
npx prisma db push

# Or create migration (production-ready)
npx prisma migrate dev --name init

# Verify database
npx prisma studio
# Opens browser at http://localhost:5555
```

### Step 6: Build Application

```bash
# Build for production (also runs prisma generate)
npm run build

# Verify build output
ls -la .next/
```

### Step 7: Start VNC Servers

```bash
# Make script executable (if needed)
chmod +x scripts/start-vnc.sh

# Start VNC servers
./scripts/start-vnc.sh

# Verify VNC servers are running
ps aux | grep -E 'Xvfb|x11vnc'
netstat -tulpn | grep -E '6080|6081'
```

---

## Configuration

### Environment Variables Reference

Create a `.env` file in the project root with the following variables:

#### Database Configuration

```env
# PostgreSQL connection string
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/mi_ai_coding?schema=public"
```

**Important Notes**:
- Replace `your_username` and `your_password` with actual PostgreSQL credentials
- For production, use a strong password (16+ characters, mixed case, numbers, symbols)
- Keep DATABASE_URL secret - never commit to version control
- For remote PostgreSQL, replace `localhost` with server IP/hostname

#### Authentication Configuration

```env
# NextAuth.js configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

**NEXTAUTH_URL**:
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com` (use HTTPS in production)

**NEXTAUTH_SECRET**:
- Generate with: `openssl rand -base64 32`
- Must be at least 32 characters
- Keep secret - never commit to version control
- Generate different secrets for dev/staging/production

Example secret generation:
```bash
openssl rand -base64 32
# Output: J8ZK+2X9vP3mQ7wR5tN8yH4kL1fG6sA9xC0bV2nM8pU=
```

#### VNC Configuration

```env
# VNC display identifiers
VNC_DISPLAY_98=":98"    # Terminal display
VNC_DISPLAY_99=":99"    # Playwright display

# VNC server ports
TERMINAL_VNC_PORT=6081   # Terminal VNC (display :98)
PLAYWRIGHT_VNC_PORT=6080 # Playwright VNC (display :99)
```

**VNC Display Usage**:
- Display :98 (port 6081): Terminal access with xterm, bash, vim
- Display :99 (port 6080): Playwright browser automation for E2E testing
- Both displays support clipboard synchronization with browser

**Security Note**: VNC servers run without passwords by default. For production:
- Use firewall rules to restrict access (see [Production Deployment](#production-deployment))
- Run VNC behind reverse proxy with authentication
- Or configure x11vnc with password: `x11vnc -usepw`

#### Application Configuration

```env
# Application server port
APP_PORT=3000

# Node environment (development, production, test)
NODE_ENV="development"
```

**NODE_ENV Values**:
- `development`: Enables hot reload, detailed errors, source maps
- `production`: Optimized builds, minimal logging, security headers
- `test`: Used for automated testing

#### WebSocket Configuration

```env
# WebSocket server port for real-time activity logs
WS_PORT=3001
```

**WebSocket Usage**:
- Real-time activity log streaming to dashboard
- Agent action broadcasts
- File change notifications (future feature)

### Complete .env Example

```env
# Database
DATABASE_URL="postgresql://mi_user:SecurePass123!@localhost:5432/mi_ai_coding?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="J8ZK+2X9vP3mQ7wR5tN8yH4kL1fG6sA9xC0bV2nM8pU="

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

### Environment-Specific Configuration

#### Development (.env.development)
```env
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/mi_ai_coding_dev?schema=public"
```

#### Production (.env.production)
```env
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="postgresql://prod_user:strong_prod_pass@localhost:5432/mi_ai_coding?schema=public"
```

### Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use different secrets per environment**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use environment variables in production** (not .env files)
5. **Restrict file permissions**: `chmod 600 .env`

---

## Database Setup

### PostgreSQL Installation

#### Ubuntu/Debian

```bash
# Install PostgreSQL 15 (recommended)
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
psql --version
```

#### Verify PostgreSQL is Running

```bash
# Check service status
sudo systemctl status postgresql

# Check listening ports
sudo netstat -tulpn | grep 5432

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

### Database Creation

#### Method 1: Using psql (Recommended)

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database
createdb mi_ai_coding

# Create user
createuser --interactive --pwprompt
# Enter name: mi_user
# Enter password: [your secure password]
# Superuser? n
# Create databases? n
# Create roles? n

# Grant privileges
psql mi_ai_coding -c "GRANT ALL PRIVILEGES ON DATABASE mi_ai_coding TO mi_user;"
psql mi_ai_coding -c "GRANT ALL ON SCHEMA public TO mi_user;"

# Exit postgres user
exit
```

#### Method 2: Using SQL Commands

```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE mi_ai_coding
  WITH ENCODING='UTF8'
       OWNER=postgres
       LC_COLLATE='en_US.UTF-8'
       LC_CTYPE='en_US.UTF-8'
       TEMPLATE=template0;

-- Create user
CREATE USER mi_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mi_ai_coding TO mi_user;

-- Connect to database
\c mi_ai_coding

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO mi_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mi_user;

-- Exit psql
\q
```

### Prisma Setup

#### Initialize Prisma Schema

```bash
# Generate Prisma client from schema
npx prisma generate

# Output: Generated Prisma Client in node_modules/@prisma/client
```

#### Push Schema to Database (Development)

```bash
# Push schema changes without creating migrations
npx prisma db push

# Output: Database schema synchronized
```

**Use `db push` for**:
- Prototyping and rapid development
- Local development databases
- Testing schema changes quickly

#### Create Migrations (Production)

```bash
# Create initial migration
npx prisma migrate dev --name init

# Create subsequent migrations
npx prisma migrate dev --name add_user_roles

# Apply migrations in production
npx prisma migrate deploy
```

**Use `migrate` for**:
- Production databases
- Team collaboration
- Version-controlled schema changes
- Rollback capability

### Prisma Studio (Database GUI)

```bash
# Open Prisma Studio
npx prisma studio

# Access at http://localhost:5555
```

Prisma Studio provides:
- Visual database browser
- CRUD operations without SQL
- Schema visualization
- Data seeding interface

### Database Schema Overview

The platform uses 6 core models:

#### User Model
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
}
```

#### Session Model
```prisma
model Session {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### File Model
```prisma
model File {
  id        Int      @id @default(autoincrement())
  path      String   @unique
  content   String   @db.Text
  mimeType  String   @default("text/plain")
  size      Int      @default(0)
  folderId  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  folder    Folder?  @relation(fields: [folderId], references: [id])
}
```

#### Folder Model
```prisma
model Folder {
  id        Int      @id @default(autoincrement())
  path      String   @unique
  name      String
  parentId  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  parent    Folder?  @relation("FolderToFolder", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderToFolder")
  files     File[]
}
```

#### ActivityLog Model
```prisma
model ActivityLog {
  id        Int      @id @default(autoincrement())
  agent     String
  action    String
  details   String?  @db.Text
  level     String   @default("info")
  createdAt DateTime @default(now())
}
```

#### VNCConfig Model
```prisma
model VNCConfig {
  id         Int      @id @default(autoincrement())
  display    String   @unique
  port       Int
  resolution String   @default("1920x1080")
  isActive   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Database Backup

```bash
# Backup database
pg_dump -U mi_user -d mi_ai_coding -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restore from backup
pg_restore -U mi_user -d mi_ai_coding -c backup_20250112_143000.dump
```

---

## VNC Setup

### VNC Architecture

The platform uses dual VNC displays for different purposes:

| Display | Port | Purpose | Resolution |
|---------|------|---------|------------|
| :98 | 6081 | Terminal access (xterm, bash, vim) | 1920x1080 |
| :99 | 6080 | Playwright browser automation | 1920x1080 |

### Starting VNC Servers

#### Automated Script (Recommended)

```bash
# Start both VNC servers
./scripts/start-vnc.sh
```

The script will:
1. Check for required tools (x11vnc, Xvfb)
2. Start Xvfb on displays :98 and :99
3. Start x11vnc servers on ports 6081 and 6080
4. Start fluxbox window manager
5. Launch xterm on display :98

#### Manual VNC Server Start

If you need to start VNC servers manually:

```bash
# Start Xvfb for display :98
Xvfb :98 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &

# Start x11vnc for display :98 (port 6081)
x11vnc -display :98 -forever -shared -rfbport 6081 -nopw -listen 0.0.0.0 &

# Start window manager on :98
DISPLAY=:98 fluxbox &

# Start terminal on :98
DISPLAY=:98 xterm -geometry 120x40 &

# Start Xvfb for display :99
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &

# Start x11vnc for display :99 (port 6080)
x11vnc -display :99 -forever -shared -rfbport 6080 -nopw -listen 0.0.0.0 &

# Start window manager on :99
DISPLAY=:99 fluxbox &
```

### Verifying VNC Servers

```bash
# Check Xvfb processes
ps aux | grep Xvfb
# Expected output:
# Xvfb :98 -screen 0 1920x1080x24 ...
# Xvfb :99 -screen 0 1920x1080x24 ...

# Check x11vnc processes
ps aux | grep x11vnc
# Expected output:
# x11vnc -display :98 ... -rfbport 6081 ...
# x11vnc -display :99 ... -rfbport 6080 ...

# Check listening ports
netstat -tulpn | grep -E '6080|6081'
# Expected output:
# tcp  0  0.0.0.0:6080  0.0.0.0:*  LISTEN  12345/x11vnc
# tcp  0  0.0.0.0:6081  0.0.0.0:*  LISTEN  12346/x11vnc

# Test VNC connection
xdpyinfo -display :98 | grep dimensions
xdpyinfo -display :99 | grep dimensions
```

### Connecting to VNC

#### Via Web Browser (noVNC)

The application includes embedded noVNC viewers:

- Terminal VNC: `http://localhost:3000/vnc/terminal`
- Playwright VNC: `http://localhost:3000/vnc/playwright`

Or connect directly to VNC ports:
- Terminal: `ws://localhost:6081`
- Playwright: `ws://localhost:6080`

#### Via VNC Client

Use any VNC client (TigerVNC, RealVNC, TightVNC):

```
Server: localhost:6080  (Playwright)
Server: localhost:6081  (Terminal)
```

**Note**: VNC servers run without passwords by default. For production, see security configuration.

### VNC Clipboard Integration

The platform provides clipboard synchronization between browser and VNC displays.

#### Copy from VNC to Browser

```bash
# In VNC terminal, copy text
echo "Hello World" | xclip -selection clipboard -display :98

# In browser, trigger copy via API
curl -X POST http://localhost:3000/api/vnc/copy \
  -H "Content-Type: application/json" \
  -d '{"display": ":98"}'
```

#### Paste from Browser to VNC

```bash
# Send text from browser to VNC
curl -X POST http://localhost:3000/api/vnc/paste \
  -H "Content-Type: application/json" \
  -d '{"display": ":98", "text": "Hello from browser"}'
```

### Stopping VNC Servers

```bash
# Stop Xvfb displays
pkill -f 'Xvfb :98'
pkill -f 'Xvfb :99'

# Stop x11vnc servers
pkill -f 'x11vnc.*6081'
pkill -f 'x11vnc.*6080'

# Stop all VNC-related processes
pkill -f 'Xvfb'
pkill -f 'x11vnc'
pkill -f 'fluxbox'

# Verify all stopped
ps aux | grep -E 'Xvfb|x11vnc|fluxbox'
```

### VNC Troubleshooting

#### VNC Server Won't Start

```bash
# Check if display is already in use
lsof -i:6080
lsof -i:6081

# Check for orphaned X lock files
ls -la /tmp/.X98-lock
ls -la /tmp/.X99-lock

# Remove lock files if needed
rm -f /tmp/.X98-lock
rm -f /tmp/.X99-lock
```

#### VNC Connection Refused

```bash
# Check firewall rules
sudo ufw status

# Allow VNC ports if blocked
sudo ufw allow 6080/tcp
sudo ufw allow 6081/tcp
```

#### Black Screen in VNC

```bash
# Restart window manager
DISPLAY=:98 fluxbox &
DISPLAY=:99 fluxbox &

# Or restart terminal
DISPLAY=:98 xterm &
```

---

## First Run

### Development Mode

Development mode includes hot reload, detailed error messages, and source maps.

```bash
# Start VNC servers first (required for full functionality)
./scripts/start-vnc.sh

# Start development server
npm run dev

# Output:
# > mi-ai-coding@1.0.0 dev
# > node server.js
#
# Server running on http://localhost:3000
# WebSocket server running on ws://localhost:3001
```

**Access Points**:
- Main app: `http://localhost:3000`
- API routes: `http://localhost:3000/api/*`
- Prisma Studio: `npx prisma studio` (opens `http://localhost:5555`)

**Development Features**:
- Hot reload (changes reflect immediately)
- Detailed error messages
- React DevTools support
- Source maps enabled

### Production Mode

Production mode is optimized for performance and security.

```bash
# Build application first (required for production)
npm run build

# Start VNC servers
./scripts/start-vnc.sh

# Start production server
npm start

# Or with PM2 (recommended for production)
pm2 start npm --name "mi-ai-coding" -- start
pm2 save
```

**Production Features**:
- Minified JavaScript/CSS
- Optimized images
- Security headers
- Error logging (not displayed to users)

### Verifying Installation

Run these checks to verify everything is working:

```bash
# 1. Check application is running
curl http://localhost:3000
# Expected: HTML response with "MI AI Coding Platform"

# 2. Check WebSocket server
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001
# Expected: 101 Switching Protocols

# 3. Check VNC servers
netstat -tulpn | grep -E '6080|6081'
# Expected: Both ports listening

# 4. Check database connection
npx prisma db execute --stdin <<< "SELECT 1 as test;"
# Expected: Query executed successfully

# 5. Run health check API (if implemented)
curl http://localhost:3000/api/health
```

### Initial Login

The platform requires authentication:

1. Navigate to `http://localhost:3000`
2. Click "Login" or navigate to `/login`
3. Use default credentials (if seeded) or create new account

**Default Admin Account** (if database was seeded):
```
Email: admin@example.com
Password: admin123
```

**Security Warning**: Change default passwords immediately in production!

### Running Tests

```bash
# Start VNC servers (required for Playwright tests)
./scripts/start-vnc.sh

# Run all E2E tests on display :99 (visible in VNC viewer)
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with headed browser
npm run test:headed

# View test report
npm run test:report
```

**Important**: All Playwright tests MUST run with `DISPLAY=:99` environment variable. This is pre-configured in npm scripts.

### First-Time Setup Checklist

- [ ] System dependencies installed (Node.js, PostgreSQL, VNC tools)
- [ ] Repository cloned
- [ ] npm dependencies installed (`npm ci`)
- [ ] .env file created and configured
- [ ] PostgreSQL database created
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] Application built (`npm run build`)
- [ ] VNC servers started (`./scripts/start-vnc.sh`)
- [ ] Application started (`npm start` or `npm run dev`)
- [ ] Can access `http://localhost:3000`
- [ ] Can login to application
- [ ] VNC displays accessible (ports 6080, 6081)

---

## Domain Configuration

### Localhost Setup (Development)

Default configuration for local development:

```env
NEXTAUTH_URL="http://localhost:3000"
APP_PORT=3000
```

Access via:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://[your-local-ip]:3000` (from other devices on same network)

### Custom Domain Configuration

#### DNS Setup

1. Point your domain's A record to your server IP:
```
Type: A
Name: @ (or your-subdomain)
Value: your.server.ip.address
TTL: 3600
```

2. Add CNAME for www (optional):
```
Type: CNAME
Name: www
Value: yourdomain.com
TTL: 3600
```

3. Verify DNS propagation:
```bash
dig yourdomain.com
nslookup yourdomain.com
```

#### Update Environment Variables

```env
NEXTAUTH_URL="https://yourdomain.com"
```

### Nginx Reverse Proxy Configuration

#### Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### Configure Nginx for MI AI Coding Platform

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/mi-ai-coding
```

Add the following configuration:

```nginx
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificate paths (will be populated by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/mi-ai-coding-access.log;
    error_log /var/log/nginx/mi-ai-coding-error.log;

    # Max upload size
    client_max_body_size 50M;

    # Proxy Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy (for activity logs)
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # VNC Terminal proxy (optional - restrict access in production)
    location /vnc/terminal {
        proxy_pass http://localhost:6081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Restrict access by IP (recommended)
        # allow 1.2.3.4;  # Your IP
        # deny all;
    }

    # VNC Playwright proxy (optional - restrict access in production)
    location /vnc/playwright {
        proxy_pass http://localhost:6080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Restrict access by IP (recommended)
        # allow 1.2.3.4;  # Your IP
        # deny all;
    }
}
```

#### Enable Nginx Configuration

```bash
# Test configuration
sudo nginx -t

# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/mi-ai-coding /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Restart Nginx
sudo systemctl restart nginx
```

### SSL/TLS Setup with Let's Encrypt

#### Install Certbot

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

#### Obtain SSL Certificate

```bash
# Obtain and install certificate (interactive)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or non-interactive
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos --email your@email.com
```

Follow prompts:
1. Enter email address for urgent renewal notices
2. Agree to Terms of Service
3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)

#### Verify SSL Certificate

```bash
# Check certificate details
sudo certbot certificates

# Test SSL configuration
curl -I https://yourdomain.com

# Test SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

#### Auto-Renewal Setup

Certbot installs a systemd timer for automatic renewal:

```bash
# Check renewal timer status
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run

# Manual renewal (if needed)
sudo certbot renew
```

Renewal happens automatically every 12 hours. Certificates are renewed if expiring in 30 days or less.

### Firewall Configuration (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow VNC ports (optional - only if external access needed)
sudo ufw allow 6080/tcp comment "VNC Playwright"
sudo ufw allow 6081/tcp comment "VNC Terminal"

# DO NOT expose PostgreSQL port publicly
# sudo ufw deny 5432/tcp

# DO NOT expose WebSocket port publicly (use Nginx proxy)
# sudo ufw deny 3001/tcp

# Verify rules
sudo ufw status verbose

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
# 6080/tcp (VNC Playwright)  ALLOW       Anywhere
# 6081/tcp (VNC Terminal)    ALLOW       Anywhere
```

**Security Notes**:
- NEVER expose port 3000 (Next.js) directly - use Nginx proxy
- NEVER expose port 5432 (PostgreSQL) to internet
- NEVER expose port 3001 (WebSocket) directly - use Nginx proxy
- VNC ports (6080, 6081) should be restricted by IP or protected by authentication

### Testing Domain Configuration

```bash
# Test HTTP to HTTPS redirect
curl -I http://yourdomain.com
# Expected: 301 Moved Permanently, Location: https://yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com
# Expected: 200 OK

# Test WebSocket connection
wscat -c wss://yourdomain.com/ws

# Test VNC access
# Open browser: https://yourdomain.com/vnc/terminal
```

---

## Production Deployment

### Server Requirements

#### Minimum Specifications
- **OS**: Ubuntu 22.04 LTS (recommended)
- **CPU**: 4 cores (Intel Xeon or AMD EPYC)
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 100 Mbps, static IP address
- **Bandwidth**: Unlimited or 2 TB/month minimum

#### Recommended Specifications
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 8+ cores
- **RAM**: 16 GB+
- **Storage**: 100 GB+ NVMe SSD
- **Network**: 1 Gbps, static IP, DDoS protection
- **Bandwidth**: Unlimited

### Pre-Deployment Checklist

#### Security Checklist

- [ ] Strong passwords for all services (16+ characters)
- [ ] SSH key-based authentication (disable password auth)
- [ ] Firewall configured (UFW or iptables)
- [ ] Fail2ban installed and configured
- [ ] PostgreSQL only accessible from localhost
- [ ] All secrets rotated from development values
- [ ] HTTPS/SSL configured with Let's Encrypt
- [ ] Security headers configured in Nginx
- [ ] VNC access restricted or password-protected
- [ ] Regular security updates enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

#### Configuration Checklist

- [ ] .env file configured with production values
- [ ] DATABASE_URL points to production database
- [ ] NEXTAUTH_URL uses HTTPS and production domain
- [ ] NEXTAUTH_SECRET is unique and secure (32+ chars)
- [ ] NODE_ENV="production"
- [ ] Database migrations created and tested
- [ ] Build process tested (`npm run build`)
- [ ] Error logging configured
- [ ] Log rotation configured

#### Infrastructure Checklist

- [ ] Domain name registered and DNS configured
- [ ] Server provisioned with static IP
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] PostgreSQL 15+ installed
- [ ] Node.js 20+ installed
- [ ] PM2 process manager installed
- [ ] Backup system configured
- [ ] Monitoring system configured
- [ ] Log aggregation configured

### PM2 Process Manager Setup

PM2 ensures your application runs continuously, restarts on failure, and survives server reboots.

#### Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

#### Configure PM2 Ecosystem

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'mi-ai-coding',
    script: 'server.js',
    cwd: '/home/master/projects/mi-ai-coding',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      APP_PORT: 3000,
      WS_PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next'],
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Or start directly
pm2 start npm --name "mi-ai-coding" -- start

# View status
pm2 status

# View logs
pm2 logs mi-ai-coding

# Monitor resources
pm2 monit
```

#### Configure PM2 Startup

```bash
# Generate startup script
pm2 startup systemd

# Copy and run the output command (will be specific to your system)
# Example output:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u master --hp /home/master

# Save current process list
pm2 save

# Verify startup configuration
sudo systemctl status pm2-master
```

#### PM2 Commands Reference

```bash
# Start application
pm2 start mi-ai-coding

# Stop application
pm2 stop mi-ai-coding

# Restart application
pm2 restart mi-ai-coding

# Reload application (zero-downtime)
pm2 reload mi-ai-coding

# Delete from PM2 list
pm2 delete mi-ai-coding

# View logs
pm2 logs mi-ai-coding
pm2 logs mi-ai-coding --lines 100
pm2 logs mi-ai-coding --err

# Monitor
pm2 monit

# List all processes
pm2 list

# Show process details
pm2 show mi-ai-coding

# Flush logs
pm2 flush

# Reset restart counter
pm2 reset mi-ai-coding
```

### Nginx Production Configuration

See [Nginx Reverse Proxy Configuration](#nginx-reverse-proxy-configuration) section above.

Key production settings:
- SSL/TLS with strong ciphers
- Security headers (HSTS, X-Frame-Options, etc.)
- WebSocket support for real-time features
- Request size limits
- Timeouts configured
- Access logs for monitoring
- Error logs for debugging

### Database Production Configuration

#### PostgreSQL Performance Tuning

Edit PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Recommended settings for 8GB RAM server:

```conf
# Memory settings
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# Planner settings
random_page_cost = 1.1  # For SSDs
effective_io_concurrency = 200  # For SSDs

# Connection settings
max_connections = 100

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000  # Log queries > 1s
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Database Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mi-ai-coding.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/mi-ai-coding"
DB_NAME="mi_ai_coding"
DB_USER="mi_user"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).dump"

# Perform backup
pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_FILE"

# Compress old backups
find "$BACKUP_DIR" -name "*.dump" -mtime +1 -exec gzip {} \;

# Delete old backups
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-mi-ai-coding.sh
```

Schedule with cron:
```bash
sudo crontab -e
```

Add daily backup at 2 AM:
```cron
0 2 * * * /usr/local/bin/backup-mi-ai-coding.sh >> /var/log/mi-ai-coding-backup.log 2>&1
```

### Monitoring and Logging

#### Install Monitoring Tools

```bash
# Install htop for process monitoring
sudo apt-get install -y htop

# Install netdata for system monitoring (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

#### Configure Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/mi-ai-coding
```

```
/home/master/projects/mi-ai-coding/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 master master
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Set Up Application Logging

Create logs directory:
```bash
mkdir -p /home/master/projects/mi-ai-coding/logs
```

PM2 automatically logs to:
- `/home/master/.pm2/logs/mi-ai-coding-error.log`
- `/home/master/.pm2/logs/mi-ai-coding-out.log`

Or custom logs (if configured in ecosystem.config.js):
- `./logs/pm2-error.log`
- `./logs/pm2-out.log`
- `./logs/pm2-combined.log`

### Health Checks and Uptime Monitoring

#### Create Health Check Endpoint

File: `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 });
  }
}
```

#### Set Up External Monitoring

Use services like:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom**: https://pingdom.com
- **StatusCake**: https://statuscake.com

Configure to check:
- `https://yourdomain.com/api/health` every 5 minutes
- Alert via email/SMS if down

### Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

echo "Starting deployment..."

# Navigate to project directory
cd /home/master/projects/mi-ai-coding

# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Restart PM2
pm2 restart mi-ai-coding

# Check status
pm2 status

echo "Deployment completed!"
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

### Rollback Strategy

```bash
# List recent git commits
git log --oneline -10

# Rollback to specific commit
git checkout <commit-hash>

# Reinstall dependencies and rebuild
npm ci
npm run build

# Restart application
pm2 restart mi-ai-coding

# Or rollback to previous commit
git reset --hard HEAD~1
```

### Security Hardening

#### SSH Configuration

```bash
sudo nano /etc/ssh/sshd_config
```

```conf
# Disable root login
PermitRootLogin no

# Use SSH keys only
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Change default port (optional)
Port 2222
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

#### Install Fail2ban

```bash
sudo apt-get install -y fail2ban

# Configure Fail2ban
sudo nano /etc/fail2ban/jail.local
```

```conf
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

Start Fail2ban:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### Automatic Security Updates

```bash
sudo apt-get install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Troubleshooting

### Database Connection Issues

#### Error: "Connection refused" or "Database does not exist"

**Symptoms**:
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions**:

1. Check PostgreSQL is running:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

2. Verify database exists:
```bash
sudo -u postgres psql -l | grep mi_ai_coding
```

3. Test connection manually:
```bash
psql -h localhost -U mi_user -d mi_ai_coding
```

4. Check DATABASE_URL in .env:
```env
DATABASE_URL="postgresql://mi_user:password@localhost:5432/mi_ai_coding?schema=public"
```

5. Verify PostgreSQL is listening:
```bash
sudo netstat -tulpn | grep 5432
```

#### Error: "Authentication failed"

**Symptoms**:
```
Error: P1001: password authentication failed for user "mi_user"
```

**Solutions**:

1. Verify password in .env matches PostgreSQL user
2. Reset PostgreSQL user password:
```bash
sudo -u postgres psql
ALTER USER mi_user WITH PASSWORD 'new_secure_password';
\q
```

3. Check pg_hba.conf allows password auth:
```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Ensure this line exists:
```
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

Reload PostgreSQL:
```bash
sudo systemctl reload postgresql
```

#### Error: "Prisma Client not generated"

**Symptoms**:
```
Error: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
```

**Solution**:
```bash
npx prisma generate
npm run build
```

### VNC Connection Problems

#### VNC Server Not Starting

**Symptoms**:
```
Error: X11 connection rejected because of wrong authentication
Cannot open display :98
```

**Solutions**:

1. Remove X lock files:
```bash
rm -f /tmp/.X98-lock /tmp/.X99-lock
rm -rf /tmp/.X11-unix
```

2. Kill orphaned processes:
```bash
pkill -9 Xvfb
pkill -9 x11vnc
```

3. Restart VNC servers:
```bash
./scripts/start-vnc.sh
```

#### VNC Connection Refused

**Symptoms**:
- Browser shows "Connection refused" or "WebSocket failed"
- Cannot connect via VNC client

**Solutions**:

1. Check VNC servers are running:
```bash
ps aux | grep -E 'Xvfb|x11vnc'
netstat -tulpn | grep -E '6080|6081'
```

2. Check firewall:
```bash
sudo ufw status
sudo ufw allow 6080/tcp
sudo ufw allow 6081/tcp
```

3. Check x11vnc is listening on correct interface:
```bash
netstat -tulpn | grep 6080
# Should show: 0.0.0.0:6080 (not 127.0.0.1:6080)
```

4. Restart with explicit bind address:
```bash
x11vnc -display :99 -rfbport 6080 -nopw -listen 0.0.0.0 -forever -shared &
```

#### Black Screen in VNC

**Symptoms**:
- VNC connects but shows black screen
- No window manager or terminal visible

**Solutions**:

1. Start window manager:
```bash
DISPLAY=:98 fluxbox &
DISPLAY=:99 fluxbox &
```

2. Start terminal (for display :98):
```bash
DISPLAY=:98 xterm &
```

3. Check X server is running:
```bash
DISPLAY=:98 xdpyinfo | head
```

### Port Conflicts

#### Error: "Port already in use"

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:

1. Find process using port:
```bash
lsof -ti:3000
# Or
sudo netstat -tulpn | grep :3000
```

2. Kill process:
```bash
lsof -ti:3000 | xargs kill -9
```

3. Or use different port in .env:
```env
APP_PORT=3001
```

### Build Errors

#### Error: "Module not found"

**Symptoms**:
```
Error: Cannot find module '@/lib/prisma'
```

**Solutions**:

1. Delete node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Verify path alias in tsconfig.json:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Error: "Type errors in Next.js build"

**Symptoms**:
```
Type error: Property 'X' does not exist on type 'Y'
```

**Solutions**:

1. Run TypeScript check:
```bash
npx tsc --noEmit
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

### Prisma Client Sync Issues

#### Error: "Schema out of sync"

**Symptoms**:
```
The schema.prisma file is not in sync with the database
```

**Solutions**:

1. For development (reset database):
```bash
npx prisma db push --force-reset
```

2. For production (create migration):
```bash
npx prisma migrate dev --name fix_schema
```

3. Verify schema is in sync:
```bash
npx prisma validate
```

### Application Won't Start

#### Check PM2 Logs

```bash
# View error logs
pm2 logs mi-ai-coding --err

# View all logs
pm2 logs mi-ai-coding

# View last 100 lines
pm2 logs mi-ai-coding --lines 100
```

#### Common Issues

1. **Environment variables not loaded**:
```bash
# Check PM2 environment
pm2 show mi-ai-coding | grep env

# Restart with explicit env file
pm2 restart mi-ai-coding --update-env
```

2. **Build artifacts missing**:
```bash
npm run build
pm2 restart mi-ai-coding
```

3. **Permission issues**:
```bash
# Fix file permissions
chmod -R 755 /home/master/projects/mi-ai-coding
chown -R master:master /home/master/projects/mi-ai-coding
```

### Performance Issues

#### High Memory Usage

**Solutions**:

1. Check PM2 memory limits:
```bash
pm2 show mi-ai-coding | grep memory
```

2. Adjust max memory restart in ecosystem.config.js:
```javascript
max_memory_restart: '1G'
```

3. Enable Node.js memory profiling:
```bash
NODE_OPTIONS="--max-old-space-size=2048" pm2 restart mi-ai-coding
```

#### Slow Database Queries

**Solutions**:

1. Enable query logging in Prisma:
```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

2. Analyze slow queries in PostgreSQL:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

3. Add database indexes for frequently queried fields

### Getting Help

If you encounter issues not covered here:

1. **Check logs**:
   - PM2 logs: `pm2 logs mi-ai-coding`
   - Nginx logs: `/var/log/nginx/mi-ai-coding-error.log`
   - PostgreSQL logs: `/var/log/postgresql/`

2. **Run health checks**:
   - Application: `curl http://localhost:3000/api/health`
   - Database: `npx prisma db execute --stdin <<< "SELECT 1;"`
   - VNC: `ps aux | grep -E 'Xvfb|x11vnc'`

3. **Search documentation**:
   - PROJECT.md - Architecture details
   - PROGRESS.md - Known issues
   - README.md - Feature documentation

4. **GitHub Issues**: Report bugs at repository issues page

---

## Maintenance

### Daily Tasks

```bash
# Check application status
pm2 status

# Check disk space
df -h

# Check logs for errors
pm2 logs mi-ai-coding --lines 50 --err

# Check database size
psql -U mi_user -d mi_ai_coding -c "SELECT pg_size_pretty(pg_database_size('mi_ai_coding'));"
```

### Weekly Tasks

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Restart application for memory cleanup
pm2 restart mi-ai-coding

# Vacuum database
psql -U mi_user -d mi_ai_coding -c "VACUUM ANALYZE;"

# Check SSL certificate expiration
sudo certbot certificates
```

### Monthly Tasks

```bash
# Review and analyze logs
pm2 flush  # Clear old logs

# Test backup restoration
# (restore to test database and verify)

# Update npm dependencies (test in development first)
npm outdated
npm update

# Review security updates
sudo apt-get dist-upgrade

# Review and optimize database
psql -U mi_user -d mi_ai_coding -c "REINDEX DATABASE mi_ai_coding;"
```

### Backup Verification

```bash
# Test backup integrity
pg_restore --list /var/backups/mi-ai-coding/latest.dump

# Restore to test database
createdb mi_ai_coding_test
pg_restore -d mi_ai_coding_test /var/backups/mi-ai-coding/latest.dump
```

### Security Audits

```bash
# Check for security updates
sudo apt-get update
apt list --upgradable | grep -i security

# Audit npm dependencies
npm audit
npm audit fix

# Check open ports
sudo netstat -tulpn | grep LISTEN

# Review firewall rules
sudo ufw status verbose

# Check failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20
```

---

## Additional Resources

### Documentation Files

- **README.md** - Quick start guide and features overview
- **PROJECT.md** - Complete architecture and technical documentation
- **PROGRESS.md** - Current project status and task tracking
- **CLAUDE.md** - LLM-specific development instructions
- **START-PROJECT-PROMPT.md** - Agent initialization guide

### External Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Refine Framework**: https://refine.dev/docs
- **Prisma ORM**: https://prisma.io/docs
- **Ant Design**: https://ant.design/docs
- **PostgreSQL Documentation**: https://postgresql.org/docs
- **PM2 Guide**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs
- **Let's Encrypt**: https://letsencrypt.org/docs

### Support

- **GitHub Repository**: [Your repository URL]
- **Issue Tracker**: [Your repository]/issues
- **Documentation**: [Your documentation URL]

---

## Changelog

### Version 1.0.0 (2025-10-12)

- Initial installation guide
- Complete setup instructions for Ubuntu/Debian
- Production deployment guide
- VNC configuration documentation
- Troubleshooting section
- Security hardening guide

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-12
**Maintained By**: Documentation Agent

For questions or improvements to this guide, please open an issue in the GitHub repository.
