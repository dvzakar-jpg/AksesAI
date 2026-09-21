/**
 * AksesAI - Text, Photo & Document Simplification Component
 * Transforms complicated Indonesian text, photographed notices/letters, PDFs & documents
 * into accessible, highly structured information.
 */

import { GeminiService } from '../services/gemini.js';
import { HistoryService } from '../services/historyService.js';
import { StorageService } from '../services/storage.js';
import { ttsService, TTSService } from '../services/ttsService.js';
import { DyslexiaService } from '../services/dyslexiaService.js';

export const INDONESIAN_PRESETS = [
    {
        id: 'sekolah',
        icon: '🏫',
        title: 'Pengumuman Sekolah',
        text: `Diberitahukan kepada seluruh wali murid kelas XII bahwa berkenaan dengan pelaksanaan Penilaian Akhir Semester (PAS) Genap Tahun Ajaran 2025/2026 yang akan diselenggarakan secara luring pada tanggal 20 hingga 27 Mei 2026, seluruh siswa diwajibkan menyelesaikan bebas tunggakan administrasi keuangan sekolah paling lambat hari Jumat, 15 Mei 2026 pukul 14.00 WIB di Bagian Tata Usaha. Pengambilan kartu ujian dilakukan oleh orang tua/wali siswa.`
    },
    {
        id: 'kampus',
        icon: '🎓',
        title: 'Informasi Akademik Kampus',
        text: `Berdasarkan Surat Keputusan Rektor Nomor 402/UN/2026 mengenai Prosedur Pengajuan Cuti Akademik Mahasiswa, diberitahukan bahwa permohonan penundaan kegiatan akademik semester ganjil wajib diunggah melalui portal Sistem Informasi Akademik (SIAKAD) paling lambat 10 hari sebelum perkuliahan efektif dimulai. Mahasiswa yang tidak melakukan KRS ulang tanpa keterangan resmi hingga tenggat waktu akan dikenakan sanksi status Non-Aktif.`
    },
    {
        id: 'pemerintah',
        icon: '🏛️',
        title: 'Surat Resmi Pemerintah / BPJS',
        text: `Himbauan Resmi Kelurahan: Dalam rangka pemutakhiran data penerima Bantuan Sosial Beras dan Program Keluarga Harapan (PKH) periode Triwulan II, Kepala Keluarga wajib menyerahkan fotokopi Kartu Keluarga (KK) terbaru, KTP elektronik, dan Surat Keterangan Tidak Mampu (SKTM) dari RT/RW setempat ke kantor Kelurahan lantai 2 pada loket Pelayanan Masyarakat sebelum tanggal 30 Juni 2026.`
    },
    {
        id: 'loker',
        icon: '💼',
        title: 'Lowongan Kerja / HR',
        text: `Kandidat yang lolos seleksi berkas administrasi diwajibkan mengonfirmasi kehadiran sesi wawancara teknis secara daring melalui tautan konfirmasi di surel resmi paling lambat 24 jam setelah pemberitahuan dikirimkan. Pelamar wajib menyertakan portofolio terbaru dalam format PDF serta dokumen pendukung asli yang siap ditunjukkan saat verifikasi data.`
    },
    {
        id: 'transportasi',
        icon: '🚌',
        title: 'Pengumuman Transportasi Umum',
        text: `Info Layanan Transportasi: Sehubungan dengan pekerjaan pemeliharaan berkala prasarana rel KRL Commuter Line lintas Manggarai-Kota pada Sabtu malam tanggal 18 Agustus 2026 pukul 22.00-04.00 WIB, terjadi penyesuaian pola operasi keberangkatan KA terakhir. Seluruh pengguna jasa dihimbau mengatur waktu perjalanan atau memilih moda transportasi alternatif Bus Rapid Transit (BRT).`
    },
    {
        id: 'darurat',
        icon: '🚨',
        title: 'Peringatan Darurat & Kesehatan',
        text: `Peringatan Dini Cuaca Ekstrem dari BMKG: Diperkirakan terjadi hujan lebat disertai angin kencang dan potensi banjir di wilayah pesisir utara Jakarta dan sekitarnya pada 14-16 Agustus 2026. Warga di himbau mengamankan dokumen penting di tempat tinggi, mematikan saklar listrik utama jika air mulai menggenang, dan menghubungi Call Center Siaga 112.`
    }
];

export class TextSimplifyUI {
    constructor(containerEl) {
        this.container = containerEl;
        this.currentOriginalText = '';
        this.currentSimplification = null;
        this.selectedPresetId = null;
        this.selectedFile = null;
        this.selectedFileBase64 = null;
        this.selectedFileMime = null;
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="feature-view" id="view-simplify">
                <header class="view-header">
                    <div class="view-title-group">
                        <span class="view-icon" aria-hidden="true">📝</span>
                        <div>
                            <h2>Teks, Foto & Dokumen → Lebih Mudah Dipahami</h2>
                            <p class="view-desc">Unggah foto surat resmi, foto pengumuman, file PDF/dokumen, atau tempel teks rumit untuk diubah menjadi informasi yang terstruktur dan mudah dipahami.</p>
                        </div>
                    </div>
                </header>

                <!-- Indonesian Preset Toolbar -->
                <div class="preset-toolbar-card card">
                    <span class="preset-title">💡 Contoh Situasi Keseharian di Indonesia:</span>
                    <div class="preset-buttons-grid">
                        ${INDONESIAN_PRESETS.map(p => `
                            <button type="button" class="btn-preset" data-preset-id="${p.id}">
                                <span class="preset-icon" aria-hidden="true">${p.icon}</span>
                                <span>${p.title}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="grid-2-cols">
                    <!-- Left: Input Form (Text or Multimodal File/Photo) -->
                    <div class="simplify-input-card card">
                        <div class="input-header">
                            <label for="text-input-field" class="form-label">
                                <h3>1. Tempel Teks Atau Unggah Berkas/Foto:</h3>
                            </label>
                            <button id="btn-clear-text-input" class="btn-text-only" title="Bersihkan Semua">🗑️ Bersihkan</button>
                        </div>

                        <!-- Multimodal File Upload Zone -->
                        <div id="simplify-file-dropzone" class="file-upload-box" style="border: 2px dashed var(--border-color); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 12px; background: var(--surface-bg);">
                            <span style="font-size: 2rem; display: block; margin-bottom: 4px;">📷 📄</span>
                            <strong style="display: block; margin-bottom: 4px;">Unggah Foto Surat, Pengumuman, Tangkapan Layar, atau PDF</strong>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">Format didukung: JPG, PNG, WEBP, PDF, TXT (Maks. 10MB)</p>
                            <label for="input-file-simplify" class="btn btn-outline" style="cursor: pointer; display: inline-block;">
                                📁 Pilih Berkas / Foto
                            </label>
                            <input type="file" id="input-file-simplify" accept="image/*,application/pdf,text/plain" style="display: none;">
                        </div>

                        <!-- Selected File Preview Badge -->
                        <div id="selected-file-badge" class="hidden" style="display: flex; align-items: center; justify-content: space-between; background: var(--primary-light, #eef2ff); padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--primary-color);">
                            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                                <span id="file-badge-icon" style="font-size: 1.2rem;">📎</span>
                                <div style="overflow: hidden;">
                                    <strong id="file-badge-name" style="display: block; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</strong>
                                    <span id="file-badge-size" style="font-size: 0.8rem; color: var(--text-muted);">-</span>
                                </div>
                            </div>
                            <button type="button" id="btn-remove-selected-file" class="btn-text-only" style="color: var(--danger-color, #dc2626); font-weight: bold;">✕ Hapus</button>
                        </div>

                        <textarea id="text-input-field" class="form-textarea" rows="7" 
                            placeholder="Ketik atau tempel teks pengumuman/surat di sini (Opsional jika sudah mengunggah foto/berkas)..."></textarea>

                        <div class="textarea-footer" style="margin-top: 12px;">
                            <span id="text-char-count" class="char-count-text">0 Karakter</span>
                            <button id="btn-submit-simplify" class="btn btn-primary btn-lg flex-center" disabled>
                                <span>✨ Transformasi & Sederhanakan</span>
                            </button>
                        </div>

                        <div id="simplify-alert" class="status-alert hidden" role="status" aria-live="polite"></div>
                    </div>

                    <!-- Right: Results & Interactive Follow-up -->
                    <div class="simplify-results-container">
                        <!-- Loading State -->
                        <div id="simplify-loading" class="loading-box hidden card" aria-live="polite">
                            <div class="spinner"></div>
                            <h4>AksesAI sedang menganalisis & menyederhanakan...</h4>
                            <p>Membaca isi teks/foto dan mentransformasikan ke format terstruktur yang mudah diakses.</p>
                        </div>

                        <!-- Placeholder -->
                        <div id="simplify-placeholder" class="card placeholder-box text-center">
                            <span class="placeholder-large-icon">💡</span>
                            <h3>Hasil Informasi Terstruktur Akan Tampil Di Sini</h3>
                            <p>Unggah foto dokumen/surat resmi atau tempel teks Anda untuk memulai.</p>
                        </div>

                        <!-- Output Cards (Structured Accessible Output) -->
                        <div id="simplify-results-content" class="results-wrapper hidden">
                            <!-- 1. What This Means / Apa Artinya -->
                            <div class="card result-card primary-border">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">💡</span>
                                        <h3>APA ARTINYA (WHAT THIS MEANS)</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('summary')}
                                </div>
                                <p id="out-simplify-summary" class="result-summary-text" style="font-size: 1.05rem; line-height: 1.6; font-weight: 500;"></p>
                            </div>

                            <!-- 2. Key Information / Informasi Penting -->
                            <div class="card result-card">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">📌</span>
                                        <h3>INFORMASI PENTING</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('key-points')}
                                </div>
                                <ul id="out-simplify-key-points" class="styled-list"></ul>
                            </div>

                            <!-- 3. What You Need To Know / Apa Yang Harus Kamu Ketahui -->
                            <div id="card-simplify-know" class="card result-card hidden">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">ℹ️</span>
                                        <h3>HAL CRUCIAL YANG WAJIB DIKETAHUI</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('know')}
                                </div>
                                <ul id="out-simplify-know" class="styled-list"></ul>
                            </div>

                            <!-- 4 & 5. Dates & Locations -->
                            <div class="grid-2-cols gap-md">
                                <div class="card result-card">
                                    <div class="result-header">
                                        <div>
                                            <span class="result-icon">📅</span>
                                            <h3>TANGGAL & WAKTU PENTING</h3>
                                        </div>
                                        ${TTSService.createAudioButtonHTML('dates')}
                                    </div>
                                    <ul id="out-simplify-dates" class="styled-list"></ul>
                                </div>

                                <div class="card result-card">
                                    <div class="result-header">
                                        <div>
                                            <span class="result-icon">📍</span>
                                            <h3>LOKASI PENTING</h3>
                                        </div>
                                        ${TTSService.createAudioButtonHTML('locations')}
                                    </div>
                                    <ul id="out-simplify-locations" class="styled-list"></ul>
                                </div>
                            </div>

                            <!-- 6. What You May Need To Do / Langkah Tindakan -->
                            <div class="card result-card">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">⚡</span>
                                        <h3>YANG MUNGKIN HARUS DILAKUKAN</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('actions')}
                                </div>
                                <ul id="out-simplify-actions" class="styled-list"></ul>
                            </div>

                            <!-- 7. Simplified Version / Versi Lebih Sederhana -->
                            <div class="card result-card" style="background: var(--surface-bg-alt, #f8fafc); border-left: 4px solid var(--primary-color);">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">📝</span>
                                        <h3>VERSI BAHASA INDONESIA SEDERHANA</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('simplified-version')}
                                </div>
                                <p id="out-simplify-version" style="white-space: pre-wrap; line-height: 1.6;"></p>
                            </div>

                            <!-- 8. Unclear Notes / Catatan Kejujuran & Kejelasan -->
                            <div id="card-simplify-unclear" class="card result-card warning-bg hidden">
                                <div class="result-header">
                                    <div>
                                        <span class="result-icon">⚠️</span>
                                        <h3>CATATAN KEJUJURAN & KEJELASAN SUMBER</h3>
                                    </div>
                                    ${TTSService.createAudioButtonHTML('unclear')}
                                </div>
                                <p id="out-simplify-unclear-text" class="warning-list" style="margin: 0; font-size: 0.95rem;"></p>
                            </div>

                            <!-- Interactive "Jelaskan Lebih Lanjut" Tool -->
                            <div class="card explain-further-card">
                                <div class="result-header">
                                    <span class="result-icon">❓</span>
                                    <h3>Belum Paham? Tanya / Jelaskan Lebih Lanjut</h3>
                                </div>
                                <p class="card-subtext">Ketik bagian atau kalimat yang masih membuat Anda bingung untuk penjelasan lebih detail dari AI.</p>

                                <div class="preset-questions-row">
                                    <button class="btn-chip-ask" data-q="Apa langkah pertama yang wajib saya lakukan?">Langkah Pertama?</button>
                                    <button class="btn-chip-ask" data-q="Kapan tenggat waktu paling akhir?">Tenggat Waktu Akhir?</button>
                                    <button class="btn-chip-ask" data-q="Jelaskan kata atau istilah tersulit di dokumen ini secara sangat sederhana.">Istilah Sulit?</button>
                                </div>

                                <div class="ask-input-group">
                                    <input type="text" id="ask-further-input" class="form-input" placeholder="Contoh: Apakah saya perlu membawa dokumen asli?">
                                    <button id="btn-submit-ask" class="btn btn-secondary">Kirim Pertanyaan</button>
                                </div>

                                <div id="ask-response-box" class="ask-response-box hidden card-subtly" aria-live="polite">
                                    <strong>Penjelasan Tambahan AksesAI:</strong>
                                    <p id="ask-response-text"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const textarea = document.getElementById('text-input-field');
        const submitBtn = document.getElementById('btn-submit-simplify');
        const clearBtn = document.getElementById('btn-clear-text-input');
        const presetBtns = this.container.querySelectorAll('.btn-preset');
        const fileInput = document.getElementById('input-file-simplify');
        const removeFileBtn = document.getElementById('btn-remove-selected-file');
        const askBtn = document.getElementById('btn-submit-ask');
        const askInput = document.getElementById('ask-further-input');
        const chipAskBtns = this.container.querySelectorAll('.btn-chip-ask');

        // File selection handler
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileSelection(file);
        });

        removeFileBtn.addEventListener('click', () => {
            this.clearSelectedFile();
            this.updateInputValidity();
        });

        // Presets click
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetId = btn.getAttribute('data-preset-id');
                const preset = INDONESIAN_PRESETS.find(p => p.id === presetId);
                if (preset) {
                    textarea.value = preset.text;
                    this.selectedPresetId = preset.title;
                    this.updateInputValidity();
                    presetBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        textarea.addEventListener('input', () => this.updateInputValidity());

        clearBtn.addEventListener('click', () => {
            textarea.value = '';
            presetBtns.forEach(b => b.classList.remove('active'));
            this.selectedPresetId = null;
            this.clearSelectedFile();
            this.updateInputValidity();
        });

        submitBtn.addEventListener('click', () => this.handleSimplify());

        // Audio Explanation Button Listener
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-audio-explain');
            if (btn) {
                const sectionKey = btn.getAttribute('data-section-key');
                const cardEl = btn.closest('.card, .result-card, .explain-further-card') || this.container;
                ttsService.speakSectionContent(sectionKey, cardEl, btn);
            }
        });

        // Dyslexia Mode toggle listener
        if (typeof window !== 'undefined') {
            window.addEventListener('dyslexiaModeChanged', () => {
                if (this.currentSimplification) {
                    this.renderResults(this.currentSimplification);
                }
            });
        }

        // Ask further submit
        askBtn.addEventListener('click', () => this.handleAskFurther(askInput.value));
        askInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleAskFurther(askInput.value);
        });

        chipAskBtns.forEach(chip => {
            chip.addEventListener('click', () => {
                const qText = chip.getAttribute('data-q');
                askInput.value = qText;
                this.handleAskFurther(qText);
            });
        });
    }

    handleFileSelection(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran berkas terlalu besar. Maksimal 10MB.');
            return;
        }

        this.selectedFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            const resultStr = e.target.result;
            // Extract base64 payload
            const commaIdx = resultStr.indexOf(',');
            if (commaIdx !== -1) {
                this.selectedFileBase64 = resultStr.substring(commaIdx + 1);
            } else {
                this.selectedFileBase64 = resultStr;
            }
            let mime = file.type;
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            if (!mime || mime === 'application/octet-stream') {
                if (ext === 'pdf') mime = 'application/pdf';
                else if (ext === 'txt') mime = 'text/plain';
                else if (ext === 'png') mime = 'image/png';
                else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
                else if (ext === 'webp') mime = 'image/webp';
                else mime = 'application/pdf';
            }
            this.selectedFileMime = mime;

            // Show badge UI
            const badge = document.getElementById('selected-file-badge');
            const nameEl = document.getElementById('file-badge-name');
            const sizeEl = document.getElementById('file-badge-size');
            const iconEl = document.getElementById('file-badge-icon');

            if (mime.startsWith('image/')) iconEl.textContent = '🖼️';
            else if (mime.includes('pdf')) iconEl.textContent = '📄';
            else iconEl.textContent = '📎';

            nameEl.textContent = file.name;
            sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
            badge.classList.remove('hidden');

            this.updateInputValidity();
        };

        reader.onerror = () => {
            alert('Gagal membaca berkas yang dipilih.');
            this.clearSelectedFile();
        };

        reader.readAsDataURL(file);
    }

    clearSelectedFile() {
        this.selectedFile = null;
        this.selectedFileBase64 = null;
        this.selectedFileMime = null;
        const fileInput = document.getElementById('input-file-simplify');
        if (fileInput) fileInput.value = '';
        const badge = document.getElementById('selected-file-badge');
        if (badge) badge.classList.add('hidden');
    }

    updateInputValidity() {
        const textarea = document.getElementById('text-input-field');
        const submitBtn = document.getElementById('btn-submit-simplify');
        const charCount = document.getElementById('text-char-count');

        const len = textarea.value.trim().length;
        charCount.textContent = `${len} Karakter`;
        const hasFile = !!this.selectedFileBase64;

        submitBtn.disabled = !hasFile && len < 5;
    }

    async handleSimplify() {
        const text = document.getElementById('text-input-field').value.trim();
        const hasFile = !!this.selectedFileBase64;

        if (!text && !hasFile) return;

        this.currentOriginalText = text || (this.selectedFile ? `[Berkas: ${this.selectedFile.name}]` : '');
        const loading = document.getElementById('simplify-loading');
        const placeholder = document.getElementById('simplify-placeholder');
        const results = document.getElementById('simplify-results-content');
        const alertBox = document.getElementById('simplify-alert');

        alertBox.classList.add('hidden');
        placeholder.classList.add('hidden');
        results.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const scenario = this.selectedPresetId || 'Pengumuman / Informasi Umum';
            const payload = {
                text,
                base64Data: this.selectedFileBase64,
                mimeType: this.selectedFileMime,
                scenario
            };

            const data = await GeminiService.simplifyText(payload);

            this.currentSimplification = data;
            loading.classList.add('hidden');
            results.classList.remove('hidden');

            this.renderResults(data);

            // Save to history
            const historyTitle = hasFile 
                ? `Transformasi Dokumen: ${this.selectedFile ? this.selectedFile.name : 'Foto/File'}`
                : `Penyederhanaan Teks (${scenario})`;

            HistoryService.addHistory(
                'simplify',
                historyTitle,
                text.slice(0, 150) || (this.selectedFile ? `Berkas: ${this.selectedFile.name}` : ''),
                data,
                'Bahasa Indonesia'
            );
        } catch (error) {
            console.error('Simplify error:', error);
            loading.classList.add('hidden');
            placeholder.classList.remove('hidden');

            alertBox.className = 'status-alert error';
            alertBox.classList.remove('hidden');
            alertBox.textContent = error.message || 'Maaf, terjadi masalah saat mentransformasi teks/dokumen.';
        }
    }

    renderResults(data) {
        const isDyslexia = StorageService.isDyslexiaFontEnabled();

        // 1. What this means / Summary
        const sumEl = document.getElementById('out-simplify-summary');
        sumEl.innerHTML = DyslexiaService.transformText(data.summary, isDyslexia) || 'Tidak ada penjelasan kuncian tersedia.';

        // 2. Key Points
        const kpList = document.getElementById('out-simplify-key-points');
        kpList.innerHTML = (data.key_points && data.key_points.length > 0)
            ? DyslexiaService.transformArray(data.key_points, isDyslexia)
            : '<li>Tidak ada poin penting khusus.</li>';

        // 3. What You Need To Know
        const knowCard = document.getElementById('card-simplify-know');
        const knowList = document.getElementById('out-simplify-know');
        if (data.what_you_need_to_know && data.what_you_need_to_know.length > 0) {
            knowCard.classList.remove('hidden');
            knowList.innerHTML = DyslexiaService.transformArray(data.what_you_need_to_know, isDyslexia);
        } else {
            knowCard.classList.add('hidden');
        }

        // 4. Dates & Times
        const datesList = document.getElementById('out-simplify-dates');
        datesList.innerHTML = (data.dates_and_deadlines && data.dates_and_deadlines.length > 0)
            ? DyslexiaService.transformArray(data.dates_and_deadlines, isDyslexia)
            : '<li>Tidak ada tanggal atau tenggat tercatat.</li>';

        // 5. Locations
        const locsList = document.getElementById('out-simplify-locations');
        locsList.innerHTML = (data.locations && data.locations.length > 0)
            ? DyslexiaService.transformArray(data.locations, isDyslexia)
            : '<li>Tidak ada lokasi khusus tercatat.</li>';

        // 6. Actions
        const actList = document.getElementById('out-simplify-actions');
        actList.innerHTML = (data.actions && data.actions.length > 0)
            ? DyslexiaService.transformArray(data.actions, isDyslexia)
            : '<li>Tidak ada tindakan wajib tercatat.</li>';

        // 7. Simplified Version
        const verEl = document.getElementById('out-simplify-version');
        const simVerText = data.simplified_version || data.summary || 'Teks sudah disederhanakan pada poin-poin di atas.';
        verEl.innerHTML = DyslexiaService.transformText(simVerText, isDyslexia);

        // 8. Unclear Notes
        const uncCard = document.getElementById('card-simplify-unclear');
        const uncText = document.getElementById('out-simplify-unclear-text');
        if (data.unclear_notes && data.unclear_notes.trim().length > 0) {
            uncCard.classList.remove('hidden');
            uncText.innerHTML = DyslexiaService.transformText(data.unclear_notes, isDyslexia);
        } else {
            uncCard.classList.add('hidden');
        }

        // Hide any previous follow-up response
        document.getElementById('ask-response-box').classList.add('hidden');
    }

    async handleAskFurther(question) {
        if (!question || !question.trim()) return;
        if (!this.currentOriginalText) return;

        const respBox = document.getElementById('ask-response-box');
        const respText = document.getElementById('ask-response-text');

        respBox.classList.remove('hidden');
        respText.textContent = 'Meminta penjelasan dari AksesAI...';

        try {
            const answer = await GeminiService.explainFurther(this.currentOriginalText, this.currentSimplification, question);
            respText.textContent = answer;
        } catch (error) {
            respText.textContent = error.message || 'Gagal mendapatkan penjelasan tambahan.';
        }
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

