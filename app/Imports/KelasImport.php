<?php

namespace App\Imports;

use App\Models\Kelas;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KelasImport implements ToCollection, WithHeadingRow
{
    protected int $rowCount = 0;
    protected array $errors = [];

    protected function resolveField(array $row, array $keys): ?string
    {
        foreach ($keys as $key) {
            $normalized = strtolower(preg_replace('/[\s_\-]+/', '', $key));
            foreach ($row as $col => $val) {
                $colNorm = strtolower(preg_replace('/[\s_\-]+/', '', $col));
                if ($colNorm === $normalized && !empty($val)) {
                    return trim((string) $val);
                }
            }
        }
        return null;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $i => $row) {
            $rowArr = $row->toArray();

            $tingkat   = $this->resolveField($rowArr, ['tingkat', 'level']);
            $namaKelas = $this->resolveField($rowArr, ['namakelas', 'kelas', 'nama']);
            $tahunAjar = $this->resolveField($rowArr, ['tahunajar', 'tahun', 'academic_year']);
            $waliKelas = $this->resolveField($rowArr, ['walikelas', 'wali', 'teacher']);

            if (empty($tingkat) || empty($namaKelas)) {
                $this->errors[] = "Baris ".($i + 2).": Tingkat atau Nama Kelas kosong, dilewati.";
                continue;
            }

            try {
                Kelas::updateOrCreate(
                    [
                        'tingkat'    => $tingkat,
                        'nama_kelas' => $namaKelas
                    ],
                    [
                        'tahun_ajar' => $tahunAjar ?? '2025/2026',
                        'wali_kelas' => $waliKelas,
                    ]
                );
                $this->rowCount++;
            } catch (\Throwable $e) {
                $this->errors[] = "Baris ".($i + 2)." ($namaKelas): ".$e->getMessage();
                Log::warning('Import kelas error', ['row' => $i + 2, 'error' => $e->getMessage()]);
            }
        }
    }

    public function getRowCount(): int    { return $this->rowCount; }
    public function getErrors(): array    { return $this->errors; }
}
