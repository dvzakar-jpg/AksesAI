/**
 * AksesAI - Web Speech Recognition Service
 * Wraps Web Speech API with Bahasa Indonesia support, pause-based speaker heuristics,
 * live visual audio meter visualization, and instant entity detection chips.
 */

export class SpeechService {
    constructor(options = {}) {
        this.lang = options.lang || 'id-ID';
        this.onTranscriptUpdate = options.onTranscriptUpdate || (() => {});
        this.onVolumeChange = options.onVolumeChange || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});

        this.recognition = null;
        this.isListening = false;
        this.shouldAutoRestart = false;

        // Transcript states
        this.finalSentences = []; // Array of { speaker: string, text: string, timestamp: string }
        this.interimText = '';
        this.currentSpeakerIndex = 1;
        this.lastSpeechTime = Date.now();

        // Web Audio API for visual meter
        this.audioContext = null;
        this.analyser = null;
        this.micStream = null;
        this.animFrameId = null;

        this._initRecognition();
    }

    static isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    _initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.onStatusChange('Web Speech API tidak didukung di peramban ini.', false, 'UNSUPPORTED');
            return;
        }

        this.recognition = new SpeechRecognition();
        console.log('[SPEECH] recognition created');
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.lang;

        this.recognition.onstart = () => {
            console.log('[SPEECH] onstart');
            this.isListening = true;
            this.onStatusChange('Mendengarkan...', true);
            this._startAudioVisualizer();
        };

        this.recognition.onresult = (event) => {
            console.log('[SPEECH] onresult', event.results.length);
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim();

                if (event.results[i].isFinal) {
                    if (transcript) {
                        // Ignore short noise/cough artifacts (< 2 chars) in crowded environments
                        if (transcript.length < 2) continue;

                        // Check pause heuristic (> 2.5s pause means possible speaker change)
                        // Strictly capped at MAX 2 SPEAKERS (Pembicara 1 & Pembicara 2) to prevent confusion in crowded places
                        const now = Date.now();
                        if (now - this.lastSpeechTime > 2500 && this.finalSentences.length > 0) {
                            // Cycle strictly between Pembicara 1 and Pembicara 2
                            this.currentSpeakerIndex = (this.currentSpeakerIndex % 2) + 1;
                        }
                        this.lastSpeechTime = now;

                        const sentenceObj = {
                            id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                            speaker: `Pembicara ${this.currentSpeakerIndex}`,
                            speakerId: this.currentSpeakerIndex,
                            text: transcript,
                            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            entities: this._detectEntities(transcript)
                        };
                        this.finalSentences.push(sentenceObj);
                    }
                } else {
                    currentInterim += transcript + ' ';
                }
            }

            this.interimText = currentInterim.trim();
            this._notifyUpdate();
        };

        this.recognition.onerror = (event) => {
            console.warn('[SPEECH] onerror:', event.error);
            let userMsg = 'Terjadi kendala mikrofon.';
            if (event.error === 'not-allowed') {
                userMsg = 'Izin penggunaan mikrofon ditolak oleh pengguna/peramban.';
                this.shouldAutoRestart = false;
            } else if (event.error === 'no-speech') {
                userMsg = 'Tidak ada suara terdeteksi...';
            }
            this.onStatusChange(userMsg, this.isListening, event.error);
        };

        this.recognition.onend = () => {
            console.log('[SPEECH] onend');
            if (this.shouldAutoRestart && this.isListening) {
                setTimeout(() => {
                    if (this.shouldAutoRestart && this.isListening && this.recognition) {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            // If already active, continue listening
                        }
                    }
                }, 150);
            } else {
                this._stopAudioVisualizer();
                const wasListening = this.isListening;
                this.isListening = false;
                if (wasListening) {
                    this.onStatusChange('Berhenti mendengarkan.', false);
                }
            }
        };
    }

    start() {
        console.log('[SPEECH] start called');
        if (!SpeechService.isSupported()) {
            this.onStatusChange('Peramban Anda tidak mendukung pengenalan suara langsung.', false, 'UNSUPPORTED');
            return;
        }
        if (this.isListening) return;

        this.shouldAutoRestart = true;
        try {
            this.recognition.start();
        } catch (err) {
            console.error('Error starting speech recognition:', err);
        }
    }

    stop() {
        console.log('[SPEECH] stop called');
        this.shouldAutoRestart = false;
        const wasListening = this.isListening;
        this.isListening = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        this._stopAudioVisualizer();
        if (wasListening) {
            this.onStatusChange('Mikrofon dimatikan.', false);
        }
    }

    setLanguage(langCode) {
        this.lang = langCode === 'auto' ? 'id-ID' : langCode;
        if (this.recognition) {
            this.recognition.lang = this.lang;
        }
        this.onStatusChange(`Bahasa diubah ke: ${langCode === 'en-US' ? 'English (International)' : 'Bahasa Indonesia'}`, this.isListening);
    }

    setManualSpeaker(index) {
        if (index === 1 || index === 2) {
            this.currentSpeakerIndex = index;
            this._notifyUpdate();
        }
    }

    switchSpeaker() {
        this.currentSpeakerIndex = (this.currentSpeakerIndex % 2) + 1;
        this._notifyUpdate();
    }

    clearTranscript() {
        console.log('[LIVE SPEECH] transcript reset');
        this.finalSentences = [];
        this.interimText = '';
        this._notifyUpdate();
    }

    _notifyUpdate() {
        this.onTranscriptUpdate({
            finalSentences: this.finalSentences,
            interimText: this.interimText,
            fullText: this.finalSentences.map(s => `${s.speaker}: ${s.text}`).join('\n')
        });
    }

    // Entity Detection Regex for Indonesian
    _detectEntities(text) {
        const entities = [];
        // Dates/Times
        const dateRegex = /\b(\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|besok|lusa|hari ini))\b/gi;
        const timeRegex = /\b(jam\s+\d{1,2}([:.]\d{2})?|\d{1,2}[:.]\d{2}\s*(WIB|WITA|WIT)?)\b/gi;
        // Locations
        const locationRegex = /\b(Gedung|Ruang|Aula|Jl\.|Jalan|Kampus|Sekolah|Universitas|Kantor|Rumah Sakit|RS|Stasiun|Bandara|Terminal)\s+([A-Z0-9\w\-]+)/g;
        // Important Instructions
        const instructionRegex = /\b(wajib|harus|dilarang|segera|dikumpulkan|dibawa|harap|mohon|catat)\b/gi;

        let match;
        while ((match = dateRegex.exec(text)) !== null) {
            entities.push({ type: 'date', text: match[0] });
        }
        while ((match = timeRegex.exec(text)) !== null) {
            entities.push({ type: 'time', text: match[0] });
        }
        while ((match = locationRegex.exec(text)) !== null) {
            entities.push({ type: 'location', text: match[0] });
        }
        while ((match = instructionRegex.exec(text)) !== null) {
            entities.push({ type: 'instruction', text: match[0] });
        }

        return entities;
    }

    // Web Audio Visualizer (generates volume 0-100 for visual volume meter)
    async _startAudioVisualizer() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.micStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64;
            source.connect(this.analyser);

            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            const updateVolume = () => {
                if (!this.isListening) return;
                this.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const volumePercent = Math.min(100, Math.round((average / 128) * 100));
                this.onVolumeChange(volumePercent);
                this.animFrameId = requestAnimationFrame(updateVolume);
            };

            updateVolume();
        } catch (e) {
            console.warn('Could not start visual audio meter:', e);
        }
    }

    _stopAudioVisualizer() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        this.onVolumeChange(0);
    }
}
