# 🚀 Production Deployment Checklist

## ⚠️ IMPORTANT - READ BEFORE DEPLOYMENT

---

## 🔐 Security Configuration

### MUST DO - Encryption Key
- [ ] **Generate Strong Encryption Key**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  
- [ ] **Update .env with your key**
  ```dotenv
  # CHANGE THIS TO YOUR GENERATED KEY
  ENCRYPTION_KEY=your_generated_key_here
  ```

- [ ] **Verify ENCRYPTION_KEY is NOT default**
  ```bash
  grep "ENCRYPTION_KEY=" .env
  # Should NOT show: "your-secret-key-change-this"
  ```

### Git Security
- [ ] **Add to .gitignore**
  ```bash
  echo "api_keys.json" >> .gitignore
  echo ".env" >> .gitignore
  ```

- [ ] **Verify files are ignored**
  ```bash
  git status --ignored
  # Should show api_keys.json & .env as ignored
  ```

### HTTPS Configuration
- [ ] **Enable HTTPS (if not already)**
  - Use reverse proxy (Nginx)
  - Or use certbot + Let's Encrypt
  - Or use PM2 + SSL

- [ ] **Update GOOGLE_REDIRECT_URI if needed**
  ```dotenv
  # From: http://localhost:8000/oauth2callback
  # To: https://your-domain.com/oauth2callback
  GOOGLE_REDIRECT_URI=https://your-domain.com/oauth2callback
  ```

---

## 📋 Pre-Deployment Checklist

### Database & Files
- [ ] **Backup api_keys.json**
  ```bash
  cp api_keys.json api_keys.json.backup
  cp api_keys.json api_keys.json.$(date +%Y%m%d)
  ```

- [ ] **Document ENCRYPTION_KEY**
  - Save in secure location (password manager)
  - DO NOT share or commit

- [ ] **Clear old logs**
  ```bash
  # Optional: archive old logs
  mv bot-logs.log bot-logs.$(date +%Y%m%d).log
  ```

### Code Review
- [ ] **Review apiKeyManager.js**
  - Check encryption logic
  - Verify no hardcoded secrets
  
- [ ] **Review bot.js additions**
  - Check API endpoint security
  - Verify authentication middleware
  
- [ ] **Review settings.html**
  - Check no console.logs
  - Verify API calls secured

### Dependencies
- [ ] **Verify all packages installed**
  ```bash
  npm install
  npm list | grep crypto
  ```

- [ ] **Check for deprecated packages**
  ```bash
  npm audit
  ```

---

## ✅ Testing Pre-Deployment

### Local Testing
- [ ] **Start bot locally**
  ```bash
  node bot.js
  ```

- [ ] **Test all API endpoints**
  ```bash
  # Test 1: Get API keys
  curl -b cookies.txt http://localhost:8000/api/internal/api-keys
  
  # Test 2: Add API key
  curl -b cookies.txt -X POST http://localhost:8000/api/internal/api-keys \
    -H "Content-Type: application/json" \
    -d '{"provider":"gemini","apiKey":"test123"}'
  
  # Test 3: Validate
  curl -b cookies.txt -X POST http://localhost:8000/api/internal/api-keys/test/gemini \
    -H "Content-Type: application/json" \
    -d '{"apiKey":"test123"}'
  
  # Test 4: Delete
  curl -b cookies.txt -X DELETE http://localhost:8000/api/internal/api-keys/gemini
  ```

- [ ] **Test dashboard UI**
  - Login to settings.html
  - Add/Edit/Delete API keys
  - Verify validation works
  - Check encryption in api_keys.json

- [ ] **Test Gemini integration**
  - Send `/gemini test` via WhatsApp
  - Verify response

- [ ] **Check logs**
  - `tail -f bot-logs.log`
  - Should see API key operations logged

### Production Simulation
- [ ] **Test with production ENCRYPTION_KEY**
  - Generate new key
  - Set in .env
  - Add API key
  - Verify encryption
  - Decrypt & verify

- [ ] **Test recovery scenario**
  - Export api_keys.json
  - Delete local copy
  - Restart bot
  - Restore from backup
  - Verify keys work

---

## 🚀 Deployment Steps

### 1. Prepare Production Environment
```bash
# Stop current process
pm2 stop whatsapp-bot
# or
Ctrl+C

# Backup current state
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
node scripts/migrate.js  # if exists
```

### 2. Configuration
```bash
# Verify .env
cat .env

# Check critical variables
grep -E "ENCRYPTION_KEY|GEMINI_API_KEY|PORT" .env

# Test database connection
node -e "const fs = require('fs'); console.log(JSON.parse(fs.readFileSync('api_keys.json')).)"
```

### 3. Start Application
```bash
# Option 1: Direct start
node bot.js

# Option 2: PM2 (recommended)
pm2 restart whatsapp-bot
pm2 logs whatsapp-bot

# Option 3: Docker
docker-compose up -d
```

### 4. Verify Deployment
```bash
# Check if running
ps aux | grep "node bot.js"

# Test API
curl http://localhost:8000/api/internal/api-keys

# Check logs
pm2 logs whatsapp-bot  # Last 100 lines
# or
tail -f bot-logs.log

# Monitor
pm2 monit
```

### 5. Post-Deployment
```bash
# Verify all handlers loaded
grep -i "handler" bot-logs.log

# Test commands
# Via WhatsApp:
# /help
# /gemini test
# /cuti #1 December 2025 #Name

# Monitor for 1 hour
# - Check error rates
# - Check API calls
# - Monitor memory usage
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
```bash
# 1. Check bot is running
pm2 list

# 2. Check for errors
pm2 logs whatsapp-bot | grep "error"

# 3. Check API key status
curl http://localhost:8000/api/internal/api-keys

# 4. Monitor resources
pm2 monit
```

### Weekly Tasks
- [ ] Backup api_keys.json
- [ ] Review logs for issues
- [ ] Check API usage
- [ ] Verify all commands working

### Monthly Tasks
- [ ] Review & rotate API keys
- [ ] Update dependencies
- [ ] Check for security updates
- [ ] Archive old logs

---

## 🆘 Emergency Procedures

### If Bot Crashes
```bash
# 1. Check logs
pm2 logs whatsapp-bot

# 2. Restart
pm2 restart whatsapp-bot

# 3. If still fails, check:
node bot.js  # Run directly to see errors
```

### If API Keys Lost
```bash
# 1. Check backup
ls -la api_keys.json*

# 2. Restore from backup
cp api_keys.json.backup api_keys.json

# 3. Restart bot
pm2 restart whatsapp-bot

# 4. Re-enter keys if needed
# Via dashboard: settings.html
```

### If Encryption Key Lost
```bash
# 1. Backup current api_keys.json
cp api_keys.json api_keys.json.corrupted

# 2. Start with new encryption key
ENCRYPTION_KEY=new_key node bot.js

# 3. Re-enter all API keys via dashboard

# 4. Test everything works
```

### If Cannot Login
```bash
# 1. Reset session
# Stop bot & delete session files
rm -rf node_modules/.session*

# 2. Clear browser cookies
# Ctrl+Shift+Delete in browser

# 3. Restart bot
node bot.js

# 4. Login again
```

---

## 📈 Performance Metrics

### Target Metrics
| Metric | Target | Action |
|--------|--------|--------|
| API Response | < 500ms | Optimize if exceed |
| Memory Usage | < 500MB | Monitor & restart if needed |
| CPU Usage | < 50% | Alert if exceed |
| Error Rate | < 1% | Investigate immediately |

### Monitoring Commands
```bash
# Memory usage
ps aux | grep "node bot.js" | awk '{print $6}'

# CPU usage
ps aux | grep "node bot.js" | awk '{print $3}'

# Uptime
pm2 list

# All stats
pm2 plus  # Or use PM2 Cloud
```

---

## 🔄 Rollback Plan

If deployment fails:

```bash
# 1. Stop current version
pm2 stop whatsapp-bot

# 2. Restore from backup
cp -r ../backup-YYYYMMDD-HHMMSS .

# 3. Restore database
cp api_keys.json.backup api_keys.json

# 4. Start old version
pm2 start whatsapp-bot

# 5. Notify team
# Send notification about rollback
```

---

## 📝 Documentation

After deployment, update:
- [ ] README.md - deployment details
- [ ] CHANGELOG.md - what was added
- [ ] ops-manual.md - operational procedures
- [ ] disaster-recovery.md - recovery procedures

---

## ✅ Sign-off

- [ ] **Developer:** Reviewed & tested locally
- [ ] **QA:** Tested all features
- [ ] **DevOps:** Infrastructure ready
- [ ] **Security:** Security review passed
- [ ] **Manager:** Approval given

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Approved By:** _______________

---

## 🎯 Go/No-Go Criteria

### GREEN Light (Safe to Deploy)
- ✅ All tests passed
- ✅ No security issues
- ✅ Encryption key set
- ✅ Database backed up
- ✅ Monitoring ready
- ✅ Rollback plan ready

### RED Light (DO NOT DEPLOY)
- ❌ Tests failing
- ❌ Security vulnerabilities
- ❌ No backup
- ❌ Default encryption key
- ❌ No monitoring setup

---

## 📞 Support Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| DevOps | [Phone] | 24/7 |
| Backend | [Email] | Business hours |
| Security | [Email] | 24/7 |

---

## 🔗 Related Documents

- PANDUAN_API_KEYS_MANAGEMENT.md
- IMPLEMENTATION_SUMMARY.md
- TESTING_CHECKLIST.md
- ARCHITECTURE_DIAGRAMS.md
- QUICK_REFERENCE.md

---

**Last Updated:** 4 Desember 2025  
**Next Review:** After first deployment  
**Maintained By:** DevOps Team
