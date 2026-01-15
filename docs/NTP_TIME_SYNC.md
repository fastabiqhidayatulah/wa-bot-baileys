# ⏰ NTP Time Synchronization - WA Bot

**Status:** ✅ Aktif

---

## Apa Itu?

Bot sekarang **otomatis menyinkronkan waktu dengan server NTP online** (Asia/Jakarta) saat startup dan setiap 1 jam sekali.

Ini memastikan **scheduler/cron jobs berjalan tepat waktu** meskipun jam sistem server sering tidak akurat.

---

## Cara Kerja

1. **Saat Bot Start:**
   - Bot query waktu dari `worldtimeapi.org` (server NTP publik)
   - Bandingkan dengan jam sistem lokal
   - Hitung offset (selisih waktu)
   - Apply offset ke semua cron jobs

2. **Setiap 1 Jam:**
   - Bot re-sync waktu otomatis
   - Jika ada perubahan offset, update log

3. **Scheduler Jobs:**
   - Menggunakan jam yang sudah dikalibrasi (NTP)
   - Tidak terpengaruh oleh drift jam sistem

---

## Log Output

**Saat startup (SUCCESS):**
```
🔄 NTP Sync: Waktu server offline -2s dari online
✓ NTP Sync OK: Waktu sudah sinkron dengan server online
```

**Saat startup (FAILURE):**
```
⚠️ NTP Sync gagal: fetch error. Menggunakan jam sistem.
```

---

## Timezone

- **Default:** Asia/Jakarta (UTC+7)
- **Untuk ubah:** Edit di bot.js line: `'https://worldtimeapi.org/api/timezone/Asia/Jakarta'`
- **Timezone lain:**
  - Asia/Bangkok → Thailand
  - Asia/Singapore → Singapura
  - Asia/Kolkata → India
  - Europe/London → UK
  - Dst...

---

## Manual Check

Di Command Prompt:

```cmd
REM Check offset waktu
nssm\nssm.exe status wabot

REM Atau lihat logs
type logs\service-stdout.log | find "NTP"
```

---

## Testing

**Test scheduler dengan cron yang akan jalan dalam 1 menit:**

1. Buka dashboard
2. Buat scheduled message dengan waktu +1 menit dari sekarang
3. Tunggu 1 menit, pesan harus dikirim tepat waktu

---

## Konfigurasi (Optional)

**Ubah frekuensi re-sync (default: 1 jam):**

Di bot.js, baris ~110:
```javascript
setInterval(syncTimeWithNTP, 60 * 60 * 1000); // 60 menit

// Ganti 60 dengan:
// 30 → setiap 30 menit
// 15 → setiap 15 menit
// 5  → setiap 5 menit
```

---

## API Used

- **Service:** worldtimeapi.org
- **Endpoint:** `/api/timezone/Asia/Jakarta`
- **Response:** JSON dengan waktu ISO 8601
- **Uptime:** 99.9% (public service)

---

## Troubleshooting

**Q: Bot tidak konek ke NTP?**
A: Pastikan server punya akses internet. Check logs untuk error message.

**Q: Scheduler masih tidak tepat waktu?**
A: Mungkin offset terlalu besar (>30s). Restart bot atau manual sync jam sistem.

**Q: Ingin pakai NTP lokal?**
A: Install `ntpd` di server, ubah endpoint ke IP local NTP server.

---

**Dokumentasi dibuat:** 15 Januari 2026
