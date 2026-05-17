<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class KelasTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            [
                'tingkat'    => 'XI',
                'nama_kelas' => 'XI RPL 1',
                'tahun_ajar' => '2025/2026',
                'wali_kelas' => 'Budi Santoso, S.Pd.',
            ],
            [
                'tingkat'    => 'X',
                'nama_kelas' => 'X TKJ 2',
                'tahun_ajar' => '2025/2026',
                'wali_kelas' => 'Siti Aminah, M.Pd.',
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'tingkat',
            'nama_kelas',
            'tahun_ajar',
            'wali_kelas',
        ];
    }
}
