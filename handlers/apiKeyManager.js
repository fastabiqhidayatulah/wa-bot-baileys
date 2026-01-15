// File: handlers/apiKeyManager.js
// Mengelola API keys dengan enkripsi

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const API_KEYS_FILE = path.join(__dirname, '..', 'api_keys.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-this-in-production';

/**
 * Enkripsi nilai dengan AES-256
 */
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0')).slice(0, 32), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Dekripsi nilai
 */
function decrypt(text) {
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0')).slice(0, 32), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        throw new Error('Gagal dekripsi API key');
    }
}

/**
 * Baca semua API keys (terenkripsi)
 */
function loadApiKeys() {
    try {
        if (fs.existsSync(API_KEYS_FILE)) {
            return JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf-8'));
        }
        return {};
    } catch (error) {
        console.error('Gagal memuat API keys:', error);
        return {};
    }
}

/**
 * Simpan API keys
 */
function saveApiKeys(keys) {
    try {
        fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2));
    } catch (error) {
        throw new Error(`Gagal menyimpan API keys: ${error.message}`);
    }
}

/**
 * Dapatkan API key (terenkripsi, hanya preview)
 */
function getApiKey(provider) {
    const keys = loadApiKeys();
    if (!keys[provider]) {
        return null;
    }
    const encrypted = keys[provider];
    // Return hanya preview (last 10 char) + status
    return {
        provider,
        preview: encrypted.substring(encrypted.length - 10),
        isSet: !!encrypted
    };
}

/**
 * Dapatkan API key terdekrips (HANYA untuk internal usage)
 */
function getDecryptedApiKey(provider) {
    const keys = loadApiKeys();
    if (!keys[provider]) {
        return null;
    }
    try {
        return decrypt(keys[provider]);
    } catch (e) {
        return null;
    }
}

/**
 * Simpan/update API key (dengan enkripsi)
 */
function setApiKey(provider, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key tidak boleh kosong');
    }
    const keys = loadApiKeys();
    keys[provider] = encrypt(apiKey.trim());
    saveApiKeys(keys);
}

/**
 * Hapus API key
 */
function deleteApiKey(provider) {
    const keys = loadApiKeys();
    delete keys[provider];
    saveApiKeys(keys);
}

/**
 * Validasi API key dengan simple test
 */
async function validateApiKey(provider, apiKey) {
    try {
        if (provider === 'gemini') {
            // Validasi format dasar
            if (!apiKey || apiKey.length < 20) {
                return { valid: false, message: 'Format API key Gemini tidak valid (terlalu pendek)' };
            }
            
            // Coba test dengan API call sederhana dengan timeout
            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                // Coba dengan model yang lebih standard
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                
                // Set timeout 10 detik
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout - API tidak merespons')), 10000)
                );
                
                const result = await Promise.race([
                    model.generateContent("ping"),
                    timeoutPromise
                ]);
                
                return { valid: true, message: '✓ API key Gemini valid dan dapat diakses' };
            } catch (apiError) {
                // Jika error CORS atau network, format sudah benar
                if (apiError.message.includes('Timeout')) {
                    return { valid: false, message: '⏱️ API Gemini timeout - periksa koneksi internet' };
                } else if (apiError.message.includes('API key') || apiError.message.includes('authentication')) {
                    return { valid: false, message: '❌ API key Gemini tidak valid atau tidak aktif' };
                } else if (apiError.message.includes('is not found') || apiError.message.includes('not supported')) {
                    return { valid: true, message: '✓ API key format valid (model mungkin sedang maintenance)' };
                } else {
                    return { valid: false, message: `❌ Error: ${apiError.message}` };
                }
            }
        } else if (provider === 'custom_api') {
            // Custom API hanya validasi tidak kosong
            if (!apiKey || apiKey.trim().length === 0) {
                return { valid: false, message: 'API key tidak boleh kosong' };
            }
            return { valid: true, message: '✓ Custom API key siap disimpan' };
        } else {
            return { valid: true, message: 'API key siap disimpan' };
        }
    } catch (error) {
        return { valid: false, message: `Error: ${error.message}` };
    }
}

/**
 * Daftar provider yang tersedia
 */
function getAvailableProviders() {
    return [
        { id: 'gemini', name: 'Google Gemini AI', icon: '🤖', color: 'blue' },
        { id: 'custom_api', name: 'Custom External API', icon: '🔌', color: 'purple' }
    ];
}

module.exports = {
    encrypt,
    decrypt,
    loadApiKeys,
    saveApiKeys,
    getApiKey,
    getDecryptedApiKey,
    setApiKey,
    deleteApiKey,
    validateApiKey,
    getAvailableProviders
};
