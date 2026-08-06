<?php

namespace App\Imports;

use App\Models\Soal;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\Element\Row;
use PhpOffice\PhpWord\Element\Cell;
use PhpOffice\PhpWord\Element\Text;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\Element\Link;
use PhpOffice\PhpWord\Element\Image;

class SoalDocxImport
{
    protected $mapelId;
    protected $isPreview = false;
    protected $questions = [];
    protected int $rowCount = 0;
    protected array $errors = [];

    public function __construct($mapelId, $isPreview = false)
    {
        $this->mapelId = $mapelId;
        $this->isPreview = $isPreview;
    }

    /**
     * Jalankan impor soal dari file Word DOCX.
     */
    public function import(string $filePath): void
    {
        try {
            $phpWord = IOFactory::load($filePath);
            $tableFound = false;

            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if ($element instanceof Table) {
                        $tableFound = true;
                        $this->parseTable($element);
                        break 2; // Hanya memproses tabel pertama yang ditemukan
                    }
                }
            }

            if (!$tableFound) {
                $this->errors[] = "Tidak ditemukan tabel format soal di dalam dokumen Word.";
            }

        } catch (\Throwable $e) {
            $this->errors[] = "Gagal memproses file Word: " . $e->getMessage();
            Log::error('DOCX Import error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        }
    }

    /**
     * Parse tabel soal dari DOCX.
     */
    protected function parseTable(Table $table): void
    {
        $rows = $table->getRows();
        if (empty($rows)) {
            return;
        }

        // 1. Cari baris header untuk mendeteksi kolom secara dinamis
        $headerMap = null;
        $headerRowIdx = -1;

        foreach ($rows as $idx => $row) {
            $map = $this->getHeaderMapFromRow($row);
            if ($map !== null) {
                $headerMap = $map;
                $headerRowIdx = $idx;
                break;
            }
        }

        if ($headerMap === null) {
            $this->errors[] = "Format kolom tabel Word tidak dikenali. Pastikan terdapat kolom 'Jenis', 'Isi', dan 'Jawaban'.";
            return;
        }

        $jenisIdx = $headerMap['jenis'];
        $isiIdx = $headerMap['isi'];
        $jawabanIdx = $headerMap['status'] ?? null;
        $noIdx = $headerMap['no'] ?? null;
        $topikIdx = $headerMap['topik'] ?? null;

        $currentSoal = null;

        // 2. Iterasi baris setelah header
        for ($i = $headerRowIdx + 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            $cells = $row->getCells();

            // Mendapatkan teks dan elemen HTML dari sel
            $jenisRaw = $this->getCellText($cells[$jenisIdx] ?? null);
            $jenis = strtoupper(trim($jenisRaw));

            $isiData = $this->getCellHtmlAndImages($cells[$isiIdx] ?? null);
            $isi = $isiData['html'];

            $jawabanRaw = $this->getCellText($cells[$jawabanIdx] ?? null);
            $jawaban = trim($jawabanRaw);

            $noRaw = $this->getCellText($cells[$noIdx] ?? null);
            $no = (int)trim($noRaw);

            $topik = trim($this->getCellText($cells[$topikIdx] ?? null));

            if (empty($jenis) && empty($isi)) {
                continue; // Lewati baris kosong
            }

            if ($jenis === 'SOAL') {
                // Simpan soal sebelumnya
                if ($currentSoal !== null) {
                    $this->saveSoal($currentSoal);
                }

                $currentSoal = [
                    'konten' => $isi,
                    'bobot' => 1, // Nilai default bobot
                    'urutan' => $no ?: 0,
                    'topik_materi' => $topik ?: null,
                    'options' => []
                ];
            } elseif ($jenis === 'JAWABAN' && $currentSoal !== null) {
                $currentSoal['options'][] = [
                    'konten' => $isi,
                    'is_correct' => ($jawaban === '1' || strtolower($jawaban) === 'benar' || strtolower($jawaban) === 'kunci')
                ];
            }
        }

        // Simpan soal terakhir
        if ($currentSoal !== null) {
            $this->saveSoal($currentSoal);
        }
    }

    /**
     * Deteksi posisi kolom berdasarkan sel header.
     */
    protected function getHeaderMapFromRow(Row $row): ?array
    {
        $map = [];
        $foundRequired = 0;
        $cells = $row->getCells();

        foreach ($cells as $idx => $cell) {
            $valStr = strtolower(trim($this->getCellText($cell)));
            if ($valStr === 'jenis' || $valStr === 'tipe') {
                $map['jenis'] = $idx;
                $foundRequired++;
            } elseif ($valStr === 'isi' || $valStr === 'konten' || $valStr === 'pertanyaan' || $valStr === 'soal') {
                $map['isi'] = $idx;
                $foundRequired++;
            } elseif ($valStr === 'jawaban' || $valStr === 'status jawaban' || $valStr === 'status' || $valStr === 'kunci') {
                $map['status'] = $idx;
                $foundRequired++;
            } elseif ($valStr === 'no' || $valStr === 'nomor' || $valStr === '#') {
                $map['no'] = $idx;
            } elseif ($valStr === 'topik' || $valStr === 'topik materi' || $valStr === 'topik_materi' || $valStr === 'materi') {
                $map['topik'] = $idx;
            }
        }

        if ($foundRequired >= 3) {
            return $map;
        }

        return null;
    }

    /**
     * Dapatkan teks polos dari sel.
     */
    protected function getCellText(?Cell $cell): string
    {
        if ($cell === null) {
            return '';
        }
        $text = '';
        foreach ($cell->getElements() as $element) {
            $text .= $this->extractPlainText($element);
        }
        return $text;
    }

    protected function extractPlainText($element): string
    {
        if ($element instanceof Text) {
            return $element->getText();
        }
        if ($element instanceof TextRun) {
            $t = '';
            foreach ($element->getElements() as $child) {
                $t .= $this->extractPlainText($child);
            }
            return $t;
        }
        if ($element instanceof Link) {
            return $element->getText();
        }
        return '';
    }

    /**
     * Parse isi sel dan mengekstrak gambar / bentuk ke HTML.
     */
    protected function getCellHtmlAndImages(?Cell $cell): array
    {
        if ($cell === null) {
            return ['html' => '', 'images' => []];
        }

        $htmlParts = [];
        $images = [];

        foreach ($cell->getElements() as $element) {
            $part = $this->parseElementToHtml($element, $images);
            if ($part !== '') {
                $htmlParts[] = $part;
            }
        }

        // Susun HTML dengan baris baru.
        // Jika elemen saat ini atau sebelumnya adalah block gambar (div), kita tidak perlu tag <br /> tambahan
        $html = '';
        foreach ($htmlParts as $idx => $part) {
            if ($idx > 0) {
                if (str_starts_with($part, '<div') || str_ends_with($htmlParts[$idx - 1], '</div>')) {
                    $html .= "\n" . $part;
                } else {
                    $html .= "<br />\n" . $part;
                }
            } else {
                $html .= $part;
            }
        }

        return [
            'html' => trim($html),
            'images' => $images
        ];
    }

    /**
     * Parse elemen PHPWord ke tag HTML (lengkap dengan format tebal, miring, garis bawah, gambar webp).
     */
    protected function parseElementToHtml($element, array &$images): string
    {
        if ($element === null) {
            return '';
        }

        if ($element instanceof Text) {
            $decodedText = html_entity_decode($element->getText(), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $text = htmlspecialchars($decodedText, ENT_NOQUOTES, 'UTF-8');
            $style = $element->getFontStyle();
            if ($style) {
                if ($style->isBold()) {
                    $text = '<strong>' . $text . '</strong>';
                }
                if ($style->isItalic()) {
                    $text = '<em>' . $text . '</em>';
                }
                $underline = method_exists($style, 'getUnderline') ? $style->getUnderline() : null;
                if ($underline && $underline !== 'none') {
                    $text = '<u>' . $text . '</u>';
                }
            }
            return $text;
        }

        if ($element instanceof TextRun) {
            $html = '';
            foreach ($element->getElements() as $child) {
                $html .= $this->parseElementToHtml($child, $images);
            }
            return $html;
        }

        if ($element instanceof Link) {
            $decodedText = html_entity_decode($element->getText(), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            return '<a href="' . e($element->getSource()) . '" target="_blank" class="text-indigo-600 underline">' . htmlspecialchars($decodedText, ENT_NOQUOTES, 'UTF-8') . '</a>';
        }

        if ($element instanceof Image) {
            $imgData = null;
            if (method_exists($element, 'getImageString')) {
                $imgData = $element->getImageString();
            }
            if (!$imgData && method_exists($element, 'getImageStringData')) {
                $hexData = $element->getImageStringData(false);
                if ($hexData) {
                    $imgData = @hex2bin($hexData);
                }
            }
            if (!$imgData && method_exists($element, 'getSource')) {
                $source = $element->getSource();
                if (file_exists($source)) {
                    $imgData = file_get_contents($source);
                } elseif (str_starts_with($source, 'data:')) {
                    $parts = explode(',', $source);
                    $imgData = base64_decode($parts[1] ?? '');
                }
            }

            if ($imgData) {
                try {
                    $image = @imagecreatefromstring($imgData);
                    if ($image) {
                        $filename = 'soal_' . uniqid() . '.webp';
                        
                        // Direktori penyimpanan
                        $storageDir = storage_path('app/public/soal');
                        if (!file_exists($storageDir)) {
                            mkdir($storageDir, 0755, true);
                        }
                        $storagePath = $storageDir . '/' . $filename;
                        
                        // Simpan sebagai WebP berkualitas tinggi
                        imagewebp($image, $storagePath, 85);
                        imagedestroy($image);
                        
                        $url = asset('storage/soal/' . $filename);
                        $images[] = $url;
                        return '<div class="soal-gambar-block" style="display: block; text-align: center; margin: 16px 0;"><img src="' . $url . '" alt="Gambar Soal" style="max-width: 100%; max-height: 400px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); display: inline-block;" /></div>';
                    }
                } catch (\Throwable $e) {
                    Log::warning('DOCX Image conversion failed: ' . $e->getMessage());
                }
            }
        }

        return '';
    }

    /**
     * Simpan data soal hasil parse ke database.
     */
    protected function saveSoal(array $soalData): void
    {
        if (empty($soalData['konten'])) {
            return;
        }

        $tipe = count($soalData['options']) > 0 ? 'PG' : 'ESSAY';

        try {
            if ($this->isPreview) {
                $opts = [];
                if ($tipe === 'PG') {
                    $labels = ['A', 'B', 'C', 'D', 'E'];
                    foreach ($soalData['options'] as $idx => $opt) {
                        $label = $labels[$idx] ?? 'A';
                        $opts[] = [
                            'label' => $label,
                            'konten' => $opt['konten'],
                            'is_correct' => (bool)$opt['is_correct']
                        ];
                    }
                }
                $this->questions[] = [
                    'tipe' => $tipe,
                    'konten' => $soalData['konten'],
                    'bobot' => $soalData['bobot'] ?: 1,
                    'urutan' => $soalData['urutan'] ?: 0,
                    'topik_materi' => $soalData['topik_materi'] ?? null,
                    'kunci_essay' => null,
                    'options' => $opts
                ];
                $this->rowCount++;
                return;
            }

            $soalObj = Soal::create([
                'mapel_id' => $this->mapelId,
                'tipe'     => $tipe,
                'konten'   => $soalData['konten'],
                'bobot'    => $soalData['bobot'] ?: 1,
                'urutan'   => $soalData['urutan'] ?: 0,
                'topik_materi' => $soalData['topik_materi'] ?? null,
            ]);

            if ($tipe === 'PG') {
                $labels = ['A', 'B', 'C', 'D', 'E'];
                foreach ($soalData['options'] as $idx => $opt) {
                    $label = $labels[$idx] ?? 'A';
                    $soalObj->opsi()->create([
                        'label'      => $label,
                        'konten'     => $opt['konten'],
                        'is_correct' => $opt['is_correct'],
                    ]);
                }
            }

            $this->rowCount++;
        } catch (\Throwable $e) {
            $this->errors[] = "Gagal mengimpor soal \"" . substr(strip_tags($soalData['konten']), 0, 30) . "...\": " . $e->getMessage();
            Log::warning('Impor soal DOCX gagal: ' . $e->getMessage());
        }
    }

    public function getRowCount(): int
    {
        return $this->rowCount;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getQuestions(): array
    {
        return $this->questions;
    }
}
