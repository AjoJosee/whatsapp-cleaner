const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const crypto = require('crypto');
const qrcode = require('qrcode-terminal');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'message_history.json');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading history:', e);
    }
    return [];
}

function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving history:', e);
    }
}

function pruneHistory(history) {
    const now = Date.now();
    return history.filter(item => (now - item.timestamp) < THIRTY_DAYS_MS);
}

async function getMessageSignature(msg) {
    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            if (media && media.data) {
                return crypto.createHash('sha256').update(media.data).digest('hex');
            }
        } catch (e) {
            console.error('Failed to download media:', e);
        }
        return null;
    }
    
    // TEXT HANDLING (The "Sure" Bug Fix + Fuzzy Matcher)
    if (!msg.body) return null;
    
    const text = msg.body.trim();
    
    // Ignore short texts (e.g. "Ok", "Sure", "Happy birthday") unless it was explicitly Forwarded
    if (text.length < 30 && !msg.isForwarded) {
        return null; 
    }
    
    // Fuzzy Matcher: Remove all spaces, punctuation, and emojis, then convert to lowercase.
    // Example: "Happy bday 🎂!!!" -> "happybday"
    const fuzzyText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // If the message was ONLY emojis (e.g., "🎂"), fuzzyText will be empty, so we ignore it
    if (fuzzyText.length === 0) return null;
    
    return crypto.createHash('sha256').update(fuzzyText).digest('hex');
}

function logAction(message) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${message}`);
}

let messageHistory = loadHistory();
messageHistory = pruneHistory(messageHistory);
saveHistory(messageHistory);

const waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, 'wa-session') }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        protocolTimeout: 0
    }
});

waClient.on('qr', (qr) => {
    logAction('QR code generated! Please scan this code with your WhatsApp app to log in:');
    qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
    logAction('WhatsApp is connected and ready! Monitoring ALL groups in the background.');
});

waClient.on('authenticated', () => {
    logAction('Authenticated successfully.');
});

waClient.on('auth_failure', msg => {
    logAction('Authentication failure: ' + msg);
});

waClient.on('disconnected', (reason) => {
    logAction('Disconnected: ' + reason);
});

waClient.on('message_create', async (msg) => {
    try {
        const chat = await msg.getChat();
        if (!chat.isGroup) return; // Only process group messages

        const signature = await getMessageSignature(msg);
        if (!signature) return; // Cannot generate signature

        const now = Date.now();
        const isDuplicate = messageHistory.some(item => item.signature === signature);

        if (isDuplicate) {
            logAction(`Duplicate detected in '${chat.name}'. Deleting for me...`);
            try {
                await msg.delete(false);
                logAction(`-> Deletion successful.`);
            } catch (delErr) {
                logAction(`-> Deletion failed: ${delErr.message}`);
            }
        } else {
            messageHistory.push({
                id: msg.id._serialized,
                signature: signature,
                timestamp: now,
                groupId: chat.id._serialized
            });
            saveHistory(messageHistory);
        }

        if (messageHistory.length % 50 === 0) {
            messageHistory = pruneHistory(messageHistory);
            saveHistory(messageHistory);
        }
    } catch (e) {
        console.error('Error processing message:', e);
    }
});

logAction('Starting WhatsApp Duplicate Remover (Headless Server Mode)...');
waClient.initialize();
// Graceful Crash Handler
process.on('uncaughtException', async (error) => {
    console.error('Bot crashed! Closing browser cleanly...', error);
    try {
        if (waClient) await waClient.destroy();
    } catch (e) {}
    process.exit(1);
});

process.on('unhandledRejection', async (error) => {
    console.error('Connection dropped! Closing browser cleanly...', error);
    try {
        if (waClient) await waClient.destroy();
    } catch (e) {}
    process.exit(1);
});
