# Quick Start Guide

Get MI AI Coding Platform up and running in **10 minutes**.

## One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/amirtafreshi/mi-ai-coding/main/scripts/install-all.sh | sudo bash
```

Or manual:

```bash
git clone https://github.com/amirtafreshi/mi-ai-coding.git
cd mi-ai-coding
sudo ./scripts/install-all.sh
```

## What Gets Installed

- ✅ Node.js 20.x
- ✅ PostgreSQL 14+
- ✅ VNC servers (x11vnc, Xvfb, fluxbox)
- ✅ All dependencies
- ✅ Database setup
- ✅ Application configured

## After Installation

1. **Start the application:**

```bash
cd mi-ai-coding
npm run dev
```

2. **Access the platform:**
   - Main App: http://localhost:3000
   - Terminal VNC: http://localhost:6081
   - Playwright VNC: http://localhost:6080

3. **Login:**
   - Email: `admin@example.com`
   - Password: `admin123`

## For Production

1. **Build and start with PM2:**

```bash
npm run build
pm2 start npm --name mi-ai-coding -- start
pm2 save
```

2. **Configure domain and SSL:**

```bash
# Update .env with your domain
nano .env
# Set: NEXTAUTH_URL="https://your-domain.com"

# Configure Nginx and SSL
sudo ./scripts/setup-domain-ssl.sh
```

## Troubleshooting

**Issue: Database connection failed**
```bash
sudo systemctl start postgresql
```

**Issue: VNC not working**
```bash
./scripts/start-vnc.sh
```

**Issue: Port 3000 in use**
```bash
sudo lsof -i :3000
# Change port in .env: APP_PORT=3001
```

## Next Steps

- Read [INSTALLATION.md](INSTALLATION.md) for detailed guide
- Configure domain: [DOMAIN-SETUP.md](DOMAIN-SETUP.md)
- Review [README.md](README.md) for features
- Check [PROJECT.md](PROJECT.md) for architecture

---

**Need help?** Open an issue on [GitHub](https://github.com/amirtafreshi/mi-ai-coding/issues)
