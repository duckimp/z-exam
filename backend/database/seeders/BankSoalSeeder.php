<?php

namespace Database\Seeders;

use App\Models\MataPelajaran;
use App\Models\Soal;
use Illuminate\Database\Seeder;

class BankSoalSeeder extends Seeder
{
    public function run(): void
    {
        $mapel = MataPelajaran::create([
            'nama_mapel' => 'Matematika',
            'kode_mapel' => 'MTK-VII',
            'tingkat'    => 'VII',
        ]);

        // Soal PG (KaTeX)
        $s1 = Soal::create([
            'mapel_id' => $mapel->id,
            'tipe'     => 'PG',
            'konten'   => 'Hasil dari $2x + 5x$ adalah...',
            'bobot'    => 2,
            'urutan'   => 1,
        ]);
        $s1->opsi()->createMany([
            ['label' => 'A', 'konten' => '$7x$', 'is_correct' => true],
            ['label' => 'B', 'konten' => '$10x$', 'is_correct' => false],
            ['label' => 'C', 'konten' => '$3x$', 'is_correct' => false],
            ['label' => 'D', 'konten' => '$7x^2$', 'is_correct' => false],
        ]);

        // Soal Matching
        $s2 = Soal::create([
            'mapel_id' => $mapel->id,
            'tipe'     => 'MATCHING',
            'konten'   => 'Pasangkanlah operasi hitung berikut dengan hasilnya yang benar.',
            'bobot'    => 5,
            'urutan'   => 2,
        ]);
        $s2->matchingItems()->createMany([
            ['item_kiri' => '5 + 3', 'item_kanan' => '8'],
            ['item_kiri' => '10 / 2', 'item_kanan' => '5'],
            ['item_kiri' => '4 * 3', 'item_kanan' => '12'],
        ]);

        // Soal Essay
        Soal::create([
            'mapel_id' => $mapel->id,
            'tipe'     => 'ESSAY',
            'konten'   => 'Jelaskan apa yang dimaksud dengan variabel dalam aljabar!',
            'kunci_essay' => 'Variabel adalah lambang pengganti suatu bilangan yang belum diketahui nilainya dengan jelas.',
            'bobot'    => 10,
            'urutan'   => 3,
        ]);
    }
}
