# VNC Infrastructure Setup

## Current Status

### Installation Status
- **x11vnc**: INSTALLED (/usr/bin/x11vnc)
- **Xvfb**: INSTALLED (/usr/bin/Xvfb)
- **websockify**: INSTALLED (/usr/local/bin/websockify)
- **xclip**: INSTALLED (/usr/bin/xclip)
- **xdotool**: INSTALLED (/usr/bin/xdotool)

### VNC Servers Status
- **Display :98 (Terminal VNC)**: RUNNING
  - Port: 6081
  - Current Resolution: 1024x768
  - Target Resolution: 1920x1080 (UPGRADE NEEDED)

- **Display :99 (Playwright VNC)**: RUNNING
  - Port: 6080
  - Current Resolution: 1024x768
  - Target Resolution: 1920x1080 (UPGRADE NEEDED)

### Websockify Status
- **Port 6080**: LISTENING (2 processes running - duplicate, cleanup recommended)
- **Port 6081**: LISTENING (2 processes running - duplicate, cleanup recommended)

### Web Access URLs
- **Playwright Display (Display :99)**: http://localhost:6080
- **Terminal Display (Display :98)**: http://localhost:6081

## Resolution Upgrade Required

The VNC servers are currently running at 1024x768 resolution but need to be upgraded to 1920x1080 as specified in the project requirements.

### Upgrade Instructions

1. **Run the resolution upgrade script** (requires root access):
   ```bash
   sudo /home/master/projects/mi-ai-coding/scripts/restart-vnc-1920x1080.sh
   ```

   This script will:
   - Stop existing VNC servers
   - Restart Xvfb displays with 1920x1080 resolution
   - Restart x11vnc servers
   - Clean up duplicate websockify processes
   - Verify the new resolution

2. **Verify the upgrade**:
   ```bash
   /home/master/projects/mi-ai-coding/scripts/check-vnc-status.sh
   ```

## Available Scripts

### 1. check-vnc-status.sh
**Location**: `/home/master/projects/mi-ai-coding/scripts/check-vnc-status.sh`

Comprehensive status check that verifies:
- VNC tools installation
- Running processes
- Port accessibility
- Display resolutions
- Overall health status

**Usage**:
```bash
./scripts/check-vnc-status.sh
```

### 2. restart-vnc-1920x1080.sh
**Location**: `/home/master/projects/mi-ai-coding/scripts/restart-vnc-1920x1080.sh`

Resolution upgrade script that restarts VNC servers with 1920x1080 resolution.

**Usage** (requires root):
```bash
sudo ./scripts/restart-vnc-1920x1080.sh
```

### 3. start-vnc.sh
**Location**: `/home/master/projects/mi-ai-coding/scripts/start-vnc.sh`

Main VNC startup script (updated for 1920x1080 resolution).

**Usage**:
```bash
./scripts/start-vnc.sh
```

## Testing VNC Connectivity

### Test X11 Connection to Display :99
```bash
export DISPLAY=:99
xwininfo -root
```

Expected output should show:
- Width: 1024 (currently) → 1920 (after upgrade)
- Height: 768 (currently) → 1080 (after upgrade)

### Test X11 Connection to Display :98
```bash
export DISPLAY=:98
xwininfo -root
```

### Test Playwright on Display :99
```bash
DISPLAY=:99 npx playwright test
```

This is CRITICAL - all Playwright tests MUST run on DISPLAY=:99 to be visible in the VNC viewer.

## Port Configuration

| Service | Display | VNC Port | Web Port | Purpose |
|---------|---------|----------|----------|---------|
| Terminal VNC | :98 | 5901 | 6081 | Terminal access (xterm, bash) |
| Playwright VNC | :99 | 5900 | 6080 | Browser automation & E2E testing |

## Known Issues

1. **Duplicate websockify processes**: Currently 2 processes per port (total 4). Recommend cleanup during next restart.
2. **Resolution upgrade pending**: VNC servers running at 1024x768, need upgrade to 1920x1080.
3. **noVNC directory permissions**: /root/noVNC not accessible to 'master' user (running under root).

## Process Architecture

```
Xvfb :98 (1024x768x24) → x11vnc (port 5901) → websockify (port 6081) → Browser
Xvfb :99 (1024x768x24) → x11vnc (port 5900) → websockify (port 6080) → Browser
```

After upgrade:
```
Xvfb :98 (1920x1080x24) → x11vnc (port 5901) → websockify (port 6081) → Browser
Xvfb :99 (1920x1080x24) → x11vnc (port 5900) → websockify (port 6080) → Browser
```

## Verification Commands

### Check running VNC processes
```bash
ps aux | grep -E "(Xvfb|x11vnc|websockify)" | grep -v grep
```

### Check port status
```bash
ss -tlnp | grep -E ':6080|:6081'
# or
netstat -tlnp | grep -E ':6080|:6081'
```

### Check display resolution
```bash
DISPLAY=:98 xdpyinfo | grep dimensions
DISPLAY=:99 xdpyinfo | grep dimensions
```

## Environment Variables

The following environment variables are configured in `.env`:

```env
TERMINAL_VNC_PORT=6081
PLAYWRIGHT_VNC_PORT=6080
VNC_DISPLAY_98=":98"
VNC_DISPLAY_99=":99"
```

## Security Notes

- VNC servers currently listen on 0.0.0.0 (all interfaces)
- Consider restricting to localhost in production
- No password authentication is configured (development only)
- Websockify provides the web interface layer

## Next Steps

1. **Immediate**: Run `sudo ./scripts/restart-vnc-1920x1080.sh` to upgrade resolution
2. **Monitoring**: Verify VNC accessibility from web browser at http://localhost:6080 and http://localhost:6081
3. **Testing**: Run Playwright tests with `DISPLAY=:99` to verify visual testing works
4. **Cleanup**: Remove duplicate websockify processes after restart
5. **Documentation**: Update PROGRESS.md with VNC setup completion status

## Support

For issues:
1. Check status: `./scripts/check-vnc-status.sh`
2. Review process list: `ps aux | grep vnc`
3. Check logs: `journalctl -u x11vnc` (if configured as service)
4. Verify ports: `netstat -tulpn | grep -E '6080|6081'`
