const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKeyManager = require('./apiKeyManager');
require('dotenv').config();

async function geminiHandler(sock, jid, question) {
    if (!question) {
        await sock.sendMessage(jid, { text: 'Silakan berikan pertanyaan setelah perintah /gemini.' });
        return;
    }

    try {
        await sock.sendMessage(jid, { text: '🤖 Sedang berpikir...' });

        // Ambil API key dari manager (terenkripsi) atau fallback ke .env
        let geminiKey = null;
        try {
            geminiKey = apiKeyManager.getDecryptedApiKey('gemini');
        } catch (e) {
            console.error('[Gemini] Error decrypt API key dari manager:', e.message);
        }
        
        // Fallback ke .env jika tidak ada di manager
        if (!geminiKey) {
            geminiKey = process.env.GEMINI_API_KEY;
        }
        
        if (!geminiKey) {
            await sock.sendMessage(jid, { text: 'Maaf, API key Gemini belum dikonfigurasi. Silakan atur di dashboard Settings.' });
            return;
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        
        // Coba model terbaru dulu (gemini-2.5-flash paling reliable untuk free tier)
        // Urutan: gemini-2.5-flash (recommended), gemini-1.5-flash, gemini-1.5-pro, gemini-pro
        const models = [
            'gemini-2.5-flash',      // Latest fast model, recommended free tier
            'gemini-1.5-flash',      // Older but stable
            'gemini-1.5-pro',        // Older pro model
            'gemini-pro'             // Deprecated but might work
        ];
        
        let result = null;
        let lastError = null;
        let successModel = null;
        
        for (const modelName of models) {
            try {
                console.log(`[Gemini] Mencoba model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(question);
                console.log(`[Gemini] ✓ Model ${modelName} berhasil`);
                successModel = modelName;
                break;
            } catch (modelError) {
                console.log(`[Gemini] ✗ Model ${modelName} gagal: ${modelError.message.substring(0, 80)}`);
                lastError = modelError;
                // Lanjut ke model berikutnya
                continue;
            }
        }
        
        if (!result || !successModel) {
            console.error('[Gemini] Semua model gagal:', lastError?.message);
            throw lastError || new Error('Semua model tidak tersedia. Cek akses API Gemini di https://aistudio.google.com/app/apikeys');
        }
        
        const response = await result.response;
        const text = response.text();
        await sock.sendMessage(jid, { text: text });
        
    } catch (error) {
        console.error('[Gemini] Error:', error);
        const errorMsg = error.message || 'Kesalahan tidak diketahui';
        
        // Format error message berdasarkan jenis error
        let displayMsg = '❌ Error: Tidak bisa terhubung ke Gemini API';
        if (errorMsg.includes('404')) {
            displayMsg = '❌ Model tidak tersedia. Cek: https://aistudio.google.com/app/apikeys';
        } else if (errorMsg.includes('authentication') || errorMsg.includes('API_KEY_INVALID')) {
            displayMsg = '❌ API key tidak valid. Update di Settings > Google Gemini AI';
        } else if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
            displayMsg = '⏱️ Quota habis atau rate limit. Coba lagi nanti.';
        } else if (errorMsg.length > 0) {
            displayMsg = `❌ ${errorMsg.substring(0, 120)}`;
        }
        
        await sock.sendMessage(jid, { text: displayMsg });
    }
}

module.exports = geminiHandler;