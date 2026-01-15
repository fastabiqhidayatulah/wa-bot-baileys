# 🚀 Deployment & Configuration Guide

**Panduan setup production dan konfigurasi environment**

---

## 📋 Daftar Isi

1. [System Requirements](#system-requirements)
2. [Environment Setup](#environment-setup)
3. [Production Deployment](#production-deployment)
4. [Database & Data Persistence](#database--data-persistence)
5. [Monitoring & Logging](#monitoring--logging)
6. [Backup & Recovery](#backup--recovery)
7. [Security Checklist](#security-checklist)

---

## System Requirements

### Minimum Specs
- **OS:** Windows/Linux/macOS
- **RAM:** 2GB minimum (4GB recommended)
- **Storage:** 5GB free space
- **Node.js:** v18 LTS or higher
- **npm:** v9 or higher

### Network Requirements
- Stable internet connection (always-on for WhatsApp)
- Port 8000 accessible (configurable)
- Outbound HTTPS to Google APIs (Gemini)
- Outbound IMAP/SMTP for email (if using Node-RED)

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Environment Setup

### 1. Create .env File

```env
# Server
PORT=8000
NODE_ENV=production

# WhatsApp
WA_SESSION_NAME=wa_bot_session
WA_SESSION_PATH=./auth_info_baileys

# Dashboard
DASHBOARD_PASSWORD=your_secure_password_here
SESSION_SECRET=your_session_secret_key

# Google Generative AI (Gemini)
GOOGLE_API_KEY=your_google_api_key_here

# Optional: HTTPS
# HTTPS_ENABLED=true
# CERT_PATH=/path/to/cert.pem
# KEY_PATH=/path/to/key.pem

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# API Rate Limiting (optional)
# RATE_LIMIT_WINDOW=15m
# RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Konfigurasi Session Dashboard

Password hash untuk `users.json`:

```javascript
// Generate password hash (run di Node.js)
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'your_password_here';
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

generateHash();
```

Simpan hasil di `users.json`:

```json
{
  "admin": {
    "password": "$2b$10$xxxxx...",
    "role": "admin",
    "createdAt": "2024-01-01"
  }
}
```

### 3. Setup Firewall Rules

**Port yang perlu dibuka:**
```
8000    (Bot Server)
8001    (Socket.IO - included in 8000)
```

**UFW (Linux):**
```bash
sudo ufw allow 8000/tcp
sudo ufw enable
```

**Windows Firewall:**
1. Settings → Privacy & Security → Windows Defender Firewall
2. Advanced settings → Inbound Rules
3. New Rule → Port → TCP → 8000

---

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem config
pm2 start bot.js --name "wa-bot" --instances max

# Make PM2 auto-start on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs wa-bot
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: "wa-bot",
    script: "./bot.js",
    instances: 1,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    },
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    max_restarts: 10,
    min_uptime: "10s",
    max_memory_restart: "500M",
    watch: false,
    ignore_watch: ["node_modules", "logs", "attachments"],
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
```

### Option 2: Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "bot.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  wa-bot:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./auth_info_baileys:/app/auth_info_baileys
      - ./logs:/app/logs
      - ./attachments:/app/attachments
      - ./data:/app/data
    environment:
      NODE_ENV: production
      PORT: 8000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Run Docker:**
```bash
docker-compose up -d
docker-compose logs -f
```

### Option 3: Windows Service (NSSM)

```bash
# Already in /nssm folder (if exists)

# Install service
nssm install wa-bot "C:\path\to\node.exe" "C:\path\to\bot.js"

# Set startup type
nssm set wa-bot AppDirectory "C:\path\to\project"

# Start service
nssm start wa-bot

# Monitor
nssm status wa-bot
```

---

## Database & Data Persistence

### File-Based Storage (Current)

**Data Files:**
```
/
├── users.json          # Dashboard credentials
├── api_keys.json       # Encrypted API keys
├── schedules.json      # Broadcast jobs
├── templates.json      # Message templates
├── reminder_settings.json  # (Optional)
└── /attachments/       # Uploaded files
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

cp users.json $BACKUP_DIR/
cp api_keys.json $BACKUP_DIR/
cp schedules.json $BACKUP_DIR/
cp templates.json $BACKUP_DIR/

# Compress
tar -czf "backups/backup_$(date +%Y%m%d_%H%M%S).tar.gz" $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR"
```

### Migration ke Database (Optional)

Jika ingin upgrade ke MongoDB/PostgreSQL:

**MongoDB Setup:**
```bash
npm install mongoose
npm install dotenv
```

**Mongoose Models (example):**
```javascript
// models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  name: String,
  message: String,
  cronExpression: String,
  recipients: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
```

---

## Monitoring & Logging

### Log Files

```
/logs/
├── bot.log           # Main application logs
├── error.log         # Error-only logs
├── access.log        # HTTP request logs
└── pm2-*.log         # PM2 process manager logs
```

### Real-Time Monitoring

**Access Dashboard:**
```
http://192.168.10.20:8000
```

**Features:**
- Live status indicator
- Real-time message log
- Active connections
- Performance metrics
- Error tracking

### Log Analysis Commands

```bash
# View recent errors
tail -f logs/error.log

# Search for specific message
grep "ERROR" logs/bot.log | tail -20

# Count log entries per type
grep -c "INFO\|ERROR\|WARN" logs/bot.log

# Parse JSON logs (if applicable)
tail -f logs/bot.log | jq '.level'
```

### Health Check

```javascript
// Bot provides health endpoint
// GET /health

// Response:
{
  "status": "healthy",
  "uptime": "2h 30m",
  "connections": 5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Backup & Recovery

### Automated Daily Backup

**Cron Job (Linux/macOS):**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

**PowerShell Task (Windows):**
```powershell
# Create backup script
# backup.ps1

$BackupPath = "C:\bot\backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $BackupPath

Copy-Item "C:\bot\users.json" $BackupPath
Copy-Item "C:\bot\api_keys.json" $BackupPath
Copy-Item "C:\bot\schedules.json" $BackupPath

# Schedule task
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\bot\backup.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At 2AM
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "BotBackup"
```

### Restore dari Backup

```bash
# Extract backup
tar -xzf backups/backup_20240115_020000.tar.gz

# Restore files
cp backups/20240115_020000/users.json ./
cp backups/20240115_020000/api_keys.json ./
cp backups/20240115_020000/schedules.json ./

# Restart bot
pm2 restart wa-bot
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change default password di dashboard
- [ ] Generate strong session secret
- [ ] Create `.env` file (jangan commit ke git)
- [ ] Set NODE_ENV=production
- [ ] Review firewall rules
- [ ] Enable HTTPS jika possible

### API Security

- [ ] Rotate API keys regularly
- [ ] Use strong random API keys (32+ chars)
- [ ] Monitor API key usage
- [ ] Implement rate limiting
- [ ] Add request validation

### File Security

- [ ] Set proper file permissions (600 for sensitive files)
- [ ] Encrypt api_keys.json
- [ ] Regular backups di secure location
- [ ] Delete old attachments periodically
- [ ] Monitor disk usage

### WhatsApp Session

- [ ] Keep auth_info_baileys private
- [ ] Don't share QR code
- [ ] Monitor unusual activity
- [ ] Re-authenticate monthly

### Network Security

- [ ] Use HTTPS if possible
- [ ] Restrict dashboard access by IP (optional)
- [ ] Keep firewall updated
- [ ] Monitor suspicious login attempts
- [ ] Use strong passwords

### Operational Security

- [ ] Log all API access
- [ ] Audit schedule changes
- [ ] Monitor error rates
- [ ] Regular security updates
- [ ] Document access procedures

---

## Performance Optimization

### RAM Optimization
```javascript
// bot.js - Add memory monitoring
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory:', Math.round(used.heapUsed / 1024 / 1024) + 'MB');
}, 60000);
```

### File Cleanup
```javascript
// Delete old attachments (> 7 days)
const fs = require('fs');
const path = require('path');

setInterval(() => {
  const now = Date.now();
  const dir = './attachments';
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
      fs.unlinkSync(filePath);
      console.log('Deleted old file:', file);
    }
  });
}, 24 * 60 * 60 * 1000); // Run daily
```

### Connection Pooling
```javascript
// If using database, implement connection pooling
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});
```

---

## Troubleshooting Deployment

### Bot tidak start

```bash
# Check Node.js
node --version

# Check dependencies
npm install

# Run with verbose logging
NODE_DEBUG=* node bot.js

# Check logs
tail -f logs/error.log
```

### High Memory Usage

```bash
# Find memory leak
# Using Chrome DevTools remote debugging
node --inspect bot.js

# Connect via chrome://inspect
```

### API Key tidak bekerja

1. Verify di .env
2. Check encryption di api_keys.json
3. Restart bot untuk reload keys
4. Check logs untuk detailed error

### Dashboard tidak accessible

1. Verify port 8000 terbuka
2. Check firewall rules
3. Verify IP address correct
4. Check if bot is running

---

## Scaling ke Multiple Instances

Jika perlu handle lebih banyak requests:

```javascript
// Load balancer setup dengan Nginx

upstream wa_bot {
  server 192.168.10.20:8000;
  server 192.168.10.20:8001;
  server 192.168.10.20:8002;
}

server {
  listen 80;
  server_name bot.example.com;

  location / {
    proxy_pass http://wa_bot;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

**Lihat juga:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | [NODERED_INTEGRATION.md](./NODERED_INTEGRATION.md)
