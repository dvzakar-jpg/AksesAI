const LOCAL_API_URL = 'http://localhost:3000/api';
const PRODUCTION_API_URL = 'https://aksesai-backend-production.up.railway.app/api';

/**
 * Smart fetch with automatic fallback:
 * Tries local server (http://localhost:3000/api) first if on localhost, then falls back to Railway production API.
 */
async function fetchWithFallback(endpointPath, fetchOptions = {}) {
    const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const urlsToTry = isLocalhost 
        ? [LOCAL_API_URL, PRODUCTION_API_URL]
        : [PRODUCTION_API_URL, LOCAL_API_URL];

    let lastError = null;

    for (const baseUrl of urlsToTry) {
        try {
            const res = await fetch(`${baseUrl}${endpointPath}`, fetchOptions);
            // If server returns 502/503 (server initializing/restarting on cloud), try next URL
            if ((res.status === 502 || res.status === 503 || res.status === 504) && urlsToTry.indexOf(baseUrl) < urlsToTry.length - 1) {
                lastError = new Error(`Server returned status ${res.status}`);
                continue;
            }
            return res;
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error('Gagal terhubung ke server backend AksesAI.');
}

// Local storage keys for standalone mode
const LOCAL_USERS_KEY = 'aksesai_users_db';
const LOCAL_HISTORY_KEY = 'aksesai_user_history_db';

function getLocalUsers() {
    try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
        { id: 'usr_admin', username: 'admin', email: 'admin@aksesai.id', password: 'adminpassword123', role: 'admin' }
    ];
}

function saveLocalUsers(users) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function getLocalHistoryAll() {
    try {
        const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
}

function saveLocalHistoryAll(historyList) {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList));
}

export const ApiService = {
    /**
     * Auth Header Helper
     */
    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('aksesai_auth_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    /**
     * Helper to format network fetch errors cleanly
     */
    _handleFetchError(e, defaultMsg) {
        console.error('ApiService error:', e);
        if (e.name === 'TypeError' || (e.message && (e.message.includes('fetch') || e.message.includes('Failed')))) {
            return new Error('Gagal terhubung ke server backend AksesAI. Silakan pastikan server backend (node server.js) sudah dijalankan di terminal atau tunggu beberapa saat hingga deployment Railway selesai.');
        }
        return new Error(e.message || defaultMsg);
    },

    /**
     * AI Simplify Request (Secure Server-Side AI Proxy)
     * Supports text, images/photos, PDFs, and documents
     */
    async simplifyText(payload = {}) {
        const { text = '', base64Data = null, mimeType = null, scenario = 'Umum' } = typeof payload === 'string' ? { text: payload } : payload;

        try {
            const res = await fetchWithFallback('/ai/simplify', {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify({ text, base64Data, mimeType, scenario })
            });
            const data = await res.json();
            if (res.ok) return data;
            throw new Error(data.error?.message || `Gagal memproses penyederhanaan (Status ${res.status}).`);
        } catch (e) {
            throw this._handleFetchError(e, 'Gagal terhubung ke layanan server AksesAI.');
        }
    },

    /**
     * AI Explain Further Request
     */
    async explainFurther(originalText, currentSimplification, question) {
        try {
            const res = await fetchWithFallback('/ai/explain-further', {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify({ originalText, currentSimplification, question })
            });
            const data = await res.json();
            if (res.ok) return data.answer || data;
            throw new Error(data.error?.message || `Gagal memproses penjelasan lanjutan (Status ${res.status}).`);
        } catch (e) {
            throw this._handleFetchError(e, 'Gagal terhubung ke layanan server AksesAI.');
        }
    },

    /**
     * AI Process Audio/Video Media Request
     */
    async processAudioVideo(base64Data, mimeType, transcriptText = '') {
        try {
            const res = await fetchWithFallback('/ai/audio-process', {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify({ base64Data, mimeType, transcriptText })
            });
            const data = await res.json();
            if (res.ok) return data;
            throw new Error(data.error?.message || `Gagal memproses berkas media (Status ${res.status}).`);
        } catch (e) {
            throw this._handleFetchError(e, 'Gagal terhubung ke layanan server AksesAI.');
        }
    },


    // --- AUTHENTICATION (Server + Standalone Local Storage Fallback) ---
    async login(username, password) {
        // Try backend server first
        try {
            const res = await fetchWithFallback('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem('aksesai_auth_token', data.token);
                    localStorage.setItem('aksesai_user', JSON.stringify(data.user));
                }
                return data;
            }
        } catch (e) {}

        // Local Standalone Auth Fallback
        const users = getLocalUsers();
        const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
        if (!user) {
            throw new Error('Username atau kata sandi tidak cocok.');
        }

        const userPayload = { id: user.id, username: user.username, email: user.email, role: user.role };
        const token = btoa(JSON.stringify(userPayload));

        localStorage.setItem('aksesai_auth_token', token);
        localStorage.setItem('aksesai_user', JSON.stringify(userPayload));

        return { token, user: userPayload };
    },

    async register(username, email, password) {
        try {
            const res = await fetchWithFallback('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem('aksesai_auth_token', data.token);
                    localStorage.setItem('aksesai_user', JSON.stringify(data.user));
                }
                return data;
            }
        } catch (e) {}

        // Local Standalone Registration Fallback
        const users = getLocalUsers();
        const existing = users.find(u => u.username === username || u.email === email);
        if (existing) {
            throw new Error('Username atau Email sudah terdaftar. Silakan pilih username lain.');
        }

        const newUser = {
            id: 'usr_' + Date.now(),
            username,
            email,
            password,
            role: 'user'
        };
        users.push(newUser);
        saveLocalUsers(users);

        const userPayload = { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role };
        const token = btoa(JSON.stringify(userPayload));

        localStorage.setItem('aksesai_auth_token', token);
        localStorage.setItem('aksesai_user', JSON.stringify(userPayload));

        return { token, user: userPayload };
    },

    logout() {
        localStorage.removeItem('aksesai_auth_token');
        localStorage.removeItem('aksesai_user');
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('aksesai_user');
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch (e) { return null; }
    },

    // --- USER HISTORY (Server + Local User-Isolated Storage) ---
    async getHistory() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];

        try {
            const res = await fetchWithFallback('/history', {
                method: 'GET',
                headers: this._getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                return data.history || [];
            }
        } catch (e) {}

        // Local Standalone History Filtered by User ID
        const allHistory = getLocalHistoryAll();
        return allHistory.filter(h => h.user_id === currentUser.id);
    },

    async saveHistoryItem(item) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        item.user_id = currentUser.id;

        try {
            const res = await fetchWithFallback('/history', {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify(item)
            });
            if (res.ok) return await res.json();
        } catch (e) {}

        const allHistory = getLocalHistoryAll();
        allHistory.unshift(item);
        saveLocalHistoryAll(allHistory);
        return item;
    },

    async deleteHistoryItem(id) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        try {
            await fetchWithFallback(`/history/${id}`, {
                method: 'DELETE',
                headers: this._getHeaders()
            });
        } catch (e) {}

        const allHistory = getLocalHistoryAll().filter(h => !(h.id === id && h.user_id === currentUser.id));
        saveLocalHistoryAll(allHistory);
    },

    async clearHistory() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        try {
            await fetchWithFallback('/history', {
                method: 'DELETE',
                headers: this._getHeaders()
            });
        } catch (e) {}

        const allHistory = getLocalHistoryAll().filter(h => h.user_id !== currentUser.id);
        saveLocalHistoryAll(allHistory);
    }
};

