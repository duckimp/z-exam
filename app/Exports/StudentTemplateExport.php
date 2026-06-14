<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class StudentTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            [
                'nisn' => '1234567890',
                'nama' => 'Ahmad Fauzi',
                'kelas' => 'XI RPL 1',
                'jk'   => 'L',
                'tempat_lahir' => 'Jakarta',
                'tanggal_lahir' => '2008-05-15',
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'nisn',
            'nama',
            'kelas',
            'jk',
            'tempat_lahir',
            'tanggal_lahir',
        ];
    }
}
