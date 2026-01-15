# Dokumentasi Web App Portal - WA Bot Baileys

## 📋 Ringkasan Umum
Web application ini adalah sebuah **Control Panel/Dashboard** untuk mengelola WhatsApp Bot yang dibangun dengan **Baileys** (library untuk interaksi WhatsApp). Portal ini memungkinkan pengguna untuk mengontrol bot, menjadwalkan pesan broadcast, validasi nomor, manajemen kalender, dan pengaturan reminder cuti.

**Status Deployment:** Berjalan di `http://localhost:8000`  
**Stack Teknologi:** Node.js + Express + Socket.IO + Tailwind CSS

---

## 🏗️ Arsitektur Aplikasi

### Backend (bot.js)
- **Framework:** Express.js v5.1.0
- **Real-time Communication:** Socket.IO v4.8.1
- **WhatsApp Integration:** @whiskeysockets/baileys v6.7.18
- **Task Scheduling:** node-cron v4.2.0
- **Authentication:** bcrypt + express-session
- **Logging:** pino + pino-pretty
- **Google Integration:** googleapis v150.0.1 (untuk Google Calendar)
- **AI Integration:** @google/generative-ai (Gemini)

### Frontend (HTML + Tailwind CSS)
- **Styling:** Tailwind CSS + Custom CSS
- **JavaScript:** Vanilla JS dengan Socket.IO client
- **Real-time Updates:** Socket.IO untuk live logging & status

---

## 📄 Struktur File & Folder

```
📦 WA Bot Baileys/
├── bot.js                      # Backend utama (757 baris)
├── package.json                # Dependencies & metadata
├── .env                         # Konfigurasi environment
├── users.json                  # Database user terenkripsi
├── schedules.json              # Jadwal broadcast yang disimpan
├── templates.json              # Template pesan yang disimpan
├── reminder_settings.json      # Konfigurasi reminder cuti
├── bot-logs.log                # Log file aplikasi
├── hash-password.js            # Utility untuk generate password hash
├── auth_info_baileys/          # Folder autentikasi WhatsApp
│   ├── creds.json              # Kredensial WA
│   ├── app-state-sync-*.json   # Sinkronisasi state WA
│   └── pre-key-*.json          # Kunci enkripsi WA
├── public/                     # Frontend files
│   ├── index.html              # Dashboard utama
│   ├── login.html              # Login page
│   ├── scheduler.html          # Penjadwalan broadcast
│   ├── validator.html          # Validasi nomor WA
│   ├── calendar.html           # Manajemen kalender cuti
│   └── settings.html           # Pengaturan reminder
└── handlers/                   # Business logic handlers
    ├── geminiHandler.js        # AI chatbot integration
    ├── cutiHandler.js          # Cuti/Leave management
    ├── leaveReminderHandler.js # Pengingat cuti otomatis
    └── helpHandler.js          # Perintah help
```

---

## 🔐 Sistem Autentikasi

### Login System
- **Tipe:** Session-based authentication (express-session)
- **Enkripsi Password:** bcrypt (bcrypt.compareSync)
- **Penyimpanan:** `users.json` dengan password ter-hash
- **Session Storage:** In-memory (default Express)
- **Protected Routes:**
  - GET `/` → Redirect ke login jika belum auth
  - GET `/index.html`, `/scheduler.html`, `/validator.html`, `/calendar.html`, `/settings.html`

### Middleware Authentication
```javascript
// checkPageAuth: Melindungi halaman HTML
// checkApiAuth: Melindungi API internal (/api/internal/*)
// checkApiKey: Melindungi API eksternal (header X-API-Key)
```

### Login Endpoint
```
POST /login
Body: { username, password }
Response: { message: "Login berhasil" } atau error 401
```

---

## 🔌 Socket.IO Real-time Events

### Server → Client Events
| Event | Data | Deskripsi |
|-------|------|-----------|
| `status` | `{status, qr}` | Update status koneksi & QR code |
| `log` | `string` | Live log messages |
| `validation-update` | `{number, status}` | Update progress validasi nomor |
| `validation-progress` | `{checked, total}` | Progress bar validasi |
| `validation-complete` | - | Validasi selesai |
| `schedule_updated` | - | Refresh data scheduler |
| `templates_updated` | - | Refresh template list |

### Client → Server Events
| Event | Data | Deskripsi |
|-------|------|-----------|
| `validate-numbers` | `{numbers: []}` | Validasi daftar nomor WA |

---

## 📡 API Endpoints

### 1. Authentication
```
POST /login
POST /logout
```

### 2. Status & Connection
```
GET /api/internal/status
Returns: { status: string, qr: string|null }

POST /api/internal/logout-wa
Restart bot dan hapus session WA
```

### 3. Grup Management
```
GET /api/internal/get-groups
Returns: [{ id, subject }]
```

### 4. Template Management
```
GET /api/internal/get-templates
Returns: [{ name, message }]

POST /api/internal/save-template
Body: { name, message }
```

### 5. Scheduler (Broadcasting)
```
GET /api/internal/get-scheduled-jobs
Returns: [{ id, targets, groups, message, scheduleType, 
           scheduleData, status, lastRun, recipientString, 
           scheduleString, nextRun }]

POST /api/internal/schedule-message
Body: {
  targets: [nomor],           # Personal numbers
  groups: [groupId],          # Group IDs
  message: string,
  templateName: string,
  scheduleType: "now|once|daily|weekly|monthly",
  scheduleData: { 
    time: "HH:MM",           # Untuk daily/weekly/monthly
    date: "YYYY-MM-DD",      # Untuk once
    days: [0-6]              # Untuk weekly (0=Sun, 6=Sat)
  }
}

POST /api/internal/pause-job/:id
Jeda penjadwalan

POST /api/internal/resume-job/:id
Lanjutkan penjadwalan

POST /api/internal/cancel-job/:id
Batalkan & hapus jadwal
```

### 6. Validasi Nomor
```
Via Socket.IO: emit('validate-numbers', { numbers: [] })
Cek nomor registrasi di WhatsApp dengan delay random 2-5 detik
```

### 7. Google Calendar Integration
```
GET /google-auth
Redirect ke Google OAuth2 consent screen

GET /oauth2callback?code=...
Callback setelah autentikasi Google

GET /api/internal/google-status
Returns: { connected: boolean }

GET /api/internal/get-calendar-events?start=...&end=...
Ambil event kalender dalam rentang tanggal

POST /api/internal/create-calendar-event
Body: { summary, start, end, description }
```

### 8. Reminder Settings
```
GET /api/internal/get-reminder-settings
Returns: { schedule: "cron", targets: { personal, groups } }

POST /api/internal/save-reminder-settings
Body: { schedule: "cron format", targets: { personal, groups } }
```

### 9. External API (dengan API Key)
```
POST /api/external/send-message
Header: X-API-Key: <EXTERNAL_API_KEY>
Body: {
  targetType: "personal|group",
  target: "nomor_atau_nama_grup",
  message: string
}
```

---

## 🤖 WhatsApp Bot Commands

Bot merespons pesan dengan format command yang dimulai dengan `/`:

### 1. `/help`
Menampilkan daftar command yang tersedia

### 2. `/gemini <pertanyaan>`
AI-powered chatbot menggunakan Google Gemini API
```
Example: /gemini Apa itu machine learning?
```

### 3. `/cuti #<tanggal> <bulan> <tahun> #<nama>`
Membuat event cuti di Google Calendar

Format:
- Single day: `/cuti #1 Maret 2025 #Nama Anda`
- Multiple consecutive: `/cuti #1-3 Maret 2025 #Nama Anda`
- Multiple non-consecutive: `/cuti #1,5,8 Maret 2025 #Nama Anda`

---

## 📑 Frontend Pages

### 1. Login Page (`login.html`)
- Form login username/password
- Validasi client-side
- Redirect ke dashboard setelah login

### 2. Dashboard Utama (`index.html`)
**Fitur:**
- Status koneksi WhatsApp real-time
- Display QR code untuk scan
- Log viewer (scrollable, 400px height)
- Tombol logout & hapus sesi
- Quick actions sidebar

**Navigasi:** Header dengan 5 tab utama

### 3. Scheduler (`scheduler.html`)
**Fitur:**
- 3 langkah pembuatan broadcast:
  1. **Create Message:** Template selection + custom message
  2. **Select Target:** Personal numbers & groups
  3. **Schedule:** Tipe jadwal (now, once, daily, weekly, monthly)

- Tabel jadwal dengan kolom:
  - ID, Message Preview, Recipient, Schedule, Status, Last Run, Next Run
  - Action buttons: Pause, Resume, Cancel

- Save template untuk reuse

### 4. Validator (`validator.html`)
**Fitur:**
- Input nomor (one per line)
- Validasi real-time dengan progress bar
- Hasil: Aktif / Tidak Terdaftar / Error
- Delay 2-5 detik antar validasi

### 5. Calendar (`calendar.html`)
**Fitur:**
- Integrasi Google Calendar
- Tombol autentikasi Google
- Display event dalam kalender interaktif
- Create event langsung dari dashboard

### 6. Settings (`settings.html`)
**Fitur:**
- Configure reminder cron schedule
- Select target personal & groups untuk reminder
- Save settings dan auto-reload scheduler

---

## 📊 Data Models

### 1. User (users.json)
```json
[
  {
    "username": "admin",
    "password": "bcrypt_hash"
  }
]
```

### 2. Schedule (schedules.json)
```json
[
  {
    "id": "uuid",
    "targets": ["08xxx", "08yyy"],
    "groups": ["group-id-1"],
    "message": "Pesan broadcast",
    "templateName": "Nama Template",
    "scheduleType": "daily|weekly|monthly|once|now",
    "scheduleData": {
      "time": "14:30",
      "date": "2025-01-15",
      "days": [1,3,5]
    },
    "status": "Active|Paused",
    "lastRun": {
      "time": "2025-01-15T14:30:00.000Z",
      "status": "Sukses|Gagal"
    }
  }
]
```

### 3. Template (templates.json)
```json
[
  {
    "name": "Info Promo",
    "message": "Halo! Promo spesial untuk Anda..."
  }
]
```

### 4. Reminder Settings (reminder_settings.json)
```json
{
  "schedule": "0 7 * * *",
  "targets": {
    "personal": ["08xxx"],
    "groups": ["group-id-1"]
  }
}
```

---

## ⏱️ Scheduling System (node-cron)

### Supported Schedule Types:
1. **now** - Kirim langsung
2. **once** - Sekali di waktu tertentu
3. **daily** - Setiap hari jam X
4. **weekly** - Hari tertentu jam X (0-6, Sun-Sat)
5. **monthly** - Tanggal tertentu jam X

### Cron Format Examples:
```
"0 7 * * *"       # Setiap hari jam 07:00
"0 14 * * 1,3,5"  # Senin, Rabu, Jumat jam 14:00
"0 9 15 * *"      # Tanggal 15 setiap bulan jam 09:00
```

### Fitur:
- Pause/Resume jadwal tanpa menghapus
- Track `lastRun` status (Sukses/Gagal)
- Calculate `nextRun` untuk display
- Timezone: Asia/Jakarta
- Bug fix: Cleanup old tasks sebelum reload

---

## 🔧 Environment Variables (.env)

| Variable | Deskripsi | Contoh |
|----------|-----------|---------|
| `PORT` | Port server | 8000 |
| `SESSION_SECRET` | Secret untuk session encryption | `Tabie418728!` |
| `WEB_USERNAME` | Username default login | admin |
| `WEB_PASSWORD` | Password default login | 418728 |
| `GEMINI_API_KEY` | API key Google Gemini | AIzaSy... |
| `EXTERNAL_API_KEY` | API key eksternal | e8a3b7... |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID | 858200... |
| `GOOGLE_CLIENT_SECRET` | OAuth2 secret | GOCSPX-... |
| `GOOGLE_REDIRECT_URI` | Callback URL | http://localhost:8000/oauth2callback |
| `LEAVE_CALENDAR_ID` | Google Calendar ID | ges3ra... |

---

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Buat atau edit `.env` dengan variabel yang sesuai

### 3. Generate Password Hash (opsional)
```bash
node hash-password.js
```
Input username & password untuk generate hash

### 4. Start Server
```bash
node bot.js
```

Server akan:
- Berjalan di `http://localhost:8000`
- Display QR code di terminal untuk scan WhatsApp
- Menampilkan log di console dan dashboard

### 5. Akses Dashboard
- URL: `http://localhost:8000`
- Login dengan credentials dari `.env`

---

## 🔄 Workflow Penjadwalan Broadcast

```
User (Dashboard)
    ↓
POST /api/internal/schedule-message
    ↓
Backend: Create Job (UUID) + Save ke schedules.json
    ↓
Create Cron Task (node-cron)
    ↓
At Scheduled Time:
    ├→ sendBroadcastWithDelay()
    ├→ Loop targets dengan delay 5-10 detik
    ├→ Send message via sock.sendMessage()
    ├→ Update lastRun status (Sukses/Gagal)
    └→ Emit 'schedule_updated' ke Socket.IO
    ↓
Frontend: Refresh schedule list
```

---

## 🔔 Workflow Reminder Cuti

```
setupLeaveReminder() at Bot startup
    ↓
Create Cron Job (reminder_settings.schedule)
    ↓
At Scheduled Time:
    ├→ Authenticate Google Calendar
    ├→ getLeaveData() untuk hari ini
    ├→ formatLeaveMessage() dengan daftar yang cuti
    ├→ sendBroadcastWithDelay() ke target
    └→ Emit log ke Socket.IO
```

---

## 🔐 Security Considerations

1. **Password:** Hashed dengan bcrypt (compareSync)
2. **Session:** Menggunakan SECRET dari `.env`
3. **API Key:** External API dilindungi header `X-API-Key`
4. **Protected Routes:** Semua page & API diproteksi auth
5. **Google OAuth:** Secure token storage via leaveReminderHandler
6. **Limitations:**
   - Session in-memory (tidak persistent di restart)
   - Tidak ada HTTPS (development only)
   - Perlu upgrade untuk production

---

## 📈 Logging & Monitoring

### Log Locations:
1. **Console:** Real-time output
2. **File:** `bot-logs.log`
3. **Dashboard:** Live log viewer via Socket.IO

### Log Format:
```
[DD/MM/YYYY HH:MM:SS] [info|error|warn] MESSAGE
```

### Log Emitted via Socket.IO:
Semua log dikirim ke connected clients untuk real-time display

---

## ⚠️ Known Limitations & Improvements

### Current Issues:
1. **Session tidak persistent** → Perlu implement external session store (Redis)
2. **No HTTPS** → Production perlu SSL
3. **Queue system belum ada** → Broadcast besar bisa timeout
4. **Rate limiting belum ada** → WhatsApp bisa block bot
5. **Error handling terbatas** → Perlu better error recovery

### Potential Improvements:
1. Add message queue (Bull/RabbitMQ)
2. Implement Redis for session store
3. Add comprehensive error logging
4. Rate limiting & retry logic
5. Database migration (MongoDB/PostgreSQL)
6. Docker containerization
7. PM2 ecosystem file
8. Unit & integration tests

---

## 📞 Contact & Support

**Project:** WA Bot Baileys  
**Main File:** `bot.js`  
**Backend:** Express.js + Node.js  
**WhatsApp API:** Baileys  

---

**Last Updated:** 4 Desember 2025  
**Documentation Version:** 1.0
