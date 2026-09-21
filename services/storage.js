/**
 * AksesAI - Storage & Accessibility Settings Manager
 * Manages user preferences (font scale, contrast mode, dyslexia font)
 * and secure API key storage in sessionStorage.
 */

import { DyslexiaService } from './dyslexiaService.js';

const STORAGE_KEYS = {
    FONT_SCALE: 'aksesai_font_scale',
    CONTRAST_MODE: 'aksesai_contrast_mode',
    DYSLEXIA_FONT: 'aksesai_dyslexia_font'
};

export const StorageService = {
    // Accessibility Preferences
    getFontScale() {
        return localStorage.getItem(STORAGE_KEYS.FONT_SCALE) || 'normal'; // 'normal', 'large', 'xlarge'
    },

    setFontScale(scale) {
        localStorage.setItem(STORAGE_KEYS.FONT_SCALE, scale);
        document.documentElement.setAttribute('data-font-scale', scale);
    },

    getContrastMode() {
        return localStorage.getItem(STORAGE_KEYS.CONTRAST_MODE) || 'default'; // 'default', 'high-contrast', 'dark'
    },

    setContrastMode(mode) {
        localStorage.setItem(STORAGE_KEYS.CONTRAST_MODE, mode);
        document.documentElement.setAttribute('data-theme', mode);
    },

    isDyslexiaFontEnabled() {
        return localStorage.getItem(STORAGE_KEYS.DYSLEXIA_FONT) === 'true';
    },

    setDyslexiaFont(enabled) {
        localStorage.setItem(STORAGE_KEYS.DYSLEXIA_FONT, enabled ? 'true' : 'false');
        if (enabled) {
            document.documentElement.classList.add('dyslexia-font');
        } else {
            document.documentElement.classList.remove('dyslexia-font');
        }
        DyslexiaService.applyAppWideDyslexiaText(enabled);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dyslexiaModeChanged', { detail: { enabled } }));
        }
    },

    // Apply saved settings on app load
    applySavedSettings() {
        this.setFontScale(this.getFontScale());
        this.setContrastMode(this.getContrastMode());
        this.setDyslexiaFont(this.isDyslexiaFontEnabled());
    }
};
