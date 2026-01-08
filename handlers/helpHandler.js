// File: handlers/helpHandler.js

/**
 * Mengirimkan pesan bantuan yang berisi daftar perintah bot.
 * @param {import('@whiskeysockets/baileys').WASocket} sock - Instance socket Baileys.
 * @param {string} jid - JID (Jabber ID) dari pengirim atau grup.
 */
async function helpHandler(sock, jid) {
    const helpMessage = `👋 *Bantuan Bot Multifungsi* 👋

Berikut adalah daftar perintah yang tersedia:

- \`/help\`: Menampilkan pesan bantuan ini.

- \`/gemini [pertanyaan]\`: Ajukan pertanyaan ke AI.
  Contoh: \`/gemini Apa ibu kota Indonesia?\`

- \`/cuti #[TGL] #NAMA\`: Menambahkan jadwal cuti ke kalender.
  Format tanggal: \`DD Bulan YYYY\`
  
  *Contoh Penggunaan:*
  - Satu hari: \`/cuti #1 Maret 2025 #Andi\`
  - Berurutan: \`/cuti #1-3 Maret 2025 #Budi\`
  - Tdk Berurutan: \`/cuti #5, 10, 15 Maret 2025 #Citra\`

Selamat mencoba!`;
    
    try {
        await sock.sendMessage(jid, { text: helpMessage });
    } catch (error) {
        console.error(`Gagal mengirim pesan bantuan ke ${jid}:`, error);
    }
}

module.exports = helpHandler;