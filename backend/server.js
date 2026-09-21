/**
 * AksesAI - Secure Backend API Proxy, Auth & History Server
 * Server-side execution layer protecting Gemini API Key and managing user database.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../'))); // Serve static frontend files

// --- Simple Data Store (Users, History) ---
const DB_FILE = path.join(__dirname, 'db_data.json');

function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            return {
                users: parsed.users || [],
                history: parsed.history || []
            };
        }
    } catch (e) {}
    return {
        users: [
            { id: 'usr_admin', username: 'admin', email: 'admin@aksesai.id', password: 'adminpassword123', role: 'admin' }
        ],
        history: []
    };
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save DB file:', e);
    }
}

let db = loadDatabase();

// --- Auth Helper Token Simulation ---
function verifyToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        const user = db.users.find(u => u.id === decoded.id);
        return user || null;
    } catch (e) {
        return null;
    }
}

function getActiveKey() {
    return process.env.GEMINI_API_KEY || '';
}

// --- SECURE GEMINI AI PROXY ENDPOINTS ---

app.post('/api/ai/simplify', async (req, res) => {
    const { text, base64Data, mimeType, scenario = 'Umum' } = req.body;
    if (!text && !base64Data) {
        return res.status(400).json({ error: { message: 'Harap berikan teks atau unggah berkas/foto.' } });
    }

    const activeKey = getActiveKey();
    if (!activeKey) {
        return res.status(500).json({ 
            error: { 
                message: 'Layanan AI server belum dikonfigurasi dengan benar. Silakan pastikan server-side GEMINI_API_KEY dikonfigurasi di server.' 
            } 
        });
    }

    const systemInstruction = `Anda adalah AksesAI, pendamping aksesibilitas informasi untuk komunitas Tuli & Teman Dengar Indonesia.
Tugas Anda adalah membaca, menganalisis, dan mentransformasikan dokumen/foto/teks yang rumit atau formal menjadi informasi yang MUDAH DIBACA, DITANGKAP, DAN DIPAHAMI.

KEJUJURAN & AKURASI:
- Pertahankan makna asli dari sumber. Jangan pernah mengarang detail atau tanggal yang tidak ada di teks/foto/dokumen.
- Jika dokumen/foto samar atau sulit dibaca, sebutkan secara jelas pada bagian "unclear_notes".

PERSYARATAN TERJEMAHAN & PENYEDERHANAAN TEKS ("simplified_version"):
- Pertahankan struktur paragraf dan kalimat asli dari teks sumber.
- Hasilkan terjemahan dan penyederhanaan bahasa yang bersih, alami, ramah, dan mudah dipahami dalam Bahasa Indonesia standar.
- JANGAN menyisipkan penjelasan tambahan, komentar AI, atau istilah teknis/asing yang membingungkan di dalam "simplified_version".
- JANGAN merekayasa atau mencampurkan bahasa yang tidak perlu.
- Jaga agar format tetap rapi dan mudah dibaca.

Output WAJIB JSON dengan format persis berikut:
{
  "summary": "Penjelasan ringkas 2-3 kalimat mengenai apa arti/isi dokumen ini (WHAT THIS MEANS).",
  "key_points": ["Poin penting 1", "Poin penting 2"],
  "what_you_need_to_know": ["Rincian atau hal kritis yang wajib diketahui pengguna"],
  "dates_and_deadlines": ["Tanggal, waktu, jam, atau tenggat penting jika ada"],
  "locations": ["Lokasi, alamat, atau nama tempat penting jika ada"],
  "actions": ["Langkah tindakan atau hal yang harus dilakukan jika dokumen berisi instruksi"],
  "simplified_version": "Teks lengkap dalam versi Bahasa Indonesia yang sangat sederhana, polos, dan jelas.",
  "unclear_notes": "Sebutkan jika ada bagian teks/foto yang buram, tidak terbaca, atau meragukan. Kosongkan string ini jika semua jelas."
}`;

    const parts = [];
    if (base64Data && mimeType) {
        if (mimeType === 'text/plain') {
            const decodedText = Buffer.from(base64Data, 'base64').toString('utf8');
            parts.push({ text: `Konteks Berkas Teks: ${scenario}\n\nTeks Berkas Asli:\n${decodedText}\n${text ? '\nTeks Pengguna: ' + text : ''}` });
        } else {
            parts.push({ inlineData: { mimeType, data: base64Data } });
            if (text) {
                parts.push({ text: `Catatan Tambahan Konteks: ${scenario}\nTeks Pengguna: ${text}\n\nAnalisis foto/dokumen di atas dan transformasi menjadi format JSON terstruktur yang dapat diakses.` });
            } else {
                parts.push({ text: `Konteks: ${scenario}\n\nAnalisis foto/dokumen di atas dan transformasi menjadi format JSON terstruktur yang dapat diakses.` });
            }
        }
    } else {
        parts.push({ text: `Konteks: ${scenario}\n\nTeks Asli:\n${text}` });
    }

    try {
        const response = await fetch(`${GEMINI_URL}?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            const rawMsg = data.error?.message || response.statusText || '';
            console.error("Gemini API Error details:", response.status, rawMsg);
            if (response.status === 503 || response.status === 429 || rawMsg.toLowerCase().includes('high demand') || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('rate')) {
                return res.status(503).json({ error: { message: 'Model AI sedang padat. Silakan coba lagi beberapa saat.' } });
            }
            return res.status(response.status).json({ error: { message: `Gagal memproses dengan Gemini AI: ${rawMsg}` } });
        }

        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(rawText);

        return res.json(parsed);
    } catch (error) {
        console.error('Proxy Error /ai/simplify:', error);
        return res.status(500).json({ error: { message: `Gagal memproses penyederhanaan: ${error.message}` } });
    }
});

app.post('/api/ai/explain-further', async (req, res) => {
    const { originalText, currentSimplification, question } = req.body;
    const activeKey = getActiveKey();
    if (!activeKey) {
        return res.status(500).json({ error: { message: 'Layanan AI server belum dikonfigurasi.' } });
    }

    const prompt = `Teks/Konteks Asli: ${originalText || 'Dokumen/Foto'}\nRingkasan Saat Ini: ${JSON.stringify(currentSimplification)}\nPertanyaan Pengguna: ${question}\n\nBerikan jawaban ramah, jelas, dan langsung dalam Bahasa Indonesia.`;

    try {
        const response = await fetch(`${GEMINI_URL}?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            const msg = data.error?.message || response.statusText;
            return res.status(response.status).json({ error: { message: `Gemini API Error: ${msg}` } });
        }
        const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada penjelasan tambahan.';
        return res.json({ answer: textResp });
    } catch (error) {
        return res.status(500).json({ error: { message: `Gagal memproses pertanyaan lanjutan: ${error.message}` } });
    }
});

app.post('/api/ai/audio-process', async (req, res) => {
    const { base64Data, mimeType, transcriptText } = req.body;
    const activeKey = getActiveKey();
    if (!activeKey) {
        return res.status(500).json({ error: { message: 'Layanan AI server belum dikonfigurasi.' } });
    }

    const systemInstruction = `Anda adalah AksesAI, pendamping aksesibilitas media untuk komunitas Tuli & Teman Dengar Indonesia.
Tugas Anda adalah menganalisis berkas audio/video atau transkripnya dan mentransformasikan ke informasi yang sangat jelas, terstruktur, dan mudah diakses.

TRANSKRIP & SPEAKER DIARIZATION (PERGANTIAN PEMBICARA):
- Lakukan pengelompokan pembicaraan berdasarkan PERGANTIAN SUARA PEMBICARA ASLI (Voice / Speaker Turns).
- Gunakan label pembicara netral seperti "Pembicara A", "Pembicara B", "Pembicara C".
- Ganti label pembicara HANYA ketika terdapat bukti pergantian suara/nada pembicara yang berbeda dalam audio. JANGAN MEMBUAT PERGANTIAN PEMBICARA BERDASARKAN INTERVAL WAKTU BUATAN (seperti setiap 2 menit ganti pembicara).
- Jika hanya 1 pembicara yang bersuara atau pergantian pembicara tidak dapat dipastikan dengan jelas, gunakan label "Pembicara A" (atau "Pembicara") secara konsisten untuk seluruh pembicaraan.
- Sertakan rentang stempel waktu jika memungkinkan, dengan format: "[00:00 - 00:15] Pembicara A: \"teks...\"".

AKURASI & KEJUJURAN:
- Pertahankan makna asli dari pembicaraan. Jangan pernah mengarang informasi yang tidak ada.
- Jika ada suara buram/tidak jelas, sebutkan secara jujur pada "unclear_sections".

Output WAJIB JSON dengan format persis:
{
  "transcript": "[00:00 - 00:15] Pembicara A: \"...\"\n[00:15 - 00:30] Pembicara B: \"...\"",
  "summary": "Ringkasan 1-2 kalimat tentang INTI PEMBICARAAN.",
  "what_it_means": "Penjelasan ringkas dan ramah tentang APA ARTINYA bagi pengguna.",
  "key_points": ["Poin penting 1", "Poin penting 2"],
  "what_you_need_to_know": ["Hal atau rincian penting yang wajib diketahui"],
  "dates_and_times": ["Tanggal dan waktu penting jika ada"],
  "locations": ["Lokasi, alamat, nama instansi atau tempat jika ada"],
  "actions": ["Langkah atau tindakan yang harus dilakukan jika ada"],
  "unclear_sections": ["Bagian suara yang buram/tidak jelas. Kosongkan array jika semua jelas."]
}`;

    const parts = [];
    if (base64Data && mimeType) {
        parts.push({ inlineData: { mimeType, data: base64Data } });
        parts.push({ text: "Analisis berkas audio/video ini dan buat transkrip diarization serta penjelasan terstruktur." });
    } else if (transcriptText) {
        parts.push({ text: `Transkrip:\n${transcriptText}` });
    }

    try {
        const response = await fetch(`${GEMINI_URL}?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            const rawMsg = data.error?.message || response.statusText || '';
            console.error("Gemini Audio API Error details:", response.status, rawMsg);
            if (response.status === 503 || response.status === 429 || rawMsg.toLowerCase().includes('high demand') || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('rate')) {
                return res.status(503).json({ error: { message: 'Model AI sedang padat. Silakan coba lagi beberapa saat.' } });
            }
            return res.status(response.status).json({ error: { message: `Gagal memproses media dengan Gemini AI: ${rawMsg}` } });
        }

        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        return res.json(JSON.parse(rawText));
    } catch (error) {
        return res.status(500).json({ error: { message: `Gagal memproses media: ${error.message}` } });
    }
});

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: { message: 'Semua bidang wajib diisi.' } });

    const existing = db.users.find(u => u.username === username || u.email === email);
    if (existing) return res.status(400).json({ error: { message: 'Username atau Email sudah terdaftar.' } });

    const newUser = {
        id: 'usr_' + Date.now(),
        username,
        email,
        password,
        role: 'user',
        created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase(db);

    const token = Buffer.from(JSON.stringify({ id: newUser.id, username: newUser.username })).toString('base64');
    return res.json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role } });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => (u.username === username || u.email === username) && u.password === password);
    if (!user) return res.status(401).json({ error: { message: 'Username atau kata sandi tidak cocok.' } });

    const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64');
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

app.get('/api/auth/me', (req, res) => {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: { message: 'Sesi berakhir.' } });
    return res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// --- HISTORY ENDPOINTS (User isolated) ---

app.get('/api/history', (req, res) => {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: { message: 'Harap masuk terlebih dahulu.' } });

    const userHistory = db.history.filter(h => h.user_id === user.id);
    return res.json({ history: userHistory });
});

app.post('/api/history', (req, res) => {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: { message: 'Harap masuk terlebih dahulu.' } });

    const { feature, title, input_snippet, result_data, language = 'Bahasa Indonesia' } = req.body;
    const newItem = {
        id: 'hist_' + Date.now(),
        user_id: user.id,
        feature,
        title: title || 'Aktivitas AksesAI',
        input_snippet,
        result_data,
        language,
        timestamp: new Date().toISOString()
    };
    db.history.unshift(newItem);
    saveDatabase(db);

    return res.json({ success: true, item: newItem });
});

app.delete('/api/history/:id', (req, res) => {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: { message: 'Harap masuk terlebih dahulu.' } });

    const initialLength = db.history.length;
    db.history = db.history.filter(h => !(h.id === req.params.id && h.user_id === user.id));
    saveDatabase(db);

    return res.json({ success: true, deleted: db.history.length < initialLength });
});

app.delete('/api/history', (req, res) => {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: { message: 'Harap masuk terlebih dahulu.' } });

    db.history = db.history.filter(h => h.user_id !== user.id);
    saveDatabase(db);

    return res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`🚀 AksesAI Server berjalan di http://localhost:${PORT}`);
});

