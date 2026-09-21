/**
 * AksesAI - Auth Service
 * Manages optional login/registration state & user session.
 */

import { ApiService } from './apiService.js';

export const AuthService = {
    listeners: [],

    onAuthChange(callback) {
        this.listeners.push(callback);
    },

    notify() {
        const user = this.getCurrentUser();
        console.log('[AUTH] current user changed:', user ? user.username : 'LOGGED OUT');
        this.listeners.forEach(cb => cb(user));
    },

    getCurrentUser() {
        return ApiService.getCurrentUser();
    },

    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    async login(username, password) {
        const data = await ApiService.login(username, password);
        console.log('[AUTH] login success:', username);
        this.notify();
        return data;
    },

    async register(username, email, password) {
        const data = await ApiService.register(username, email, password);
        this.notify();
        return data;
    },

    logout() {
        ApiService.logout();
        this.notify();
    }
};
