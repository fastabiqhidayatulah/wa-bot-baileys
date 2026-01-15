# 📚 WA Bot Baileys - API Documentation Hub

**Dokumentasi Lengkap untuk Semua API Endpoints & Fitur**

---

## 📑 Daftar Isi

1. [🚀 Quick Start](#quick-start)
2. [🔐 Autentikasi](#autentikasi)
3. [📋 API Endpoints](#api-endpoints)
4. [💬 Fitur Chatbot](#fitur-chatbot)
5. [📤 Fitur Scheduler](#fitur-scheduler)
6. [✅ Fitur Validator](#fitur-validator)
7. [📎 Fitur Attachment](#fitur-attachment)
8. [⚙️ Pengaturan & Konfigurasi](#pengaturan--konfigurasi)
9. [🛠️ Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Instalasi & Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd wa-bot-baileys

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# 4. Jalankan bot
node bot.js

# 5. Akses dashboard
# Browser: http://192.168.10.20:8000
# Login dengan credentials di users.json
```

### Environment Variables

```env
# Server
PORT=8000
NODE_ENV=development

# Session & Auth
SESSION_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-char-secret-key

# API Keys
EXTERNAL_API_KEY=your-external-api-key
GEMINI_API_KEY=your-gemini-key

# Logging
LOG_LEVEL=info
```

---

## 🔐 Autentikasi

### 1. Dashboard Login
```
URL: http://192.168.10.20:8000/login.html
Username/Password: Dari users.json
Session: Disimpan dalam browser
```

### 2. API External (Node-RED, integrasi lain)
```
Header: X-API-Key: <EXTERNAL_API_KEY>
Method: GET/POST/DELETE
```

### 3. API Internal (Dashboard)
```
Requirement: Logged-in session via browser
Otomatis authenticated via req.session
```

---

## 📋 API Endpoints

### Server Status & Connection

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/internal/status` | Status koneksi bot |
| POST | `/api/internal/logout-wa` | Logout & hapus session WA |

---

## 💬 Fitur Chatbot

### Gemini AI Integration

**Perintah WhatsApp:**
```
/gemini Apa ibu kota Indonesia?
/gemini Bantu saya menulis email
```

**Endpoint:**
- Query diproses langsung via WhatsApp
- Tidak ada endpoint REST untuk Gemini (langsung via chat)

**Supported Models (fallback otomatis):**
1. `gemini-2.5-flash` (recommended)
2. `gemini-1.5-flash`
3. `gemini-1.5-pro`
4. `gemini-pro`

**Konfigurasi API Key:**
```
Dashboard → Pengaturan → Gemini AI
atau
.env → GEMINI_API_KEY=xxx
```

---

## 📤 Fitur Scheduler

### Broadcast Pesan Otomatis

**Endpoint:** `POST /api/internal/create-schedule`

```javascript
{
  "id": "job-123",
  "targets": ["6281234567890"],
  "groups": ["Group ID"],
  "message": "Pesan broadcast",
  "scheduleType": "daily", // daily | weekly | monthly | once
  "scheduleData": {
    "time": "10:30",
    "days": [1, 3, 5]  // untuk weekly (0=Minggu, 6=Sabtu)
  },
  "status": "Active"
}
```

**Schedule Types:**
- `daily` - Setiap hari jam tertentu
- `weekly` - Hari-hari spesifik dalam seminggu
- `monthly` - Tanggal tertentu setiap bulan
- `once` - Satu kali saja

**Endpoints:**

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/internal/create-schedule` | Buat jadwal baru |
| GET | `/api/internal/list-schedules` | Daftar jadwal |
| POST | `/api/internal/pause-schedule/:id` | Pause jadwal |
| POST | `/api/internal/resume-schedule/:id` | Resume jadwal |
| DELETE | `/api/internal/delete-schedule/:id` | Hapus jadwal |

---

## ✅ Fitur Validator

### Validasi Nomor WhatsApp

**Endpoint:** `POST /api/internal/validate-numbers` (via Socket.IO)

```javascript
// Input: Array nomor
data = {
  numbers: [
    "6281234567890",
    "081234567890",
    "6287654321000"
  ]
}

// Output: Realtime via WebSocket
{
  number: "6281234567890",
  status: "Aktif" // atau "Tidak Terdaftar" / "Error"
}
```

**Features:**
- ✅ Validasi bulk dengan delay
- ✅ Real-time progress update
- ✅ Deteksi nomor tidak terdaftar
- ✅ Auto format ke format internasional

---

## 📎 Fitur Attachment

Lihat dokumentasi lengkap: [ATTACHMENT_API.md](./ATTACHMENT_API.md)

### Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/external/upload-attachment` | Upload file |
| GET | `/api/external/attachments` | List semua file |
| POST | `/api/external/send-attachment` | Kirim file ke WA |
| DELETE | `/api/external/attachments/:filename` | Hapus file |

### Contoh: Upload & Send File

```bash
# 1. Upload file
curl -X POST http://192.168.10.20:8000/api/external/upload-attachment \
  -H "X-API-Key: your-api-key" \
  -F "file=@invoice.pdf"

# 2. Kirim ke WhatsApp
curl -X POST http://192.168.10.20:8000/api/external/send-attachment \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "6281234567890",
    "filename": "invoice.pdf",
    "caption": "Berikut invoice Anda"
  }'
```

### Tipe File Supported
- **Gambar:** JPG, PNG, GIF
- **Video:** MP4, AVI, MOV, MKV
- **Audio:** MP3, WAV, AAC, M4A
- **Dokumen:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Arsip:** ZIP, RAR
- **Text:** TXT

Max size: **50MB per file**

---

## ⚙️ Pengaturan & Konfigurasi

### API Keys Management

**Endpoint:** `POST /api/internal/api-keys`

```bash
curl -X POST http://192.168.10.20:8000/api/internal/api-keys \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "provider": "gemini",
    "apiKey": "your-gemini-api-key"
  }'
```

**Available Providers:**
- `gemini` - Google Gemini AI
- `custom_api` - Custom external API

### Template Pesan

**Endpoint:** `POST /api/internal/save-template`

```bash
curl -X POST http://192.168.10.20:8000/api/internal/save-template \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "name": "Greeting",
    "message": "Halo! Selamat datang di layanan kami"
  }'
```

---

## 🌐 Dashboard Pages

### Pages yang Tersedia

| Path | Nama | Fungsi |
|------|------|--------|
| `/` atau `/index.html` | **Utama** | Status bot & live log |
| `/scheduler.html` | **Scheduler** | Buat jadwal broadcast |
| `/validator.html` | **Validator** | Validasi nomor WA |
| `/settings.html` | **Pengaturan** | Manage API keys & templates |

### Cara Akses
```
1. Buka browser: http://192.168.10.20:8000
2. Login dengan username/password
3. Pilih menu di navbar
```

---

## 🔌 Integrasi Node-RED

### Setup Node-RED untuk Bot

**1. Email ke WhatsApp dengan Attachment**
```
Email Input → Extract Attachment → Upload ke Bot → Send to WhatsApp
```

**2. Web Form Submission**
```
Form Submit → Extract Data → Store/Process → Send WhatsApp Notification
```

**3. Scheduled Report**
```
Data Source → Generate Report → Upload → Send via Scheduler
```

---

## 📊 Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation berhasil",
  "data": {}
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "Deskripsi error",
  "statusCode": 400
}
```

---

## 🛠️ Troubleshooting

### Bot tidak terhubung ke WhatsApp

**Solusi:**
1. Hapus folder `auth_info_baileys/`
2. Restart bot: `node bot.js`
3. Scan QR code yang muncul

### Nomor tidak bisa menerima pesan

**Solusi:**
1. Pastikan nomor format internasional: `628xxx`
2. Nomor harus aktif di WhatsApp
3. Cek API Key valid

### Scheduler tidak berjalan

**Solusi:**
1. Pastikan bot sudah terhubung
2. Check cron syntax via `crontab.guru`
3. Lihat server log untuk error

### API Key tidak valid

**Solusi:**
1. Cek `.env` - `EXTERNAL_API_KEY`
2. Pastikan header: `X-API-Key: <value>`
3. Tidak ada spasi di awal/akhir

### File tidak bisa di-upload

**Solusi:**
1. Cek ukuran < 50MB
2. Pastikan format file supported
3. Folder `attachments/` writable

---

## 📞 Support & Contact

- **Issue Report:** Cek logs di browser DevTools (F12)
- **Bot Logs:** Terminal tempat `node bot.js` running
- **Database:** Check JSON files di root folder

---

## 🔗 Links & Resources

- [Attachment API](./ATTACHMENT_API.md)
- [Environment Setup](./PRODUCTION_DEPLOYMENT.md)
- [GitHub Repository](https://github.com/username/wa-bot-baileys)

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
