// =================================================================
//                      IMPOR MODUL & INISIALISASI
// =================================================================
const pino = require('pino'); // Logger canggih
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { exec } = require('child_process');
require('dotenv').config();

// Handlers
const helpHandler = require('./handlers/helpHandler');
const geminiHandler = require('./handlers/geminiHandler');
const apiKeyManager = require('./handlers/apiKeyManager');
const attachmentHandler = require('./handlers/attachmentHandler'); 


// =================================================================
//                 FUNGSI UTAMA UNTUK MENJALANKAN BOT
// =================================================================
async function startBot() {
    // -----------------------------------------------------------------
    //          MEMUAT BAILEYS (ESM) SECARA DINAMIS (v7 COMPATIBLE)
    // -----------------------------------------------------------------
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion, // <-- Impor fungsi untuk mengambil versi terbaru
    } = await import('@whiskeysockets/baileys');
    const { Boom } = await import('@hapi/boom');

    // --- Konfigurasi Logger (Pino) ---
    const logger = pino({
        level: 'info',
        transport: {
            targets: [
                { target: 'pino-pretty', options: { colorize: true }, level: 'info' },
                { target: 'pino/file', options: { destination: './bot-logs.log' }, level: 'info' }
            ]
        }
    });

    // Inisialisasi Aplikasi Express & Server
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    const PORT = process.env.PORT || 8000;

    // Variabel Global untuk Status Bot
    let sock;
    let qrCode = null;
    let connectionStatus = 'Menunggu koneksi...';
    let scheduledTasks = {};
    let reminderCronJob = null;

    // =================================================================
    //                         FUNGSI BANTUAN
    // =================================================================
    const log = (message, type = 'info') => {
        const timestamp = `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}]`;
        logger[type](`${timestamp} ${message}`); 
        io.emit('log', `${timestamp} ${message}`);
    };
    const readJSON = (filePath) => { try { if (fs.existsSync(filePath)) { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } return null; } catch (error) { log(`Error membaca file JSON ${filePath}: ${error}`, 'error'); return null; } };
    const writeJSON = (filePath, data) => { try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); } catch (error) { log(`Error menulis file JSON ${filePath}: ${error}`, 'error'); } };

    // =================================================================
    //                    NTP TIME SYNCHRONIZATION (JAKARTA)
    // =================================================================
    let timeOffset = 0; // Offset dari waktu online
    let lastSyncTime = new Date(); // Track waktu sync terakhir
    
    const syncTimeWithNTP = async () => {
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Jakarta');
            const data = await response.json();
            const serverTime = new Date(data.datetime).getTime();
            const localTime = Date.now();
            timeOffset = serverTime - localTime;
            lastSyncTime = new Date(); // Update waktu sync
            
            const offsetSeconds = Math.round(timeOffset / 1000);
            if (Math.abs(offsetSeconds) > 0) {
                log(`🔄 NTP Sync: Waktu server offline ${offsetSeconds > 0 ? '+' : ''}${offsetSeconds}s dari online`, 'info');
            } else {
                log(`✓ NTP Sync OK: Waktu sudah sinkron dengan server online`, 'info');
            }
            return true;
        } catch (e) {
            log(`⚠️ NTP Sync gagal: ${e.message}. Menggunakan jam sistem.`, 'warn');
            return false;
        }
    };

    // Dapatkan waktu yang sudah dikalibrasi
    const getNTPTime = () => Date.now() + timeOffset;

    // =================================================================
    //                    MIDDLEWARE & KONFIGURASI EXPRESS
    // =================================================================
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // File upload middleware dengan batas ukuran 50MB
    const fileUpload = require('express-fileupload');
    app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
    app.use(session({ secret: process.env.SESSION_SECRET || 'secret-key-default', resave: false, saveUninitialized: true, cookie: { secure: process.env.NODE_ENV === 'production' }}));
    const checkPageAuth = (req, res, next) => { if (req.session.userId) { next(); } else { res.redirect('/login.html'); } };
    const checkApiAuth = (req, res, next) => { if (req.session.userId) { next(); } else { res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' }); } };
    const checkApiKey = (req, res, next) => { const apiKey = req.headers['x-api-key']; if (apiKey && apiKey === process.env.EXTERNAL_API_KEY) { next(); } else { res.status(403).json({ error: 'Forbidden: API Key tidak valid atau tidak ada.' }); } };
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/', checkPageAuth);
    app.get('/index.html', checkPageAuth);
    app.get('/scheduler.html', checkPageAuth);
    app.get('/validator.html', checkPageAuth);
    app.get('/docs.html', checkPageAuth);
    app.get('/settings.html', checkPageAuth);
    app.use('/api/internal', checkApiAuth);

    // =================================================================
    //                 KONEKSI WHATSAPP (BAILEYS V7 - STABLE VERSION)
    // =================================================================
    async function connectToWhatsApp() {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        const { version, isLatest } = await fetchLatestBaileysVersion();
        log(`Menggunakan WA v${version.join('.')}, Versi Terbaru: ${isLatest}`);

        sock = makeWASocket({
            version, 
            logger,  
            printQRInTerminal: true,
            auth: state,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCode = qr;
                connectionStatus = 'Menunggu Scan QR';
                io.emit('status', { status: connectionStatus, qr: qrCode });
                log('QR Code diterima, silakan scan.');
            }
            
            if (connection === 'close') {
                const error = lastDisconnect?.error;
                const statusCode = error instanceof Boom ? error.output.statusCode : 500;
                
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                connectionStatus = `Koneksi ditutup. Alasan: ${statusCode}, ${error?.message}. Menghubungkan kembali: ${shouldReconnect}`;
                log(connectionStatus, 'error');
                io.emit('status', { status: connectionStatus, qr: null });

                if (shouldReconnect) {
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    log('Tidak dapat terhubung: Logout Terdeteksi. Hapus folder auth dan restart.', 'error');
                    if (fs.existsSync('auth_info_baileys')) {
                        fs.rmSync('auth_info_baileys', { recursive: true, force: true });
                    }
                }
            } else if (connection === 'open') {
                qrCode = null;
                connectionStatus = `Terhubung sebagai ${sock.user.name || sock.user.id}`;
                log(connectionStatus);
                io.emit('status', { status: connectionStatus, qr: qrCode });
                loadScheduledJobs();
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            const from = msg.key.remoteJid;

            log(`Pesan diterima dari ${from}: "${messageText}"`);

            if (messageText.startsWith('/help')) {
                await helpHandler(sock, from);
            } else if (messageText.startsWith('/gemini')) {
                await geminiHandler(sock, from, messageText.substring(7).trim());
            }
        });
    }

    
    // =================================================================
    //                 KOMUNIKASI REAL-TIME (SOCKET.IO)
    // =================================================================
    io.on('connection', (socket) => {
        log('Dashboard terhubung via Socket.IO.');
        socket.emit('status', { status: connectionStatus, qr: qrCode });
        socket.emit('log', 'Selamat datang di log server.');
        socket.on('validate-numbers', async (data) => {
            if (!sock || !sock.user) return socket.emit('validation-error', { message: 'Bot tidak terhubung.' });
            const { numbers } = data;
            let checkedCount = 0;
            for (const number of numbers) {
                try {
                    let formattedNumber = number.trim().startsWith('0') ? '62' + number.trim().substring(1) : number.trim();
                    const [result] = await sock.onWhatsApp(`${formattedNumber}@s.whatsapp.net`);
                    socket.emit('validation-update', { number, status: result?.exists ? 'Aktif' : 'Tidak Terdaftar' });
                } catch (e) {
                    socket.emit('validation-update', { number, status: 'Error' });
                } finally {
                    checkedCount++;
                    socket.emit('validation-progress', { checked: checkedCount, total: numbers.length });
                    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));
                }
            }
            socket.emit('validation-complete');
        });
    });

    // =================================================================
    //                 SISTEM LOGIN & OTENTIKASI
    // =================================================================
    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        const users = readJSON(path.join(__dirname, 'users.json'));
        const user = users.find(u => u.username === username);
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.username;
            log(`Pengguna ${username} berhasil login.`);
            res.status(200).json({ message: 'Login berhasil' });
        } else {
            log(`Percobaan login gagal untuk pengguna: ${username}.`, 'error');
            res.status(401).json({ message: 'Username atau password salah' });
        }
    });
    app.get('/logout', (req, res) => {
        const username = req.session.userId;
        req.session.destroy(() => {
            log(`Pengguna ${username} telah logout.`);
            res.redirect('/login.html');
        });
    });

    // =================================================================
    //                 API INTERNAL (DASHBOARD)
    // =================================================================
    app.get('/api/internal/status', (req, res) => res.json({ status: connectionStatus, qr: qrCode }));
    app.post('/api/internal/logout-wa', async (req, res) => {
        log('Menerima permintaan logout & hapus sesi WA.');
        try {
            await sock.logout();
        } catch (e) {
            log(`Error saat logout: ${e.message}`, 'error');
        } finally {
            if (fs.existsSync('auth_info_baileys')) {
                fs.rmSync('auth_info_baileys', { recursive: true, force: true });
            }
            res.json({ message: 'Proses logout dan hapus sesi dimulai.' });
            exec('pm2 restart whatsapp-bot', (err) => { if (err) log(`Gagal restart PM2: ${err}`, 'error'); });
        }
    });
    app.get('/api/internal/get-groups', async (req, res) => {
        if (!sock || !sock.user) return res.status(503).json({ error: 'Bot tidak terhubung.' });
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups).map(g => ({ id: g.id, subject: g.subject })).sort((a, b) => a.subject.localeCompare(b.subject));
            res.json(groupList);
        } catch (e) { res.status(500).json({ error: 'Gagal mengambil grup.' }); }
    });
    app.get('/api/internal/get-templates', (req, res) => res.json(readJSON('templates.json')));
    app.post('/api/internal/save-template', (req, res) => {
        const { name, message } = req.body;
        if (!name || !message) return res.status(400).json({ error: 'Nama dan isi template harus diisi.' });
        const templates = readJSON('templates.json') || [];
        templates.push({ name, message });
        writeJSON('templates.json', templates);
        io.emit('templates_updated');
        res.json({ success: true, message: 'Template berhasil disimpan.' });
    });

    // =================================================================
    //                 SISTEM PENJADWALAN (SCHEDULER)
    // =================================================================
    
    /**
     * [DIRUBAH] Mengirim broadcast dan MENCATAT HASILNYA ke schedules.json
     */
    async function sendBroadcastWithDelay(destinations, message, source = "Scheduler", jobId = null) {
        log(`[${source}] Memulai broadcast ke ${destinations.length} target.`);
        let hasErrors = false; // Lacak error

        for (const dest of destinations) {
            try {
                let targetJid = dest;
                if (!targetJid.includes('@')) {
                    if (targetJid.startsWith('0')) {
                        targetJid = '62' + dest.substring(1);
                    }
                    targetJid = `${targetJid}@s.whatsapp.net`;
                }
                await sock.sendMessage(targetJid, { text: message });
                log(`[${source}] Pesan terkirim ke ${targetJid}`);
            } catch (e) {
                log(`[${source}] Gagal mengirim ke ${dest}: ${e.message}`, 'error');
                hasErrors = true; // Tandai jika ada error
            }
            const delay = Math.floor(Math.random() * 5000) + 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // [BARU] Simpan status eksekusi terakhir
        if (jobId) {
            try {
                const schedules = readJSON(path.join(__dirname, 'schedules.json')) || [];
                const jobIndex = schedules.findIndex(j => j.id === jobId);
                if (jobIndex !== -1) {
                    schedules[jobIndex].lastRun = { 
                        time: new Date().toISOString(), 
                        status: hasErrors ? 'Gagal' : 'Sukses' 
                    };
                    writeJSON('schedules.json', schedules);
                    io.emit('schedule_updated'); // Beri tahu frontend untuk refresh data
                }
            } catch (e) {
                log(`Gagal update status Last Run for job #${jobId}: ${e.message}`, 'error');
            }
        }
        log(`[${source}] Broadcast selesai.`);
    }

    /**
     * [DIRUBAH] Membuat tugas cron, kini menghormati status 'Paused'
     */
    function createCronJob(job) {
        const { id, targets, groups, message, scheduleType, scheduleData } = job;
        const allTargets = [...(targets || []), ...(groups || [])];
        
        // [DIRUBAH] Fungsi job sekarang meneruskan 'id' untuk pelaporan status
        const jobFunction = () => sendBroadcastWithDelay(allTargets, message, `Scheduler Job #${id}`, id);
        
        let cronTime = '';
        const [hour, minute] = scheduleData.time.split(':');
        switch (scheduleType) {
            case 'daily':
                cronTime = `${minute} ${hour} * * *`;
                break;
            case 'weekly':
                const daysOfWeek = Array.isArray(scheduleData.days) ? scheduleData.days.join(',') : scheduleData.days;
                if (!daysOfWeek) {
                    log(`Jadwal mingguan #${id} tidak memiliki hari yang valid.`, 'error');
                    return;
                }
                cronTime = `${minute} ${hour} * * ${daysOfWeek}`;
                break;
            case 'monthly':
                cronTime = `${minute} ${hour} ${scheduleData.date} * *`;
                break;
            default:
                return;
        }

        if (cron.validate(cronTime)) {
            // [DIRUBAH] Hanya jadwalkan jika status tidak 'Paused'
            const task = cron.schedule(cronTime, jobFunction, { 
                scheduled: (job.status !== 'Paused'), // 'scheduled: false' jika dijeda
                timezone: "Asia/Jakarta" 
            });
            scheduledTasks[id] = task;
            log(`Tugas Scheduler #${id} dimuat dengan cron: ${cronTime} (Status: ${job.status || 'Active'})`);
        } else {
            log(`Format cron tidak valid untuk tugas Scheduler #${id}: ${cronTime}`, 'error');
        }
    }

    /**
     * [DIRUBAH] Memuat jadwal, kini dengan pembersihan bug spam
     */
    function loadScheduledJobs() {
        // [FIX BUG SPAM] Bersihkan semua tugas di memori sebelum memuat ulang
        log('Membersihkan tugas terjadwal lama...');
        for (const taskId in scheduledTasks) {
            if (scheduledTasks[taskId]) {
                scheduledTasks[taskId].stop();
                delete scheduledTasks[taskId];
            }
        }

        const schedules = readJSON(path.join(__dirname, 'schedules.json')) || [];
        log(`Memuat ${schedules.length} jadwal dari file...`);
        
        schedules.forEach(job => {
            if (job.scheduleType === 'once') {
                const scheduleDateTime = new Date(`${job.scheduleData.date}T${job.scheduleData.time}`);
                if (scheduleDateTime < new Date()) {
                    log(`Melewatkan jadwal "once" #${job.id} yang sudah lewat.`);
                    return; 
                }
            }
            createCronJob(job); // createCronJob akan menangani status 'Paused'
        });
    }

    /**
     * [DIRUBAH TOTAL] API untuk mengambil jadwal, kini mengirim data lengkap
     */
    app.get('/api/internal/get-scheduled-jobs', async (req, res) => {
        const schedules = readJSON(path.join(__dirname, 'schedules.json')) || [];
        
        let groupCache = {};
        if (sock && sock.user) { // Hanya fetch nama grup jika bot terhubung
            try {
                const groups = await sock.groupFetchAllParticipating();
                groupCache = Object.values(groups).reduce((acc, g) => {
                    acc[g.id] = g.subject;
                    return acc;
                }, {});
            } catch (e) {
                log('Gagal fetch grup saat mengambil jadwal, nama grup mungkin tidak tampil.', 'warn');
            }
        }

        const dayMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        const detailedJobs = schedules.map(job => {
            // 1. Detailkan Penerima
            const targetDetails = [];
            if (job.groups && job.groups.length > 0) {
                job.groups.forEach(gId => {
                    targetDetails.push(`Grup: ${groupCache[gId] || gId}`); 
                });
            }
            if (job.targets && job.targets.length > 0) {
                targetDetails.push(`${job.targets.length} Kontak`); 
            }
            const recipientString = targetDetails.join(', ') || 'Tidak ada target';

            // 2. Detailkan Jadwal
            let scheduleString = '';
            try {
                switch (job.scheduleType) {
                    case 'daily':
                        scheduleString = `Setiap Hari, ${job.scheduleData.time}`;
                        break;
                    case 'weekly':
                        const days = Array.isArray(job.scheduleData.days) ? job.scheduleData.days.map(d => dayMap[d] || d).join(',') : job.scheduleData.days;
                        scheduleString = `Mingguan (${days}), ${job.scheduleData.time}`;
                        break;
                    case 'monthly':
                        scheduleString = `Bulanan (Tgl ${job.scheduleData.date}), ${job.scheduleData.time}`;
                        break;
                    case 'once':
                        scheduleString = `Sekali (${job.scheduleData.date}), ${job.scheduleData.time}`;
                        break;
                    default:
                        scheduleString = 'Tidak Diketahui';
                }
            } catch (e) { scheduleString = "Error: Format jadwal tidak valid"; }


            // 3. Dapatkan "Run Berikutnya"
            let nextRun = null;
            if (job.status === 'Paused') {
                nextRun = 'Dijeda';
            } else if (scheduledTasks[job.id]) {
                try {
                    const nextDate = scheduledTasks[job.id].nextDates(1)[0];
                    if (nextDate) {
                        nextRun = nextDate.toISOString();
                    }
                } catch (e) { /* Biarkan null jika error */ }
            }

            return {
                ...job,
                recipientString, // Detail Penerima
                scheduleString,  // Detail Jadwal
                nextRun,         // Run Berikutnya
                // lastRun dan status sudah ada di objek 'job'
            };
        });

        res.json(detailedJobs);
    });

    /**
     * [DIRUBAH] Saat membuat jadwal, tambahkan status default
     */
    app.post('/api/internal/schedule-message', (req, res) => {
        const { targets, groups, message, templateName, scheduleType, scheduleData } = req.body;
        const allTargets = [...(targets || []), ...(groups || [])];
        if (allTargets.length === 0 || !message) return res.status(400).json({ error: "Target dan pesan harus diisi." });
        
        const jobId = uuidv4();
        // [BARU] Tambahkan 'status' dan 'lastRun'
        const job = { 
            id: jobId, 
            ...req.body, 
            status: 'Active', 
            lastRun: null 
        }; 

        if (scheduleType === 'now') {
            sendBroadcastWithDelay(allTargets, message, "Scheduler (Now)");
            res.json({ success: true, message: 'Pesan sedang dikirim sekarang.' });
        } else {
            const schedules = readJSON('schedules.json') || [];
            schedules.push(job);
            writeJSON('schedules.json', schedules);
            
            if (scheduleType === 'once') {
                const scheduleDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);
                if (scheduleDateTime > new Date()) {
                    const jobFunction = () => {
                        // [DIRUBAH] Kirim ID untuk pelaporan status
                        sendBroadcastWithDelay(allTargets, message, `Scheduler Job #${jobId}`, jobId);
                        
                        const currentSchedules = readJSON('schedules.json');
                        const updatedSchedules = currentSchedules.filter(s => s.id !== jobId);
                        writeJSON('schedules.json', updatedSchedules);
                        io.emit('schedule_updated');
                    };
                    const delay = scheduleDateTime.getTime() - new Date().getTime();
                    setTimeout(jobFunction, delay);
                    log(`Tugas sekali kirim #${jobId} dijadwalkan untuk ${scheduleDateTime}`);
                }
            } else {
                createCronJob(job);
            }
            io.emit('schedule_updated');
            res.json({ success: true, message: `Pesan berhasil dijadwalkan dengan ID: ${jobId}` });
        }
    });

    app.post('/api/internal/cancel-job/:id', (req, res) => {
        const { id } = req.params;
        if (scheduledTasks[id]) {
            scheduledTasks[id].stop();
            delete scheduledTasks[id];
        }
        let schedules = readJSON('schedules.json') || [];
        const jobExists = schedules.some(j => j.id === id);
        if (!jobExists) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
        schedules = schedules.filter(j => j.id !== id);
        writeJSON('schedules.json', schedules);
        log(`Tugas Scheduler #${id} berhasil dibatalkan.`);
        io.emit('schedule_updated');
        res.json({ success: true, message: 'Jadwal berhasil dibatalkan.' });
    });

    // [ENDPOINT BARU] Untuk menjeda tugas terjadwal
    app.post('/api/internal/pause-job/:id', (req, res) => {
        const { id } = req.params;
        let schedules = readJSON('schedules.json') || [];
        const jobIndex = schedules.findIndex(j => j.id === id);

        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
        }

        try {
            if (scheduledTasks[id]) {
                scheduledTasks[id].stop(); // Hentikan tugas di memori
                log(`Tugas Scheduler #${id} dijeda.`);
            }
            schedules[jobIndex].status = 'Paused'; // Set status di file
            writeJSON('schedules.json', schedules);
            io.emit('schedule_updated'); // Refresh frontend
            res.json({ success: true, message: 'Jadwal berhasil dijeda.' });
        } catch (e) {
            log(`Gagal menjeda tugas #${id}: ${e.message}`, 'error');
            res.status(500).json({ error: 'Gagal memproses permintaan.' });
        }
    });

    // [ENDPOINT BARU] Untuk melanjutkan tugas terjadwal
    app.post('/api/internal/resume-job/:id', (req, res) => {
        const { id } = req.params;
        let schedules = readJSON('schedules.json') || [];
        const jobIndex = schedules.findIndex(j => j.id === id);

        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
        }
        
        const job = schedules[jobIndex];
        job.status = 'Active'; // Set status dulu

        try {
            // Hapus tugas lama (yang dijeda) jika ada di memori
            if (scheduledTasks[id]) {
                scheduledTasks[id].stop();
                delete scheduledTasks[id];
            }
            
            // Buat dan daftarkan tugas cron baru
            createCronJob(job); // createCronJob akan otomatis menjalankannya karena status 'Active'
            
            log(`Tugas Scheduler #${id} dilanjutkan.`);
            writeJSON('schedules.json', schedules);
            io.emit('schedule_updated'); // Refresh frontend
            res.json({ success: true, message: 'Jadwal berhasil dilanjutkan.' });
        } catch (e) {
            log(`Gagal melanjutkan tugas #${id}: ${e.message}`, 'error');
            res.status(500).json({ error: 'Gagal memproses permintaan.' });
        }
    });


    // =================================================================
    //                    API ATTACHMENT MANAGEMENT
    // =================================================================
    /**
     * POST /api/external/upload-attachment
     * Upload file attachment (dari Node-RED / external)
     * Body: multipart/form-data dengan field 'file'
     */
    app.post('/api/external/upload-attachment', checkApiKey, (req, res) => {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).json({ error: 'Tidak ada file yang di-upload' });
            }

            const uploadedFile = req.files.file;
            const result = attachmentHandler.saveAttachment(uploadedFile.name, uploadedFile.data);

            if (result.success) {
                log(`File attachment berhasil disimpan: ${result.filename} (${result.size} bytes)`);
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (e) {
            log(`Error upload attachment: ${e.message}`, 'error');
            res.status(500).json({ error: `Gagal upload attachment: ${e.message}` });
        }
    });

    /**
     * GET /api/external/attachments
     * Daftar semua attachment yang tersedia
     */
    app.get('/api/external/attachments', checkApiKey, (req, res) => {
        try {
            const files = attachmentHandler.listAttachments();
            res.json({
                success: true,
                count: files.length,
                files: files
            });
        } catch (e) {
            log(`Error listing attachments: ${e.message}`, 'error');
            res.status(500).json({ error: `Gagal mengambil daftar attachment: ${e.message}` });
        }
    });

    /**
     * POST /api/external/send-attachment
     * Kirim file attachment ke WhatsApp
     * Body: { target, filename, caption (optional) }
     */
    app.post('/api/external/send-attachment', checkApiKey, async (req, res) => {
        const { target, filename, caption } = req.body;

        if (!target || !filename) {
            return res.status(400).json({ error: 'Field "target" dan "filename" wajib diisi' });
        }

        if (!sock || !sock.user) {
            return res.status(503).json({ error: 'Service Unavailable: Bot belum terhubung.' });
        }

        try {
            let targetJid = target;

            // Validasi nomor WA
            if (!target.includes('@')) {
                let number = target.trim();
                if (number.startsWith('0')) {
                    number = '62' + number.substring(1);
                }
                targetJid = `${number}@s.whatsapp.net`;

                // Cek apakah nomor aktif
                const [checkResult] = await sock.onWhatsApp(targetJid);
                if (!checkResult || !checkResult.exists) {
                    return res.status(404).json({ error: `Nomor ${target} tidak terdaftar di WhatsApp` });
                }
            }

            const result = await attachmentHandler.sendFileToWhatsApp(sock, targetJid, filename, caption);

            if (result.success) {
                log(`Attachment ${filename} berhasil dikirim ke ${target}`);
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (e) {
            log(`Gagal mengirim attachment: ${e.message}`, 'error');
            res.status(500).json({ error: `Gagal mengirim attachment: ${e.message}` });
        }
    });

    /**
     * DELETE /api/external/attachments/:filename
     * Hapus file attachment
     */
    app.delete('/api/external/attachments/:filename', checkApiKey, (req, res) => {
        try {
            const { filename } = req.params;
            const result = attachmentHandler.deleteAttachment(filename);

            if (result.success) {
                log(`Attachment ${filename} berhasil dihapus`);
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (e) {
            log(`Error delete attachment: ${e.message}`, 'error');
            res.status(500).json({ error: `Gagal menghapus attachment: ${e.message}` });
        }
    });

    // =================================================================
    //                         API EKSTERNAL
    // =================================================================
    app.post('/api/external/send-message', checkApiKey, async (req, res) => {
        const { targetType, target, message } = req.body;
        if (!targetType || !target || !message) {
            return res.status(400).json({ error: 'Properti "targetType", "target", dan "message" wajib diisi.' });
        }
        if (!sock || !sock.user) {
            return res.status(503).json({ error: 'Service Unavailable: Bot belum terhubung.' });
        }
        try {
            let targetJid;
            if (targetType === 'personal') {
                let number = target.trim();
                if (number.startsWith('0')) {
                    number = '62' + number.substring(1);
                }
                targetJid = `${number}@s.whatsapp.net`;
                const [result] = await sock.onWhatsApp(targetJid);
                if (!result || !result.exists) {
                    return res.status(404).json({ error: `Nomor ${target} tidak terdaftar di WhatsApp.` });
                }
            } else if (targetType === 'group') {
                const groups = await sock.groupFetchAllParticipating();
                const group = Object.values(groups).find(g => g.subject.toLowerCase() === target.toLowerCase());
                if (!group) {
                    return res.status(404).json({ error: `Grup dengan nama "${target}" tidak ditemukan.` });
                }
                targetJid = group.id;
            } else {
                return res.status(400).json({ error: 'Nilai "targetType" tidak valid. Gunakan "personal" atau "group".' });
            }
            await sock.sendMessage(targetJid, { text: message });
            log(`Pesan eksternal terkirim ke ${target} (${targetJid})`);
            res.json({ success: true, message: `Pesan berhasil dikirim ke ${target}.` });
        } catch (e) {
            log(`Gagal mengirim pesan eksternal: ${e.message}`, 'error');
            res.status(500).json({ error: `Gagal mengirim pesan: ${e.message}` });
        }
    });


    // =================================================================
    //                 API UNTUK MANAJEMEN API KEYS
    // =================================================================
    
    /**
     * GET /api/internal/api-keys
     * Ambil daftar API keys (tanpa value, hanya preview)
     */
    app.get('/api/internal/api-keys', checkApiAuth, (req, res) => {
        try {
            if (!apiKeyManager) {
                log(`API Key Manager tidak tersedia`, 'error');
                return res.status(503).json({ error: 'Service tidak siap. Restart bot.' });
            }
            
            const providers = apiKeyManager.getAvailableProviders();
            if (!providers || !Array.isArray(providers)) {
                log(`Provider list tidak valid`, 'error');
                return res.status(500).json({ error: 'Gagal memuat daftar provider' });
            }
            
            const result = providers.map(provider => {
                try {
                    const keyInfo = apiKeyManager.getApiKey(provider.id);
                    return {
                        id: provider.id,
                        name: provider.name,
                        icon: provider.icon,
                        color: provider.color,
                        isSet: keyInfo?.isSet || false,
                        preview: keyInfo?.preview || ''
                    };
                } catch (err) {
                    log(`Error processing provider ${provider.id}: ${err.message}`, 'warn');
                    return {
                        id: provider.id,
                        name: provider.name,
                        icon: provider.icon,
                        color: provider.color,
                        isSet: false,
                        preview: ''
                    };
                }
            });
            res.json(result);
        } catch (e) {
            log(`Gagal mengambil API keys: ${e.message}`, 'error');
            res.status(500).json({ error: 'Gagal mengambil API keys: ' + e.message });
        }
    });

    /**
     * POST /api/internal/api-keys
     * Simpan/update API key baru
     */
    app.post('/api/internal/api-keys', checkApiAuth, async (req, res) => {
        try {
            if (!apiKeyManager) {
                return res.status(503).json({ error: 'Service tidak siap. Restart bot.' });
            }
            
            const { provider, apiKey } = req.body;
            if (!provider || !apiKey) {
                return res.status(400).json({ error: 'Provider dan API key harus diisi' });
            }

            // Validasi format
            const validation = await apiKeyManager.validateApiKey(provider, apiKey);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.message });
            }

            apiKeyManager.setApiKey(provider, apiKey);
            log(`API key untuk ${provider} berhasil disimpan`);
            
            // Update environment variable jika Gemini
            if (provider === 'gemini') {
                process.env.GEMINI_API_KEY = apiKey;
            }

            res.json({ success: true, message: `API key ${provider} berhasil disimpan` });
        } catch (e) {
            log(`Gagal menyimpan API key: ${e.message}`, 'error');
            res.status(500).json({ error: e.message });
        }
    });

    /**
     * DELETE /api/internal/api-keys/:provider
     * Hapus API key
     */
    app.delete('/api/internal/api-keys/:provider', checkApiAuth, (req, res) => {
        try {
            if (!apiKeyManager) {
                return res.status(503).json({ error: 'Service tidak siap. Restart bot.' });
            }
            
            const { provider } = req.params;
            apiKeyManager.deleteApiKey(provider);
            log(`API key untuk ${provider} berhasil dihapus`);
            res.json({ success: true, message: `API key ${provider} berhasil dihapus` });
        } catch (e) {
            log(`Gagal menghapus API key: ${e.message}`, 'error');
            res.status(500).json({ error: e.message });
        }
    });

    /**
     * POST /api/internal/api-keys/test/:provider
     * Test API key sebelum menyimpan
     */
    app.post('/api/internal/api-keys/test/:provider', checkApiAuth, async (req, res) => {
        try {
            if (!apiKeyManager) {
                return res.status(503).json({ error: 'Service tidak siap. Restart bot.' });
            }
            
            const { provider } = req.params;
            const { apiKey } = req.body;
            if (!apiKey) {
                return res.status(400).json({ error: 'API key harus diisi' });
            }
            
            const validation = await apiKeyManager.validateApiKey(provider, apiKey);
            res.json(validation);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    /**
     * GET /api/internal/time-status
     * Dapatkan informasi waktu sistem, NTP, dan offset
     */
    app.get('/api/internal/time-status', checkApiAuth, (req, res) => {
        const systemTime = new Date();
        const ntpTime = new Date(Date.now() + timeOffset);
        
        res.json({
            systemTime: systemTime.toISOString(),
            ntpTime: ntpTime.toISOString(),
            timeOffset: timeOffset,
            offsetSeconds: Math.round(timeOffset / 1000),
            lastSyncTime: lastSyncTime.toISOString(),
            timezone: 'Asia/Jakarta'
        });
    });

    // =================================================================
    //                         JALANKAN SERVER
    // =================================================================
    server.listen(PORT, async () => {
        log(`Server berjalan di http://localhost:${PORT}`);
        
        // Sync waktu dengan NTP sebelum connect WhatsApp
        log(`[System] Menyinkronkan jam dengan server NTP (Asia/Jakarta)...`);
        await syncTimeWithNTP();
        
        // Setup re-sync setiap 1 jam
        setInterval(syncTimeWithNTP, 60 * 60 * 1000);
        
        connectToWhatsApp().catch(err => log(`Gagal memulai koneksi WhatsApp: ${err}`, 'error'));
    });
    process.on('SIGINT', async () => {
        log('Menutup koneksi...');
        if (sock) await sock.end(new Error('Shutdown manual'));
        process.exit(0);
    });

}

// Panggil fungsi utama untuk menjalankan bot
startBot().catch(err => {
    console.error("Gagal menjalankan bot:", err);
});