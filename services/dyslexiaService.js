/**
 * AksesAI - App-Wide Dyslexia-Friendly Presentation & Content Transformation Service
 * Implements two distinct presentation modes across the ENTIRE AksesAI application:
 * 
 * NORMAL MODE:
 * - Standard interface, complete wording, full paragraphs & context.
 * 
 * DYSLEXIA FRIENDLY MODE:
 * - App-wide simplified language for UI labels, titles, instructions & dropzones.
 * - Concise, bullet-focused presentation for AI results (short sentences, key facts first).
 * - Preserves ALL underlying factual data (dates, times, locations, names, warnings, required actions).
 * - 100% Client-side deterministic transformation layer — zero extra Gemini API calls.
 */

export const DyslexiaService = {
    /**
     * Map of static DOM element selectors and their NORMAL vs DYSLEXIA text content
     */
    uiTextMap: [
        {
            selector: '.hero-badge',
            normal: 'Pendamping Aksesibilitas Informasi Berbasis AI',
            dyslexia: 'Pendamping Informasi Sederhana'
        },
        {
            selector: '.hero-title',
            normal: 'Mentransformasi Informasi Harian Menjadi Informasi yang Mudah Diakses & Dipahami.',
            dyslexia: 'Ubah Teks & Suara Menjadi Teks Sederhana.'
        },
        {
            selector: '.hero-subtitle',
            normal: 'AksesAI bukan chatbot umum. AksesAI adalah <strong>Sistem Pendamping Aksesibilitas</strong> yang mentransformasikan pembicaraan lisan, rekaman suara/video, foto pengumuman/surat resmi, dan dokumen rumit menjadi informasi yang jelas, terstruktur, dan mudah ditindaklanjuti bagi komunitas Tuli & Teman Dengar.',
            dyslexia: 'AksesAI membantu memahami ucapan langsung, rekaman suara, foto surat, dan berkas rumit menjadi teks singkat yang mudah dibaca.'
        },
        {
            selector: '#question-title',
            normal: 'Informasi apa yang ingin Anda akses saat ini?',
            dyslexia: 'Pilih Jenis Informasi:'
        },
        // Feature Cards
        {
            selector: '#card-choice-speech .feature-card-title',
            normal: 'Dengarkan → Teks Real-time',
            dyslexia: '🎙️ Suara Langsung → Teks'
        },
        {
            selector: '#card-choice-speech .feature-card-desc',
            normal: 'Ubah pembicaraan langsung dari mikrofon menjadi teks tulisan di layar secara real-time saat orang berbicara di sekitar Anda.',
            dyslexia: 'Ubah ucapan langsung dari mikrofon menjadi teks tulisan di layar saat orang berbicara.'
        },
        {
            selector: '#card-choice-upload .feature-card-title',
            normal: 'Upload Audio / Video Media',
            dyslexia: '📁 Berkas Rekaman'
        },
        {
            selector: '#card-choice-upload .feature-card-desc',
            normal: 'Unggah berkas rekaman suara atau video (pengumuman, rapat, seminar) untuk mendapatkan transkrip dan ringkasan poin penting.',
            dyslexia: 'Unggah file audio atau video untuk ringkasan dan transkrip.'
        },
        {
            selector: '#card-choice-simplify .feature-card-title',
            normal: 'Teks, Foto & Dokumen → Mudah Dipahami',
            dyslexia: '📝 Teks & Foto Dokumen'
        },
        {
            selector: '#card-choice-simplify .feature-card-desc',
            normal: 'Unggah foto surat pemerintah/sekolah, berkas PDF, atau tempel teks formal untuk diubah menjadi Bahasa Indonesia yang ringkas dan terstruktur.',
            dyslexia: 'Unggah foto surat, dokumen PDF, atau tempel teks rumit untuk diubah jadi teks sederhana.'
        },
        {
            selector: '#card-choice-history .feature-card-title',
            normal: 'Riwayat Aktivitas Saya',
            dyslexia: '📜 Riwayat Saya'
        },
        {
            selector: '#card-choice-history .feature-card-desc',
            normal: 'Lihat dan kelola kembali hasil transkripsi, analisis berkas, dan penyederhanaan teks yang pernah Anda lakukan.',
            dyslexia: 'Lihat hasil transkrip dan ringkasan yang pernah Anda buat.'
        },
        // How It Works
        {
            selector: '#cara-kerja h2',
            normal: 'Bagaimana Sistem AksesAI Bekerja?',
            dyslexia: 'Cara Kerja AksesAI'
        },
        {
            selector: '#cara-kerja .card-subtext',
            normal: 'Alur kerja transformasi informasi dari sumber mentah hingga menjadi informasi terstruktur yang mudah diakses.',
            dyslexia: 'Alur kerja 3 langkah sederhana:'
        },
        // Social Impact
        {
            selector: '#tentang h2',
            normal: 'Dampak Sosial AksesAI di Indonesia',
            dyslexia: 'Manfaat AksesAI'
        }
    ],

    /**
     * Applies Application-Wide UI Language Adaptation when Dyslexia Mode is toggled
     */
    applyAppWideDyslexiaText(isDyslexiaMode = false) {
        if (typeof document === 'undefined') return;

        this.uiTextMap.forEach(item => {
            const el = document.querySelector(item.selector);
            if (el) {
                el.innerHTML = isDyslexiaMode ? item.dyslexia : item.normal;
            }
        });
    },

    /**
     * Transforms paragraph text into short, labeled bullet points for Dyslexia Mode.
     * When isDyslexiaMode is false, returns normal complete text.
     */
    transformText(text, isDyslexiaMode = false) {
        if (!text || typeof text !== 'string') return text || '';
        if (!isDyslexiaMode) return this.escapeHtml(text);

        let cleaned = text.trim();
        if (!cleaned) return '';

        // Remove introductory filler preambles
        const preambles = [
            /^Dokumen ini menginformasikan mengenai pelaksanaan kegiatan yang akan diselenggarakan/i,
            /^Dokumen ini menginformasikan mengenai/i,
            /^Dokumen ini berisi informasi mengenai/i,
            /^Dokumen ini berisi informasi tentang/i,
            /^Dokumen ini berisi tentang/i,
            /^Surat ini menginformasikan bahwa/i,
            /^Diberitahukan kepada seluruh/i,
            /^Berdasarkan Surat Keputusan Rektor Nomor/i,
            /^Himbauan Resmi Kelurahan:\s*/i,
            /^Inti pembicaraan membahas/i,
            /^Pembicara menjelaskan bahwa/i,
            /^Bagian ini menjelaskan/i,
            /^Dalam rangka/i,
            /^Sehubungan dengan/i,
            /^Peringatan Dini Cuaca Ekstrem dari BMKG:\s*/i
        ];

        preambles.forEach(regex => {
            cleaned = cleaned.replace(regex, '');
        });

        // Simplify complex phrasing into everyday Indonesian
        cleaned = this.simplifyPhrases(cleaned);

        // Split into clauses/sentences
        const rawSentences = cleaned.split(/(?<=[.!?])\s+|;\s+/);
        const bullets = [];

        rawSentences.forEach(sentence => {
            let s = sentence.trim();
            if (!s) return;

            let label = '';

            if (/\b(?:tanggal|hari|senin|selasa|rabu|kamis|jumat|sabtu|minggu|\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember))\b/i.test(s) && /\b\d{4}\b|\b\d{1,2}[\.\:]\d{2}\b/i.test(s)) {
                if (s.toLowerCase().includes('jam') || s.toLowerCase().includes('pukul') || s.toLowerCase().includes('wib')) {
                    label = 'Waktu / Tanggal';
                } else {
                    label = 'Tanggal';
                }
            } else if (/\b(?:di|bertempat di|lokasi|kantor|aula|gedung|ruang|stasiun|bandara|kelurahan)\b/i.test(s) && !label) {
                label = 'Di mana';
            } else if (/\b(?:diwajibkan|harus|wajib|perlu|membawa|bawa|daftar|registrasi|menyerahkan|mengirimkan)\b/i.test(s)) {
                label = 'Yang perlu dilakukan';
            } else if (/\b(?:peringatan|bahaya|darurat|penting|catatan)\b/i.test(s)) {
                label = 'Penting';
            }

            if (s.endsWith('.')) s = s.slice(0, -1);
            s = s.charAt(0).toUpperCase() + s.slice(1);

            const highlightedContent = this.highlightFacts(s);

            if (label) {
                bullets.push(`• <strong>${label}:</strong> ${highlightedContent}`);
            } else {
                bullets.push(`• ${highlightedContent}`);
            }
        });

        if (bullets.length === 0) return `<p>${this.highlightFacts(cleaned)}</p>`;

        return `
            <div class="dyslexia-simplified-block">
                <ul class="dyslexia-bullet-list">
                    ${bullets.map(b => `<li class="dyslexia-bullet-item">${b}</li>`).join('')}
                </ul>
            </div>
        `;
    },

    /**
     * Transforms an array of strings into Dyslexia bullets when ON.
     * When OFF, returns clean standard list items.
     */
    transformArray(arrData, isDyslexiaMode = false) {
        if (!arrData || !Array.isArray(arrData) || arrData.length === 0) return '';

        if (!isDyslexiaMode) {
            return arrData.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
        }

        const bullets = arrData.map(item => {
            let simplified = this.simplifyPhrases(item);
            if (simplified.endsWith('.')) simplified = simplified.slice(0, -1);
            simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
            return `<li class="dyslexia-bullet-item">• ${this.highlightFacts(simplified)}</li>`;
        });

        return `<ul class="dyslexia-bullet-list">${bullets.join('')}</ul>`;
    },

    /**
     * Replaces formal or passive phrasing with simple everyday Indonesian
     */
    simplifyPhrases(str) {
        if (!str) return '';
        let s = str;

        const replacements = [
            [/\bdiwajibkan untuk melakukan registrasi\b/gi, 'daftar'],
            [/\bdiwajibkan untuk\b/gi, 'harus'],
            [/\bdiwajibkan\b/gi, 'harus'],
            [/\bpeserta diharapkan\b/gi, 'peserta harap'],
            [/\bmelakukan registrasi\b/gi, 'daftar'],
            [/\bmelakukan konfirmasi\b/gi, 'konfirmasi'],
            [/\bmelakukan pemutakhiran\b/gi, 'perbarui'],
            [/\bdiselenggarakan secara luring\b/gi, 'tatap muka'],
            [/\bdiselenggarakan secara daring\b/gi, 'online'],
            [/\bmenyelesaikan bebas tunggakan\b/gi, 'lunasi biaya'],
            [/\bpaling lambat hari\b/gi, 'sebelum hari'],
            [/\bpaling lambat\b/gi, 'sebelum'],
            [/\bbatas waktu yang telah ditentukan\b/gi, 'tenggat waktu'],
            [/\bsebelum acara dimulai\b/gi, 'sebelum acara'],
            [/\bdihimbau untuk\b/gi, 'disarankan'],
            [/\bdihimbau\b/gi, 'disarankan'],
            [/\bdikarenakan\b/gi, 'karena'],
            [/\bapabila\b/gi, 'jika'],
            [/\bsegera melakukan\b/gi, 'segera lakukan'],
            [/\bterjadi perubahan kondisi\b/gi, 'kondisi berubah'],
            [/\byang sebelumnya dijadwalkan pada hari\b/gi, 'jadwal lama:'],
            [/\bdipindahkan ke hari\b/gi, 'jadwal baru:']
        ];

        replacements.forEach(([regex, replacement]) => {
            s = s.replace(regex, replacement);
        });

        return s;
    },

    /**
     * Highlights dates, times, and key numbers
     */
    highlightFacts(text) {
        if (!text) return '';
        return text.replace(/(\b\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}\b|\b\d{1,2}[\.\:]\d{2}\s*(?:WIB|WITA|WIT)?\b)/gi, 
            '<mark class="dyslexia-fact-highlight">$1</mark>');
    },

    escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
