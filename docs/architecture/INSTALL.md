# MI AI Coding Platform - Installation Guide

## Quick Access

🌐 **Public URL**: http://45.22.197.163:3000

The application is currently running and accessible via the public IP address.

## System Requirements

- **Node.js**: 18+ (20+ recommended)
- **PostgreSQL**: 14+ (Required for database operations)
- **Operating System**: Linux (Ubuntu/Debian)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB minimum

## Installation Steps

### 1. PostgreSQL Setup (REQUIRED)

The application requires PostgreSQL to function. Run these commands:

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 2. Create Database and User

```bash
# Switch to postgres user and create database
sudo -u postgres psql << 'EOF'
CREATE DATABASE mi_ai_coding;
CREATE USER mi_user WITH ENCRYPTED PASSWORD 'SecurePass123!';
GRANT ALL PRIVILEGES ON DATABASE mi_ai_coding TO mi_user;
ALTER DATABASE mi_ai_coding OWNER TO mi_user;
\q
EOF
```

### 3. Configure Environment Variables

```bash
cd /home/master/projects/mi-ai-coding

# Edit .env file
nano .env

# Update DATABASE_URL to:
DATABASE_URL="postgresql://mi_user:SecurePass123!@localhost:5432/mi_ai_coding?schema=public"
```

### 4. Initialize Database Schema

```bash
# Generate Prisma client (already done)
npx prisma generate

# Push schema to database
npx prisma db push

# Verify database tables
npx prisma studio
# This opens a GUI at http://localhost:5555
```

### 5. Restart Development Server

```bash
# The server is already running in the background
# If you need to restart:
pkill -f "next dev"
npm run dev
```

## Optional: VNC Dependencies

For full VNC functionality, install these packages:

```bash
sudo apt-get install -y x11vnc xvfb xclip xdotool
```

### Start VNC Servers

```bash
cd /home/master/projects/mi-ai-coding
./scripts/start-vnc.sh
```

## Optional: Firewall Configuration

If you have a firewall enabled, allow port 3000:

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

## Verification Steps

### 1. Check Application Access

- **Landing Page**: http://45.22.197.163:3000
- **Dashboard**: http://45.22.197.163:3000/dashboard

### 2. Test Database Connection

```bash
# Open Prisma Studio
npx prisma studio

# Or test with psql
psql -h localhost -U mi_user -d mi_ai_coding
```

### 3. Check Running Services

```bash
# Check Next.js dev server
ps aux | grep "next dev"

# Check PostgreSQL
sudo systemctl status postgresql

# Check VNC servers (if installed)
ps aux | grep vnc
```

## Current Implementation Status

### ✅ Completed Features

1. **Core Layout & UI**
   - Responsive dashboard with resizable panels
   - Header with user menu
   - Collapsible sidebar navigation
   - Panel layout persistence (localStorage)

2. **File Management System**
   - File explorer with tree view
   - Create/read/update/delete operations
   - API routes: `/api/files/*`
   - Prisma integration (pending database setup)

3. **Monaco Code Editor**
   - Full-featured code editor (VS Code engine)
   - Syntax highlighting for 15+ languages
   - Multi-file tabs
   - Auto-save on Ctrl+S
   - Unsaved changes indicator

4. **VNC Integration (Partial)**
   - VNC viewer components for displays :98 and :99
   - Clipboard copy/paste API routes
   - Requires VNC servers to be running

5. **Activity Log System**
   - Real-time activity stream
   - Filter by agent and severity level
   - Color-coded log levels
   - API routes: `/api/activity`

### ⏳ Pending Features (Require Database)

- User authentication with NextAuth
- File persistence to database
- Activity log storage and retrieval
- Session management
- VNC configuration storage

### 🎯 Next Steps After PostgreSQL Setup

1. Run `npx prisma db push` to create tables
2. Test file operations in the UI
3. Create initial user account
4. Test activity logging
5. Configure VNC servers (optional)
6. Set up WebSocket for real-time updates

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U mi_user -d mi_ai_coding

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Restart server
npm run dev
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

## Production Deployment (Future)

For production deployment:

1. Run `npm run build` to create production build
2. Use `npm start` instead of `npm run dev`
3. Set `NODE_ENV=production` in environment
4. Use proper PostgreSQL credentials
5. Enable SSL for PostgreSQL connections
6. Configure reverse proxy (Nginx)
7. Set up PM2 or systemd for process management

## Support

For issues or questions:
- Check `PROJECT.md` for architecture details
- Review `PROGRESS.md` for current status
- See `CLAUDE.md` for development guidance
- Check agent documentation in `agents/` directory

---

**Installation Date**: 2025-10-04
**Version**: 1.0.0
**Status**: Development - Database setup required
