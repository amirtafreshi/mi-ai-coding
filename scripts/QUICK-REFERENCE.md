# MI AI Coding Platform - Scripts Quick Reference

One-page reference for all essential script commands.

---

## Initial Setup

### Development
```bash
./scripts/setup.sh              # Complete dev setup with checks
./scripts/start-vnc.sh          # Start VNC servers
./scripts/health-check.sh       # Verify system health
npm run dev                     # Start development server
```

### Production (Run as root)
```bash
sudo ./scripts/production-setup.sh  # Full production setup
cd /opt/mi-ai-coding
git clone <repo> .
./scripts/deploy.sh --production
```

---

## Daily Operations

### VNC Management
```bash
./scripts/start-vnc.sh          # Start VNC servers
./scripts/start-vnc.sh --status # Check VNC status
./scripts/start-vnc.sh --restart # Restart VNC servers
./scripts/start-vnc.sh --stop   # Stop all VNC servers
```

### Health Monitoring
```bash
./scripts/health-check.sh       # Full system health check
```

### Application
```bash
npm run dev                     # Development mode
npm run build                   # Build for production
npm start                       # Production mode
npm test                        # Run tests
DISPLAY=:99 npm test           # Tests on VNC (visible)
```

---

## Production Management

### PM2 Process Manager
```bash
pm2 start npm --name mi-ai-coding -- start  # Start app
pm2 status                                   # Check status
pm2 logs mi-ai-coding                        # View logs
pm2 restart mi-ai-coding                     # Restart app
pm2 stop mi-ai-coding                        # Stop app
pm2 save                                     # Save config
```

### Nginx
```bash
sudo nginx -t                   # Test configuration
sudo systemctl reload nginx     # Reload config
sudo systemctl restart nginx    # Restart Nginx
sudo systemctl status nginx     # Check status
tail -f /var/log/nginx/mi-ai-coding-access.log  # Access logs
tail -f /var/log/nginx/mi-ai-coding-error.log   # Error logs
```

### Firewall (UFW)
```bash
sudo ufw status numbered        # Show all rules
sudo ufw allow 8080/tcp        # Allow port
sudo ufw delete 5              # Delete rule
sudo ufw enable                # Enable firewall
sudo ufw disable               # Disable firewall
```

### Fail2ban
```bash
sudo fail2ban-client status                 # Overall status
sudo fail2ban-client status sshd           # SSH jail status
sudo fail2ban-client unban 192.168.1.100   # Unban IP
sudo systemctl restart fail2ban            # Restart service
```

### SSL Certificates
```bash
sudo certbot certificates              # List certificates
sudo certbot renew --dry-run          # Test renewal
sudo certbot renew                    # Renew now
sudo certbot delete                   # Remove certificate
sudo certbot --nginx -d example.com   # New certificate
```

---

## Database Operations

### PostgreSQL
```bash
sudo systemctl status postgresql          # Check status
sudo systemctl start postgresql           # Start service
sudo systemctl restart postgresql         # Restart service
sudo -u postgres psql                     # Open psql
sudo -u postgres psql -d mi_ai_coding    # Connect to DB
```

### Prisma
```bash
npx prisma generate             # Generate client
npx prisma db push              # Push schema
npx prisma migrate dev          # Create migration
npx prisma studio               # Open GUI
npx prisma db seed              # Seed database
```

---

## Backup and Restore

### Manual Backup
```bash
sudo /usr/local/bin/mi-ai-coding-backup.sh     # Run backup
ls -lh /var/backups/mi-ai-coding/              # List backups
```

### Restore Database
```bash
sudo -u postgres psql mi_ai_coding < /var/backups/mi-ai-coding/20251012-020000/database.sql
```

### Restore Application Files
```bash
tar -xzf /var/backups/mi-ai-coding/20251012-020000/app-files.tar.gz -C /opt/mi-ai-coding
```

---

## Monitoring and Logs

### Application Logs
```bash
# Development
tail -f .next/server.log

# Production
pm2 logs mi-ai-coding
tail -f /var/log/mi-ai-coding/error.log
tail -f /var/log/mi-ai-coding/monitor.log
```

### System Logs
```bash
journalctl -u mi-ai-coding -f              # Systemd service logs
journalctl -p 3 --since "1 hour ago"       # Critical errors
tail -f /var/log/syslog                    # System log
```

### VNC Logs
```bash
tail -f /tmp/x11vnc-:98.log               # Terminal VNC
tail -f /tmp/x11vnc-:99.log               # Playwright VNC
```

---

## Troubleshooting

### Check Services
```bash
systemctl status postgresql
systemctl status nginx
systemctl status fail2ban
systemctl status mi-ai-coding
ps aux | grep -E 'node|Xvfb|x11vnc'
```

### Check Ports
```bash
netstat -tulpn | grep -E '3000|3001|6080|6081|5432|80|443'
lsof -i:3000                              # Specific port
lsof -ti:3000 | xargs kill -9             # Kill process on port
```

### Check Resources
```bash
df -h                                     # Disk space
free -h                                   # Memory
top                                       # CPU and processes
htop                                      # Interactive process viewer
```

### Network Diagnostics
```bash
ping google.com                           # Test connectivity
dig example.com                           # DNS lookup
curl -I http://localhost:3000            # Test app endpoint
nc -zv localhost 3000                    # Test port
```

### Restart Everything
```bash
./scripts/start-vnc.sh --restart
sudo systemctl restart postgresql
sudo systemctl restart nginx
pm2 restart mi-ai-coding
```

---

## VNC Connections

### Local Access
```
Terminal:   ws://localhost:6081   (Display :98)
Playwright: ws://localhost:6080   (Display :99)
```

### External Access
```
Terminal:   ws://YOUR-SERVER-IP:6081
Playwright: ws://YOUR-SERVER-IP:6080
```

### Testing VNC
```bash
# Open terminal on VNC display
DISPLAY=:98 xterm &

# Run Playwright tests on VNC
DISPLAY=:99 npx playwright test

# Take screenshot on VNC
DISPLAY=:99 import -window root screenshot.png
```

---

## Environment Variables

### Required in .env
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/mi_ai_coding?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"
APP_PORT=3000
NODE_ENV="development"  # or "production"
WS_PORT=3001
```

---

## Common Port Numbers

- **3000** - Next.js Application
- **3001** - WebSocket Server
- **5432** - PostgreSQL Database
- **6080** - VNC Playwright (Display :99)
- **6081** - VNC Terminal (Display :98)
- **80** - HTTP (Nginx)
- **443** - HTTPS (Nginx)
- **22** - SSH

---

## File Locations

### Development
```
/home/master/projects/mi-ai-coding/          # Project root
/tmp/mi-ai-coding-setup-*.log                # Setup logs
/tmp/x11vnc-*.log                            # VNC logs
```

### Production
```
/opt/mi-ai-coding/                           # Application
/etc/nginx/sites-available/mi-ai-coding      # Nginx config
/var/log/mi-ai-coding/                       # App logs
/var/log/nginx/mi-ai-coding-*.log            # Nginx logs
/var/backups/mi-ai-coding/                   # Backups
/usr/local/bin/mi-ai-coding-*.sh             # Automation scripts
```

---

## Emergency Procedures

### Application Down
```bash
./scripts/health-check.sh                    # Diagnose
pm2 logs mi-ai-coding --lines 50            # Check logs
pm2 restart mi-ai-coding                     # Restart
```

### Database Connection Failed
```bash
sudo systemctl status postgresql             # Check status
sudo systemctl restart postgresql            # Restart
psql -h localhost -U youruser -d mi_ai_coding  # Test connection
```

### Disk Full
```bash
df -h                                        # Check space
du -sh /* | sort -h                         # Find large dirs
find /var/log -type f -name "*.log" -mtime +30 -delete  # Clean old logs
docker system prune -a                       # Clean Docker (if used)
```

### SSL Certificate Expired
```bash
sudo certbot certificates                    # Check expiry
sudo certbot renew --force-renewal          # Force renewal
sudo systemctl reload nginx                  # Reload Nginx
```

### Locked Out (SSH)
1. Use server console/VNC
2. Check `/var/log/auth.log`
3. Unban IP: `sudo fail2ban-client unban YOUR_IP`
4. Or disable Fail2ban: `sudo systemctl stop fail2ban`

### High CPU/Memory
```bash
top                                          # Find culprit
pm2 logs mi-ai-coding                       # Check for issues
pm2 restart mi-ai-coding                    # Restart app
sudo systemctl restart postgresql            # Restart DB
```

---

## Quick Testing

### Test Application
```bash
curl http://localhost:3000                   # Test endpoint
curl -I http://localhost:3000/health        # Health check
```

### Test Database
```bash
sudo -u postgres psql -d mi_ai_coding -c "SELECT 1;"
```

### Test VNC
```bash
./scripts/start-vnc.sh --status
ps aux | grep -E 'Xvfb|x11vnc'
netstat -tulpn | grep -E '6080|6081'
```

### Test Firewall
```bash
sudo ufw status
sudo ufw status numbered
```

---

## Getting Help

```bash
./scripts/setup.sh --help              # Setup help
./scripts/start-vnc.sh --help          # VNC help
npm run --help                         # NPM scripts
pm2 --help                             # PM2 commands
```

### Documentation
- **Scripts:** `/home/master/projects/mi-ai-coding/scripts/README.md`
- **Project:** `/home/master/projects/mi-ai-coding/PROJECT.md`
- **Development:** `/home/master/projects/mi-ai-coding/CLAUDE.md`
- **Progress:** `/home/master/projects/mi-ai-coding/PROGRESS.md`

---

## Script Versions

- **setup.sh** - v2.0 (Enhanced)
- **start-vnc.sh** - v2.0 (Enhanced)
- **production-setup.sh** - v1.0 (New)
- **health-check.sh** - v1.0 (New)
- **deploy.sh** - v1.0 (Existing)

---

*Last Updated: 2025-10-12*
*Keep this card handy for quick reference during development and operations!*
