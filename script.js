/**
 * AksesAI - Main Application Entry Point
 * Orchestrates views, accessibility controls, authentication, and history.
 */

import { StorageService } from './services/storage.js';
import { AuthService } from './services/authService.js';
import { ttsService } from './services/ttsService.js';
import { LiveSpeechUI } from './components/liveSpeechUI.js';
import { AudioUploadUI } from './components/audioUploadUI.js';
import { TextSimplifyUI } from './components/textSimplifyUI.js';
import { HistoryUI } from './components/historyUI.js';
import { AuthModalUI } from './components/authModalUI.js';

class AksesAIApp {
    constructor() {
        this.speechUI = null;
        this.uploadUI = null;
        this.simplifyUI = null;
        this.historyUI = null;
        this.authModalUI = null;
        this.activeView = 'speech';
    }

    init() {
        // 1. Apply saved accessibility preferences
        StorageService.applySavedSettings();
        this.initAccessibilityToolbar();

        // 2. Instantiate component views
        const speechContainer = document.getElementById('view-speech-container');
        const uploadContainer = document.getElementById('view-upload-container');
        const simplifyContainer = document.getElementById('view-simplify-container');
        const historyContainer = document.getElementById('view-history-container');

        if (speechContainer) this.speechUI = new LiveSpeechUI(speechContainer);
        if (uploadContainer) this.uploadUI = new AudioUploadUI(uploadContainer);
        if (simplifyContainer) this.simplifyUI = new TextSimplifyUI(simplifyContainer);
        if (historyContainer) this.historyUI = new HistoryUI(historyContainer);

        // Instantiate Auth Dialog
        this.authModalUI = new AuthModalUI();

        // 3. Setup Navigation & View Switching
        this.initViewSwitcher();

        // 4. Setup Authentication State Header Listener
        this.initAuthHeader();

    }

    initAccessibilityToolbar() {
        // Font Scale Buttons
        const fontNormal = document.getElementById('btn-font-normal');
        const fontLarge = document.getElementById('btn-font-large');
        const fontXlarge = document.getElementById('btn-font-xlarge');

        const updateFontButtons = (activeScale) => {
            [fontNormal, fontLarge, fontXlarge].forEach(b => b && b.classList.remove('active'));
            if (activeScale === 'large' && fontLarge) fontLarge.classList.add('active');
            else if (activeScale === 'xlarge' && fontXlarge) fontXlarge.classList.add('active');
            else if (fontNormal) fontNormal.classList.add('active');
        };

        updateFontButtons(StorageService.getFontScale());

        if (fontNormal) fontNormal.addEventListener('click', () => { StorageService.setFontScale('normal'); updateFontButtons('normal'); });
        if (fontLarge) fontLarge.addEventListener('click', () => { StorageService.setFontScale('large'); updateFontButtons('large'); });
        if (fontXlarge) fontXlarge.addEventListener('click', () => { StorageService.setFontScale('xlarge'); updateFontButtons('xlarge'); });

        // Theme Contrast Buttons
        const themeDefault = document.getElementById('btn-theme-default');
        const themeContrast = document.getElementById('btn-theme-contrast');
        const themeDark = document.getElementById('btn-theme-dark');

        const updateThemeButtons = (activeTheme) => {
            [themeDefault, themeContrast, themeDark].forEach(b => b && b.classList.remove('active'));
            if (activeTheme === 'high-contrast' && themeContrast) themeContrast.classList.add('active');
            else if (activeTheme === 'dark' && themeDark) themeDark.classList.add('active');
            else if (themeDefault) themeDefault.classList.add('active');
        };

        updateThemeButtons(StorageService.getContrastMode());

        if (themeDefault) themeDefault.addEventListener('click', () => { StorageService.setContrastMode('default'); updateThemeButtons('default'); });
        if (themeContrast) themeContrast.addEventListener('click', () => { StorageService.setContrastMode('high-contrast'); updateThemeButtons('high-contrast'); });
        if (themeDark) themeDark.addEventListener('click', () => { StorageService.setContrastMode('dark'); updateThemeButtons('dark'); });

        // Dyslexia Font Checkbox
        const chkDyslexia = document.getElementById('chk-dyslexia');
        if (chkDyslexia) {
            chkDyslexia.checked = StorageService.isDyslexiaFontEnabled();
            chkDyslexia.addEventListener('change', (e) => StorageService.setDyslexiaFont(e.target.checked));
        }
    }

    initViewSwitcher() {
        const cardSpeech = document.getElementById('card-choice-speech');
        const cardUpload = document.getElementById('card-choice-upload');
        const cardSimplify = document.getElementById('card-choice-simplify');
        const cardHistory = document.getElementById('card-choice-history');

        const navBeranda = document.getElementById('nav-beranda');
        const navFitur = document.getElementById('nav-fitur');
        const navRiwayat = document.getElementById('nav-riwayat');
        const navTentang = document.getElementById('nav-tentang');

        const navLinks = [navBeranda, navFitur, navRiwayat, navTentang].filter(Boolean);

        const views = {
            speech: document.getElementById('view-speech'),
            upload: document.getElementById('view-upload'),
            simplify: document.getElementById('view-simplify'),
            history: document.getElementById('view-history')
        };

        const cards = {
            speech: cardSpeech,
            upload: cardUpload,
            simplify: cardSimplify,
            history: cardHistory
        };

        const setActiveNavLink = (activeNavEl) => {
            navLinks.forEach(link => link.classList.remove('active'));
            if (activeNavEl) activeNavEl.classList.add('active');
        };

        const switchView = (targetViewKey, shouldScroll = false) => {
            this.activeView = targetViewKey;
            ttsService.stop();

            // Toggle active classes on cards
            Object.keys(cards).forEach(key => {
                if (cards[key]) {
                    const isActive = key === targetViewKey;
                    cards[key].classList.toggle('active', isActive);
                    cards[key].setAttribute('aria-expanded', isActive ? 'true' : 'false');
                }
            });

            // Toggle view visibility
            Object.keys(views).forEach(key => {
                if (views[key]) {
                    if (key === targetViewKey) {
                        views[key].classList.add('active-view');
                    } else {
                        views[key].classList.remove('active-view');
                    }
                }
            });

            // Highlight corresponding navbar link
            if (targetViewKey === 'history') {
                setActiveNavLink(navRiwayat);
            } else {
                setActiveNavLink(navFitur);
            }

            // Refresh history view if active
            if (targetViewKey === 'history' && this.historyUI) {
                this.historyUI.loadHistory();
            }

            if (shouldScroll) {
                const targetSec = document.getElementById('fitur') || document.getElementById('akses-menu');
                if (targetSec) targetSec.scrollIntoView({ behavior: 'smooth' });
            }
        };

        if (cardSpeech) cardSpeech.addEventListener('click', () => switchView('speech', false));
        if (cardUpload) cardUpload.addEventListener('click', () => switchView('upload', false));
        if (cardSimplify) cardSimplify.addEventListener('click', () => switchView('simplify', false));
        if (cardHistory) cardHistory.addEventListener('click', () => switchView('history', false));

        if (navBeranda) {
            navBeranda.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveNavLink(navBeranda);
                const heroSec = document.getElementById('beranda');
                if (heroSec) heroSec.scrollIntoView({ behavior: 'smooth' });
            });
        }

        if (navFitur) {
            navFitur.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(this.activeView === 'history' ? 'speech' : this.activeView, true);
                setActiveNavLink(navFitur);
            });
        }

        if (navRiwayat) {
            navRiwayat.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('history', true);
                setActiveNavLink(navRiwayat);
            });
        }

        if (navTentang) {
            navTentang.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveNavLink(navTentang);
                const tentangSec = document.getElementById('tentang');
                if (tentangSec) tentangSec.scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Default view
        switchView('speech', false);
    }

    initAuthHeader() {
        const authBtn = document.getElementById('btn-open-auth');
        const authLabel = document.getElementById('auth-btn-label');

        const updateAuthUI = () => {
            const user = AuthService.getCurrentUser();
            if (user) {
                authLabel.textContent = `👤 ${user.username} (Keluar)`;
            } else {
                authLabel.textContent = '👤 Masuk / Daftar';
            }
        };

        updateAuthUI();

        AuthService.onAuthChange(async () => {
            updateAuthUI();
            if (AuthService.isLoggedIn() && this.speechUI) {
                await this.speechUI.saveHistorySession();
            }
            if (this.historyUI) this.historyUI.loadHistory();
        });

        if (authBtn) {
            authBtn.addEventListener('click', () => {
                if (AuthService.isLoggedIn()) {
                    if (confirm('Apakah Anda ingin keluar (Logout)?')) {
                        AuthService.logout();
                    }
                } else {
                    AuthModalUI.open();
                }
            });
        }
    }
}

// Launch app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AksesAIApp();
    app.init();
});
