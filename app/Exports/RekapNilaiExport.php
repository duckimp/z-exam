<?php

namespace App\Exports;

use App\Models\SesiUjian;
use App\Models\UjianPeserta;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class RekapNilaiExport implements FromCollection, ShouldAutoSize, WithStyles
{
    protected $sesiId;

    public function __construct($sesiId)
    {
        $this->sesiId = $sesiId;
    }

    public function collection()
    {
        $sesi = SesiUjian::with('mapel')->findOrFail($this->sesiId);
        
        // Ambil semua murid yang se-tingkat dengan mata pelajaran sesi ini (sinkron dengan monitoring)
        $tingkat = $sesi->mapel->tingkat ?? null;
        $expectedStudents = \App\Models\Student::with('kelas')
            ->where('is_active', true)
            ->when($tingkat, function ($query) use ($tingkat) {
                $query->whereHas('kelas', function ($q) use ($tingkat) {
                    $q->where('tingkat', $tingkat);
                });
            })
            ->get();

        $existingPeserta = UjianPeserta::with('student')
            ->where('sesi_id', $this->sesiId)
            ->get()
            ->keyBy('student_id');

        // Gabungkan list murid dengan status pengerjaannya
        $peserta = $expectedStudents->map(function ($student) use ($existingPeserta) {
            $ujian = $existingPeserta->get($student->id);
            return [
                'nisn'       => $student->nisn,
                'nama'       => $student->nama,
                'status'     => $ujian ? ($ujian->status === 'START' ? 'Mengerjakan' : ($ujian->status === 'FINISH' ? 'Selesai' : ($ujian->status === 'BANNED' ? 'Diblokir' : 'Menunggu'))) : 'Menunggu',
                'start_time' => $ujian && $ujian->start_time ? date('H:i:s', strtotime($ujian->start_time)) : '—',
                'end_time'   => $ujian && $ujian->end_time ? date('H:i:s', strtotime($ujian->end_time)) : '—',
                'ip_address' => $ujian->ip_address ?? '—',
                'score'      => $ujian ? ($ujian->status === 'FINISH' ? $ujian->score : '—') : '—',
            ];
        })->toArray();

        // Tambahkan peserta yang tidak ada di expectedStudents tapi sempat ikut ujian
        foreach ($existingPeserta as $studentId => $ujian) {
            $alreadyIncluded = false;
            foreach ($peserta as $p) {
                if ($p['nisn'] == $ujian->student->nisn) {
                    $alreadyIncluded = true;
                    break;
                }
            }
            if (!$alreadyIncluded) {
                $peserta[] = [
                    'nisn'       => $ujian->student->nisn,
                    'nama'       => $ujian->student->nama,
                    'status'     => $ujian->status === 'START' ? 'Mengerjakan' : ($ujian->status === 'FINISH' ? 'Selesai' : ($ujian->status === 'BANNED' ? 'Diblokir' : 'Menunggu')),
                    'start_time' => $ujian->start_time ? date('H:i:s', strtotime($ujian->start_time)) : '—',
                    'end_time'   => $ujian->end_time ? date('H:i:s', strtotime($ujian->end_time)) : '—',
                    'ip_address' => $ujian->ip_address ?? '—',
                    'score'      => $ujian->status === 'FINISH' ? $ujian->score : '—',
                ];
            }
        }

        // Urutkan berdasarkan nama peserta agar rapi
        usort($peserta, function($a, $b) {
            return strcmp($a['nama'], $b['nama']);
        });

        // Bangun struktur sheet
        $rows = [];
        $rows[] = ['REKAPITULASI HASIL UJIAN'];
        $rows[] = [];
        $rows[] = ['Sesi Ujian', ': ' . $sesi->nama_sesi];
        $rows[] = ['Mata Pelajaran', ': ' . ($sesi->mapel->nama_mapel ?? '—')];
        $rows[] = ['Tingkat / Kelas', ': ' . ($sesi->mapel->tingkat ?? '—')];
        $rows[] = ['Waktu Pelaksanaan', ': ' . ($sesi->tanggal ? $sesi->tanggal->format('d-m-Y') : '—') . ' (' . $sesi->jam_mulai . ')'];
        $rows[] = [];
        
        // Table Header
        $rows[] = [
            'No',
            'NISN',
            'Nama Peserta',
            'Status',
            'Mulai',
            'Selesai',
            'IP Address',
            'Nilai / Skor'
        ];

        // Table Data
        $no = 1;
        foreach ($peserta as $p) {
            $rows[] = [
                $no++,
                $p['nisn'],
                $p['nama'],
                $p['status'],
                $p['start_time'],
                $p['end_time'],
                $p['ip_address'],
                $p['score']
            ];
        }

        return collect($rows);
    }

    public function styles(Worksheet $sheet)
    {
        // 1. Merge dan style judul utama (Row 1)
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // 2. Style labels info (Row 3 - 6)
        $sheet->getStyle('A3:A6')->getFont()->setBold(true);

        // 3. Style Table Header (Row 8)
        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '1E293B'], // Dark slate
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F1F5F9'], // Sleek light gray / Slate 100
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CBD5E1'],
                ],
            ],
        ];
        $sheet->getStyle('A8:H8')->applyFromArray($headerStyle);
        $sheet->getRowDimension(8)->setRowHeight(28); // Tinggi header

        // 4. Dapatkan total baris data
        $highestRow = $sheet->getHighestRow();

        // 5. Style Table Data (Row 9 sampai $highestRow)
        if ($highestRow >= 9) {
            // Alignment
            $sheet->getStyle('A9:A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // No
            $sheet->getStyle('B9:B' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // NISN
            $sheet->getStyle('D9:G' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Status, Mulai, Selesai, IP
            $sheet->getStyle('H9:H' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Score

            // Borders untuk semua sel data
            $dataStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'E2E8F0'], // Light border Slate 200
                    ],
                ],
            ];
            $sheet->getStyle('A9:H' . $highestRow)->applyFromArray($dataStyle);

            // Beri row height yang lega dan nyaman dibaca
            for ($row = 9; $row <= $highestRow; $row++) {
                $sheet->getRowDimension($row)->setRowHeight(22);
            }
        }

        return [];
    }
}
