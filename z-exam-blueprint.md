# 🚀 Blueprint Arsitektur & Desain UI/UX Z-Exam (Anti-Gravity Version)

**Z-Exam** adalah sistem *Computer-Based Test* (CBT) modern berarsitektur *Single Page Application* (SPA) yang dibangun menggunakan **Laravel 12 (Backend & Reverb WebSocket)** dan **React (Frontend)**. Sistem ini dirancang khusus untuk berjalan 100% Offline/Intranet di lingkungan madrasah menggunakan **Technitium DNS** dan ekosistem penguncian client menggunakan **Exambrowser Android APK** dan **Electron.js (Desktop)**.

Desain UI/UX sistem ini mengadopsi gaya **Anti-Gravity / Zed Code Editor**: Super minimalis, *ultra-responsive*, minim sekat *card* tebal, menggunakan garis border tipis, monokromatik, dan sangat efisien dalam pemanfaatan ruang layar.

---

## 🎨 Konsep UI/UX & Estetika Visual (Anti-Gravity Style)

* **Workspace & Tema:** Menggunakan pendekatan *Zen & High-Contrast*. Pilihan *Light Mode* (latar putih bersih/abu-abu kertas dengan teks hitam pekat) dan *Dark Mode* (latar belakang hitam arang/zinc gelap).
* **Borders over Shadows:** Menghilangkan efek bayangan (*box-shadows*) tebal yang berat. Semua komponen dipisahkan oleh border tipis 1px (`border-zinc-200` atau `border-zinc-800`) agar terkesan tajam dan hemat *resource* rendering browser.
* **Kepadatan Informasi (Density):** Memaksimalkan ruang layar untuk data penting. Jarak *padding* dan *margin* dibuat efisien (khas teks editor), sehingga operator tidak perlu banyak melakukan *scrolling*.
* **Keyboard-Shortcut Friendly:** Navigasi cepat bagi admin/operator menggunakan kombinasi tombol keyboard untuk eksekusi aksi krusial (misal: rilis token, kunci ujian).

---

## 📋 Spesifikasi 8 Modul Utama Z-Exam

### 1. 📊 Dashboard (Command Center Panel)
* **Top Metric Grid:** Baris horizontal berisi data ringkas tanpa box tebal: `Total Siswa` | `Sesi Aktif` | `Mapel Terunggah` | `Router Traffic`.
* **Multi-Line Performance Chart:** Grafik *real-time* berbasis WebSocket (Laravel Reverb) yang memantau utilitas CPU dan RAM laptop server setiap 3 detik. Sangat penting untuk menjaga stabilitas hardware saat menampung 32+ siswa secara simultan.
* **Live Student Monitor Grid:** Kotak kecil statis penanda status siswa. Hijau (Mengerjakan), Kuning (Idle/Selesai), Merah (Terjadi Pelanggaran/Keluar Aplikasi).

### 2. 📚 Bank Soal & Manajemen Mapel
* **Local Asset Parser:** Fitur parser untuk file Word (.docx) dan Excel (.xlsx) secara lokal. Memisahkan teks soal, opsi, kunci, dan bobot nilai.
* **Intranet Rich Renderer:** Semua gambar (Base64 atau lokal storage), komponen *shapes*, dan rumus matematika rumit di-render instan di sisi React memakai library *KaTeX/MathJax* yang sudah di-host lokal (tanpa CDN internet).
* **Modul Mencocokkan (Matching Grid):** Implementasi interaktif pencocokan item. Siswa menghubungkan titik soal ke titik jawaban dengan visualisasi garis merah dinamis berbasis skema JSON terstruktur.

### 3. 👥 Manajemen Peserta & Kredensial
* **Bulk Data Importer:** Import massal format data EMIS/Dapodik (NISN, Nama, TTL, JK, Kelas).
* **Auto-Credential System:** Username dan password otomatis disamakan dengan NISN siswa demi kepraktisan saat login masal di kelas.
* **Cetak Kartu Ujian Cetak Cepat:** Generator PDF lokal siap cetak pada kertas A4 (isi 8-10 kartu per lembar) lengkap dengan QR Code berisi enkripsi data login siswa.

### 4. 🚀 Manajemen Tes & Kontrol Room (Wizard Mode)
* **Form Wizard Layout:** Pembagian setup ujian menjadi 3 kolom panel minimalis (Pilih Mapel & Kelas -> Set Waktu & Durasi -> Set Pengaturan Keamanan).
* **Advanced Toggle Switches:**
    * 🎚️ **Acak Soal & Jawaban:** Algoritme *Fisher-Yates* di backend Laravel dengan penyimpanan *seed key* per sesi siswa agar urutan soal konisten saat HP siswa tidak sengaja memuat ulang halaman.
    * 🎚️ **Dynamic Token:** Token acak yang berganti otomatis setiap 15 menit, didistribusikan ke React siswa secara instan via Laravel Reverb.
    * 🎚️ **Exambro Enforcement:** Jika diaktifkan, hanya siswa yang memakai APK khusus yang bisa masuk ke halaman ujian.

### 5. 🖨️ Modul Laporan & Administrasi Resmi
* **CSS @media print Optimization:** Desain halaman cetak khusus yang otomatis menyembunyikan sidebar, topbar, dan tombol navigasi saat tombol "Cetak" ditekan. Hasil cetakan bersih langsung berupa dokumen fisik resmi.
* **Dokumen Cetak Tersedia:**
    * Berita Acara Ujian (Otomatis menghitung statistik kehadiran).
    * Daftar Hadir Siswa per Sesi/Kelas.
    * Legger Nilai Rekapitulasi (Siap ekspor ke file Excel `.xlsx` untuk input rapor).

### 6. 🧠 Analisis Jawaban Siswa (Diagnostic Analytics)
* **Heatmap Matrix:** Visualisasi berbentuk grid monokrom/warna tegas untuk melihat sebaran jawaban siswa. Memudahkan melihat nomor soal mana yang paling banyak gagal dijawab oleh seluruh kelas.
* **Automated Summary:** Teks kesimpulan performa otomatis berdasarkan data statistik untuk evaluasi guru mata pelajaran (Contoh: *"Guru pengampu: 70% siswa gagal pada indikator soal nomor 5"*).

### 7. 💾 Sistem Backup & Restore Lokal
* **Modular Backup Cards:** Tiga opsi tindakan cepat:
    * Backup Database saja (File `.sql` ringan).
    * Backup Media/Aset (Aset gambar soal terkompresi `.zip`).
    * Full System Snapshot.
* **Instant Restore Zone:** Area *drag-and-drop* file cadangan untuk restorasi sistem secara kilat jika laptop server mengalami masalah teknis di tengah pelaksanaan ujian.

### 8. ⚙️ Pengaturan Sistem & Manajemen Akses (RBAC)
* **Identitas Madrasah:** Manajemen nama sekolah, logo lokal, konfigurasi waktu, dan batasan ukuran upload berkas.
* **Role Checklist Matrix:** Pembagian hak akses berbasis peranan (Role-Based Access Control) antara Operator/Super Admin, Guru Mapel (hanya bisa input soal & lihat nilai kelasnya), dan Pengawas (hanya bisa memantau dashboard monitor dan reset login siswa).

---

## 📱 Arsitektur Ekosistem Client: Anti-Cheat & Intranet Isolation

### A. Exambrowser Android (Native Mobile APK Client