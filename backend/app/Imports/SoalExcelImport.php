<?php

namespace App\Imports;

use App\Models\Soal;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class SoalExcelImport implements ToCollection, WithHeadingRow
{
    protected $mapelId;

    public function __construct($mapelId)
    {
        $this->mapelId = $mapelId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $tipe = strtoupper($row['tipe'] ?? 'PG');
            
            $soal = Soal::create([
                'mapel_id' => $this->mapelId,
                'tipe'     => $tipe,
                'konten'   => $row['soal'] ?? $row['pertanyaan'] ?? '',
                'bobot'    => $row['bobot'] ?? 1,
                'urutan'   => $row['urutan'] ?? 0,
                'kunci_essay' => $tipe === 'ESSAY' ? ($row['kunci'] ?? '') : null,
            ]);

            if ($tipe === 'PG') {
                $labels = ['A', 'B', 'C', 'D', 'E'];
                $kunci  = strtoupper($row['kunci'] ?? '');

                foreach ($labels as $label) {
                    $col = strtolower("opsi_$label");
                    if (isset($row[$col]) && !empty($row[$col])) {
                        $soal->opsi()->create([
                            'label'      => $label,
                            'konten'     => $row[$col],
                            'is_correct' => $kunci === $label,
                        ]);
                    }
                }
            }
        }
    }
}
