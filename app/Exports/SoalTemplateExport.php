<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;

class SoalTemplateExport implements FromArray, WithStyles, WithColumnWidths, WithTitle
{
    public function title(): string
    {
        return 'Template Soal';
    }

    public function array(): array
    {
        return [
            // Baris 1: Judul
            ['TEMPLATE IMPORT SOAL', '', '', '', '', '', ''],
            // Baris 2: Keterangan Q
            ['', 'Q', '=', 'Question (Soal)', '', 'Kolom "Status Jawaban": isi angka 1 untuk jawaban BENAR, 0 untuk salah', ''],
            // Baris 3: Keterangan A
            ['', 'A', '=', 'Answer (Pilihan Jawaban)', '', 'Kolom "Butir Soal": khusus untuk soal ESSAY (poin nilai soal)', ''],
            // Baris 4: Peringatan
            ['', '', '', '', '', '⚠ Import tidak mendukung gambar/rumus LaTeX yang menggunakan tanda kutip ganda', ''],
            // Baris 5: Kosong (Pemisah)
            ['', '', '', '', '', '', ''],
            // Baris 6: Header Kolom
            ['No', 'Jenis', 'Kode', 'Isi Soal / Teks Jawaban', 'Status Jawaban', 'Butir Soal', ''],
            // ── Contoh Soal 1: Pilihan Ganda ──
            [1, 'SOAL', 'Q', 'Hasil dari $2x + 5x$ adalah...', '', 2, ''],
            ['', 'JAWABAN', 'A', '$7x$', 1, '', ''],
            ['', 'JAWABAN', 'A', '$10x$', 0, '', ''],
            ['', 'JAWABAN', 'A', '$3x$', 0, '', ''],
            ['', 'JAWABAN', 'A', '$7x^2$', 0, '', ''],
            // Baris kosong antar soal
            ['', '', '', '', '', '', ''],
            // ── Contoh Soal 2: Essay ──
            [2, 'SOAL', 'Q', 'Jelaskan pengertian variabel dalam aljabar!', '', 10, ''],
            // Baris kosong untuk data baru
            ['', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,    // No
            'B' => 12,   // Jenis
            'C' => 8,    // Kode
            'D' => 60,   // Isi Soal
            'E' => 18,   // Status Jawaban
            'F' => 14,   // Butir Soal
            'G' => 5,    // Padding kanan
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // ── Merge judul ──
        $sheet->mergeCells('A1:F1');

        // ── Judul ──
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'size'  => 14,
                'color' => ['argb' => 'FFFFFFFF'],
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E40AF'], // biru tua
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        // ── Kotak keterangan (baris 2–4) ──
        $sheet->getStyle('A2:F4')->applyFromArray([
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFEFF6FF'], // biru sangat muda
            ],
            'font' => [
                'size' => 10,
                'color' => ['argb' => 'FF1E3A8A'],
            ],
        ]);

        // Bold label Q dan A
        $sheet->getStyle('B2:B3')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['argb' => 'FF1D4ED8']],
        ]);

        // Peringatan (baris 4) italic
        $sheet->getStyle('F4')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['argb' => 'FF92400E']],
        ]);

        // ── Baris 5 pemisah kosong ──
        $sheet->getRowDimension(5)->setRowHeight(6);

        // ── Header tabel (baris 6) ──
        $sheet->getStyle('A6:F6')->applyFromArray([
            'font' => [
                'bold'  => true,
                'size'  => 10,
                'color' => ['argb' => 'FFFFFFFF'],
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1D4ED8'], // biru
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
                'wrapText'   => false,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color'       => ['argb' => 'FF93C5FD'],
                ],
            ],
        ]);
        $sheet->getRowDimension(6)->setRowHeight(22);

        // ── Baris SOAL (baris 7 & 13) ──
        foreach ([7, 13] as $row) {
            $sheet->getStyle("A{$row}:F{$row}")->applyFromArray([
                'font' => [
                    'bold'  => true,
                    'size'  => 10,
                    'color' => ['argb' => 'FF1E3A8A'],
                ],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFDBEAFE'], // biru muda
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['argb' => 'FFBFDBFE'],
                    ],
                ],
            ]);
            $sheet->getRowDimension($row)->setRowHeight(20);
        }

        // ── Baris JAWABAN (baris 8–11) ──
        foreach (range(8, 11) as $row) {
            $sheet->getStyle("A{$row}:F{$row}")->applyFromArray([
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFF8FAFC'],
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['argb' => 'FFE2E8F0'],
                    ],
                ],
                'font' => ['size' => 10],
            ]);
            $sheet->getRowDimension($row)->setRowHeight(18);
        }

        // ── Kolom "Status Jawaban" (E) — center ──
        $sheet->getStyle('E7:E16')->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // ── Kolom "Butir Soal" (F) — kuning, center ──
        $sheet->getStyle('F7:F16')->applyFromArray([
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFFEF9C3'], // kuning
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'font'      => ['size' => 10],
        ]);

        // ── Kolom "No" (A) — center ──
        $sheet->getStyle('A7:A16')->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'font'      => ['bold' => true, 'size' => 10],
        ]);

        // ── Kolom "Jenis" (B) & "Kode" (C) — center ──
        $sheet->getStyle('B7:C16')->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'font'      => ['size' => 10],
        ]);

        // ── Baris kosong antar soal — border tipis ──
        $sheet->getStyle('A12:F12')->applyFromArray([
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_DASHED,
                    'color'       => ['argb' => 'FFCBD5E1'],
                ],
            ],
        ]);

        // Freeze header
        $sheet->freezePane('A7');

        return [];
    }
}
