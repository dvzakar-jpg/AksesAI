/**
 * AksesAI - Section Text-to-Speech (TTS) Service
 * Reads the EXACT CURRENTLY DISPLAYED text in Bahasa Indonesia using browser SpeechSynthesis.
 * Strict Indonesian voice selection (lang = "id-ID").
 * Does NOT consume Gemini API quota or require external API keys.
 */

export class TTSService {
    constructor() {
        this.synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
        this.activeSectionKey = null;
        this.activeButtonEl = null;
        this.currentUtterance = null;
        this.indonesianVoice = null;
        this.selectedVoiceInfo = { name: 'Menunggu peramban...', lang: 'id-ID', isIndonesian: false };
        this.initVoices();
    }

    initVoices() {
        if (!this.synth) return;

        const loadVoices = () => {
            const voices = this.synth.getVoices();
            if (!voices || voices.length === 0) return;

            // Search explicitly for an Indonesian voice
            const idVoice = voices.find(v => {
                const l = (v.lang || '').toLowerCase();
                const n = (v.name || '').toLowerCase();
                return l === 'id-id' || l.startsWith('id') || l.includes('id_id') || n.includes('indonesian') || n.includes('indonesia');
            });

            if (idVoice) {
                this.indonesianVoice = idVoice;
                this.selectedVoiceInfo = {
                    name: idVoice.name,
                    lang: idVoice.lang,
                    isIndonesian: true
                };
            } else {
                // If no Indonesian voice found, do NOT assign an English voice to indonesianVoice.
                // Keep indonesianVoice = null and let browser use system locale with utterance.lang = 'id-ID'.
                this.indonesianVoice = null;
                const defaultV = voices.find(v => v.default) || voices[0];
                this.selectedVoiceInfo = {
                    name: `Default Peramban (${defaultV ? defaultV.name : 'Unknown'}) - Fallback id-ID locale`,
                    lang: 'id-ID',
                    isIndonesian: false
                };
            }
        };

        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    isSupported() {
        return !!this.synth;
    }

    stop() {
        if (!this.synth) return;
        if (this.synth.speaking || this.synth.pending) {
            this.synth.cancel();
        }
        this.resetActiveState();
    }

    resetActiveState() {
        if (this.activeButtonEl) {
            this.activeButtonEl.classList.remove('is-playing');
            this.activeButtonEl.setAttribute('aria-label', 'Dengarkan isi bagian ini');
            this.activeButtonEl.innerHTML = `<span class="audio-btn-icon" aria-hidden="true">🔊</span> <span>Dengarkan</span>`;
        }
        this.activeSectionKey = null;
        this.activeButtonEl = null;
        this.currentUtterance = null;
    }

    /**
     * Reads the EXACT CURRENTLY DISPLAYED text from the given section container element
     */
    speakSectionContent(sectionKey, containerEl, buttonEl) {
        if (!this.isSupported()) {
            alert('Peramban Anda tidak mendukung fitur pemutaran suara (SpeechSynthesis).');
            return;
        }

        // Toggle OFF if clicking the currently speaking section button
        if (this.activeSectionKey === sectionKey && this.synth.speaking) {
            this.stop();
            return;
        }

        // Stop any active audio before starting new section
        this.stop();

        // Extract the exact visible text displayed in the section card (excluding button text)
        let textToSpeak = this.extractVisibleText(containerEl, sectionKey);

        if (!textToSpeak || textToSpeak.trim().length === 0) {
            alert('Belum ada transkripsi untuk dibacakan.');
            return;
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'id-ID'; // Explicit Indonesian locale

        if (this.indonesianVoice) {
            utterance.voice = this.indonesianVoice;
        }

        utterance.rate = 0.95; // Clear speed for accessibility
        utterance.pitch = 1.0;

        this.activeSectionKey = sectionKey;
        this.activeButtonEl = buttonEl;
        this.currentUtterance = utterance;

        if (buttonEl) {
            buttonEl.classList.add('is-playing');
            buttonEl.setAttribute('aria-label', 'Hentikan pemutaran audio bagian ini');
            buttonEl.innerHTML = `<span class="audio-btn-icon" aria-hidden="true">⏹</span> <span>Hentikan</span>`;
        }

        utterance.onend = () => {
            this.resetActiveState();
        };

        utterance.onerror = (e) => {
            console.warn('[TTS] Speech synthesis error:', e);
            this.resetActiveState();
        };

        this.synth.speak(utterance);
    }

    /**
     * Extracts clean visible text from a section element, removing button controls
     */
    extractVisibleText(containerEl, sectionKey = '') {
        if (!containerEl) return '';

        // Special handling for live transcription section
        if (sectionKey === 'transcript' || containerEl.classList.contains('transcript-display-container') || containerEl.querySelector('#transcript-scroll-box')) {
            return this.extractLiveTranscriptText(containerEl);
        }

        // Clone node so we don't modify actual DOM
        const clone = containerEl.cloneNode(true);

        // Remove audio buttons, UI control badges, placeholders, and hidden elements from cloned tree before reading text
        const elementsToRemove = clone.querySelectorAll('.btn-audio-explain, .btn-icon-only, button, script, style, .placeholder-box, .placeholder-text, .placeholder-subtext, .chip-empty');
        elementsToRemove.forEach(el => el.remove());

        let text = clone.innerText || clone.textContent || '';
        
        // Clean markdown symbols or bullet markers so TTS speaks cleanly
        text = text.replace(/^[•\-\*\s]+/gm, '')
                   .replace(/[\:\:\.\.]+/g, ': ')
                   .replace(/\s+/g, ' ')
                   .trim();

        return text;
    }

    /**
     * Extracts ONLY the currently displayed transcribed text from the live speech section
     */
    extractLiveTranscriptText(containerEl) {
        if (!containerEl) return '';

        // Extract text from completed sentences (.sentence-text)
        const sentenceEls = containerEl.querySelectorAll('.sentence-text');
        const sentences = Array.from(sentenceEls)
            .map(el => (el.textContent || '').trim())
            .filter(txt => txt.length > 0);

        // Extract interim text if present and visible
        let interimText = '';
        const interimBox = containerEl.querySelector('#interim-text-box');
        if (interimBox && !interimBox.classList.contains('hidden')) {
            const interimContent = interimBox.querySelector('#interim-text-content');
            if (interimContent) {
                const cloneInterim = interimContent.cloneNode(true);
                const speakerTags = cloneInterim.querySelectorAll('.speaker-tag, .interim-speaker');
                speakerTags.forEach(st => st.remove());
                interimText = (cloneInterim.textContent || '').trim();
            }
        }

        const allParts = [...sentences];
        if (interimText) {
            allParts.push(interimText);
        }

        let text = allParts.join(' ').trim();

        // Clean markdown symbols or bullet markers so TTS speaks cleanly
        text = text.replace(/^[•\-\*\s]+/gm, '')
                   .replace(/[\:\:\.\.]+/g, ': ')
                   .replace(/\s+/g, ' ')
                   .trim();

        return text;
    }

    static createAudioButtonHTML(sectionKey, labelText = 'Dengarkan') {
        return `
            <button type="button" 
                class="btn-audio-explain" 
                data-section-key="${sectionKey}" 
                aria-label="Dengarkan isi teks bagian ini">
                <span class="audio-btn-icon" aria-hidden="true">🔊</span>
                <span>${labelText}</span>
            </button>
        `;
    }
}

// Global Singleton Instance
export const ttsService = new TTSService();

