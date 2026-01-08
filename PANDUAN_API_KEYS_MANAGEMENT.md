# Panduan Manajemen API Keys & Tokens

## 📋 Ringkasan

Fitur **Manajemen API Keys** memungkinkan Anda untuk mengatur, mengupdate, dan mengelola API keys dari berbagai layanan AI dan integrasi **langsung melalui dashboard** tanpa perlu edit file `.env` secara manual.

**Status:** ✅ Implementasi Lengkap  
**Lokasi:** `http://localhost:8000/settings.html`

---

## 🎯 Keuntungan Fitur Ini

1. **✅ GUI Management** - Tidak perlu manual edit `.env`
2. **✅ Enkripsi Aman** - API keys dienkripsi dengan AES-256 sebelum disimpan
3. **✅ Validasi Real-time** - Test API key sebelum menyimpan
4. **✅ Easy Updates** - Update API key kapan saja tanpa restart
5. **✅ Preview Aman** - Hanya tampil 10 karakter terakhir
6. **✅ Multi-Provider** - Support Gemini, Google Calendar, Custom API

---

## 📡 Arsitektur & Files

### Backend Files

#### 1. `handlers/apiKeyManager.js` (NEW)
Manager untuk enkripsi/dekripsi API keys dengan fungsi:

```javascript
encrypt(text)                          // Enkripsi dengan AES-256
decrypt(text)                          // Dekripsi
loadApiKeys()                          // Baca dari api_keys.json
saveApiKeys(keys)                      // Simpan ke api_keys.json
getApiKey(provider)                    // Get preview + status
getDecryptedApiKey(provider)           // Get full key (internal only)
setApiKey(provider, apiKey)            // Simpan/update
deleteApiKey(provider)                 // Hapus
validateApiKey(provider, apiKey)       // Validasi key sebelum simpan
getAvailableProviders()                // List provider tersedia
```

#### 2. `api_keys.json` (NEW)
Database untuk menyimpan API keys terenkripsi:

```json
{
  "gemini": "iv:encrypted_value",
  "google_calendar": "iv:encrypted_value",
  "custom_api": "iv:encrypted_value"
}
```

#### 3. `bot.js` (MODIFIED)
Tambahan 4 endpoint API:

```
GET  /api/internal/api-keys                    # Dapatkan list API keys
POST /api/internal/api-keys                    # Simpan/update API key
DELETE /api/internal/api-keys/:provider        # Hapus API key
POST /api/internal/api-keys/test/:provider     # Validasi API key
```

#### 4. `handlers/geminiHandler.js` (MODIFIED)
Update untuk menggunakan API key dari manager terlebih dahulu:

```javascript
// Prioritas:
// 1. API key dari api_keys.json (terenkripsi)
// 2. Fallback ke GEMINI_API_KEY dari .env
```

### Frontend Files

#### `public/settings.html` (MODIFIED)
Tambahan section **"Manajemen API Keys & Tokens"** dengan:

1. **Grid Cards** - Menampilkan status setiap provider
2. **Modal Dialog** - Form untuk add/edit API key
3. **Validasi Real-time** - Test button sebelum save
4. **Show/Hide Password** - Checkbox untuk tampil API key

---

## 🎨 UI Components

### Main Section
```
┌─────────────────────────────────────────┐
│ Manajemen API Keys & Tokens             │
│ Kelola API keys untuk berbagai layanan  │
├─────────────────────────────────────────┤
│
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 🤖 Gemini    │  │ 📅 Calendar  │    │
│  │ Active ✓     │  │ Inactive ✗   │    │
│  │ ...abc123def │  │              │    │
│  └──────────────┘  └──────────────┘    │
│
│  ┌──────────────┐                      │
│  │ 🔌 Custom    │                      │
│  │ Inactive ✗   │                      │
│  └──────────────┘                      │
└─────────────────────────────────────────┘
```

### Modal Dialog
```
┌─────────────────────────────────────┐
│ Atur Google Gemini AI                │
├─────────────────────────────────────┤
│                                     │
│ API Key [password input]            │
│ ☐ Tampilkan API Key                 │
│                                     │
│ ℹ️ Dapatkan dari: [link]             │
│                                     │
│ ┌────────────┬──────────┬─────────┐ │
│ │Validasi    │ Simpan   │ Batal   │ │
│ └────────────┴──────────┴─────────┘ │
│                                     │
│ [Validation message: OK/ERROR]      │
└─────────────────────────────────────┘
```

---

## 🔐 Enkripsi & Keamanan

### Algoritma
- **Type:** AES-256-CBC
- **Key Length:** 32 bytes (256 bits)
- **IV:** 16 bytes random per encryption
- **Format:** `{iv}:{encrypted_value}` (hex encoded)

### Contoh Flow
```
User Input: "AIzaSyC0HYb5cboGHUyS99yMgPWiPgiBeiqUn8w"
    ↓
Generate Random IV (16 bytes)
    ↓
Encrypt dengan AES-256-CBC
    ↓
Hasil: "a1b2c3d4e5f6g7h8:xyz123...encrypted"
    ↓
Simpan ke api_keys.json
    ↓
Saat digunakan: Decrypt → gunakan plain text
```

### Keamanan Tips
1. **Ubah ENCRYPTION_KEY** di `.env` untuk production
2. **Jangan share api_keys.json** - berisi data sensitif
3. **Gunakan HTTPS** di production
4. **Backup api_keys.json** - kehilangan ENCRYPTION_KEY = kehilangan akses

---

## 📋 API Endpoints

### 1. GET /api/internal/api-keys
Dapatkan list API keys (tanpa nilai, hanya preview)

**Request:**
```
GET /api/internal/api-keys
Authorization: Session
```

**Response:**
```json
[
  {
    "id": "gemini",
    "name": "Google Gemini AI",
    "icon": "🤖",
    "color": "blue",
    "isSet": true,
    "preview": "iqUn8w"
  },
  {
    "id": "google_calendar",
    "name": "Google Calendar OAuth",
    "icon": "📅",
    "color": "red",
    "isSet": false,
    "preview": ""
  }
]
```

### 2. POST /api/internal/api-keys
Simpan/update API key baru

**Request:**
```json
{
  "provider": "gemini",
  "apiKey": "AIzaSyC0HYb5cboGHUyS99yMgPWiPgiBeiqUn8w"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key gemini berhasil disimpan"
}
```

**Error:**
```json
{
  "error": "API key tidak valid atau format salah"
}
```

### 3. DELETE /api/internal/api-keys/:provider
Hapus API key

**Request:**
```
DELETE /api/internal/api-keys/gemini
```

**Response:**
```json
{
  "success": true,
  "message": "API key gemini berhasil dihapus"
}
```

### 4. POST /api/internal/api-keys/test/:provider
Validasi API key sebelum menyimpan

**Request:**
```json
{
  "apiKey": "AIzaSyC0HYb5cboGHUyS99yMgPWiPgiBeiqUn8w"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "message": "API key valid"
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "API key tidak valid atau expired"
}
```

---

## 📊 Supported Providers

### 1. 🤖 Google Gemini AI
- **ID:** `gemini`
- **Deskripsi:** AI chatbot untuk `/gemini` command
- **Dapatkan:** https://aistudio.google.com/app/apikeys
- **Validasi:** Real-time API call test
- **Fallback:** Process.env.GEMINI_API_KEY

### 2. 📅 Google Calendar OAuth
- **ID:** `google_calendar`
- **Deskripsi:** OAuth credentials untuk Calendar integration
- **Dapatkan:** Google Cloud Console → OAuth 2.0 Client ID
- **Validasi:** Format check (contains "apps.googleusercontent.com")
- **Fallback:** Process.env.GOOGLE_CLIENT_ID

### 3. 🔌 Custom External API
- **ID:** `custom_api`
- **Deskripsi:** Custom API key untuk integrasi eksternal
- **Dapatkan:** Dari service provider Anda
- **Validasi:** Basic format check
- **Fallback:** Process.env.EXTERNAL_API_KEY

---

## 🚀 Cara Menggunakan

### 1. Akses Dashboard
```
URL: http://localhost:8000/settings.html
Login: admin / 418728 (atau credentials Anda)
```

### 2. Navigasi ke Manajemen API Keys
Di halaman Settings, Anda akan melihat section **"Manajemen API Keys & Tokens"** di bagian atas.

### 3. Klik Card Provider
- **Warna Hijau** = API key sudah aktif
- **Warna Abu-abu** = Belum diatur

### 4. Form Input
1. Isi API key di field input
2. (Optional) Klik **Tampilkan API Key** untuk verify
3. Klik **Coba Validasi** untuk test sebelum save
4. Klik **Simpan** untuk menyimpan

### 5. Validasi Berhasil
Jika validasi OK:
```
✓ API key valid
```

Jika gagal:
```
✗ API key tidak valid atau format salah
```

### 6. Menyimpan
Setelah submit, API key akan:
1. ✅ Dienkripsi dengan AES-256
2. ✅ Disimpan ke `api_keys.json`
3. ✅ Dimuat ke memory (process.env)
4. ✅ Card status berubah menjadi "Aktif" ✓

---

## 💾 Environment Variables

### `.env` Configuration

```dotenv
# Encryption key untuk API keys (WAJIB DIUBAH untuk production!)
ENCRYPTION_KEY=your-secret-encryption-key-change-this-in-production

# Gemini API (fallback jika tidak ada di dashboard)
GEMINI_API_KEY=AIzaSyC0HYb5cboGHUyS99yMgPWiPgiBeiqUn8w

# Google OAuth (fallback)
GOOGLE_CLIENT_ID=858200110074-...
GOOGLE_CLIENT_SECRET=GOCSPX-...

# External API (fallback)
EXTERNAL_API_KEY=e8a3b7d1f9c0e5a...
```

### Priority Order
```
1. api_keys.json (dari dashboard) ← PRIMARY
2. .env variables              ← FALLBACK
```

---

## 🔄 Workflow Contoh

### Scenario: Update Gemini API Key

```
1. User akses Settings → "Atur Google Gemini AI"
   ↓
2. Input API key baru
   ↓
3. Klik "Coba Validasi"
   ↓
   Backend: Call Gemini API dengan key
   ↓
   Response: "✓ API key valid"
   ↓
4. Klik "Simpan"
   ↓
5. Backend:
   - Encrypt key: AES-256-CBC
   - Save ke api_keys.json
   - Load ke process.env.GEMINI_API_KEY
   ↓
6. Response: "✓ API key gemini berhasil disimpan"
   ↓
7. Frontend: Refresh list, card berubah "Aktif ✓"
   ↓
8. Mulai sekarang: /gemini command menggunakan API key baru
```

---

## ⚙️ Integrasi dengan Handlers

### Gemini Handler
```javascript
// handlers/geminiHandler.js

// Ambil dari manager (terenkripsi) atau fallback ke .env
let geminiKey = apiKeyManager.getDecryptedApiKey('gemini') 
                || process.env.GEMINI_API_KEY;

if (!geminiKey) {
    // API key belum dikonfigurasi
    return 'Silakan atur di dashboard';
}

// Gunakan key
const genAI = new GoogleGenerativeAI(geminiKey);
```

### Future Integrations
```javascript
// Untuk handler lain (cutiHandler, leaveReminderHandler, dll)
// Bisa mengikuti pattern yang sama:

const googleKey = apiKeyManager.getDecryptedApiKey('google_calendar') 
                  || process.env.GOOGLE_CLIENT_ID;

const customKey = apiKeyManager.getDecryptedApiKey('custom_api')
                  || process.env.EXTERNAL_API_KEY;
```

---

## 🆘 Troubleshooting

### Error: "ENCRYPTION_KEY not set"
**Solusi:** Set `ENCRYPTION_KEY` di `.env`
```dotenv
ENCRYPTION_KEY=my-secret-key-12345
```

### Error: "Gagal dekripsi API key"
**Penyebab:** ENCRYPTION_KEY berbeda saat menyimpan vs membaca  
**Solusi:** Pastikan ENCRYPTION_KEY konsisten, atau reset api_keys.json

### API Key tidak ter-update setelah save
**Penyebab:** Bot perlu restart untuk load key baru  
**Solusi:** 
```bash
# Via PM2
pm2 restart whatsapp-bot

# Atau manual
Ctrl+C di terminal
node bot.js
```

### "API key valid" tapi masih error saat digunakan
**Penyebab:** API key sudah expired atau rate limit  
**Solusi:** Generate API key baru dari provider

---

## 📈 Future Enhancements

1. **Export/Backup Keys** - Export encrypted backup
2. **Key Rotation** - Schedule auto-update keys
3. **Usage Analytics** - Track API usage per key
4. **Rate Limiting** - Set rate limit per API
5. **Multi-region Support** - Different keys per region
6. **Audit Logging** - Log semua perubahan API key
7. **WebSocket Updates** - Real-time sync across instances

---

## 🔒 Security Checklist

- [ ] Ubah `ENCRYPTION_KEY` di `.env` untuk production
- [ ] Backup `api_keys.json` secara berkala
- [ ] Gunakan HTTPS di production
- [ ] Jangan expose `.env` atau `api_keys.json` di version control
- [ ] Rotate API keys secara periodik
- [ ] Monitor penggunaan API untuk deteksi abuse
- [ ] Gunakan secrets management (AWS Secrets Manager, Vault, dll) di enterprise

---

## 📚 Related Files

| File | Tujuan |
|------|--------|
| `handlers/apiKeyManager.js` | Manager enkripsi/dekripsi |
| `api_keys.json` | Database terenkripsi |
| `bot.js` | Backend API endpoints |
| `public/settings.html` | Frontend UI |
| `handlers/geminiHandler.js` | Integrasi Gemini |
| `.env` | Fallback & encryption key |

---

## 📝 Notes

1. **In-Memory Storage:** Setelah restart, API keys akan dimuat dari `api_keys.json` secara otomatis
2. **Session Required:** Semua API endpoint memerlukan valid session/login
3. **No API Key Leakage:** Frontend tidak pernah menerima plain-text API key, hanya preview
4. **Backward Compatible:** Fitur lama (env variables) masih berfungsi

---

**Last Updated:** 4 Desember 2025  
**Version:** 1.0  
**Status:** Production Ready
