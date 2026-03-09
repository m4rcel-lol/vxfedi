# Deployment Guide for vxfedi

This guide provides detailed instructions for deploying vxfedi in various environments.

## Table of Contents

- [Docker Compose Deployment (Recommended)](#docker-compose-deployment-recommended)
- [Docker Standalone](#docker-standalone)
- [Node.js Direct Deployment](#nodejs-direct-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Environment Configuration](#environment-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Docker Compose Deployment (Recommended)

This is the recommended deployment method for production environments.

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- A server with at least 512MB RAM
- A domain name (e.g., `vx.yourdomain.tld`)

### Step-by-Step Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/m4rcel-lol/vxfedi.git
   cd vxfedi
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # or use your preferred editor
   ```

   Update the following variables:
   ```env
   BASE_URL=https://vx.yourdomain.tld
   PORT=3000
   NODE_ENV=production
   ```

3. **Build and start the container**
   ```bash
   docker-compose up -d
   ```

4. **Verify the deployment**
   ```bash
   docker-compose logs -f
   # You should see: "🚀 vxfedi server running on port 3000"

   # Test health endpoint
   curl http://localhost:3000/health
   ```

5. **Configure your reverse proxy** (see [Reverse Proxy Setup](#reverse-proxy-setup))

### Updating

```bash
cd vxfedi
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Docker Standalone

If you prefer not to use Docker Compose:

```bash
# Build image
docker build -t vxfedi .

# Run container
docker run -d \
  --name vxfedi \
  --restart unless-stopped \
  -p 3000:3000 \
  -e BASE_URL=https://vx.yourdomain.tld \
  -e NODE_ENV=production \
  vxfedi
```

## Node.js Direct Deployment

For environments where Docker is not available:

### Prerequisites

- Node.js 18+
- npm or yarn
- Process manager (PM2 recommended)

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/m4rcel-lol/vxfedi.git
   cd vxfedi
   npm install --production
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Install PM2 (optional but recommended)**
   ```bash
   npm install -g pm2
   ```

4. **Start with PM2**
   ```bash
   pm2 start src/index.js --name vxfedi
   pm2 save
   pm2 startup  # Follow the instructions
   ```

   Or start directly:
   ```bash
   npm start
   ```

### Updating

```bash
cd vxfedi
git pull
npm install --production
pm2 restart vxfedi  # or restart your process
```

## Reverse Proxy Setup

vxfedi should run behind a reverse proxy for SSL/TLS termination and security.

### Caddy (Recommended)

Caddy is the recommended reverse proxy for vxfedi due to its automatic HTTPS support, simple configuration, and modern defaults.

**Installation:**

```bash
# Debian/Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Or using Docker
docker pull caddy:latest
```

**Configuration:**

Create `/etc/caddy/Caddyfile` (or use the included `Caddyfile.example`):

```caddy
vx.yourdomain.tld {
    # Reverse proxy to vxfedi application
    reverse_proxy localhost:3000 {
        # Header forwarding
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
        header_up X-Forwarded-Port {server_port}

        # WebSocket support
        header_up Upgrade {http.request.header.Upgrade}
        header_up Connection {http.request.header.Connection}

        # Timeouts
        transport http {
            dial_timeout 60s
            response_header_timeout 60s
            read_timeout 60s
        }
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer-when-downgrade"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        -Server
    }

    # Logging
    log {
        output file /var/log/caddy/vxfedi-access.log
        format console
    }

    # Request size limit
    request_body {
        max_size 1MB
    }

    # Health check endpoint
    handle /health {
        reverse_proxy localhost:3000
        log {
            output discard
        }
    }

    # Deny access to hidden files (files starting with .)
    @hidden {
        path_regexp hidden /\..+
    }
    handle @hidden {
        respond 403
    }
}
```

**Start Caddy:**

```bash
# Using systemd (recommended)
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy

# Or run directly
caddy run --config /etc/caddy/Caddyfile

# Validate configuration
caddy validate --config /etc/caddy/Caddyfile

# Reload after configuration changes
sudo systemctl reload caddy
```

**Key Benefits:**
- ✅ Automatic HTTPS with Let's Encrypt (no manual certificate setup!)
- ✅ Automatic certificate renewal
- ✅ HTTP to HTTPS redirect (automatic)
- ✅ Modern TLS configuration by default
- ✅ Simple, readable configuration
- ✅ Built-in rate limiting and security features

### Nginx

If you prefer Nginx, create `/etc/nginx/sites-available/vxfedi`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vx.yourdomain.tld;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vx.yourdomain.tld;

    # SSL configuration (use Certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/vx.yourdomain.tld/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vx.yourdomain.tld/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/vxfedi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Setup SSL with Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d vx.yourdomain.tld
```

### Apache

Enable required modules:
```bash
sudo a2enmod proxy proxy_http ssl headers
```

Create `/etc/apache2/sites-available/vxfedi.conf`:

```apache
<VirtualHost *:80>
    ServerName vx.yourdomain.tld
    Redirect permanent / https://vx.yourdomain.tld/
</VirtualHost>

<VirtualHost *:443>
    ServerName vx.yourdomain.tld

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/vx.yourdomain.tld/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/vx.yourdomain.tld/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite vxfedi
sudo systemctl reload apache2
```

## Environment Configuration

### Essential Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BASE_URL` | Yes | `http://localhost:3000` | Public URL of your vxfedi instance |
| `PORT` | No | `3000` | Port to listen on |
| `NODE_ENV` | No | `production` | Node environment |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USER_AGENT` | `vxfedi/1.0` | User agent for API requests |
| `REQUEST_TIMEOUT` | `10000` | Timeout for Fediverse API requests (ms) |
| `CACHE_MAX_AGE` | `3600` | Cache duration for responses (seconds) |

### Example Production Configuration

```env
# Production settings
NODE_ENV=production
PORT=3000
BASE_URL=https://vx.yourdomain.tld

# API settings
USER_AGENT=vxfedi/1.0 (https://vx.yourdomain.tld)
REQUEST_TIMEOUT=15000

# Cache settings
CACHE_MAX_AGE=7200
```

## SSL/TLS Setup with Let's Encrypt

### Using Caddy (Recommended - Automatic HTTPS)

Caddy automatically obtains and renews SSL certificates - **no extra configuration needed!** Just ensure:

1. Your domain points to your server
2. Ports 80 and 443 are open
3. Caddy is running with your domain configured

Caddy will automatically:
- Request Let's Encrypt certificates on first run
- Renew certificates before expiry
- Redirect HTTP to HTTPS
- Configure modern TLS settings

That's it! No manual certificate management required.

### Using Certbot (for Nginx/Apache)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d vx.yourdomain.tld

# Auto-renewal is configured automatically
# Test renewal with:
sudo certbot renew --dry-run
```

## Monitoring and Maintenance

### Health Checks

vxfedi provides a health endpoint at `/health`:

```bash
curl https://vx.yourdomain.tld/health
# Response: {"status":"ok","service":"vxfedi"}
```

### Viewing Logs

**Docker Compose:**
```bash
docker-compose logs -f
docker-compose logs -f --tail=100  # Last 100 lines
```

**Docker Standalone:**
```bash
docker logs -f vxfedi
```

**PM2:**
```bash
pm2 logs vxfedi
pm2 logs vxfedi --lines 100
```

### Resource Usage

**Docker:**
```bash
docker stats vxfedi
```

**PM2:**
```bash
pm2 monit
```

### Backup

vxfedi is stateless and doesn't store any data, so backups are minimal:

1. **Configuration files:**
   ```bash
   tar -czf vxfedi-config-backup.tar.gz .env docker-compose.yml
   ```

2. **Code (if customized):**
   ```bash
   tar -czf vxfedi-code-backup.tar.gz src/
   ```

### Updating Dependencies

```bash
# For Docker deployments
docker-compose pull
docker-compose up -d

# For Node.js deployments
npm update
pm2 restart vxfedi
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Verify port is not in use
sudo netstat -tulpn | grep 3000

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Can't access from outside

1. Check firewall:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

2. Verify reverse proxy is running and configured correctly

3. Check DNS settings for your domain

### Fediverse content not loading

1. Verify instance is accessible:
   ```bash
   curl https://mastodon.social/api/v1/instance
   ```

2. Check network connectivity from server

3. Increase `REQUEST_TIMEOUT` in `.env`

4. Check logs for specific errors

### Preview not showing on Discord/Slack

1. Verify `BASE_URL` is set to your public HTTPS URL
2. Test meta tags:
   ```bash
   curl -A "Discordbot" https://vx.yourdomain.tld/mastodon.social/@user/123
   ```
3. Use Discord's embed debugger or Twitter's Card Validator

## Performance Optimization

### Caching

Consider adding Redis for caching:

```yaml
# Add to docker-compose.yml
services:
  redis:
    image: redis:alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Rate Limiting

Add rate limiting in your reverse proxy to prevent abuse.

**Caddy approach:**

Rate limiting in standard Caddy requires a plugin. You can use:
1. The `caddy-ratelimit` plugin ([mholt/caddy-ratelimit](https://github.com/mholt/caddy-ratelimit))
2. Application-level rate limiting in your Node.js code
3. Use a dedicated service like Cloudflare for rate limiting

If using application-level rate limiting, consider the `express-rate-limit` package.

**Nginx with built-in rate limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=vxfedi:10m rate=10r/s;

location / {
    limit_req zone=vxfedi burst=20;
    proxy_pass http://localhost:3000;
}
```

## Security Hardening

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Run container as non-root:** (already configured in Dockerfile)

3. **Enable firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **Regular security audits:**
   ```bash
   npm audit
   docker scan vxfedi
   ```

## Support

- **Issues:** https://github.com/m4rcel-lol/vxfedi/issues
- **Discussions:** https://github.com/m4rcel-lol/vxfedi/discussions

---

For more information, see the [main README](README.md).
