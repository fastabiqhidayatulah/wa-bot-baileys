# 🚀 WA Bot Baileys

WhatsApp Bot Control Panel built with **Baileys**, **Express.js**, dan **Socket.IO** untuk mengelola WhatsApp secara otomatis dengan fitur lengkap.

## ✨ Fitur Utama

### 🤖 **AI Chatbot (Gemini)**
- Integrasi Google Generative AI (Gemini)
- Perintah: `/gemini [pertanyaan]`
- Support multiple model fallback

### 📤 **Broadcast Scheduler**
- Jadwal pesan otomatis (Daily, Weekly, Monthly, Once, Now)
- Target: Individual (nomor WA) + Group
- Pause/Resume job
- Track last run & next run
- Template messages
- **NTP Time Sync** - Scheduler menggunakan waktu akurat (Asia/Jakarta) via worldtimeapi.org

### ✅ **Validasi Nomor WhatsApp**
- Bulk validate nomor WA
- Real-time progress tracking
- Check apakah nomor terdaftar

### 📎 **File Attachment Manager**
- Upload file dari komputer (max 50MB)
- Send attachment via WhatsApp
- Support: Images, Videos, Audio, Documents, Archives
- List, delete attachment
- Integration dengan Node-RED email flows

### 🔑 **API Keys Management**
- Manage API keys dari dashboard
- Enkripsi AES-256
- Validasi real-time sebelum save
- Support Gemini dan Custom API

### 🌐 **Dashboard Web**
- Login system dengan bcrypt
- Real-time status & QR code via Socket.IO
- Live logging
- Time widget (System time, NTP time, Offset tracking)
- Responsive UI dengan Tailwind CSS

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js v22.11.0
- **Framework:** Express.js v5.1.0
- **WhatsApp:** @whiskeysockets/baileys v6.7.18
- **Real-time:** Socket.IO v4.8.1
- **Scheduling:** node-cron v4.2.0
- **File Upload:** express-fileupload v1.5.0 (50MB limit)
- **Auth:** bcrypt + express-session
- **Logging:** pino + pino-pretty
- **AI:** @google/generative-ai v0.24.1
- **Time Sync:** NTP via worldtimeapi.org API

### Frontend
- HTML5 + Vanilla JavaScript
- Tailwind CSS
- Socket.IO client

---

## 📋 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/username/wa-bot-baileys.git
cd wa-bot-baileys
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Setup Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:
```
PORT=8000
ENCRYPTION_KEY=your-32-char-secret-key
GEMINI_API_KEY=your-gemini-api-key (optional, bisa set dari dashboard)
SESSION_SECRET=your-secret-key
EXTERNAL_API_KEY=your-external-api-key
```

### **4. Start Bot**
```bash
node bot.js
```

Bot akan tersedia di: `http://localhost:8000`

Atau gunakan NSSM untuk Windows Service (auto-start on reboot):
```bash
install-service.bat  # Install service
nssm restart wabot   # Restart service
```

---

## 📚 Dokumentasi

- [docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md) - Navigation hub untuk semua dokumentasi
- [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) - Dokumentasi lengkap API endpoints
- [docs/ATTACHMENT_API.md](./docs/ATTACHMENT_API.md) - Panduan File Attachment Manager
- [docs/NODERED_INTEGRATION.md](./docs/NODERED_INTEGRATION.md) - Integrasi dengan Node-RED
- [docs/NTP_TIME_SYNC.md](./docs/NTP_TIME_SYNC.md) - Dokumentasi NTP Time Synchronization
- [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) - Production deployment (PM2, Docker, NSSM)
- [public/docs.html](./public/docs.html) - Interactive API documentation (visit `/docs`)

---

## 🗂️ Struktur File

```
wa-bot-baileys/
├── bot.js                          # Backend utama (950+ lines)
├── package.json                    # Dependencies
├── .env.example                    # Environment template
├── handlers/
│   ├── geminiHandler.js           # AI chatbot
│   ├── attachmentHandler.js       # File attachment manager
│   ├── helpHandler.js             # Help command
│   └── apiKeyManager.js           # Encrypt/decrypt API keys
├── public/                         # Frontend
│   ├── index.html                 # Dashboard
│   ├── login.html                 # Login page
│   ├── scheduler.html             # Broadcast scheduler
│   ├── validator.html             # Number validator
│   ├── docs.html                  # API documentation
│   └── settings.html              # Settings & API keys
├── docs/                          # Documentation
│   ├── DOCUMENTATION_INDEX.md     # Documentation hub
│   ├── API_DOCUMENTATION.md       # Complete API reference
│   ├── ATTACHMENT_API.md          # File attachment guide
│   ├── NODERED_INTEGRATION.md     # Node-RED setup
│   ├── NTP_TIME_SYNC.md          # Time synchronization
│   └── DEPLOYMENT_GUIDE.md        # Production deployment
├── auth_info_baileys/             # WhatsApp auth (gitignored)
├── logs/                          # Application logs
├── nssm/                          # Windows Service Manager
│   ├── install-service.bat        # Install Windows service
│   ├── uninstall-service.bat      # Uninstall service
│   └── service-control.bat        # Service control menu
├── schedules.json                 # Saved broadcast jobs
├── templates.json                 # Message templates
└── .gitignore                     # Git ignore rules
```

---

## 🔐 Security Notes

⚠️ **JANGAN PERNAH:**
- Commit `.env` file (berisi API keys)
- Commit `auth_info_baileys/` (WhatsApp credentials)
- Commit `api_keys.json` (encrypted keys)

✅ **SEBAIKNYA:**
- Gunakan `.env.example` sebagai template
- Store credentials di environment variables
- Encrypt sensitive data

---

## 🚀 Deployment

### Windows Server dengan NSSM (Auto-start):
```bash
# Install service (run as Administrator)
install-service.bat

# Control service
nssm restart wabot
nssm stop wabot
nssm start wabot

# Uninstall
uninstall-service.bat
```

### Manual Deploy ke VPS/Server:
```bash
# Clone di server
git clone <repo-url>
cd wa-bot-baileys

# Setup
npm install
cp .env.example .env
# Edit .env dengan konfigurasi production

# Run dengan PM2 (recommended)
pm2 start bot.js --name "wa-bot"
pm2 save
pm2 startup
```

### Atau gunakan Docker:
```bash
docker build -t wa-bot .
docker run -d -p 8000:8000 --name wa-bot wa-bot
```

Lihat [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) untuk detail lengkap.

---

## 📡 API Endpoints

### Authentication
- `POST /login` - Login
- `GET /logout` - Logout

### Dashboard (Internal)
- `GET /api/internal/status` - Bot status
- `GET /api/internal/get-groups` - List groups
- `GET /api/internal/get-scheduled-jobs` - List broadcast jobs
- `GET /api/internal/time-status` - Get NTP time & offset
- `POST /api/internal/schedule-message` - Create broadcast
- `POST /api/internal/pause-job/:id` - Pause job
- `POST /api/internal/resume-job/:id` - Resume job
- `GET /api/internal/api-keys` - Get API keys
- `POST /api/internal/api-keys` - Save API key
- `POST /api/internal/api-keys/test/:provider` - Test API key

### File Attachment API (Internal)
- `POST /api/internal/upload-attachment` - Upload file
- `GET /api/internal/attachments` - List files
- `GET /api/internal/download-attachment/:filename` - Download file
- `POST /api/internal/send-attachment` - Send via WhatsApp
- `DELETE /api/internal/delete-attachment/:filename` - Delete file

### External API
- `POST /api/external/send-message` (requires X-API-Key header)

---

## 🔄 Workflow Contoh

### 1. Send Broadcast Terjadwal
1. Dashboard → Scheduler
2. Pilih target (grup/nomor)
3. Tulis pesan
4. Pilih jadwal (daily/weekly/monthly/once)
5. Submit
6. Bot akan otomatis send sesuai jadwal (dengan NTP time sync yang akurat)

### 2. Send File Attachment
1. Dashboard → Upload attachment
2. Pilih file (max 50MB)
3. Click "Send to WhatsApp"
4. Pilih target (nomor/grup)
5. File akan langsung terkirim

### 3. Integrasi Node-RED untuk Email
1. Setup Node-RED email listener
2. Forward attachment URLs ke API: `POST /api/internal/upload-attachment`
3. Bot akan auto-save dan ready to send
4. Use `POST /api/internal/send-attachment` untuk kirim via WhatsApp

### 4. Setup API Keys
1. Dashboard → Settings (scroll up)
2. Klik card provider (e.g., Gemini)
3. Input API key
4. Click "Validasi"
5. Click "Simpan"

---

## ⏰ NTP Time Synchronization

Bot dilengkapi dengan automatic NTP time synchronization untuk memastikan scheduler akurat:

- **Sync dengan:** worldtimeapi.org (Asia/Jakarta timezone)
- **On Startup:** Langsung sinkron saat bot start
- **Auto Re-sync:** Setiap 1 jam otomatis update offset
- **Dashboard Widget:** Lihat system time vs NTP time + offset
- **Scheduler Accuracy:** Broadcast jobs menggunakan calibrated time

Lihat [docs/NTP_TIME_SYNC.md](./docs/NTP_TIME_SYNC.md) untuk detail.

### Bot tidak connect
```bash
# Delete auth folder dan rescan QR
rm -r auth_info_baileys
node bot.js
```

### Port sudah dipakai
```bash
# Edit .env
PORT=3000  # Ganti ke port lain
node bot.js
```

### Missing dependencies
```bash
npm install
```

---

## 📝 License

MIT License - Silakan gunakan untuk keperluan pribadi/komersial

---

## 🤝 Contributing

Pull requests welcome! Untuk perubahan besar, buka issue dulu untuk diskusi.

---

## 📧 Support

Jika ada pertanyaan atau issue, silakan buka GitHub Issues atau hubungi developer.

---

**Happy Coding!** 🎉
