// File: handlers/attachmentHandler.js
// Handler untuk mengelola file attachment dan pengiriman ke WhatsApp

const fs = require('fs');
const path = require('path');

const ATTACHMENTS_DIR = path.join(__dirname, '..', 'attachments');

/**
 * Simpan file attachment
 * @param {string} filename - Nama file
 * @param {Buffer} fileBuffer - Buffer file
 * @returns {object} Info file yang disimpan
 */
function saveAttachment(filename, fileBuffer) {
    try {
        if (!filename || !fileBuffer) {
            throw new Error('Filename dan file buffer harus diisi');
        }

        // Validasi filename untuk security
        const sanitizedName = path.basename(filename);
        if (sanitizedName !== filename) {
            throw new Error('Filename tidak valid - tidak boleh ada path traversal');
        }

        const filePath = path.join(ATTACHMENTS_DIR, sanitizedName);
        
        // Pastikan direktori exists
        if (!fs.existsSync(ATTACHMENTS_DIR)) {
            fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
        }

        // Simpan file
        fs.writeFileSync(filePath, fileBuffer);

        return {
            success: true,
            filename: sanitizedName,
            path: filePath,
            size: fileBuffer.length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Ambil file attachment
 * @param {string} filename - Nama file
 * @returns {Buffer} Buffer file atau null jika tidak ada
 */
function getAttachment(filename) {
    try {
        const sanitizedName = path.basename(filename);
        const filePath = path.join(ATTACHMENTS_DIR, sanitizedName);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        return fs.readFileSync(filePath);
    } catch (error) {
        console.error(`Error reading attachment ${filename}:`, error);
        return null;
    }
}

/**
 * Daftar semua attachment
 * @returns {array} Daftar file di folder attachments
 */
function listAttachments() {
    try {
        if (!fs.existsSync(ATTACHMENTS_DIR)) {
            return [];
        }

        const files = fs.readdirSync(ATTACHMENTS_DIR);
        return files
            .filter(file => file !== '.gitkeep')
            .map(file => {
                const filePath = path.join(ATTACHMENTS_DIR, file);
                const stat = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stat.size,
                    modified: stat.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    } catch (error) {
        console.error('Error listing attachments:', error);
        return [];
    }
}

/**
 * Hapus attachment
 * @param {string} filename - Nama file
 * @returns {object} Status penghapusan
 */
function deleteAttachment(filename) {
    try {
        const sanitizedName = path.basename(filename);
        const filePath = path.join(ATTACHMENTS_DIR, sanitizedName);

        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File tidak ditemukan' };
        }

        fs.unlinkSync(filePath);
        return { success: true, message: `File ${sanitizedName} berhasil dihapus` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Validasi mime type file
 * @param {string} filename - Nama file
 * @param {string} allowedTypes - Tipe yang diperbolehkan (comma separated)
 * @returns {boolean} Valid atau tidak
 */
function validateMimeType(filename, allowedTypes = '') {
    const ext = path.extname(filename).toLowerCase();
    
    // Default allowed types jika tidak dispesifikasi
    const defaultAllowed = [
        '.jpg', '.jpeg', '.png', '.gif', '.pdf',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.txt', '.zip', '.rar', '.mp3', '.mp4', '.avi'
    ];

    if (!allowedTypes) {
        return defaultAllowed.includes(ext);
    }

    const allowedArray = allowedTypes.split(',').map(t => t.trim());
    return allowedArray.some(type => {
        if (type.startsWith('.')) {
            return ext === type.toLowerCase();
        }
        return ext === `.${type.toLowerCase()}`;
    });
}

/**
 * Send file ke WhatsApp
 * Memerlukan sock instance dari Baileys
 * @param {object} sock - Baileys socket instance
 * @param {string} targetJid - Target JID
 * @param {string} filename - Nama file di folder attachments
 * @param {string} caption - Caption (opsional)
 * @returns {Promise<object>} Result pengiriman
 */
async function sendFileToWhatsApp(sock, targetJid, filename, caption = '') {
    try {
        const fileBuffer = getAttachment(filename);
        if (!fileBuffer) {
            return { success: false, error: `File ${filename} tidak ditemukan` };
        }

        const filePath = path.join(ATTACHMENTS_DIR, path.basename(filename));
        const ext = path.extname(filename).toLowerCase();

        let messageContent = {};

        // Tentukan tipe berdasarkan extension
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            messageContent = {
                image: fileBuffer,
                caption: caption || undefined
            };
        } else if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) {
            messageContent = {
                video: fileBuffer,
                caption: caption || undefined
            };
        } else if (['.mp3', '.wav', '.aac', '.m4a'].includes(ext)) {
            messageContent = {
                audio: fileBuffer
            };
        } else {
            // Untuk file lainnya gunakan document
            messageContent = {
                document: fileBuffer,
                fileName: filename,
                mimetype: getMimeType(ext),
                caption: caption || undefined
            };
        }

        // Send ke WhatsApp
        const result = await sock.sendMessage(targetJid, messageContent);

        return {
            success: true,
            message: `File ${filename} berhasil dikirim ke ${targetJid}`,
            messageId: result.key.id
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get MIME type dari extension
 * @param {string} ext - Extension file (contoh: .pdf, .jpg, dll)
 * @returns {string} MIME type
 */
function getMimeType(ext) {
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

module.exports = {
    saveAttachment,
    getAttachment,
    listAttachments,
    deleteAttachment,
    validateMimeType,
    sendFileToWhatsApp,
    getMimeType,
    ATTACHMENTS_DIR
};
