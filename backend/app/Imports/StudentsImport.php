<?php

namespace App\Imports;

use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentsImport implements ToCollection, WithHeadingRow
{
    protected int $rowCount = 0;
    protected array $errors = [];
    protected ?int $kelasId;

    public function __construct(?int $kelasId = null)
    {
        $this->kelasId = $kelasId;
    }

    /**
     * Kolom yang dikenali (mapping fleksibel untuk header berbeda-beda).
     */
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

            // Mapping kolom fleksibel
            $nisn  = $this->resolveField($rowArr, ['nisn', 'no_induk', 'nomor_induk']);
            $nama  = $this->resolveField($rowArr, ['nama', 'nama_siswa', 'nama_lengkap', 'name']);
            $jk    = $this->resolveField($rowArr, ['jk', 'jenis_kelamin', 'gender']);
            $ttl   = $this->resolveField($rowArr, ['ttl', 'tgl_lahir', 'tanggal_lahir', 'birthdate']);
            $tmpt  = $this->resolveField($rowArr, ['tempat_lahir', 'tempat', 'place_of_birth']);

            if (empty($nisn) || empty($nama)) {
                $this->errors[] = "Baris ".($i + 2).": NISN atau Nama kosong, dilewati.";
                continue;
            }

            // Normalisasi JK
            $jkNorm = null;
            if ($jk) {
                $jkUp = strtoupper(substr(trim($jk), 0, 1));
                $jkNorm = in_array($jkUp, ['L', 'P']) ? $jkUp : null;
                if (!$jkNorm && str_contains(strtolower($jk), 'per')) $jkNorm = 'P';
                if (!$jkNorm && str_contains(strtolower($jk), 'lak')) $jkNorm = 'L';
            }

            // Parse TTL
            $ttlDate = null;
            if ($ttl) {
                try {
                    $ttlDate = date('Y-m-d', strtotime($ttl));
                } catch (\Throwable) {}
            }

            try {
                Student::updateOrCreate(
                    ['nisn' => $nisn],
                    [
                        'nama'         => $nama,
                        'kelas_id'     => $this->kelasId,
                        'jk'           => $jkNorm,
                        'ttl'          => $ttlDate,
                        'tempat_lahir' => $tmpt,
                        'username'     => $nisn,
                        'password'     => bcrypt($nisn),
                    ]
                );
                $this->rowCount++;
            } catch (\Throwable $e) {
                $this->errors[] = "Baris ".($i + 2)." (NISN: $nisn): ".$e->getMessage();
                Log::warning('Import siswa error', ['row' => $i + 2, 'error' => $e->getMessage()]);
            }
        }
    }

    public function getRowCount(): int    { return $this->rowCount; }
    public function getErrors(): array    { return $this->errors; }
}
