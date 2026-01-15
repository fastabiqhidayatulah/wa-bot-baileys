# 📎 API Dokumentasi - Attachment Handler

Dokumentasi lengkap untuk menggunakan fitur **Attachment Management** di WA Bot, terutama untuk integrasi dengan **Node-RED**.

---

## 🔑 Autentikasi

Semua endpoint attachment memerlukan header:
```
X-API-Key: <EXTERNAL_API_KEY>
```

Dapatkan value dari file `.env` Anda:
```
EXTERNAL_API_KEY=your-api-key-here
```

---

## 📤 1. Upload File Attachment

**Endpoint:** `POST /api/external/upload-attachment`

Upload file ke folder `attachments/` untuk kemudian dapat dikirim ke WhatsApp.

### Request
```bash
curl -X POST http://192.168.10.20:8000/api/external/upload-attachment \
  -H "X-API-Key: your-api-key" \
  -F "file=@/path/to/file.pdf"
```

### Node-RED Setup
```javascript
// Gunakan node "http request" dengan konfigurasi:
// Method: POST
// URL: http://192.168.10.20:8000/api/external/upload-attachment
// Headers:
// {
//   "X-API-Key": "your-api-key",
//   "Content-Type": "multipart/form-data"
// }

// Input dari email attachment:
// msg.payload = <binary file data>
// msg.headers["content-disposition"] = 'attachment; filename="document.pdf"'
```

### Response
```json
{
  "success": true,
  "filename": "document.pdf",
  "path": "/path/to/attachments/document.pdf",
  "size": 102400,
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Filename dan file buffer harus diisi"
}
```

---

## 📋 2. List Semua Attachment

**Endpoint:** `GET /api/external/attachments`

Ambil daftar semua file yang tersedia di folder attachments.

### Request
```bash
curl -X GET http://192.168.10.20:8000/api/external/attachments \
  -H "X-API-Key: your-api-key"
```

### Node-RED Setup
```javascript
// Gunakan node "http request" dengan:
// Method: GET
// URL: http://192.168.10.20:8000/api/external/attachments
// Return type: Parsed JSON object
```

### Response
```json
{
  "success": true,
  "count": 3,
  "files": [
    {
      "filename": "invoice_001.pdf",
      "size": 102400,
      "modified": "2026-01-14T10:30:00.000Z"
    },
    {
      "filename": "payment_proof.jpg",
      "size": 256000,
      "modified": "2026-01-14T10:25:00.000Z"
    },
    {
      "filename": "contract.docx",
      "size": 512000,
      "modified": "2026-01-14T10:20:00.000Z"
    }
  ]
}
```

---

## 📤 3. Kirim Attachment ke WhatsApp

**Endpoint:** `POST /api/external/send-attachment`

Kirim file yang sudah tersimpan ke nomor WhatsApp atau grup.

### Request
```bash
curl -X POST http://192.168.10.20:8000/api/external/send-attachment \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "6281234567890",
    "filename": "invoice_001.pdf",
    "caption": "Berikut invoice Anda"
  }'
```

### Node-RED Setup
```javascript
// Gunakan node "http request" dengan:
// Method: POST
// URL: http://192.168.10.20:8000/api/external/send-attachment
// Return type: Parsed JSON object

// msg.payload:
{
  "target": "6281234567890",  // nomor WA atau JID
  "filename": "invoice.pdf",   // nama file di folder attachments
  "caption": "Dokumen penting"  // opsional
}
```

### Response
```json
{
  "success": true,
  "message": "File invoice_001.pdf berhasil dikirim ke 6281234567890",
  "messageId": "WAMID123456789"
}
```

### Error Response
```json
{
  "success": false,
  "error": "File invoice_001.pdf tidak ditemukan"
}
```

---

## 🗑️ 4. Hapus Attachment

**Endpoint:** `DELETE /api/external/attachments/:filename`

Hapus file dari folder attachments.

### Request
```bash
curl -X DELETE http://192.168.10.20:8000/api/external/attachments/invoice_001.pdf \
  -H "X-API-Key: your-api-key"
```

### Node-RED Setup
```javascript
// Gunakan node "http request" dengan:
// Method: DELETE
// URL: http://192.168.10.20:8000/api/external/attachments/invoice_001.pdf
// Return type: Parsed JSON object
```

### Response
```json
{
  "success": true,
  "message": "File invoice_001.pdf berhasil dihapus"
}
```

---

## 🚀 Node-RED Integration Flow Example

### Skenario: Email dengan attachment → WhatsApp

```javascript
// Node-RED Flow JSON
{
  "id": "email-to-whatsapp",
  "type": "flow",
  "label": "Email to WhatsApp with Attachment",
  "nodes": [
    {
      "id": "email-in",
      "type": "email",
      "name": "Email In",
      "server": "imap.gmail.com",
      "protocol": "IMAP4",
      "port": 993,
      "box": "INBOX",
      "useSSL": true
    },
    {
      "id": "extract-attachment",
      "type": "function",
      "name": "Extract Attachment",
      "func": "// Extract first attachment dari email\nlet attachment = msg.payload.attachments[0];\nif (attachment) {\n  msg.filename = attachment.filename;\n  msg.data = Buffer.from(attachment.content, 'base64');\n  return msg;\n}\nreturn null;"
    },
    {
      "id": "upload-to-bot",
      "type": "http request",
      "name": "Upload to WA Bot",
      "method": "POST",
      "url": "http://192.168.10.20:8000/api/external/upload-attachment",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    },
    {
      "id": "send-to-whatsapp",
      "type": "http request",
      "name": "Send to WhatsApp",
      "method": "POST",
      "url": "http://192.168.10.20:8000/api/external/send-attachment",
      "headers": {
        "X-API-Key": "YOUR_API_KEY",
        "Content-Type": "application/json"
      },
      "payload": {
        "target": "6281234567890",
        "filename": "msg.filename",
        "caption": "Dokumen dari email"
      }
    }
  ]
}
```

---

## 📂 Struktur Folder

```
wa-bot-baileys/
├── attachments/              ← Folder untuk menyimpan file
│   ├── invoice_001.pdf
│   ├── payment_proof.jpg
│   └── contract.docx
├── handlers/
│   └── attachmentHandler.js  ← Handler logic
└── bot.js                    ← Main server
```

---

## ✅ Tipe File yang Didukung

| Kategori | Tipe File | Extension |
|----------|-----------|-----------|
| **Gambar** | JPEG, PNG, GIF | .jpg, .jpeg, .png, .gif |
| **Video** | MP4, AVI, MOV, MKV | .mp4, .avi, .mov, .mkv |
| **Audio** | MP3, WAV, AAC, M4A | .mp3, .wav, .aac, .m4a |
| **Dokumen** | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx |
| **Arsip** | ZIP, RAR | .zip, .rar |
| **Teks** | TXT | .txt |

---

## 🔒 Keamanan

1. **Path Traversal Protection**: Filename di-sanitize untuk mencegah akses ke folder lain
2. **API Key Required**: Semua endpoint memerlukan header `X-API-Key`
3. **File Size Limit**: Max 50MB per file
4. **MIME Type Validation**: Validasi berdasarkan extension file

---

## ⚙️ Konfigurasi Environment

Tambahkan ke `.env`:
```
EXTERNAL_API_KEY=secure-api-key-12345
PORT=8000
```

---

## 💡 Contoh Use Case

### 1. Auto-Forward Invoice dari Email ke Customer WA
```javascript
Email → Node-RED → Extract PDF → Upload ke Bot → Send ke Customer
```

### 2. Daily Report Distribution
```javascript
Report Generator → PDF Export → Upload → Send ke Management Group
```

### 3. Document Approval Flow
```javascript
Email with Attachment → Bot receives → Send to Approval Manager → Approval → Send Confirmation
```

---

## 🆘 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Forbidden: API Key tidak valid` | Pastikan header `X-API-Key` sama dengan `.env` |
| `File tidak ditemukan` | Pastikan file sudah di-upload terlebih dahulu |
| `Bot belum terhubung` | Pastikan bot sudah terhubung ke WhatsApp (scan QR) |
| `Nomor tidak terdaftar` | Gunakan nomor WhatsApp yang aktif |
| `Maximum call stack exceeded` | Restart bot: `node bot.js` |

---

## 📝 Notes

- File disimpan di folder `/attachments` (relative ke root bot)
- Pastikan folder tersebut writable dan memiliki space cukup
- File tidak auto-dihapus, delete manual via API jika tidak perlu
- Untuk production, gunakan HTTPS dan API key yang kuat

**Happy automating! 🎉**
