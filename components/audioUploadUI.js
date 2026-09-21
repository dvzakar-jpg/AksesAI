/**
 * AksesAI - Audio/Video Upload Component
 * Manages file uploads, audio/video previews, and Gemini AI structured analysis.
 */

import { GeminiService } from '../services/gemini.js';
import { HistoryService } from '../services/historyService.js';
import { StorageService } from '../services/storage.js';
import { ttsService, TTSService } from '../services/ttsService.js';
import { DyslexiaService } from '../services/dyslexiaService.js';

export class AudioUploadUI {
    constructor(containerEl) {
        this.container = containerEl;
        this.selectedFile = null;
        this.base64Data = null;
        this.currentResult = null;
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="feature-view" id="view-upload">
                <header class="view-header">
                    <div class="view-title-group">
                        <span class="view-icon" aria-hidden="true">📁</span>
                        <div>
                            <h2>Upload Audio/Video → Transkrip & Ringkasan</h2>
                            <p class="view-desc">Unggah berkas rekaman suara atau video untuk mendapatkan transkrip dan ringkasan poin penting secara otomatis.</p>
                        </div>
                    </div>
                </header>

                <div class="grid-2-cols">
                    <!-- Left Column: File Dropzone & Player -->
                    <div class="upload-control-card card">
                        <h3>Unggah Berkas Rekaman</h3>
                        <p class="card-subtext">Mendukung format MP3, WAV, M4A, OGG, MP4, WEBM (Maksimal 25MB).</p>

                        <!-- Accessible Dropzone -->
                        <div id="dropzone" class="dropzone" tabindex="0" role="button" aria-label="Area Unggah Berkas Audio atau Video. Klik atau seret berkas ke sini.">
                            <div class="dropzone-icon">📥</div>
                            <div class="dropzone-text">
                                <strong>Pilih Berkas</strong> atau Seret Ke Sini
                            </div>
                            <span class="dropzone-hint">Suara pengumuman, rekaman rapat, perkuliahan, atau video</span>
                            <input type="file" id="file-input" accept="audio/*,video/*" class="file-input-hidden">
                        </div>

                        <!-- Selected File Status & Preview Player -->
                        <div id="file-preview-card" class="file-preview-card hidden">
                            <div class="file-meta-row">
                                <span class="file-icon">🎵</span>
                                <div class="file-info">
                                    <strong id="file-name">filename.mp3</strong>
                                    <span id="file-size" class="file-size-text">0 MB</span>
                                </div>
                                <button id="btn-remove-file" class="btn-icon-only" aria-label="Hapus Berkas">❌</button>
                            </div>
                            <!-- Dynamic Media Player -->
                            <div id="media-player-container" class="media-player-container"></div>
                        </div>

                        <!-- Action Button -->
                        <div class="upload-actions">
                            <button id="btn-process-audio" class="btn btn-primary btn-lg w-full flex-center" disabled>
                                <span>✨ Proses & Ringkas dengan Gemini AI</span>
                            </button>
                        </div>

                        <div id="upload-status-alert" class="status-alert hidden" role="status" aria-live="polite"></div>
                    </div>

                    <!-- Right Column: AI Structured Results -->
                    <div class="upload-results-container">
                        <!-- Loading Overlay -->
                        <div id="audio-loading-box" class="loading-box hidden card" aria-live="polite">
                            <div class="spinner"></div>
                            <h4>AksesAI sedang menganalisis berkas media...</h4>
                            <p>Proses ini memerlukan beberapa detik. Mohon tunggu.</p>
                        </div>

                        <!-- Empty State -->
                        <div id="audio-empty-results" class="card placeholder-box text-center">
                            <span class="placeholder-large-icon">📑</span>
                            <h3>Hasil Transkrip & Ringkasan Akan Muncul Di Sini</h3>
                            <p>Unggah berkas audio/video di sebelah kiri dan klik "Proses" untuk mulai.</p>
                        </div>

                        <!-- Results Content -->
                        <div id="audio-results-content" class="results-wrapper hidden">
                            <!-- Summary Card -->
                            <div class="card result-card primary-border">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">💡</span>
                                        <h3>INTI PEMBICARAAN (APA ARTINYA)</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('summary')}
                                </div>
                                <p id="res-audio-summary" class="result-summary-text" style="font-size: 1.05rem; line-height: 1.6; font-weight: 500;"></p>
                            </div>

                            <!-- Key Points Card -->
                            <div class="card result-card">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">📌</span>
                                        <h3>INFORMASI PENTING</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('key-points')}
                                </div>
                                <ul id="res-audio-key-points" class="styled-list"></ul>
                            </div>

                            <!-- What You Need To Know -->
                            <div id="card-audio-know" class="card result-card hidden">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">ℹ️</span>
                                        <h3>HAL CRUCIAL YANG WAJIB DIKETAHUI</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('know')}
                                </div>
                                <ul id="res-audio-know" class="styled-list"></ul>
                            </div>

                            <!-- Grid 2 Sub-cards (Actions & Schedules) -->
                            <div class="grid-2-cols gap-md">
                                <div class="card result-card">
                                    <div class="result-header">
                                        <div>
                                            <span class="result-icon">⚡</span>
                                            <h3>YANG PERLU DILAKUKAN / INSTRUKSI</h3>
                                        </div>
                                        ${TTSService.createAudioButtonHTML('actions')}
                                    </div>
                                    <ul id="res-audio-instructions" class="styled-list"></ul>
                                </div>

                                <div class="card result-card">
                                    <div class="result-header">
                                        <div>
                                            <span class="result-icon">📅</span>
                                            <h3>TANGGAL & WAKTU PENTING</h3>
                                        </div>
                                        ${TTSService.createAudioButtonHTML('dates')}
                                    </div>
                                    <ul id="res-audio-dates" class="styled-list"></ul>
                                </div>
                            </div>

                            <!-- Identified Names/Locations & Unclear Sections -->
                            <div class="card result-card">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">📍</span>
                                        <h3>LOKASI & NAMA PENTING</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('locations')}
                                </div>
                                <div id="res-audio-locations" class="chip-container"></div>
                            </div>

                            <!-- Unclear / Ambiguous Alert Section -->
                            <div id="card-unclear-section" class="card result-card warning-bg hidden">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">⚠️</span>
                                        <h3>BAGIAN SANGAT TIDAK JELAS / SUARA BURAM</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('unclear')}
                                </div>
                                <p class="text-subtle">Bagian berikut tidak terdengar jelas dan TIDAK direkayasa oleh AI:</p>
                                <ul id="res-audio-unclear" class="styled-list warning-list"></ul>
                            </div>

                            <!-- Full Transcript Box with Speaker Diarization -->
                            <div class="card result-card">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">🗣️</span>
                                        <h3>TRANSKRIP LENGKAP & PERGANTIAN PEMBICARA</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('transcript')}
                                </div>
                                <div id="res-audio-transcript" class="transcript-full-text" style="white-space: pre-wrap; font-family: monospace, sans-serif; line-height: 1.6;" tabindex="0"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('file-input');
        const removeBtn = document.getElementById('btn-remove-file');
        const processBtn = document.getElementById('btn-process-audio');

        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // Drag & Drop handlers
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.handleFileSelected(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFileSelected(e.target.files[0]);
            }
        });

        removeBtn.addEventListener('click', () => this.resetFile());

        processBtn.addEventListener('click', () => this.processMediaFile());

        // Audio Explanation Button Listener
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-audio-explain');
            if (btn) {
                const sectionKey = btn.getAttribute('data-section-key');
                const cardEl = btn.closest('.card, .result-card') || this.container;
                ttsService.speakSectionContent(sectionKey, cardEl, btn);
            }
        });

        // Dyslexia Mode toggle listener
        if (typeof window !== 'undefined') {
            window.addEventListener('dyslexiaModeChanged', () => {
                if (this.currentResult) {
                    this.displayResults(this.currentResult);
                }
            });
        }
    }

    handleFileSelected(file) {
        // Validate max 25MB
        const MAX_BYTES = 25 * 1024 * 1024;
        const alertBox = document.getElementById('upload-status-alert');

        if (file.size > MAX_BYTES) {
            alertBox.className = 'status-alert error';
            alertBox.classList.remove('hidden');
            alertBox.textContent = `Ukuran berkas (${(file.size / (1024*1024)).toFixed(1)} MB) melebihi batas maksimal 25 MB.`;
            return;
        }

        alertBox.classList.add('hidden');
        this.selectedFile = file;

        // Display File Metadata
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        document.getElementById('file-preview-card').classList.remove('hidden');
        document.getElementById('dropzone').classList.add('hidden');
        document.getElementById('btn-process-audio').disabled = false;

        // Render Media Player Preview
        const playerContainer = document.getElementById('media-player-container');
        playerContainer.innerHTML = '';

        const fileUrl = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.controls = true;
            video.src = fileUrl;
            video.className = 'media-preview-video';
            playerContainer.appendChild(video);
        } else {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = fileUrl;
            audio.className = 'media-preview-audio';
            playerContainer.appendChild(audio);
        }

        // Convert file to Base64
        const reader = new FileReader();
        reader.onload = (e) => {
            // strip data URL prefix (e.g. data:audio/mp3;base64,)
            const result = e.target.result;
            this.base64Data = result.split(',')[1];
        };
        reader.readAsDataURL(file);
    }

    resetFile() {
        this.selectedFile = null;
        this.base64Data = null;
        document.getElementById('file-input').value = '';
        document.getElementById('file-preview-card').classList.add('hidden');
        document.getElementById('dropzone').classList.remove('hidden');
        document.getElementById('btn-process-audio').disabled = true;
        document.getElementById('media-player-container').innerHTML = '';
        document.getElementById('upload-status-alert').classList.add('hidden');
    }

    async processMediaFile() {
        if (!this.selectedFile || !this.base64Data) return;

        const loadingBox = document.getElementById('audio-loading-box');
        const emptyBox = document.getElementById('audio-empty-results');
        const resultsBox = document.getElementById('audio-results-content');
        const alertBox = document.getElementById('upload-status-alert');

        alertBox.classList.add('hidden');
        emptyBox.classList.add('hidden');
        resultsBox.classList.add('hidden');
        loadingBox.classList.remove('hidden');

        try {
            const mimeType = this.selectedFile.type || 'audio/mp3';
            const result = await GeminiService.processAudioVideo(this.base64Data, mimeType);

            this.currentResult = result;
            loadingBox.classList.add('hidden');
            resultsBox.classList.remove('hidden');

            this.displayResults(result);

            // Automatically save to history
            HistoryService.addHistory(
                'upload',
                `Analisis Media (${this.selectedFile ? this.selectedFile.name : 'Berkas'})`,
                result.summary || 'Transkrip & Ringkasan Audio/Video',
                result,
                'Bahasa Indonesia'
            );
        } catch (error) {
            console.error('Audio processing error:', error);
            loadingBox.classList.add('hidden');
            emptyBox.classList.remove('hidden');

            alertBox.className = 'status-alert error';
            alertBox.classList.remove('hidden');
            alertBox.textContent = error.message || 'Maaf, terjadi kesalahan saat memproses media.';
        }
    }

    displayResults(res) {
        const isDyslexia = StorageService.isDyslexiaFontEnabled();

        // A. Full Transcript
        document.getElementById('res-audio-transcript').innerHTML = DyslexiaService.transformText(res.transcript, isDyslexia) || 'Transkrip tidak tersedia.';

        // B. Inti Pembicaraan
        document.getElementById('res-audio-summary').innerHTML = DyslexiaService.transformText(res.summary, isDyslexia) || 'Tidak ada ringkasan inti pembicaraan.';

        // C. Apa Artinya
        const knowCard = document.getElementById('card-audio-know');
        const knowList = document.getElementById('res-audio-know');
        const whatMeansText = res.what_it_means || (res.what_you_need_to_know && res.what_you_need_to_know.join(' '));
        if (whatMeansText) {
            knowCard.classList.remove('hidden');
            knowList.innerHTML = DyslexiaService.transformText(whatMeansText, isDyslexia);
        } else {
            knowCard.classList.add('hidden');
        }

        // D. Informasi Penting
        const kpList = document.getElementById('res-audio-key-points');
        kpList.innerHTML = (res.key_points && res.key_points.length > 0)
            ? DyslexiaService.transformArray(res.key_points, isDyslexia)
            : '<li>Tidak ada poin penting khusus tercatat.</li>';

        // E. Tanggal & Waktu
        const datesList = document.getElementById('res-audio-dates');
        datesList.innerHTML = (res.dates_and_times && res.dates_and_times.length > 0)
            ? DyslexiaService.transformArray(res.dates_and_times, isDyslexia)
            : '<li>Tidak ada tanggal atau waktu disebutkan.</li>';

        // F. Lokasi & Nama
        const locContainer = document.getElementById('res-audio-locations');
        const locs = res.locations || res.locations_and_names;
        if (locs && locs.length > 0) {
            locContainer.innerHTML = locs.map(l => `<span class="chip chip-location">📍 ${this.escapeHtml(l)}</span>`).join('');
        } else {
            locContainer.innerHTML = '<span class="chip chip-empty">Tidak ada lokasi khusus tercatat.</span>';
        }

        // G. Yang Perlu Dilakukan / Instruksi
        const instList = document.getElementById('res-audio-instructions');
        const actionsList = res.actions || res.important_instructions;
        instList.innerHTML = (actionsList && actionsList.length > 0)
            ? DyslexiaService.transformArray(actionsList, isDyslexia)
            : '<li>Tidak ada tindakan khusus yang diperlukan.</li>';

        // H. Bagian Yang Tidak Jelas / Suara Buram
        const unclearCard = document.getElementById('card-unclear-section');
        const unclearList = document.getElementById('res-audio-unclear');
        if (res.unclear_sections && res.unclear_sections.length > 0) {
            unclearCard.classList.remove('hidden');
            unclearList.innerHTML = DyslexiaService.transformArray(res.unclear_sections, isDyslexia);
        } else {
            unclearCard.classList.add('hidden');
        }
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
