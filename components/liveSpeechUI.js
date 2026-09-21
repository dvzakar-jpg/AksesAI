/**
 * AksesAI - Live Speech to Text UI Component
 */

import { SpeechService } from '../services/speech.js';
import { HistoryService } from '../services/historyService.js';
import { ttsService, TTSService } from '../services/ttsService.js';

export class LiveSpeechUI {
    constructor(containerEl) {
        this.container = containerEl;
        this.speechService = null;
        this.lastSavedSentenceCount = 0;
        console.log('[LIVE SPEECH] initialized');
        this.render();
        this.initService();
    }

    render() {
        this.container.innerHTML = `
            <div class="feature-view" id="view-speech">
                <header class="view-header">
                    <div class="view-title-group">
                        <span class="view-icon" aria-hidden="true">🎙️</span>
                        <div>
                            <h2>Dengarkan → Teks</h2>
                            <p class="view-desc">Ubah percakapan langsung dan suara menjadi teks terbaca secara real-time.</p>
                        </div>
                    </div>
                    <div class="view-badge-group">
                        <span id="speech-browser-support-badge" class="status-badge info">Mengecek Peramban...</span>
                    </div>
                </header>

                <!-- Audio Visualizer & Control Panel -->
                <div class="speech-control-panel card">
                    <div class="control-top-bar">
                        <button id="btn-toggle-mic" class="btn btn-primary btn-lg flex-center" aria-live="polite">
                            <span class="btn-icon" id="mic-icon">🎙️</span>
                            <span id="mic-btn-text">Mulai Mendengarkan</span>
                        </button>
                        <button id="btn-clear-speech" class="btn btn-outline flex-center" disabled>
                            <span>🗑️ Bersihkan Teks</span>
                        </button>
                        <button id="btn-download-speech" class="btn btn-outline flex-center" disabled>
                            <span>📥 Unduh Transkrip (.txt)</span>
                        </button>
                    </div>

                    <!-- Speech Language & Accent Selection Bar -->
                    <div class="lang-selector-bar mb-md" aria-label="Pilihan Bahasa Suara">
                        <span class="filter-label">🌐 Bahasa Suara & Aksens (Speech Language):</span>
                        <div class="lang-options-group" id="speech-lang-chips">
                            <button type="button" class="btn-chip-lang active" data-lang="id-ID">🇮🇩 Bahasa Indonesia</button>
                            <button type="button" class="btn-chip-lang" data-lang="en-US">🌐 English (International - Accent Robust)</button>
                            <button type="button" class="btn-chip-lang" data-lang="auto">⚡ Otomatis (Auto-Detect)</button>
                        </div>
                    </div>

                    <!-- 2-Person Speaker Cap & Switch Control Bar -->
                    <div class="speaker-cap-bar" aria-label="Pengaturan Maksimal 2 Pembicara">
                        <div class="speaker-cap-info">
                            <span class="cap-badge">👥 Batas Maksimal 2 Pembicara</span>
                            <span class="cap-desc">Mencegah kebingungan teks saat suasana ramai atau bising.</span>
                        </div>
                        <div class="speaker-toggle-group">
                            <span class="active-speaker-label">Pembicara Aktif:</span>
                            <button type="button" id="btn-speaker-1" class="btn-speaker-tag active" aria-label="Pilih Pembicara 1">🗣️ Pembicara 1</button>
                            <button type="button" id="btn-speaker-2" class="btn-speaker-tag" aria-label="Pilih Pembicara 2">🗣️ Pembicara 2</button>
                            <button type="button" id="btn-switch-speaker" class="btn btn-outline btn-sm" title="Tukar Pembicara">⇄ Tukar</button>
                        </div>
                    </div>

                    <!-- Visual Audio Meter (Accessible Visual Feedback for Deaf Users) -->
                    <div class="visual-audio-meter-container" aria-label="Indikator Visual Suara">
                        <div class="visual-meter-label">
                            <span>Indikator Suara Terdeteksi:</span>
                            <strong id="visual-meter-status">Tidak Aktif</strong>
                        </div>
                        <div class="meter-bar-track">
                            <div id="visual-meter-fill" class="meter-bar-fill" style="width: 0%;"></div>
                        </div>
                        <div class="sound-wave-bars" id="sound-wave-bars">
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                        </div>
                    </div>

                    <div id="speech-status-banner" class="status-alert" role="status" aria-live="polite">
                        Tekan tombol "Mulai Mendengarkan" untuk mengaktifkan mikrofon.
                    </div>
                </div>

                <!-- Live Transcript Display -->
                <div class="transcript-display-container card">
                    <div class="result-header">
                        <div class="result-header-title-group">
                            <h3>Transkrip Langsung</h3>
                            <span class="transcript-count" id="sentence-count">0 Kalimat</span>
                        </div>
                        ${TTSService.createAudioButtonHTML('transcript')}
                    </div>

                    <div id="transcript-scroll-box" class="transcript-box" tabindex="0" role="region" aria-label="Hasil Transkrip Langsung" aria-live="polite">
                        <div id="empty-transcript-placeholder" class="placeholder-box">
                            <p class="placeholder-text">Belum ada suara yang ditranskripsikan.</p>
                            <p class="placeholder-subtext">Berbicaralah dekat mikrofon untuk mulai melihat teks di sini.</p>
                        </div>
                        <div id="transcript-sentence-list" class="sentence-list"></div>
                        <div id="interim-text-box" class="interim-box hidden" aria-live="assertive">
                            <span class="interim-speaker">Mendengarkan:</span>
                            <span id="interim-text-content" class="interim-content"></span>
                        </div>
                    </div>
                </div>

                <!-- Detected Key Details Panel -->
                <div class="detected-entities-card card">
                    <div class="result-header">
                        <h3>💡 Informasi Penting Terdeteksi Otomatis</h3>
                        ${TTSService.createAudioButtonHTML('detected-entities')}
                    </div>
                    <p class="card-subtext">AksesAI mendeteksi tanggal, waktu, lokasi, dan instruksi penting secara otomatis dari percakapan.</p>
                    <div id="detected-entities-chips" class="entity-chips-group">
                        <span class="chip chip-empty">Belum ada informasi penting terdeteksi.</span>
                    </div>
                </div>
            </div>
        `;
    }

    initService() {
        const supportBadge = document.getElementById('speech-browser-support-badge');
        const isSupported = SpeechService.isSupported();

        if (!isSupported) {
            supportBadge.textContent = 'Peramban Tidak Mendukung Speech API';
            supportBadge.className = 'status-badge danger';
            document.getElementById('speech-status-banner').innerHTML = `
                ⚠️ Peramban Anda tidak mendukung Web Speech API secara penuh. 
                Saran: Gunakan Google Chrome / Microsoft Edge di Komputer atau Android, atau gunakan fitur <strong>Upload Audio/Video</strong>.
            `;
            document.getElementById('btn-toggle-mic').disabled = true;
            return;
        } else {
            supportBadge.textContent = 'Peramban Mendukung';
            supportBadge.className = 'status-badge success';
        }

        this.speechService = new SpeechService({
            onStatusChange: (statusText, isListening, errorType) => this.handleStatusChange(statusText, isListening, errorType),
            onVolumeChange: (volumePercent) => this.handleVolumeChange(volumePercent),
            onTranscriptUpdate: (data) => this.handleTranscriptUpdate(data)
        });

        // Setup Event Listeners
        const toggleBtn = document.getElementById('btn-toggle-mic');
        const clearBtn = document.getElementById('btn-clear-speech');
        const downloadBtn = document.getElementById('btn-download-speech');

        toggleBtn.addEventListener('click', () => {
            if (this.speechService.isListening) {
                this.speechService.stop();
            } else {
                this.speechService.start();
            }
        });

        clearBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin membersihkan hasil transkrip?')) {
                this.speechService.clearTranscript();
                this.lastSavedSentenceCount = 0;
            }
        });

        downloadBtn.addEventListener('click', () => {
            const text = this.speechService.finalSentences.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
            if (!text) return;
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Transkrip_AksesAI_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Language & Accent Selection Chips
        const langChips = this.container.querySelectorAll('#speech-lang-chips .btn-chip-lang');
        langChips.forEach(chip => {
            chip.addEventListener('click', () => {
                langChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const lang = chip.getAttribute('data-lang');
                if (this.speechService) {
                    this.speechService.setLanguage(lang);
                }
            });
        });

        // 2-Person Speaker Cap Switchers
        const btnSpk1 = document.getElementById('btn-speaker-1');
        const btnSpk2 = document.getElementById('btn-speaker-2');
        const btnSwitch = document.getElementById('btn-switch-speaker');

        if (btnSpk1 && btnSpk2 && btnSwitch) {
            btnSpk1.addEventListener('click', () => {
                this.speechService.setManualSpeaker(1);
            });

            btnSpk2.addEventListener('click', () => {
                this.speechService.setManualSpeaker(2);
            });

            btnSwitch.addEventListener('click', () => {
                this.speechService.switchSpeaker();
            });
        }

        // Section Audio Explanations delegation
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-audio-explain');
            if (btn) {
                const sectionKey = btn.getAttribute('data-section-key');
                const cardEl = btn.closest('.card, .transcript-display-container, .detected-entities-card') || this.container;
                ttsService.speakSectionContent(sectionKey, cardEl, btn);
            }
        });
    }

    handleStatusChange(statusText, isListening, errorType) {
        const banner = document.getElementById('speech-status-banner');
        const toggleBtn = document.getElementById('btn-toggle-mic');
        const micIcon = document.getElementById('mic-icon');
        const micBtnText = document.getElementById('mic-btn-text');
        const visualStatus = document.getElementById('visual-meter-status');

        if (isListening) {
            banner.className = 'status-alert active';
            banner.textContent = `🎙️ ${statusText}`;
            toggleBtn.className = 'btn btn-danger btn-lg flex-center';
            micIcon.textContent = '⏹️';
            micBtnText.textContent = 'Hentikan Mendengarkan';
            visualStatus.textContent = 'Aktif Mendengar Suara';
            visualStatus.style.color = '#10b981';
        } else {
            banner.className = errorType ? 'status-alert error' : 'status-alert';
            banner.textContent = statusText;
            toggleBtn.className = 'btn btn-primary btn-lg flex-center';
            micIcon.textContent = '🎙️';
            micBtnText.textContent = 'Mulai Mendengarkan';
            visualStatus.textContent = 'Tidak Aktif';
            visualStatus.style.color = 'var(--text-muted)';
            
            // Save session history when listening stops
            this.saveHistorySession();
        }
    }

    async saveHistorySession() {
        if (!this.speechService || !this.speechService.finalSentences || this.speechService.finalSentences.length === 0) return null;
        
        // Prevent duplicate saves if session hasn't changed since last successful save
        if (this.lastSavedSentenceCount === this.speechService.finalSentences.length) {
            return null;
        }

        const sentences = this.speechService.finalSentences;
        const fullText = sentences.map(s => `${s.speaker}: ${s.text}`).join('\n');
        const activeLang = this.speechService.lang === 'en-US' ? 'English (International)' : 'Bahasa Indonesia';
        
        console.log('[HISTORY] save started');
        try {
            const res = await HistoryService.addHistory(
                'speech',
                `Transkripsi Suara Langsung (${sentences.length} Kalimat)`,
                fullText.slice(0, 150),
                fullText,
                activeLang
            );
            if (res) {
                console.log('[HISTORY] save success');
                this.lastSavedSentenceCount = sentences.length;
                return res;
            } else {
                console.log('[HISTORY] save completed (guest or unauthenticated)');
                return null;
            }
        } catch (e) {
            console.warn('[HISTORY] save failed:', e ? e.message : 'Storage/API error');
            return null;
        }
    }

    handleVolumeChange(volumePercent) {
        const fill = document.getElementById('visual-meter-fill');
        const waveBars = document.querySelectorAll('.wave-bar');

        fill.style.width = `${volumePercent}%`;

        // Animate wave bars proportionally to volume
        waveBars.forEach((bar, idx) => {
            const height = Math.max(15, Math.min(100, volumePercent * (1 + (idx % 3) * 0.4)));
            bar.style.height = `${height}%`;
            bar.style.backgroundColor = volumePercent > 5 ? 'var(--primary-color)' : 'var(--border-color)';
        });
    }

    handleTranscriptUpdate({ finalSentences, interimText }) {
        const placeholder = document.getElementById('empty-transcript-placeholder');
        const listEl = document.getElementById('transcript-sentence-list');
        const interimBox = document.getElementById('interim-text-box');
        const interimContent = document.getElementById('interim-text-content');
        const clearBtn = document.getElementById('btn-clear-speech');
        const downloadBtn = document.getElementById('btn-download-speech');
        const countEl = document.getElementById('sentence-count');
        const scrollBox = document.getElementById('transcript-scroll-box');
        const entityContainer = document.getElementById('detected-entities-chips');

        const hasSentences = finalSentences.length > 0;
        placeholder.style.display = (hasSentences || interimText) ? 'none' : 'block';
        clearBtn.disabled = !hasSentences;
        downloadBtn.disabled = !hasSentences;
        countEl.textContent = `${finalSentences.length} Kalimat`;

        // Update Active Speaker Tag Buttons
        const currentSpk = this.speechService ? this.speechService.currentSpeakerIndex : 1;
        const btnSpk1 = document.getElementById('btn-speaker-1');
        const btnSpk2 = document.getElementById('btn-speaker-2');
        if (btnSpk1 && btnSpk2) {
            btnSpk1.classList.toggle('active', currentSpk === 1);
            btnSpk2.classList.toggle('active', currentSpk === 2);
        }

        // Render Sentences
        listEl.innerHTML = '';
        const allEntities = [];

        finalSentences.forEach((item) => {
            const isSpeaker1 = item.speakerId === 1 || item.speaker.includes('1');
            const itemEl = document.createElement('div');
            itemEl.className = `sentence-item card-subtly ${isSpeaker1 ? 'speaker-1-border' : 'speaker-2-border'}`;
            itemEl.innerHTML = `
                <div class="sentence-meta">
                    <span class="speaker-tag ${isSpeaker1 ? 'speaker-1-tag' : 'speaker-2-tag'}">
                        🗣️ ${item.speaker}
                    </span>
                    <span class="timestamp-tag">${item.timestamp}</span>
                </div>
                <div class="sentence-text">${this.escapeHtml(item.text)}</div>
            `;
            listEl.appendChild(itemEl);

            if (item.entities && item.entities.length > 0) {
                allEntities.push(...item.entities);
            }
        });

        // Interim Text
        if (interimText) {
            interimBox.classList.remove('hidden');
            interimContent.innerHTML = `<span class="speaker-tag ${currentSpk === 1 ? 'speaker-1-tag' : 'speaker-2-tag'}">Mendengarkan (Pembicara ${currentSpk}):</span> ${this.escapeHtml(interimText)}`;
        } else {
            interimBox.classList.add('hidden');
            interimContent.textContent = '';
        }

        // Scroll to bottom automatically
        scrollBox.scrollTop = scrollBox.scrollHeight;

        // Render detected entity chips
        this.renderEntities(allEntities, entityContainer);
    }

    renderEntities(entities, container) {
        if (!entities || entities.length === 0) {
            container.innerHTML = `<span class="chip chip-empty">Belum ada informasi penting terdeteksi.</span>`;
            return;
        }

        // Deduplicate
        const unique = Array.from(new Set(entities.map(e => `${e.type}:${e.text}`)))
            .map(str => {
                const [type, text] = str.split(':');
                return { type, text };
            });

        const iconMap = {
            date: '📅 Tanggal:',
            time: '⏰ Jam:',
            location: '📍 Lokasi:',
            instruction: '⚡ Instruksi:'
        };

        container.innerHTML = unique.map(e => `
            <span class="chip chip-${e.type}">
                ${iconMap[e.type] || '📌'} ${this.escapeHtml(e.text)}
            </span>
        `).join('');
    }

    escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
