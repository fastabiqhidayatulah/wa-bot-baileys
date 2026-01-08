// File: handlers/cutiHandler.js

const { google } = require('googleapis');
const leaveReminderHandler = require('./leaveReminderHandler');

const monthMap = {
    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
    'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
};

/**
 * Mem-parsing string tanggal yang kompleks menjadi array tanggal individu.
 * @param {string} datePartStr - Contoh: "1-3, 7, 15"
 * @returns {number[]} Array berisi hari. Contoh: [1, 2, 3, 7, 15]
 */
function parseDates(datePartStr) {
    const dates = new Set();
    const parts = datePartStr.split(',');

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
            const [start, end] = trimmedPart.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    dates.add(i);
                }
            }
        } else {
            const day = Number(trimmedPart);
            if (!isNaN(day)) {
                dates.add(day);
            }
        }
    }
    return Array.from(dates).sort((a, b) => a - b);
}

/**
 * Handler utama untuk perintah /cuti.
 * @param {import('@whiskeysockets/baileys').WASocket} sock 
 * @param {string} jid 
 * @param {string} messageText 
 */
async function cutiHandler(sock, jid, messageText) {
    const regex = /^\/cuti\s+#([\d,\-\s]+)\s+([a-zA-Z]+)\s+(\d{4})\s+#(.+)$/i;
    const match = messageText.match(regex);

    if (!match) {
        const errorMessage = `Format perintah salah. Mohon gunakan format yang benar.

*Contoh Cuti 1 Hari:*
/cuti #1 Maret 2025 #Nama Anda

*Contoh Cuti Berurutan:*
/cuti #1-3 Maret 2025 #Nama Anda

*Contoh Cuti Tidak Berurutan:*
/cuti #1, 5, 8 Maret 2025 #Nama Anda`;
        await sock.sendMessage(jid, { text: errorMessage });
        return;
    }

    const [, datePartStr, monthStr, year, nama] = match;
    const month = monthMap[monthStr.toLowerCase()];

    if (month === undefined) {
        await sock.sendMessage(jid, { text: `Maaf, nama bulan "${monthStr}" tidak valid.` });
        return;
    }

    const daysToSchedule = parseDates(datePartStr);
    if (daysToSchedule.length === 0) {
        await sock.sendMessage(jid, { text: 'Format tanggal tidak valid.' });
        return;
    }

    try {
        await sock.sendMessage(jid, { text: `📝 Oke, sedang menjadwalkan cuti untuk *${nama.trim()}*...` });

        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        const auth = await leaveReminderHandler.getAuthenticatedClient(oAuth2Client);
        const calendar = google.calendar({ version: 'v3', auth });

        const createdDates = [];
        for (const day of daysToSchedule) {
            const dateStr = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];
            const nextDayStr = new Date(Date.UTC(year, month, day + 1)).toISOString().split('T')[0];

            const eventData = {
                summary: `${nama.trim()} Cuti`,
                start: { date: dateStr },
                end: { date: nextDayStr },
            };

            await calendar.events.insert({
                calendarId: process.env.LEAVE_CALENDAR_ID,
                resource: eventData,
            });
            createdDates.push(day);
        }

        const formattedDates = createdDates.map(day => `${day} ${monthStr} ${year}`).join('\n- ');
        const successMessage = `✅ *Cuti Berhasil Dibuat!*\n\n*Nama:* ${nama.trim()}\n\n*Tanggal yang dijadwalkan:*\n- ${formattedDates}`;
        
        await sock.sendMessage(jid, { text: successMessage });

    } catch (error) {
        console.error("Gagal membuat event cuti:", error);
        await sock.sendMessage(jid, { text: `Gagal membuat event cuti. Terjadi kesalahan pada server: ${error.message}` });
    }
}

module.exports = cutiHandler;