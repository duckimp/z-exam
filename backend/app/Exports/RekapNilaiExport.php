<?php

namespace App\Exports;

use App\Models\UjianPeserta;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RekapNilaiExport implements FromCollection, WithHeadings, WithMapping
{
    protected $sesiId;

    public function __construct($sesiId)
    {
        $this->sesiId = $sesiId;
    }

    public function collection()
    {
        return UjianPeserta::with(['student', 'sesi.mapel'])
            ->where('sesi_id', $this->sesiId)
            ->get();
    }

    public function headings(): array
    {
        return [
            'NISN',
            'Nama Siswa',
            'Mata Pelajaran',
            'Sesi',
            'Skor',
            'Waktu Mulai',
            'Waktu Selesai',
            'Status',
        ];
    }

    public function map($row): array
    {
        return [
            $row->student->nisn,
            $row->student->nama,
            $row->sesi->mapel->nama_mapel,
            $row->sesi->nama_sesi,
            $row->score,
            $row->start_time,
            $row->end_time,
            $row->status,
        ];
    }
}
