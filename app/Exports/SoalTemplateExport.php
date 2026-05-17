<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;

class SoalTemplateExport implements FromArray
{
    public function array(): array
    {
        return [
            // Baris 1: Judul/Instruksi Utama
            ['', '', 'Form Import Soal berdasarkan Topik yang dipilih (Import tidak menerima gambar)'],
            // Baris 2: Keterangan Singkat Q (Question)
            ['', '', 'Q', 'Question', '', 'Status Jawaban diisi dengan angka 1 untuk jawaban benar'],
            // Baris 3: Keterangan Singkat A (Answer)
            ['', '', 'A', 'Answer', '', 'Cell yang berwarna kuning tidak perlu diisi'],
            // Baris 4: Kosong (Pemisah)
            [],
            // Baris 5: Header Kolom
            ['', 'No', 'Jenis', 'Kode', 'Isi', 'Status Jawaban', 'Butir Soal'],
            // Contoh Soal 1 (Pilihan Ganda - PG)
            ['', 1, 'SOAL', 'Q', 'Hasil dari $2x + 5x$ adalah...', '', 2],
            ['', '', 'JAWABAN', 'A', '$7x$', 1, ''],
            ['', '', 'JAWABAN', 'A', '$10x$', 0, ''],
            ['', '', 'JAWABAN', 'A', '$3x$', 0, ''],
            ['', '', 'JAWABAN', 'A', '$7x^2$', 0, ''],
            // Contoh Soal 2 (Essay)
            ['', 2, 'SOAL', 'Q', 'Jelaskan pengertian variabel!', '', 10]
        ];
    }
}

