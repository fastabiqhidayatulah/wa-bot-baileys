const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const TOKEN_PATH = path.join(__dirname, '..', 'google_token.json');

async function loadToken() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
}

async function saveToken(token) {
    await fs.writeFile(TOKEN_PATH, JSON.stringify(token));
}

async function getAuthenticatedClient(oAuth2Client) {
    const token = await loadToken();
    if (!token) {
        throw new Error('Token Google tidak ditemukan. Silakan otorisasi terlebih dahulu.');
    }
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
}

async function createEvent(auth, eventData) {
    const calendar = google.calendar({ version: 'v3', auth });
    const event = {
        summary: eventData.title,
        start: {
            date: eventData.startDate,
            timeZone: 'Asia/Jakarta',
        },
        end: {
            date: eventData.endDate,
            timeZone: 'Asia/Jakarta',
        },
    };
    const response = await calendar.events.insert({
        calendarId: process.env.LEAVE_CALENDAR_ID,
        resource: event,
    });
    return response.data;
}

/**
 * --- PERBAIKAN: Fungsi untuk membuat objek Date yang aman dari timezone ---
 * @param {string} dateString - String tanggal dalam format YYYY-MM-DD
 * @returns {Date}
 */
function parseDateAsUTC(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Membuat tanggal di UTC untuk menghindari pergeseran timezone oleh JavaScript
    return new Date(Date.UTC(year, month - 1, day));
}

async function getLeaveData(auth) {
    const calendar = google.calendar({ version: 'v3', auth });

    // Menggunakan zona waktu yang konsisten untuk tanggal "hari ini"
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const timeMin = today.toISOString();
    const timeMax = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const res = await calendar.events.list({
        calendarId: process.env.LEAVE_CALENDAR_ID,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
    });

    const events = res.data.items;
    const monthlyTotal = await getTotalMonthlyLeave(calendar);

    if (!events || events.length === 0) {
        return { today: [], tomorrow: [], upcoming: new Map(), monthlyTotal };
    }

    const leaveData = {
        today: [],
        tomorrow: [],
        upcoming: new Map(),
    };

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setUTCDate(today.getUTCDate() + 2);

    events
        .filter(event => event.summary.toLowerCase().includes('cuti'))
        .forEach(event => {
            const startDate = parseDateAsUTC(event.start.date);
            const endDate = parseDateAsUTC(event.end.date);
            const employeeName = event.summary.toLowerCase().replace('cuti', '').trim().replace(/\b\w/g, l => l.toUpperCase());

            for (let d = new Date(startDate); d < endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                if (d.getTime() === today.getTime()) {
                    leaveData.today.push(employeeName);
                } else if (d.getTime() === tomorrow.getTime()) {
                    leaveData.tomorrow.push(employeeName);
                } else if (d.getTime() >= dayAfterTomorrow.getTime()) {
                    const dateString = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
                    if (!leaveData.upcoming.has(dateString)) {
                        leaveData.upcoming.set(dateString, []);
                    }
                    leaveData.upcoming.get(dateString).push(employeeName);
                }
            }
        });
    
    return { ...leaveData, monthlyTotal };
}

async function getTotalMonthlyLeave(calendar) {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

    const res = await calendar.events.list({
        calendarId: process.env.LEAVE_CALENDAR_ID,
        timeMin: firstDay.toISOString(),
        timeMax: lastDay.toISOString(),
        singleEvents: true,
    });

    const events = res.data.items;
    if (!events || events.length === 0) return 0;

    const uniqueEmployees = new Set();
    events
        .filter(event => event.summary.toLowerCase().includes('cuti'))
        .forEach(event => {
            const employeeName = event.summary.toLowerCase().replace('cuti', '').trim();
            uniqueEmployees.add(employeeName);
        });

    return uniqueEmployees.size;
}

function formatLeaveMessage(leaveData) {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    const todayString = today.toLocaleDateString('id-ID', options);
    const tomorrowString = tomorrow.toLocaleDateString('id-ID', options);
    const currentMonthString = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    let message = "✨ *REMINDER & INFO CUTI KARYAWAN* ✨\n\n";
    message += `☀️ *Cuti Hari Ini (${todayString}):*\n`;
    if (leaveData.today.length > 0) {
        leaveData.today.forEach(name => { message += `    🧑‍💼 ${name}\n`; });
    } else {
        message += "    - Tidak ada\n";
    }
    message += `\n🗓️ *Cuti Besok (${tomorrowString}):*\n`;
    if (leaveData.tomorrow.length > 0) {
        leaveData.tomorrow.forEach(name => { message += `    🧑‍💼 ${name}\n`; });
    } else {
        message += "    - Tidak ada\n";
    }
    message += `\n📅 *Jadwal Cuti 3 Hari ke Depan (setelah besok):*\n`;
    if (leaveData.upcoming.size > 0) {
        leaveData.upcoming.forEach((names, dateStr) => {
            message += `    *${dateStr}:*\n`;
            names.forEach(name => { message += `        - ${name}\n`; });
        });
    } else {
        message += "    - Tidak ada jadwal\n";
    }
    message += `\n📊 *Total Personil Cuti Bulan Ini (${currentMonthString}):* ${leaveData.monthlyTotal} orang.\n\n`;
    message += "Tetap semangat! 💪";
    return message;
}

module.exports = {
    getAuthenticatedClient,
    getLeaveData,
    formatLeaveMessage,
    saveToken,
    loadToken,
    createEvent
};