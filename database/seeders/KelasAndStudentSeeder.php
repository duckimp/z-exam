<?php

namespace Database\Seeders;

use App\Models\Kelas;
use App\Models\Student;
use Illuminate\Database\Seeder;

class KelasAndStudentSeeder extends Seeder
{
    public function run(): void
    {
        $dataKelas = [
            ['tingkat' => 'VII', 'nama_kelas' => 'VII A', 'tahun_ajar' => '2025/2026'],
            ['tingkat' => 'VII', 'nama_kelas' => 'VII B', 'tahun_ajar' => '2025/2026'],
            ['tingkat' => 'VIII', 'nama_kelas' => 'VIII A', 'tahun_ajar' => '2025/2026'],
            ['tingkat' => 'IX', 'nama_kelas' => 'IX A', 'tahun_ajar' => '2025/2026'],
        ];

        foreach ($dataKelas as $k) {
            $kelas = Kelas::firstOrCreate(
                ['nama_kelas' => $k['nama_kelas'], 'tahun_ajar' => $k['tahun_ajar']],
                $k
            );

            // Buat 5 siswa dummy per kelas
            for ($i = 1; $i <= 5; $i++) {
                $nisn = '100' . $kelas->id . $i;
                Student::firstOrCreate(
                    ['nisn' => $nisn],
                    [
                        'kelas_id' => $kelas->id,
                        'nama' => 'Siswa ' . $kelas->nama_kelas . ' ' . $i,
                        'jk' => $i % 2 == 0 ? 'L' : 'P',
                        'username' => $nisn,
                        'password' => bcrypt($nisn),
                    ]
                );
            }
        }
    }
}
