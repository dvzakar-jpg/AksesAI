/**
 * AksesAI - History Service
 * Manages user activity history (Speech to Text, Audio Upload, Text Simplification).
 * Fully respects user privacy and provides individual item deletion & clear history actions.
 */

import { ApiService } from './apiService.js';
import { AuthService } from './authService.js';

const LOCAL_STORAGE_HISTORY_KEY = 'aksesai_guest_history';

export const HistoryService = {
    /**
     * Save an activity result to history (Logged in users only)
     */
    async addHistory(feature, title, inputSnippet, resultData, language = 'Bahasa Indonesia') {
        if (!AuthService.isLoggedIn()) return null;

        const item = {
            id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            feature,
            title,
            input_snippet: inputSnippet ? inputSnippet.slice(0, 150) : '',
            result_data: resultData,
            language,
            timestamp: new Date().toISOString()
        };

        return ApiService.saveHistoryItem(item).catch(() => null);
    },

    /**
     * Fetch user history (Logged in users only)
     */
    async getHistory() {
        if (!AuthService.isLoggedIn()) {
            return [];
        }

        try {
            const res = await ApiService.getHistory();
            return Array.isArray(res) ? res : (res.history || []);
        } catch (e) {
            return [];
        }
    },

    /**
     * Delete a single history item by ID
     */
    async deleteItem(id) {
        if (AuthService.isLoggedIn()) {
            try {
                await ApiService.deleteHistoryItem(id);
            } catch (e) {}
        }
    },

    /**
     * Clear all history for current user
     */
    async clearAll() {
        if (AuthService.isLoggedIn()) {
            try {
                await ApiService.clearHistory();
            } catch (e) {}
        }
    },

    // --- Guest LocalStorage Fallback Helpers ---
    _getGuestHistory() {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    _addGuestHistory(item) {
        const list = this._getGuestHistory();
        list.unshift(item);
        // Cap guest history to max 50 items
        if (list.length > 50) list.pop();
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(list));
        return item;
    },

    _deleteGuestItem(id) {
        const list = this._getGuestHistory().filter(h => h.id !== id);
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(list));
    }
};
