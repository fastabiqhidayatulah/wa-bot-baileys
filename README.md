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

### ✅ **Validasi Nomor WhatsApp**
- Bulk validate nomor WA
- Real-time progress tracking
- Check apakah nomor terdaftar

### 📅 **Manajemen Cuti**
- Input cuti via WhatsApp: `/cuti #[tanggal] [bulan] [tahun] #[nama]`
- Integrasi Google Calendar
- Support range & tanggal tidak berurutan

### ⏰ **Reminder Cuti Otomatis**
- Cron job mengirim reminder siapa yang cuti hari ini
- Configurable jadwal & target
- Google Calendar integration

### 🔑 **API Keys Management**
- Manage API keys dari dashboard
- Enkripsi AES-256
- Validasi real-time sebelum save
- Support Gemini, Google Calendar, Custom API

### 🌐 **Dashboard Web**
- Login system dengan bcrypt
- Real-time status & QR code via Socket.IO
- Live logging
- Responsive UI dengan Tailwind CSS

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js v5.1.0
- **WhatsApp:** @whiskeysockets/baileys v6.7.18
- **Real-time:** Socket.IO v4.8.1
- **Scheduling:** node-cron v4.2.0
- **Auth:** bcrypt + express-session
- **Logging:** pino + pino-pretty
- **Google API:** googleapis v150.0.1
- **AI:** @google/generative-ai

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
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/oauth2callback
LEAVE_CALENDAR_ID=your-google-calendar-id
SESSION_SECRET=your-secret-key
EXTERNAL_API_KEY=your-external-api-key
```

### **4. Initialize Users**
```bash
node hash-password.js
# Follow prompt to create admin user
```

### **5. Start Bot**
```bash
node bot.js
```

Bot akan tersedia di: `http://localhost:8000`

---

## 📚 Dokumentasi

- [DOKUMENTASI_PORTAL_WA_BOT.md](./DOKUMENTASI_PORTAL_WA_BOT.md) - Dokumentasi lengkap aplikasi
- [README_API_KEYS_FEATURE.md](./README_API_KEYS_FEATURE.md) - Panduan API Keys
- [PANDUAN_API_KEYS_MANAGEMENT.md](./PANDUAN_API_KEYS_MANAGEMENT.md) - Technical documentation
- [INDEX.md](./INDEX.md) - Documentation index

---

## 🗂️ Struktur File

```
wa-bot-baileys/
├── bot.js                          # Backend utama (888 lines)
├── package.json                    # Dependencies
├── .env.example                    # Environment template
├── handlers/
│   ├── geminiHandler.js           # AI chatbot
│   ├── cutiHandler.js             # Leave management
│   ├── leaveReminderHandler.js    # Reminder service
│   ├── helpHandler.js             # Help command
│   └── apiKeyManager.js           # Encrypt/decrypt API keys
├── public/                         # Frontend
│   ├── index.html                 # Dashboard
│   ├── login.html                 # Login page
│   ├── scheduler.html             # Broadcast scheduler
│   ├── validator.html             # Number validator
│   ├── calendar.html              # Calendar management
│   └── settings.html              # Settings & API keys
├── auth_info_baileys/             # WhatsApp auth (gitignored)
├── logs/                          # Application logs
├── schedules.json                 # Saved broadcast jobs
├── templates.json                 # Message templates
├── reminder_settings.json         # Reminder config
└── .gitignore                     # Git ignore rules
```

---

## 🔐 Security Notes

⚠️ **JANGAN PERNAH:**
- Commit `.env` file (berisi API keys)
- Commit `auth_info_baileys/` (WhatsApp credentials)
- Commit `api_keys.json` (encrypted keys)
- Commit `google_token.json` (OAuth tokens)

✅ **SEBAIKNYA:**
- Gunakan `.env.example` sebagai template
- Store credentials di environment variables
- Encrypt sensitive data

---

## 🚀 Deployment

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

---

## 📡 API Endpoints

### Authentication
- `POST /login` - Login
- `GET /logout` - Logout

### Dashboard (Internal)
- `GET /api/internal/status` - Bot status
- `GET /api/internal/get-groups` - List groups
- `GET /api/internal/get-scheduled-jobs` - List broadcast jobs
- `POST /api/internal/schedule-message` - Create broadcast
- `POST /api/internal/pause-job/:id` - Pause job
- `POST /api/internal/resume-job/:id` - Resume job
- `GET /api/internal/api-keys` - Get API keys
- `POST /api/internal/api-keys` - Save API key
- `POST /api/internal/api-keys/test/:provider` - Test API key

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
6. Bot akan otomatis send sesuai jadwal

### 2. Manage Leave via WhatsApp
```
User: /cuti #1-5 Maret 2025 #John Doe
Bot:  Insert ke Google Calendar & send confirmation
```

### 3. Setup API Keys
1. Dashboard → Settings (scroll up)
2. Klik card provider (e.g., Gemini)
3. Input API key
4. Click "Validasi"
5. Click "Simpan"

---

## 🐛 Troubleshooting

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
