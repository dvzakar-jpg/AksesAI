/**
 * AksesAI - History UI Component
 * Renders user activity history organized by date (Hari Ini, Kemarin, Lebih Lama)
 * with search, filtering by feature, full details viewer modal, and privacy delete controls.
 */

import { HistoryService } from '../services/historyService.js';
import { AuthService } from '../services/authService.js';
import { StorageService } from '../services/storage.js';
import { AuthModalUI } from './authModalUI.js';
import { ttsService, TTSService } from '../services/ttsService.js';
import { DyslexiaService } from '../services/dyslexiaService.js';

export class HistoryUI {
    constructor(containerEl) {
        this.container = containerEl;
        this.currentSearch = '';
        this.currentFeatureFilter = 'Semua';
        this.render();
        this.bindEvents();
        this.loadHistory();
    }

    render() {
        const user = AuthService.getCurrentUser();

        this.container.innerHTML = `
            <div class="feature-view" id="view-history">
                <header class="view-header">
                    <div class="view-title-group">
                        <span class="view-icon" aria-hidden="true">📜</span>
                        <div>
                            <h2>Riwayat Aktivitas Saya</h2>
                            <p class="view-desc">
                                ${user ? `Menampilkan riwayat tersimpan untuk akun <strong>${user.username}</strong>.` : `Menampilkan riwayat aktivitas akun Anda.`}
                            </p>
                        </div>
                    </div>
                    <div class="view-badge-group">
                        <button type="button" id="btn-clear-all-history" class="btn btn-outline" style="padding: 6px 14px; color: #dc2626; border-color: #fee2e2;">
                            <span>🗑️ Hapus Semua Riwayat</span>
                        </button>
                    </div>
                </header>

                <!-- Filter & Search Toolbar -->
                <div class="history-filter-card card">
                    <div class="search-box-row">
                        <span class="search-icon" aria-hidden="true">🔍</span>
                        <input type="text" id="history-search-input" class="form-input search-input" placeholder="Cari dalam riwayat aktivitas...">
                    </div>

                    <div class="filter-chips-row" id="history-feature-chips">
                        <span class="filter-label">Filter Fitur:</span>
                        <button type="button" class="btn-chip-filter active" data-feat="Semua">Semua</button>
                        <button type="button" class="btn-chip-filter" data-feat="speech">🎙️ Dengarkan → Teks</button>
                        <button type="button" class="btn-chip-filter" data-feat="simplify">📝 Teks Sederhana</button>
                        <button type="button" class="btn-chip-filter" data-feat="upload">📁 Audio/Video Upload</button>
                    </div>
                </div>

                <!-- History Timeline Container -->
                <div id="history-loading" class="loading-box hidden card">
                    <div class="spinner"></div>
                    <h4>Memuat Riwayat Aktivitas...</h4>
                </div>

                <div id="history-empty" class="card placeholder-box text-center hidden">
                    <span class="placeholder-large-icon">📜</span>
                    <h3>Belum Ada Riwayat Tersimpan</h3>
                    <p>Hasil transkripsi dan penyederhanaan teks Anda akan otomatis muncul di sini.</p>
                </div>

                <div id="history-groups-wrapper" class="history-timeline-wrapper"></div>

                <!-- Detail View Modal -->
                <div id="modal-history-detail" class="modal-backdrop hidden" role="dialog" aria-labelledby="hist-detail-title" aria-modal="true">
                    <div class="modal-dialog">
                        <div class="modal-header">
                            <h3 id="hist-detail-title">Detail Riwayat Aktivitas</h3>
                            <button type="button" class="modal-close-btn" id="btn-close-hist-detail">❌</button>
                        </div>
                        <div id="modal-hist-body" class="modal-body"></div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const searchInput = document.getElementById('history-search-input');
        const clearAllBtn = document.getElementById('btn-clear-all-history');
        const chips = this.container.querySelectorAll('#history-feature-chips .btn-chip-filter');
        const closeDetailBtn = document.getElementById('btn-close-hist-detail');
        const detailModal = document.getElementById('modal-history-detail');

        searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.trim().toLowerCase();
            this.loadHistory();
        });

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFeatureFilter = chip.getAttribute('data-feat');
                this.loadHistory();
            });
        });

        clearAllBtn.addEventListener('click', async () => {
            if (confirm('Apakah Anda yakin ingin menghapus SELURUH riwayat aktivitas Anda? Tindakan ini tidak dapat dibatalkan.')) {
                await HistoryService.clearAll();
                this.loadHistory();
            }
        });

        closeDetailBtn.addEventListener('click', () => {
            detailModal.classList.add('hidden');
        });

        // Audio Explanation Button Listener
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-audio-explain');
            if (btn) {
                const sectionKey = btn.getAttribute('data-section-key');
                const cardEl = btn.closest('.modal-dialog, .card, .result-card') || this.container;
                ttsService.speakSectionContent(sectionKey, cardEl, btn);
            }
        });
    }

    async loadHistory() {
        const loading = document.getElementById('history-loading');
        const empty = document.getElementById('history-empty');
        const wrapper = document.getElementById('history-groups-wrapper');

        loading.classList.remove('hidden');
        empty.classList.add('hidden');
        wrapper.innerHTML = '';

        if (!AuthService.isLoggedIn()) {
            loading.classList.add('hidden');
            wrapper.innerHTML = `
                <div class="card placeholder-box text-center" style="max-width: 550px; margin: 24px auto; padding: 32px 24px;">
                    <span class="placeholder-large-icon" style="font-size: 3rem; display: block; margin-bottom: 12px;">🔒</span>
                    <h3 style="font-size: 1.25rem; margin-bottom: 8px;">Akses Terbatas: Silakan Masuk</h3>
                    <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">
                        Riwayat Aktivitas hanya tersedia untuk pengguna terdaftar. Silakan masuk atau buat akun baru untuk menyimpan dan melihat riwayat Anda.
                    </p>
                    <button type="button" id="btn-login-from-history" class="btn btn-primary btn-lg">
                        👤 Masuk / Daftar Akun
                    </button>
                </div>
            `;
            const loginBtn = document.getElementById('btn-login-from-history');
            if (loginBtn) loginBtn.addEventListener('click', () => AuthModalUI.open());
            return;
        }

        try {
            let list = await HistoryService.getHistory();
            loading.classList.add('hidden');

            // Apply Filters
            if (this.currentFeatureFilter !== 'Semua') {
                list = list.filter(item => item.feature === this.currentFeatureFilter);
            }
            if (this.currentSearch) {
                list = list.filter(item => 
                    (item.title && item.title.toLowerCase().includes(this.currentSearch)) ||
                    (item.input_snippet && item.input_snippet.toLowerCase().includes(this.currentSearch))
                );
            }

            if (!list || list.length === 0) {
                empty.classList.remove('hidden');
                return;
            }

            this.renderTimelineGroups(list, wrapper);
        } catch (e) {
            loading.classList.add('hidden');
            empty.classList.remove('hidden');
        }
    }

    renderTimelineGroups(items, container) {
        // Group by Date (Hari Ini, Kemarin, Lebih Lama)
        const groups = {
            today: [],
            yesterday: [],
            older: []
        };

        const now = new Date();
        const todayStr = now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        items.forEach(item => {
            const itemDate = new Date(item.timestamp).toDateString();
            if (itemDate === todayStr) groups.today.push(item);
            else if (itemDate === yesterdayStr) groups.yesterday.push(item);
            else groups.older.push(item);
        });

        const renderGroup = (groupTitle, groupItems) => {
            if (groupItems.length === 0) return;

            const groupEl = document.createElement('div');
            groupEl.className = 'history-group-section';
            groupEl.innerHTML = `<h3 class="history-group-header">📅 ${groupTitle} (${groupItems.length})</h3>`;

            const listEl = document.createElement('div');
            listEl.className = 'history-group-list';

            groupItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'history-card card';
                
                const iconMap = {
                    speech: '🎙️',
                    simplify: '📝',
                    upload: '📁'
                };
                const featureNameMap = {
                    speech: 'Dengarkan → Teks',
                    simplify: 'Teks Sederhana',
                    upload: 'Upload Audio/Video'
                };

                const dateObj = new Date(item.timestamp);
                const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                card.innerHTML = `
                    <div class="history-card-header">
                        <div class="history-meta">
                            <span class="history-icon">${iconMap[item.feature] || '📌'}</span>
                            <div>
                                <strong class="history-title">${this.escapeHtml(item.title || featureNameMap[item.feature])}</strong>
                                <span class="history-time-badge">${timeStr} • ${this.escapeHtml(item.language || 'Bahasa Indonesia')}</span>
                            </div>
                        </div>
                        <div class="history-actions">
                            <button type="button" class="btn btn-outline btn-sm btn-view-hist" data-id="${item.id}">👁️ Lihat Detail</button>
                            <button type="button" class="btn-text-only text-danger btn-delete-hist" data-id="${item.id}" title="Hapus Riwayat">🗑️</button>
                        </div>
                    </div>

                    ${item.input_snippet ? `
                        <p class="history-snippet-text">"${this.escapeHtml(item.input_snippet)}..."</p>
                    ` : ''}
                `;

                // View detail click
                card.querySelector('.btn-view-hist').addEventListener('click', () => {
                    this.showDetailModal(item);
                });

                // Delete single item click
                card.querySelector('.btn-delete-hist').addEventListener('click', async () => {
                    if (confirm('Hapus item riwayat ini?')) {
                        await HistoryService.deleteItem(item.id);
                        this.loadHistory();
                    }
                });

                listEl.appendChild(card);
            });

            groupEl.appendChild(listEl);
            container.appendChild(groupEl);
        };

        renderGroup('Hari Ini', groups.today);
        renderGroup('Kemarin', groups.yesterday);
        renderGroup('Lebih Lama', groups.older);
    }

    showDetailModal(item) {
        const modal = document.getElementById('modal-history-detail');
        const body = document.getElementById('modal-hist-body');
        const isDyslexia = StorageService.isDyslexiaFontEnabled();

        let formattedResult = '';
        if (typeof item.result_data === 'string') {
            formattedResult = DyslexiaService.transformText(item.result_data, isDyslexia);
        } else if (item.result_data && typeof item.result_data === 'object') {
            if (isDyslexia) {
                const summary = item.result_data.summary || item.result_data.simplified_version || '';
                const keyPoints = item.result_data.key_points || item.result_data.dates_and_deadlines || [];
                formattedResult = `
                    <div style="margin-bottom: 12px;">${DyslexiaService.transformText(summary, true)}</div>
                    ${keyPoints.length > 0 ? DyslexiaService.transformArray(keyPoints, true) : ''}
                `;
            } else {
                formattedResult = `<pre style="white-space: pre-wrap; font-family: inherit; margin-top: 10px; font-size: 0.95rem;">${this.escapeHtml(JSON.stringify(item.result_data, null, 2))}</pre>`;
            }
        } else {
            formattedResult = this.escapeHtml(String(item.result_data || ''));
        }

        body.innerHTML = `
            <div class="mb-md">
                <strong>Jenis Fitur:</strong> ${this.escapeHtml(item.feature)}<br>
                <strong>Waktu:</strong> ${new Date(item.timestamp).toLocaleString('id-ID')}
            </div>

            ${item.input_snippet ? `
                <div class="card-subtly mb-md">
                    <strong>Teks / Transkrip Input:</strong>
                    <p style="margin-top: 6px;">${DyslexiaService.transformText(item.input_snippet, isDyslexia)}</p>
                </div>
            ` : ''}

            <div class="card result-card primary-border">
                <div class="result-header">
                    <strong>Hasil Terstruktur AI:</strong>
                    ${TTSService.createAudioButtonHTML(item.feature === 'speech' ? 'transcript' : (item.feature === 'upload' ? 'summary' : 'simplified-version'))}
                </div>
                <div style="margin-top: 10px;">${formattedResult}</div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
