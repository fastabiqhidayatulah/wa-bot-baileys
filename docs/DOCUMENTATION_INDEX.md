# 📚 WA Bot Baileys - Documentation Index

**Complete documentation hub untuk WhatsApp Bot dengan attachment management**

---

## 🚀 Quick Navigation

### Untuk Memulai Cepat
1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Curl commands & endpoint summary
2. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference

### Untuk Integrasi
1. **[NODERED_INTEGRATION.md](./NODERED_INTEGRATION.md)** - Setup Node-RED flows
2. **[ATTACHMENT_API.md](./ATTACHMENT_API.md)** - File upload & management

### Untuk Deployment
1. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production setup & monitoring
2. **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Advanced deployment options

### Untuk Setup API Keys
1. **[PANDUAN_API_KEYS_MANAGEMENT.md](./PANDUAN_API_KEYS_MANAGEMENT.md)** - API key management
2. **[README_API_KEYS_FEATURE.md](./README_API_KEYS_FEATURE.md)** - API key features

---

## 📖 Semua Dokumentasi

### Getting Started

| File | Deskripsi | Untuk Siapa |
|------|-----------|-----------|
| **[README.md](./README.md)** | Overview project | Semua orang |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Cepat cari endpoint | Developer |
| **[INDEX.md](./INDEX.md)** | File structure overview | Developer |

### API & Integration

| File | Deskripsi | Untuk Siapa |
|------|-----------|-----------|
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | Complete API hub | Developer, Integrator |
| **[ATTACHMENT_API.md](./ATTACHMENT_API.md)** | File upload/send API | Node-RED User |
| **[NODERED_INTEGRATION.md](./NODERED_INTEGRATION.md)** | Node-RED setup & flows | Node-RED User |
| **[PANDUAN_API_KEYS_MANAGEMENT.md](./PANDUAN_API_KEYS_MANAGEMENT.md)** | API key management | Administrator |
| **[README_API_KEYS_FEATURE.md](./README_API_KEYS_FEATURE.md)** | API key features | Developer |

### Deployment & Operations

| File | Deskripsi | Untuk Siapa |
|------|-----------|-----------|
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Production setup (baru) | DevOps, Administrator |
| **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** | Advanced deployment | Administrator |
| **[GITHUB_SETUP_GUIDE.md](./GITHUB_SETUP_GUIDE.md)** | GitHub setup | Developer |

### Features & How-To

| File | Deskripsi | Untuk Siapa |
|------|-----------|-----------|
| **[DOKUMENTASI_PORTAL_WA_BOT.md](./DOKUMENTASI_PORTAL_WA_BOT.md)** | Dashboard documentation | End User |
| **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** | Testing procedures | QA, Tester |
| **[FINAL_CHECKLIST.md](./FINAL_CHECKLIST.md)** | Pre-launch checklist | Project Manager |

---

## 🎯 Panduan Berdasarkan Use Case

### Saya ingin setup bot dari awal
```
1. README.md → Overview
2. DEPLOYMENT_GUIDE.md → .env setup
3. PRODUCTION_DEPLOYMENT.md → PM2/Docker
4. QUICK_REFERENCE.md → Test endpoints
```

### Saya ingin integrasi dengan Node-RED
```
1. NODERED_INTEGRATION.md → Flow setup
2. ATTACHMENT_API.md → Upload file
3. API_DOCUMENTATION.md → Reference lengkap
4. QUICK_REFERENCE.md → Curl testing
```

### Saya ingin send attachment dari email
```
1. NODERED_INTEGRATION.md → Email flow
2. ATTACHMENT_API.md → Upload & send
3. API_DOCUMENTATION.md → Request format
4. DEPLOYMENT_GUIDE.md → Production setup
```

### Saya ingin manage API keys
```
1. PANDUAN_API_KEYS_MANAGEMENT.md → Concepts
2. README_API_KEYS_FEATURE.md → How-to
3. API_DOCUMENTATION.md → Auth section
4. DEPLOYMENT_GUIDE.md → Security checklist
```

### Saya ingin setup production dengan monitoring
```
1. DEPLOYMENT_GUIDE.md → Full setup
2. PRODUCTION_DEPLOYMENT.md → Advanced options
3. TESTING_CHECKLIST.md → Verification
4. FINAL_CHECKLIST.md → Launch preparation
```

---

## 🔑 Key Concepts

### WhatsApp Format

**Personal Chat ID (Jid):**
```
62812345678@s.whatsapp.net
(Format: 62 + nomor tanpa 0)
```

**Group ID:**
```
120363048XXX@g.us
(Dilihat dari WhatsApp Web)
```

### Authentication

**Dashboard:** Session-based (username/password)
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=password"
```

**API:** Header-based (X-API-Key)
```bash
curl http://localhost:8000/api/external/attachments \
  -H "X-API-Key: your-api-key-here"
```

### File Upload Format

```bash
curl -X POST http://localhost:8000/api/external/upload-attachment \
  -H "X-API-Key: your-api-key" \
  -F "file=@/path/to/file.pdf"
```

---

## 📊 Fitur Utama

### 🤖 AI Chatbot
- Command: `/gemini [pertanyaan]`
- Model fallback otomatis
- Support long conversations
- [Docs](./API_DOCUMENTATION.md#gemini-chat-api)

### 📤 Broadcast Scheduler
- Save & schedule pesan
- Pause/resume job
- Multiple recipients
- Cron expression support
- [Docs](./API_DOCUMENTATION.md#scheduler-api)

### ✅ Number Validator
- Bulk validate nomor
- Detect active/inactive
- Group by status
- [Docs](./API_DOCUMENTATION.md#validator-api)

### 📎 Attachment Manager
- Upload dari folder/email
- Send ke WhatsApp
- List & delete files
- MIME type validation
- Size limit: 50MB
- [Docs](./ATTACHMENT_API.md)

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
PORT=8000
NODE_ENV=production

# Dashboard
DASHBOARD_PASSWORD=secure_password
SESSION_SECRET=secret_key

# Google Gemini API
GOOGLE_API_KEY=your_api_key

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log
```

### Data Files

```
├── users.json              # Dashboard credentials
├── api_keys.json           # Encrypted API keys
├── schedules.json          # Broadcast jobs
├── templates.json          # Message templates
└── /attachments/           # Uploaded files
```

---

## 🔒 Security

### API Key Management
- [PANDUAN_API_KEYS_MANAGEMENT.md](./PANDUAN_API_KEYS_MANAGEMENT.md) - Key concepts
- [README_API_KEYS_FEATURE.md](./README_API_KEYS_FEATURE.md) - Implementation
- [DEPLOYMENT_GUIDE.md#security-checklist](./DEPLOYMENT_GUIDE.md#security-checklist) - Best practices

### Best Practices
1. **Never** commit API keys atau passwords
2. Use `.env` untuk sensitive data
3. Rotate API keys regularly
4. Monitor API key usage
5. Enable audit logging

---

## 🚀 Deployment Options

| Option | Recommended | Setup Time | Monitoring |
|--------|-----------|-----------|-----------|
| **PM2** | ✅ For Linux/macOS | 5 min | Built-in |
| **Docker** | ✅ For multiple machines | 15 min | Docker compose |
| **Windows Service (NSSM)** | ✅ For Windows only | 10 min | Task manager |
| **Direct Node** | ❌ Dev only | 2 min | Manual |

[Full guide →](./DEPLOYMENT_GUIDE.md)

---

## 📞 API Endpoints

### Quick Summary

**Message API:**
```
POST   /api/external/send-message
POST   /api/external/broadcast
POST   /api/external/schedule-broadcast
```

**Attachment API:**
```
POST   /api/external/upload-attachment
GET    /api/external/attachments
POST   /api/external/send-attachment
DELETE /api/external/attachments/:filename
```

**Validator API:**
```
POST   /api/external/validate-numbers
```

**Dashboard API:**
```
GET    /api/dashboard/logs
GET    /api/dashboard/status
```

[Complete reference →](./API_DOCUMENTATION.md)

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Test Message
```bash
curl -X POST http://localhost:8000/api/external/send-message \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "62812345678@s.whatsapp.net",
    "message": "Test message"
  }'
```

[Testing checklist →](./TESTING_CHECKLIST.md)

---

## ⚠️ Common Issues

### Bot won't start
1. Check `.env` file exists
2. Check `GOOGLE_API_KEY` is valid
3. Check port 8000 is available
4. Review logs: `tail -f logs/error.log`

### Can't send message
1. Verify WhatsApp number format (62xxx)
2. Check number is active in WhatsApp
3. Verify API key is correct
4. Check X-API-Key header is sent

### Attachment not uploading
1. Check file size < 50MB
2. Verify file type is supported
3. Check /attachments folder exists
4. Review logs for MIME type issues

### Can't access dashboard
1. Verify port 8000 is accessible
2. Check firewall allows port 8000
3. Try hard refresh (Ctrl+Shift+R)
4. Check username/password correct

[Full troubleshooting →](./DEPLOYMENT_GUIDE.md#troubleshooting-deployment)

---

## 📊 Project Statistics

```
├── Core Files: 2
│   ├── bot.js (main server)
│   └── package.json
│
├── Handlers: 3
│   ├── helpHandler.js
│   ├── geminiHandler.js
│   └── attachmentHandler.js
│
├── Frontend: 4
│   ├── index.html (dashboard)
│   ├── scheduler.html
│   ├── validator.html
│   └── settings.html
│
└── Documentation: 11 files
    └── Complete API references
```

---

## 🔄 Version History

**Current Version:** 2.0 (with Attachments)

### Changes (v2.0)
- ✅ Added file attachment management
- ✅ Removed Google Calendar features
- ✅ Added Node-RED integration guide
- ✅ Comprehensive API documentation
- ✅ Production deployment guide

### Previous (v1.0)
- AI Chatbot (Gemini)
- Broadcast Scheduler
- Number Validator
- Calendar management (removed in v2.0)

---

## 📧 Support & Resources

- **Bot Location:** `\\192.168.10.20\WA Bot Baileys`
- **Dashboard:** `http://192.168.10.20:8000`
- **Main File:** `bot.js`
- **Configuration:** `.env` (create if missing)

---

## 📝 Documentation Quality

| Document | Completeness | Last Updated |
|----------|-------------|--------------|
| API_DOCUMENTATION.md | 100% | Latest |
| NODERED_INTEGRATION.md | 100% | Latest |
| DEPLOYMENT_GUIDE.md | 100% | Latest |
| QUICK_REFERENCE.md | 100% | Latest |
| ATTACHMENT_API.md | 100% | Latest |

---

**Happy coding! 🎉**

*Untuk pertanyaan atau issue, check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) atau [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)*
