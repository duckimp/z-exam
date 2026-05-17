<?php

namespace Database\Seeders;

use App\Models\MataPelajaran;
use App\Models\SesiUjian;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SesiUjianSeeder extends Seeder
{
    public function run(): void
    {
        $mapel = MataPelajaran::first();

        if ($mapel) {
            SesiUjian::firstOrCreate(
                ['token' => 'ABCDEF'],
                [
                    'mapel_id'   => $mapel->id,
                    'nama_sesi'  => 'Ujian Tengah Semester Ganjil',
                    'tanggal'    => date('Y-m-d'),
                    'jam_mulai'  => '08:00',
                    'durasi'     => 120,
                    'random_soal' => true,
                    'random_opsi' => true,
                    'is_active'  => true,
                ]
            );
        }
    }
}
