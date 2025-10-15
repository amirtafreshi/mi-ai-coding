# Domain Setup Guide: code.miglobal.com.mx

This guide explains how to configure the `code.miglobal.com.mx` domain with SSL for the MI AI Coding Platform.

## Prerequisites

1. DNS record for `code.miglobal.com.mx` pointing to your server IP
2. Wildcard SSL certificate for `*.miglobal.com.mx` (already installed on server)
3. Nginx installed and configured
4. Ports 80 and 443 open in firewall

## Setup Steps

### Option 1: Automatic Setup (Recommended)

Run the automated setup script with sudo:

```bash
sudo /home/master/projects/mi-ai-coding/scripts/setup-domain-ssl.sh
```

This script will:
- ✅ Check for existing SSL certificates
- ✅ Create Nginx configuration for code.miglobal.com.mx
- ✅ Configure SSL with wildcard certificate
- ✅ Set up reverse proxy for Next.js app (port 3000)
- ✅ Configure WebSocket proxies for VNC viewers (ports 6080, 6081)
- ✅ Enable the site and reload Nginx

### Option 2: Manual Setup

If you prefer to configure manually, follow these steps:

#### 1. Check SSL Certificate

```bash
sudo ls -la /etc/letsencrypt/live/
```

Look for:
- `miglobal.com.mx/` (wildcard certificate - preferred)
- OR any subdomain certificate you want to use

#### 2. Create Nginx Configuration

The configuration file has been created at:
```
/etc/nginx/sites-available/code.miglobal.com.mx
```

#### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/code.miglobal.com.mx /etc/nginx/sites-enabled/
```

#### 4. Test Configuration

```bash
sudo nginx -t
```

#### 5. Reload Nginx

```bash
sudo systemctl reload nginx
```

## Configuration Details

### Nginx Setup

The Nginx configuration includes:

**Main Application:**
- HTTPS: `https://code.miglobal.com.mx/`
- Proxies to: `http://localhost:3000` (Next.js app)

**VNC WebSocket Endpoints:**
- Terminal VNC: `https://code.miglobal.com.mx/terminal-vnc/`
  - Proxies to: `ws://localhost:6081`
- Playwright VNC: `https://code.miglobal.com.mx/playwright-vnc/`
  - Proxies to: `ws://localhost:6080`

**Security Features:**
- HTTP to HTTPS redirect
- HSTS (Strict-Transport-Security)
- X-Frame-Options, X-Content-Type-Options headers
- 100MB file upload limit

### Environment Variables

After setup, update your `.env` file:

```bash
# In /home/master/projects/mi-ai-coding/.env
NEXTAUTH_URL="https://code.miglobal.com.mx"
```

Then restart the Next.js application:

```bash
cd /home/master/projects/mi-ai-coding
npm run dev  # or pm2 restart if using pm2
```

## Verification

### 1. Check Nginx Status

```bash
sudo systemctl status nginx
```

### 2. Check if Site is Enabled

```bash
ls -la /etc/nginx/sites-enabled/ | grep code.miglobal
```

### 3. Test SSL Certificate

```bash
curl -I https://code.miglobal.com.mx
```

### 4. Test in Browser

Open: https://code.miglobal.com.mx

You should see:
- ✅ Green padlock (valid SSL)
- ✅ MI AI Coding Platform login page

### 5. Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/code_miglobal_access.log

# Error logs
sudo tail -f /var/log/nginx/code_miglobal_error.log
```

## Troubleshooting

### Issue: SSL Certificate Error

**Problem:** Browser shows SSL certificate warning

**Solution:**
1. Check certificate path in Nginx config:
   ```bash
   sudo cat /etc/nginx/sites-available/code.miglobal.com.mx | grep ssl_certificate
   ```
2. Verify certificate exists:
   ```bash
   sudo ls -la /etc/letsencrypt/live/miglobal.com.mx/
   ```

### Issue: 502 Bad Gateway

**Problem:** Nginx shows 502 error

**Solution:**
1. Check if Next.js app is running:
   ```bash
   lsof -i :3000
   ```
2. Check Next.js logs
3. Restart the application

### Issue: WebSocket Connection Failed

**Problem:** VNC viewers don't connect

**Solution:**
1. Check VNC servers are running:
   ```bash
   ps aux | grep x11vnc
   netstat -tulpn | grep -E '6080|6081'
   ```
2. Check Nginx WebSocket configuration
3. Check browser console for errors

### Issue: Port 443 Already in Use

**Problem:** Nginx won't start due to port conflict

**Solution:**
1. Check what's using port 443:
   ```bash
   sudo lsof -i :443
   ```
2. If another Nginx instance, stop it first
3. If Apache, either stop Apache or change ports

## DNS Configuration

Ensure your DNS has the following A record:

```
Type: A
Host: code
Domain: miglobal.com.mx
Value: <YOUR_SERVER_IP>
TTL: 3600
```

Check DNS propagation:
```bash
dig code.miglobal.com.mx
nslookup code.miglobal.com.mx
```

## SSL Certificate Renewal

The wildcard certificate should auto-renew via certbot. To manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

Check certificate expiration:
```bash
sudo certbot certificates
```

## Firewall Rules

Ensure UFW allows HTTP and HTTPS:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## Additional Configuration

### Enable HTTP/2

Already enabled in the Nginx config:
```nginx
listen 443 ssl http2;
```

### Add WWW Redirect (Optional)

If you want www.code.miglobal.com.mx to redirect:

Add to Nginx config:
```nginx
server {
    listen 443 ssl http2;
    server_name www.code.miglobal.com.mx;
    return 301 https://code.miglobal.com.mx$request_uri;
}
```

## Production Deployment Checklist

- [ ] DNS configured and propagated
- [ ] SSL certificate installed and valid
- [ ] Nginx configuration tested
- [ ] Next.js app running on port 3000
- [ ] VNC servers running on ports 6080/6081
- [ ] Firewall rules configured
- [ ] .env updated with production domain
- [ ] Database accessible
- [ ] Tested login and core features
- [ ] Verified VNC viewers work via HTTPS

## Support

For issues or questions:
1. Check Nginx error logs
2. Check Next.js application logs
3. Verify all services are running
4. Review this guide's troubleshooting section

## Related Files

- Nginx config: `/etc/nginx/sites-available/code.miglobal.com.mx`
- Setup script: `/home/master/projects/mi-ai-coding/scripts/setup-domain-ssl.sh`
- Environment: `/home/master/projects/mi-ai-coding/.env`
- VNC scripts: `/home/master/projects/mi-ai-coding/scripts/start-vnc.sh`
