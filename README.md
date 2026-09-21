# 📘 Dokumentasi Internal Proyek: AksesAI (YCWC 2026)

Dokumen ini adalah **Internal Technical & Product Reference** untuk tim pengembang AksesAI dalam rangka persiapan presentasi, pembuatan slide Canva, dan dokumentasi karya kompetisi **Youth Creative Competition (YCWC) 2026**.

---

## 1. Identitas Karya

- **Nama Proyek:** AksesAI
- **Tagline:** AI-Powered Accessibility Companion for Indonesia
- **Kompetisi:** YCWC 2026 (Youth Creative Competition 2026)
- **Deskripsi 1-Kalimat:**  
  *"AksesAI adalah AI-powered accessibility companion yang mengubah informasi harian dari berbagai format—suara langsung, berkas audio, video, foto, dan dokumen—menjadi informasi yang lebih mudah diakses, dipahami, dan ditindaklanjuti bagi komunitas Tuli dan Teman Dengar di Indonesia."*
- **Konsep Utama:**  
  Bertindak sebagai **lapisan perantara aksesibilitas (accessibility layer)** yang menjembatani informasi mentah dalam kehidupan sehari-hari dengan pengguna yang memiliki kendala aksesibilitas visual, auditori, maupun kognitif.

---

## 2. Kenapa AksesAI Dibuat?

Aksesibilitas informasi adalah hak asasi fundamental. Namun dalam realitas masyarakat Indonesia saat ini, terdapat jurang besar antara **"informasi telah tersedia"** dan **"informasi dapat diakses serta dipahami secara nyata"**:

1. **Hambatan Lisan & Pendengaran:** Pengumuman suara di stasiun kereta, bandara, perkuliahan, rapat, atau siaran darurat publik sulit diakses oleh Komunitas Tuli (gangguan pendengaran) jika tidak ada penjelas teks visual real-time.
2. **Hambatan Bahasa Formal & Birokrasi:** Surat keputusan pemerintah, pengumuman sekolah, berkas BPJS, dan dokumen legal sering kali ditulis dalam kalimat yang sangat panjang, kaku, dan penuh istilah formal yang menimbulkan beban kognitif tinggi (*cognitive overload*).
3. **Informasi Tersembunyi dalam Foto/Dokumen:** Pengumuman penting fisik sering difoto dan disebarkan sebagai gambar atau PDF scan, membuat teks sulit dibaca secara langsung oleh alat bantu pembaca.
4. **Beban Pemilahan Informasi:** Pengguna kesulitan menemukan tanggal penting, lokasi, dan instruksi tindakan nyata secara cepat di antara tumpukan paragraf.

AksesAI hadir untuk memangkas hambatan tersebut dengan memanfaatkan AI sebagai modul ekstraksi makna dan penyederhanaan bahasa yang ramah kognitif.

---

## 3. Target Pengguna

Berdasarkan analisis kebutuhan dan implementasi produk saat ini, AksesAI ditujukan untuk:

1. **Komunitas Tuli & Teman Dengar:** Membutuhkan penjelas teks visual dari pembicaraan lisan tatap muka, rapat, maupun berkas rekaman suara/video.
2. **Individu dengan Tantangan Membaca & Disleksia:** Membutuhkan tampilan huruf khusus (OpenDyslexic), penyederhanaan struktur kalimat, penyorotan fakta penting, serta dukungan pembaca suara (Text-to-Speech).
3. **Masyarakat Umum & Lansia:** Siapa saja yang ingin memahami dokumen formal, pengumuman sekolah/kampus, atau peringatan publik dengan cepat tanpa harus membaca teks panjang.

---

## 4. Ide Utama

> **"AksesAI sebagai Accessibility Layer antara Informasi Sehari-hari dan Orang yang Membutuhkannya."**

AksesAI tidak diposisikan sebagai "website pencari informasi" atau "chatbot tanya-jawab". Ide utamanya adalah menyediakan **alur kerja aksesibilitas otomatis (automated accessibility workflow)**:

```text
INFORMASI HARIAN 
(Suara / Audio / Video / Foto / Dokumen)
       │
       ▼
[ AKSESAI ACCESSIBILITY LAYER ]
  - Web Speech API (Suara Langsung)
  - Gemini AI Proxy (Pemrosesan Multimodal)
  - Dyslexia & UI Engine (Transformasi Visual)
       │
       ▼
INFORMASI RAMAH ACCESSIBLE
(Teks Ringkas + Kartu Aksi + Penyorotan Fakta + Audio TTS id-ID)
```

---

## 5. Tujuan Proyek

1. **Tujuan Aksesibilitas (Accessibility Goal):** Menyediakan alternatif visual dan auditori penuh bagi semua format informasi harian sesuai standar WCAG 2.2 AA.
2. **Tujuan Pemahaman (Comprehension Goal):** Mentransformasikan bahasa formal/birokrasi menjadi Bahasa Indonesia sehari-hari yang bersih dan ramah kognitif.
3. **Tujuan Transformasi Struktur (Information Transformation Goal):** Memisahkan secara otomatis antara ringkasan, instruksi tindakan, tanggal/tenggat waktu, lokasi, dan catatan poin yang samar/butuh konfirmasi.
4. **Tujuan Kebergunaan (Usability Goal):** Menghadirkan antarmuka 1-klik yang mudah dioperasikan tanpa perlu menulis prompt AI yang rumit.

---

## 6. Cara Kerja AksesAI

Alur kerja sistem AksesAI bervariasi sesuai format input yang dimasukkan oleh pengguna:

```text
       [ INPUT PENGGUNA ]
  ┌──────────┬───────────┬───────────┐
  │ Teks     │ Gambar/PDF│ Audio/Video│ Suara Langsung
  ▼          ▼           ▼           ▼
[Teks Input] [Base64/Doc] [Base64 Media] [Web Speech API]
  │          │           │           │
  └──────────┴─────┬─────┴───────────┘
                   │
                   ▼ (HTTP POST Proxy)
      [ Express Backend Server ]
                   │
                   ▼ (API Request)
      [ Gemini 3.6 Flash Engine ]
                   │
                   ▼ (JSON Output)
    [ Display Result & Dyslexia Mode ]
```

- **Teks / Foto / Dokumen PDF:** Teks atau berkas diubah menjadi Base64, dikirim ke backend proxy `/api/ai/simplify`, lalu diproses oleh Gemini AI untuk mengekstrak makna dan poin terstruktur.
- **Berkas Audio / Video:** Berkas rekaman diunggah, dikonversi ke Base64, diproses oleh backend proxy `/api/ai/transcribe-media` menggunakan Gemini AI untuk menghasilkan transkrip lengkap dan ringkasan poin penting.
- **Suara Langsung (Live Speech):** Menggunakan API peramban native (`SpeechRecognition`) secara real-time di peramban klien tanpa melalui server Gemini, dilengkapi pengunci 2 pembicara dan pengukur volume suara visual.
- **Pembaca Audio (TTS):** Menggunakan API peramban native (`SpeechSynthesis`) ber-locale `id-ID` untuk membacakan teks hasil di layar.

---

## 7. Fitur-Fitur Utama (Berdasarkan Inspect Codebase)

### Fitur 1: 🎙️ Transkripsi Langsung (Real-time Speech-to-Text)
- **Input:** Suara lisan dari mikrofon pengguna secara real-time.
- **What System Does:** Mendengarkan alur suara, memisahkan kalimat berdasarkan jeda pembicara, mengukur intensitas volume suara, dan mendeteksi tanggal/lokasi secara otomatis via pemfilteran teks.
- **Output:** Teks transkrip lisan di layar, penghitung kalimat, serta opsi unduh berkas `.txt`.
- **Keterlibatan AI:** Menggunakan native browser Web Speech API (`SpeechRecognition`).
- **Nilai Aksesibilitas:** Memungkinkan Teman Tuli membaca pembicaraan lisan secara instan lengkap dengan indikator visual suara (`sound-wave-bars`).

### Fitur 2: 📁 Upload Audio / Video Media & Analisis AI
- **Input:** Berkas rekaman suara atau video (MP3, WAV, M4A, OGG, MP4, WEBM up to 25MB).
- **What System Does:** Mengirimkan berkas ke backend Node.js untuk dianalisis oleh Gemini AI (`gemini-3.6-flash`).
- **Output:** Transkrip lengkap + 5 Kartu Terstruktur:
  1. *Ringkasan & Inti Pembicaraan*
  2. *Yang Perlu Dilakukan / Instruksi*
  3. *Tanggal & Waktu Penting*
  4. *Lokasi & Nama Penting*
  5. *Poin Samar / Butuh Konfirmasi* (AI secara jujur menandai bagian audio yang tidak jelas tanpa mengarang fakta).
- **Keterlibatan AI:** Pemrosesan AI Multimodal Gemini 3.6 Flash.
- **Nilai Aksesibilitas:** Memangkas waktu mendengarkan rekaman panjang dan memastikan poin tindakan tidak terlewat.

### Fitur 3: 📝 Penyederhanaan Teks, Foto & Dokumen PDF
- **Input:** Teks formal yang ditempel, foto surat fisik (JPG/PNG), atau berkas PDF.
- **What System Does:** Mengirimkan teks/gambar ke Gemini AI dengan pilihan preset skenario Indonesia (Surat Resmi Kelurahan, Pengumuman Akademik, Peringatan BMKG, Lowongan Kerja).
- **Output:** Versi teks sederhana (*simplified version*) + ekstraksi kartu poin penting.
- **Keterlibatan AI:** Pemrosesan AI Multimodal Gemini 3.6 Flash.
- **Nilai Aksesibilitas:** Menghilangkan jargon formal rumit dan menurunkan beban kognitif membaca.

### Fitur 4: 🔤 Mode Ramah Disleksia (App-Wide Dyslexia Engine)
- **Input:** Tombol sakelar (*checkbox*) di toolbar aksesibilitas atas.
- **What System Does:** Mengubah jenis font seluruh aplikasi menjadi `OpenDyslexic`, mengubah teks paragraf menjadi daftar poin berlabel (`• Waktu:`, `• Di mana:`), serta menyorot tanggal dan angka dengan latar kuning (`dyslexia-fact-highlight`).
- **Output:** Tampilan visual antarmuka dan teks yang sangat mudah dibaca oleh penderita disleksia.
- **Keterlibatan AI:** 100% Client-side JS Engine deterministik (`DyslexiaService`) — *tidak mengkonsumsi kuota API Gemini*.
- **Nilai Aksesibilitas:** Mencegah kebingungan huruf berputar/terbalik dan memudahkan fokus pembaca disleksia.

### Fitur 5: 🔊 Text-to-Speech (TTS) Bahasa Indonesia
- **Input:** Klik tombol "Dengarkan" pada kartu hasil mana saja.
- **What System Does:** Membaca teks yang *sedang aktif ditampilkan* pada kartu tersebut secara jernih.
- **Output:** Audio pembacaan suara lisan Bahasa Indonesia.
- **Keterlibatan AI:** Native Browser Web SpeechSynthesis API dengan pengontrolan ketat `lang = "id-ID"` dan pemfilteran suara Bahasa Indonesia (`TTSService`).
- **Nilai Aksesibilitas:** Memberikan aksesibilitas auditori bagi pengguna dengan gangguan penglihatan atau hambatan membaca.

### Fitur 6: 📜 Manajemen Riwayat Aktivitas (History)
- **Input:** Penyimpanan otomatis setiap kali proses analisis atau transkripsi selesai.
- **What System Does:** Menyimpan sesi ke `LocalStorage` (mode Tamu) atau ke database server `db_data.json` (mode Pengguna Terautentikasi).
- **Output:** Daftar riwayat terurut, pencarian kata kunci, modal detail, dan hapus riwayat.
- **Keterlibatan AI:** Tidak ada (Management Storage Layer).
- **Nilai Aksesibilitas:** Memudahkan pengguna membuka kembali instruksi penting di kemudian hari.

---

## 8. Fitur Unik / Nilai Pembeda (Differentiators)

Dibandingkan platform AI umum, AksesAI memiliki nilai pembeda kuat:

| Parameter | Chatbot AI Generik (e.g. ChatGPT/Gemini Web) | AksesAI Companion System |
| :--- | :--- | :--- |
| **Alur Kerja** | Perlu menulis prompt manual yang panjang & tepat. | 1-Klik Alur Kerja Aksesibilitas Khusus. |
| **Bentuk Respon** | Paragraf mentah / teks percakapan bebas. | Kartu Terstruktur (Ringkasan, Aksi, Waktu, Lokasi, Poin Samar). |
| **Aksesibilitas Visual** | Tampilan font standar tanpa pengubah ukuran/kontras. | Bilah Aksesibilitas WCAG (Ukuran Font 150%, Mode Kontras Tinggi, OpenDyslexic). |
| **Dukungan Disleksia** | Terbatas pada teks yang dihasilkan AI. | **App-Wide Dyslexia Mode** (Mengubah UI & teks hasil menjadi poin berlabel secara otomatis). |
| **Transkripsi Lisan** | Tidak ada pengukur volume visual & batas pembicara. | Transkripsi langsung dengan **2-Person Speaker Toggle** & **Visual Audio Meter**. |
| **Audio Output** | Membutuhkan fitur TTS berbayar/eksternal. | **Native Indonesian TTS (`id-ID`)** 1-klik di setiap kartu hasil tanpa biaya API. |

---

## 9. Implementasi AI (Detail Arsitektur)

- **Model AI:** Google Gemini 3.6 Flash (`gemini-3.6-flash`).
- **Titik Integrasi:** Dipanggil melalui HTTP POST dari `services/apiService.js` ke Backend Server Express Proxy (`backend/server.js`) pada endpoint `/api/ai/simplify` dan `/api/ai/transcribe-media`.
- **Struktur Payload Input:**
  ```json
  {
    "text": "Teks dokumen...",
    "base64Data": "data:image/png;base64,...",
    "mimeType": "image/png",
    "scenario": "Surat Resmi"
  }
  ```
- **Struktur Output JSON Gemini:**
  ```json
  {
    "summary": "Ringkasan...",
    "key_points": ["Poin 1", "Poin 2"],
    "action_items": ["Instruksi 1"],
    "important_dates": ["Tanggal 1"],
    "important_locations": ["Lokasi 1"],
    "unclear_notes": ["Poin samar jika ada"],
    "simplified_version": "Teks sederhana..."
  }
  ```
- **Penanganan Error AI:** Jika server Gemini mengalami keterbatasan kuota atau kelebihan beban (HTTP 503), backend secara rapi menangkap error dan mengembalikan pesan ramah pengguna: `"Model AI sedang padat. Silakan coba lagi beberapa saat."`
- **Pembedaan Tegas Teknologi:**
  - **Gemini AI:** Analisis makna multimodal, pemahaman dokumen/foto/video, penyederhanaan bahasa.
  - **Web Speech API (`SpeechRecognition`):** Transkripsi mikrofon lisan real-time.
  - **Web SpeechSynthesis API (`SpeechSynthesis`):** Pembacaan audio TTS `id-ID`.

---

## 10. Arsitektur Teknis Codebase

```text
[ CLIENT FRONTEND ]
├── index.html                (Struktur Utama & Accessibility Toolbar)
├── style.css                 (CSS System, Responsive, Contrast Themes)
├── script.js                 (Main App Controller & Navigation View Switcher)
├── components/
│   ├── liveSpeechUI.js       (Komponen UI Transkripsi Langsung & Audio Meter)
│   ├── audioUploadUI.js      (Komponen UI Upload Audio/Video & Hasil Analysis)
│   ├── textSimplifyUI.js     (Komponen UI Teks/Foto/PDF Simplification)
│   ├── historyUI.js          (Komponen UI Riwayat Aktivitas)
│   └── authModalUI.js        (Komponen UI Modal Login/Daftar)
└── services/
    ├── apiService.js         (HTTP Client Fetch Ke Backend Express)
    ├── speech.js             (Wrapper Web SpeechRecognition Engine)
    ├── ttsService.js         (Wrapper Web SpeechSynthesis Engine id-ID)
    ├── dyslexiaService.js    (Deterministic Text Transformation Engine)
    ├── historyService.js     (Service Manajemen Riwayat Lokal/DB)
    ├── storage.js            (Service Manajemen Preferences UI)
    └── authService.js        (Service Manajemen Token Autentikasi)

[ SERVER BACKEND ]
└── backend/
    ├── server.js             (Node.js Express Proxy, Static File Server, Auth, API Routes)
    ├── .env                  (GEMINI_API_KEY & Port Server)
    └── db_data.json          (Local Database User & History)
```

---

## 11. Implementasi Aksesibilitas (WCAG 2.2 AA)

1. **Transformasi Konten (Content Transformation):**
   - Mengubah teks paragraf tebal menjadi poin-poin berlabel (`• Waktu:`, `• Di mana:`).
   - Penyorotan fakta penting (`<mark class="dyslexia-fact-highlight">`).
2. **Presentasi Visual (Visual Presentation):**
   - **Skala Font:** Normal (100%), Besar (125%), Sangat Besar (150%).
   - **Tema Kontras:** Standar, Mode Gelap, Kontras Tinggi (Kuning di atas Hitam).
   - **Font Ramah Disleksia:** Penggunaan keluarga font `OpenDyslexic`.
   - **Fokus Keyboard:** Indikator fokus jelas (`outline: 3px solid #2563eb`) di seluruh tombol/input.
3. **Aksesibilitas Auditori (Audio Accessibility):**
   - Sintesis pembaca suara 1-klik Bahasa Indonesia (`id-ID`) di setiap kartu hasil.

---

## 12. Autentikasi & Pengelolaan Riwayat

- **Mode Tamu (Guest User):** Pengguna dapat langsung menggunakan seluruh fitur tanpa login. Riwayat aktivitas disimpan secara lokal di `LocalStorage` peramban.
- **Mode Terautentikasi (Logged-in User):** Pengguna dapat mendaftar/masuk melalui modal autentikasi. Sesi dikelola via token Base64 dan riwayat disinkronkan ke database server (`backend/db_data.json`).

---

## 13. Keamanan Kunci API (Security)

- **Server-Side API Key Shielding:** `GEMINI_API_KEY` disimpan secara aman di file `backend/.env` di sisi server backend Node.js.
- **Peramban Klien Aman:** Kunci API **tidak pernah di-hardcode**, tidak disimpan di LocalStorage, dan tidak diekspos dalam respon API klien. Seluruh panggilan AI meintasi proxy backend `/api/ai/*`.

---

## 14. Teknologi yang Digunakan (Tech Stack Summary)

- **Frontend:** HTML5 Semantic, Vanilla CSS3 (Custom Variables), Vanilla JavaScript (ES6 Modular).
- **Backend:** Node.js, Express.js framework, CORS, Dotenv.
- **Engine & AI:** Google Gemini API REST (`gemini-3.6-flash`), Browser Web Speech Recognition API, Browser Web SpeechSynthesis API.
- **Font & Design:** OpenDyslexic Font Family, Flexbox/CSS Grid Responsive Design.

---

## 15. Inovasi & Landasan Karya

AksesAI berinovasi melalui **pendekatan integratif**: menggabungkan keunggulan kecerdasan AI Multimodal dalam memahami makna dokumen dengan aturan aksesibilitas WCAG dan mesin transformasi kognitif ramah disleksia dalam satu antarmuka terpadu.

---

## 16. Nilai Utama Karya (Value Proposition)

AksesAI secara nyata mempermudah pengguna untuk:
1. **Memahami Pengumuman Lisan Instan:** Tanpa harus bergantung pada pendengar lain di sekitar.
2. **Mengekstrak Aksi dari Dokumen Rumit:** Langsung mengetahui *apa yang harus dilakukan* dan *kapan tenggat waktunya*.
3. **Membaca Tanpa Kelelahan Kognitif:** Dengan font disleksia dan penyorotan fakta otomatis.

---

## 17. Kenapa Bukan Sekadar Chatbot?

- **Chatbot Generik:** Pengguna harus berpikir keras *bagaimana menyusun prompt* agar AI mau merangkum, dan hasilnya sering kali tetap berupa teks paragraf mentah.
- **AksesAI:** Pengguna cukup memasukkan bahan (suara/foto/dokumen/teks), dan sistem secara otomatis mengolahnya melalui *pipeline aksesibilitas* untuk menghasilkan tampilan terstruktur, ramah disleksia, serta siap didengarkan via audio.

---

## 18. Poin yang Harus Dibawa ke Presentasi (Bahan Canva Slide)

### 📌 Problem Slide
1. Informasi penting tersedia di mana-mana, tetapi tidak semuanya dapat diakses dan dipahami secara setara.
2. Pengumuman lisan tidak ramah bagi Komunitas Tuli; surat resmi berparagraf tebal membebaskan pembaca disleksia.
3. Jurang nyata antara "tersedianya informasi" dan "keterpahaman informasi".

### 💡 Idea Slide
1. **AksesAI:** AI-Powered Accessibility Companion.
2. Menjadi *accessibility layer* antara informasi harian rumit dengan pengguna yang membutuhkannya.
3. Mengubah 5 format input (suara, audio, video, foto, dokumen) menjadi teks ringkas + poin aksi.

### 🛠️ How It Works & Main Features Slide
1. **Transkripsi Langsung:** Pengenal suara real-time + audio meter visual untuk Teman Tuli.
2. **Upload Audio/Video:** Transkripsi & ekstraksi 5 kartu terstruktur via Gemini AI.
3. **Penyederhanaan Teks & Foto:** Mengubah foto pengumuman/PDF menjadi bahasa sehari-hari.
4. **App-Wide Dyslexia Mode:** Font OpenDyslexic, penyorotan fakta, dan poin berlabel.
5. **Indonesian TTS Player:** Pembaca suara 1-klik ber-locale `id-ID`.

### 🤖 AI & Technical Implementation Slide
1. Backend Node.js Express Proxy menjaga keamanan `GEMINI_API_KEY`.
2. Model `gemini-3.6-flash` digunakan untuk analisis multimodal & penyederhanaan teks.
3. Browser Web API native digunakan untuk transkripsi mikrofon & sintesis audio TTS.

### 🏆 Impact & Innovation Slide
1. Meningkatkan kemandirian Komunitas Tuli & pembaca disleksia dalam pendidikan, layanan publik, dan dunia kerja.
2. Alur kerja 1-klik tanpa perlu kemampuan *prompt engineering*.

---

## 19. Elevator Pitch

- **Versi 1-Kalimat:**  
  *"AksesAI adalah pendamping aksesibilitas berbasis AI yang mengubah informasi lisan, rekaman media, foto pengumuman, dan dokumen rumit menjadi informasi yang ringkas, terstruktur, ramah disleksia, dan mudah dipahami."*
- **Versi 30-Detik:**  
  *"Banyak pengumuman penting disampaikan secara lisan atau ditulis dalam bahasa resmi yang panjang dan rumit. Hal ini menyulitkan Komunitas Tuli, penderita disleksia, dan masyarakat umum. AksesAI hadir untuk menyelesaikan masalah ini. Cukup rekam suara, unggah foto surat, atau dokumen Anda; AksesAI akan langsung merangkum poin penting, menentukan tanggal & instruksi tindakan, menyajikannya dalam mode ramah disleksia, dan membacakannya dalam Bahasa Indonesia."*
- **Versi 1-Menit:**  
  *"Aksesibilitas informasi bukan sekadar membuat ukuran font menjadi besar. Aksesibilitas adalah tentang memastikan makna informasi dapat ditangkap dan ditindaklanjuti oleh semua orang. AksesAI dikembangkan sebagai pendamping aksesibilitas pintar untuk Indonesia. Melalui integrasi Gemini AI 3.6 Flash dan Web Speech API, AksesAI dapat mentranskripsikan pembicaraan lisan secara real-time untuk Teman Tuli, mengekstrak ringkasan dari rekaman audio rapat, serta menyederhanakan surat birokrasi yang rumit. Seluruh antarmuka dilengkapi Mode Ramah Disleksia yang menyorot fakta penting dan pembaca audio Bahasa Indonesia 1-klik. AksesAI mewujudkan kesetaraan akses informasi bagi semua."*

---

## 20. Demo Flow Recommendation (Alur Demonstrasi Produk)

1. **Langkah 1 (Live Speech Demo):** Buka fitur *Transkripsi Langsung*, bicara di depan mikrofon, dan tunjukkan *Visual Audio Meter* serta teks real-time yang muncul.
2. **Langkah 2 (Document & Photo Demo):** Unggah foto surat resmi kelurahan atau dokumen PDF pengumuman, tunjukkan hasil ekstraksi otomatis Kartu *Instruksi* dan *Tanggal Penting*.
3. **Langkah 3 (Dyslexia Mode Demo):** Tekan centang *Huruf Ramah Disleksia* di bar atas, tunjukkan perubahan font OpenDyslexic, penyorotan warna fakta tanggal (`dyslexia-fact-highlight`), dan pemisahan poin berlabel.
4. **Langkah 4 (Indonesian TTS Demo):** Klik tombol **"Dengarkan"** pada kartu hasil untuk memperdengarkan audio pembaca suara Bahasa Indonesia yang jernih.

---

## 21. Relevansi Kriteria Kompetisi (YCWC 2026)

- **Idea & Creativity:** Gagasan orisinal yang memanfaatkan AI Multimodal sebagai infrastruktur aksesibilitas sosial untuk mengatasi hambatan komunikasi di Indonesia.
- **Coding & AI Implementation:** Arsitektur kode modular, integrasi backend proxy Express yang aman, penanganan error 503 yang tangguh, serta pemanfaatan Web API native.
- **Presentation & Impact:** Nilai guna sosial nyata dengan demonstrasi produk yang stabil, bersih, dan berdampak langsung bagi komunitas difabel.

---

## 22. Current Limitations & Considerations (Keterbatasan Proyek)

- **Dukungan Peramban Web Speech API:** Fitur *Transkripsi Langsung* memerlukan peramban berbasis Chromium (Google Chrome / Microsoft Edge) di perangkat desktop atau Android.
- **Ketersediaan Kuota Gemini API:** Pemrosesan media & dokumen bergantung pada stabilitas server Google Gemini. Jika Google mengalami puncak trafik (`503 High Demand`), sistem akan menampilkan pesan peringatan ramah.
- **Paket Suara TTS OS:** Kejernihan pembacaan suara `id-ID` bergantung pada mesin sintesis suara bawaan pada sistem operasi pengguna (Windows/Android/iOS).

---

## 23. Bank Kata Kunci Canva (Presentation Keywords)

`Accessibility Companion` • `Inclusive AI` • `Komunitas Tuli` • `Teman Dengar` • `Dyslexia Friendly` • `Multimodal Analysis` • `Real-time Transcription` • `Information Transformation` • `WCAG 2.2 AA` • `Indonesian Text-to-Speech` • `Visual Audio Meter` • `Structured Action Cards` • `Kesetaraan Informasi`
