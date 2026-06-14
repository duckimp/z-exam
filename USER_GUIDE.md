# 📖 Panduan Penggunaan Z-Exam (Official User Guide)

Selamat datang di **Z-Exam CBT System**. Aplikasi ini dirancang untuk pelaksanaan ujian berbasis komputer yang efisien, aman, dan modern.

## 🚀 Persiapan Awal (Administrator)
1. **Login Admin**: Masuk ke dashboard menggunakan akun `admin@z-exam.local`.
2. **Manajemen Kelas**: Daftarkan kelas yang aktif di menu **Data Master > Kelas**.
3. **Impor Peserta**: Gunakan fitur **Import Excel** di menu **Peserta** untuk mendaftarkan siswa secara massal.
4. **Cetak Kartu**: Setelah data siswa masuk, gunakan menu **Cetak Kartu** untuk mendownload PDF kartu ujian (8 kartu per A4).

## 📚 Bank Soal (Guru)
1. **Pilih Mapel**: Masuk ke menu **Bank Soal** dan buat Mata Pelajaran baru.
2. **Input Soal**:
   - Anda bisa input manual satu per satu.
   - Gunakan format **LaTeX** (contoh: `$x^2$`) untuk rumus matematika.
   - Gunakan **Import Excel** untuk mempercepat proses input.
3. **Tipe Soal**: Pilih antara Pilihan Ganda (PG), Essay, atau Mencocokkan.

## 📡 Pelaksanaan Ujian (Pengawas/Admin)
1. **Buat Sesi**: Di menu **Sesi Ujian**, buat jadwal baru.
2. **Generate Token**: Setelah sesi dibuat, bagikan **6 Digit Token** kepada siswa.
3. **Monitoring**: Masuk ke **Control Room** (Tombol Monitoring) untuk melihat status siswa secara live.
4. **Kontrol**: Anda bisa melakukan *Force Finish* jika ada siswa yang melanggar atau lupa menekan tombol selesai.

## 🎓 Sisi Siswa (Client)
1. **Akses**: Buka URL aplikasi di perangkat siswa.
2. **Login**: Masuk menggunakan **NISN** dan **Token Ujian** yang diberikan pengawas.
3. **Fullscreen**: Siswa wajib menekan tombol "Aktifkan Layar Penuh" sebelum mulai.
4. **Autosave**: Jawaban akan tersimpan otomatis setiap kali siswa memilih/mengetik.

## 📈 Laporan & Penilaian
1. **Rekap Nilai**: Setelah ujian selesai, unduh rekap nilai dalam format **Excel** di menu **Laporan**.
2. **Analitik**: Lihat grafik distribusi nilai untuk evaluasi kualitas soal.
3. **Cetak Hasil**: Detail jawaban per siswa dapat dicetak ke **PDF** sebagai arsip.

---
*Z-Exam System — Built for Efficiency & Security.*
