# ⚡ API Quick Reference

**Panduan cepat untuk semua API endpoints**

---

## 🔑 Autentikasi

```
Header: X-API-Key: your-api-key
atau
Session: Login di dashboard dulu
```

---

## 💬 ChatBot - Gemini AI

**WhatsApp Command:**
```
/gemini [pertanyaan]
/gemini Apa itu machine learning?
```

---

## 📤 Broadcast Scheduler

### Buat Jadwal
```bash
POST /api/internal/create-schedule
{
  "message": "Halo semua!",
  "targets": ["6281234567890"],
  "scheduleType": "daily",
  "scheduleData": {"time": "10:00"}
}
```

### List Jadwal
```bash
GET /api/internal/list-schedules
```

### Pause/Resume
```bash
POST /api/internal/pause-schedule/job-id
POST /api/internal/resume-schedule/job-id
```

---

## ✅ Validator Nomor WA

### Validasi Bulk
```bash
POST /api/internal/validate-numbers (via Socket.IO)
{
  "numbers": ["6281234567890", "6287654321000"]
}
```

---

## 📎 Attachment Management

### Upload File
```bash
POST /api/external/upload-attachment
-F "file=@document.pdf"

Response:
{
  "filename": "document.pdf",
  "size": 102400
}
```

### List Files
```bash
GET /api/external/attachments

Response:
{
  "files": [
    {"filename": "doc.pdf", "size": 102400}
  ]
}
```

### Send to WhatsApp
```bash
POST /api/external/send-attachment
{
  "target": "6281234567890",
  "filename": "document.pdf",
  "caption": "Dokumen penting"
}
```

### Delete File
```bash
DELETE /api/external/attachments/document.pdf
```

---

## ⚙️ Manage API Keys

### Set API Key
```bash
POST /api/internal/api-keys
{
  "provider": "gemini",
  "apiKey": "your-key"
}
```

### Get API Keys
```bash
GET /api/internal/api-keys
```

### Test API Key
```bash
POST /api/internal/api-keys/test/gemini
{
  "apiKey": "your-key"
}
```

---

## 📋 Templates

### Save Template
```bash
POST /api/internal/save-template
{
  "name": "Greeting",
  "message": "Halo! Selamat datang"
}
```

### Get Templates
```bash
GET /api/internal/get-templates
```

---

## 🌐 Status & Connection

### Bot Status
```bash
GET /api/internal/status
```

### Groups List
```bash
GET /api/internal/get-groups
```

### Logout
```bash
POST /api/internal/logout-wa
```

---

## 🚀 External API (Node-RED)

### Send Message
```bash
POST /api/external/send-message
X-API-Key: your-api-key

{
  "targetType": "personal",
  "target": "6281234567890",
  "message": "Halo!"
}
```

---

## 🧪 Test dengan cURL

### Template
```bash
curl -X [METHOD] [URL] \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Contoh
```bash
# Upload file
curl -X POST http://192.168.10.20:8000/api/external/upload-attachment \
  -H "X-API-Key: abc123" \
  -F "file=@test.pdf"

# Send message
curl -X POST http://192.168.10.20:8000/api/external/send-message \
  -H "X-API-Key: abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "personal",
    "target": "6281234567890",
    "message": "Hello!"
  }'
```

---

## 📞 Common Errors

| Error | Solusi |
|-------|--------|
| `Forbidden: API Key tidak valid` | Cek header `X-API-Key` |
| `Bot belum terhubung` | Scan QR code dulu |
| `Nomor tidak terdaftar` | Gunakan nomor aktif WA |
| `File tidak ditemukan` | Upload file dulu |

---

**Lihat dokumentasi lengkap:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
