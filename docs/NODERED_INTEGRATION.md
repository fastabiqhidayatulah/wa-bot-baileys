# 🔗 Node-RED Integration Guide

**Panduan lengkap mengintegrasikan WA Bot dengan Node-RED**

---

## 📋 Daftar Isi

1. [Setup Node-RED](#setup-node-red)
2. [Konfigurasi Bot Connection](#konfigurasi-bot-connection)
3. [Email to WhatsApp Flow](#email-to-whatsapp-flow)
4. [Advanced Examples](#advanced-examples)
5. [Troubleshooting](#troubleshooting)

---

## Setup Node-RED

### Instalasi

```bash
# Install Node-RED
npm install -g node-red

# Jalankan
node-red

# Akses di browser
http://localhost:1880
```

### Install Required Nodes

Di Node-RED Editor:
1. Klik menu (≡) → Manage palette
2. Install nodes:
   - `node-red-node-email`
   - `node-red-contrib-http-request`
   - `node-red-contrib-multipart-parser`

---

## Konfigurasi Bot Connection

### Setup HTTP Request Node

**Properties:**

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `http://192.168.10.20:8000/api/external/[endpoint]` |
| Headers | `X-API-Key: your-api-key` |
| Return Type | Parsed JSON object |

### Environment Variables (Optional)

```
Edit Node-RED settings.js:
module.exports = {
  ...
  contextStorage: {
    default: { module: 'memory' },
    file: { module: 'localfilesystem' }
  },
  httpRequestTimeout: 120000,
  ...
}
```

---

## Email to WhatsApp Flow

### Use Case
Terima email dengan attachment → Kirim ke WhatsApp

### Flow JSON

```json
[
  {
    "id": "email_in",
    "type": "email in",
    "name": "Inbox Gmail",
    "protocol": "IMAP4",
    "server": "imap.gmail.com",
    "port": 993,
    "useSSL": true,
    "box": "INBOX",
    "repeat": "10m"
  },
  {
    "id": "extract_attachment",
    "type": "function",
    "name": "Extract First Attachment",
    "func": "if (msg.payload.attachments && msg.payload.attachments[0]) {\n  let att = msg.payload.attachments[0];\n  msg.filename = att.filename;\n  msg.filedata = Buffer.from(att.content, 'base64');\n  msg.from = msg.payload.from[0].address;\n  return msg;\n}\nreturn null;"
  },
  {
    "id": "upload_to_bot",
    "type": "http request",
    "name": "Upload ke Bot",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/upload-attachment",
    "headers": {
      "X-API-Key": "your-api-key"
    },
    "inputType": "form-data",
    "files": {
      "file": "msg.filedata"
    }
  },
  {
    "id": "send_to_whatsapp",
    "type": "http request",
    "name": "Send to WhatsApp",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/send-attachment",
    "headers": {
      "X-API-Key": "your-api-key",
      "Content-Type": "application/json"
    },
    "payload": {
      "target": "6281234567890",
      "filename": "msg.payload.filename",
      "caption": "msg.payload.subject"
    }
  },
  {
    "id": "debug",
    "type": "debug",
    "name": "Debug Output"
  }
]
```

### Cara Setup

1. **Di Node-RED:**
   - Import JSON di atas
   - Edit node "Inbox Gmail" dengan email & password
   - Update target WhatsApp di "Send to WhatsApp"
   - Deploy

2. **Konfigurasi Email:**
   - Gmail: Gunakan App Password (2FA required)
   - Outlook: Username & password biasa
   - IMAP Settings: Check di email provider

---

## Advanced Examples

### 1. Web Form → WhatsApp Notification

```javascript
// HTTP POST endpoint (form submission)
// Di Node-RED: Listen HTTP in node

[
  {
    "id": "http_in",
    "type": "http in",
    "method": "POST",
    "path": "/form-submit",
    "name": "Form Submission"
  },
  {
    "id": "extract_data",
    "type": "function",
    "func": "msg.payload = {\n  target: msg.payload.phone,\n  message: 'Form diterima dari: ' + msg.payload.name\n};\nreturn msg;"
  },
  {
    "id": "send_message",
    "type": "http request",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/send-message",
    "headers": { "X-API-Key": "your-api-key" }
  }
]
```

### 2. Scheduled Broadcast

```javascript
// Kirim pesan setiap hari jam 9 pagi

[
  {
    "id": "cron",
    "type": "inject",
    "repeat": "0 9 * * *",
    "name": "Daily 9 AM"
  },
  {
    "id": "build_message",
    "type": "function",
    "func": "msg.payload = {\n  targetType: 'group',\n  target: 'Group Name',\n  message: 'Laporan harian: ' + new Date().toISOString()\n};\nreturn msg;"
  },
  {
    "id": "broadcast",
    "type": "http request",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/send-message",
    "headers": { "X-API-Key": "your-api-key" }
  }
]
```

### 3. Database → WhatsApp Alert

```javascript
// Query database → Kirim alert WhatsApp jika kondisi tertentu

[
  {
    "id": "db_query",
    "type": "mysql",
    "query": "SELECT * FROM orders WHERE status='pending' LIMIT 10"
  },
  {
    "id": "check_condition",
    "type": "switch",
    "property": "msg.payload.length",
    "rules": [
      {
        "t": "gt",
        "v": "0",
        "vt": "num"
      }
    ]
  },
  {
    "id": "format_alert",
    "type": "template",
    "template": "Ada {{msg.payload.length}} order pending"
  },
  {
    "id": "send_alert",
    "type": "http request",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/send-message",
    "payload": {
      "targetType": "personal",
      "target": "6281234567890",
      "message": "msg.payload"
    }
  }
]
```

### 4. File Processing Pipeline

```javascript
// Download file → Process → Upload → Send via WhatsApp

[
  {
    "id": "get_file",
    "type": "http request",
    "method": "GET",
    "url": "http://example.com/export/report.pdf"
  },
  {
    "id": "save_locally",
    "type": "file",
    "filename": "/tmp/report.pdf",
    "action": "delete"
  },
  {
    "id": "upload_to_bot",
    "type": "http request",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/upload-attachment",
    "inputType": "form-data",
    "files": {
      "file": "msg.payload"
    }
  },
  {
    "id": "broadcast_file",
    "type": "http request",
    "method": "POST",
    "url": "http://192.168.10.20:8000/api/external/send-attachment",
    "payload": {
      "target": "GROUP_ID",
      "filename": "report.pdf",
      "caption": "Laporan harian"
    }
  }
]
```

---

## Contoh Function Node

### Extract Data dari Email

```javascript
let attachment = msg.payload.attachments?.[0];
if (!attachment) {
  node.warn('No attachment found');
  return null;
}

msg.filename = attachment.filename;
msg.filedata = Buffer.from(attachment.content, 'base64');
msg.sender = msg.payload.from[0].address;
msg.subject = msg.payload.subject;

return msg;
```

### Format WhatsApp Message

```javascript
let target = msg.payload.phone;
let name = msg.payload.name;

if (!target.startsWith('62')) {
  target = '62' + target.substring(1);
}

msg.payload = {
  target: target,
  targetType: 'personal',
  message: `Halo ${name}, terima kasih atas pendaftaran Anda!`
};

return msg;
```

### Error Handling

```javascript
if (!msg.payload || msg.statusCode >= 400) {
  node.error('Failed to send', msg);
  msg.payload = {
    error: true,
    message: msg.statusCode + ' - ' + JSON.stringify(msg.payload)
  };
} else {
  msg.payload = {
    success: true,
    message: 'Pesan berhasil dikirim'
  };
}

return msg;
```

---

## Troubleshooting

### Node-RED tidak bisa connect ke Bot

**Solusi:**
1. Cek IP & port: `192.168.10.20:8000`
2. Cek API Key di `.env`
3. Pastikan bot running: `node bot.js`

### Attachment tidak ter-upload

**Solusi:**
1. Cek file size < 50MB
2. Pastikan `multipart-parser` installed
3. Gunakan `form-data` di HTTP request

### Email tidak ter-receive

**Solusi:**
1. Check IMAP enabled di email provider
2. Gunakan App Password jika Gmail
3. Cek folder (mungkin di Spam)

### WhatsApp nomor tidak aktif

**Solusi:**
1. Format harus `628xx...`
2. Nomor harus aktif di WhatsApp
3. Check dengan /validator dulu

---

## Security Best Practices

1. **API Key:**
   - Simpan di environment variable
   - Jangan commit ke git
   - Rotate regularly

2. **File Upload:**
   - Validate file type
   - Limit file size
   - Scan dengan antivirus jika perlu

3. **Data Privacy:**
   - Encrypt sensitive data
   - Log tidak boleh contain API keys
   - Delete old attachments regularly

---

## Performance Tips

1. **Batch Processing:**
   ```javascript
   // Jangan send satu-satu, batch dalam 5-10 pesan
   // Delay antar batch: 3-5 detik
   ```

2. **Database Queries:**
   ```javascript
   // Use proper indexing
   // Limit hasil query (jangan ambil semua)
   ```

3. **File Handling:**
   ```javascript
   // Stream file jika besar
   // Clean up temp files setelah proses
   ```

---

## Dashboard Monitoring

Akses di browser untuk lihat:
- Status bot real-time
- Live logs
- Scheduled jobs status
- Attachment list

```
http://192.168.10.20:8000
```

---

**Lihat juga:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | [ATTACHMENT_API.md](./ATTACHMENT_API.md)
