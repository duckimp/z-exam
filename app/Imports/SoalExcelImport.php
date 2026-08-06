<?php

namespace App\Imports;

use App\Models\Soal;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class SoalExcelImport implements ToCollection
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
     * Cari peta header untuk CBT template (vertikal).
     */
    protected function getCbtHeaderMap(array $row): ?array
    {
        $map = [];
        $foundRequired = 0;

        foreach ($row as $idx => $val) {
            $valStr = strtolower(trim((string)$val));
            if ($valStr === 'jenis' || $valStr === 'tipe' || str_contains($valStr, 'jenis') || str_contains($valStr, 'tipe')) {
                $map['jenis'] = $idx;
                $foundRequired++;
            } elseif ($valStr === 'kode' || $valStr === 'code' || str_contains($valStr, 'kode') || str_contains($valStr, 'code')) {
                $map['kode'] = $idx;
                $foundRequired++;
            } elseif ($valStr === 'isi' || $valStr === 'konten' || $valStr === 'pertanyaan' || str_contains($valStr, 'isi') || str_contains($valStr, 'konten') || str_contains($valStr, 'pertanyaan')) {
                $map['isi'] = $idx;
                $foundRequired++;
            } elseif ($valStr === 'no' || $valStr === 'nomor' || $valStr === '#') {
                $map['no'] = $idx;
            } elseif (str_contains($valStr, 'status') || str_contains($valStr, 'kunci') || $valStr === 'jawaban benar') {
                $map['status'] = $idx;
            } elseif (str_contains($valStr, 'butir') || str_contains($valStr, 'bobot') || str_contains($valStr, 'nilai') || str_contains($valStr, 'skor')) {
                $map['butir'] = $idx;
            } elseif (str_contains($valStr, 'topik') || str_contains($valStr, 'materi')) {
                $map['topik'] = $idx;
            } elseif (str_contains($valStr, 'kata kunci') || str_contains($valStr, 'keyword') || str_contains($valStr, 'kunci esai')) {
                $map['keyword_esai'] = $idx;
            }
        }

        if ($foundRequired >= 3) {
            return $map;
        }

        return null;
    }

    /**
     * Cari peta header untuk template lama (horizontal).
     */
    protected function getOldHeaderMap(array $row): array
    {
        $map = [];
        foreach ($row as $idx => $val) {
            $valStr = strtolower(trim((string)$val));
            if ($valStr === 'tipe') {
                $map['tipe'] = $idx;
            } elseif ($valStr === 'soal' || $valStr === 'pertanyaan' || $valStr === 'konten') {
                $map['soal'] = $idx;
            } elseif ($valStr === 'bobot' || $valStr === 'nilai' || $valStr === 'skor') {
                $map['bobot'] = $idx;
            } elseif ($valStr === 'urutan' || $valStr === 'no') {
                $map['urutan'] = $idx;
            } elseif ($valStr === 'kunci' || $valStr === 'kunci_jawaban') {
                $map['kunci'] = $idx;
            } elseif ($valStr === 'topik' || $valStr === 'topik_materi' || $valStr === 'topik materi' || $valStr === 'materi') {
                $map['topik_materi'] = $idx;
            } elseif ($valStr === 'kata kunci' || $valStr === 'kata_kunci' || $valStr === 'keyword_esai' || $valStr === 'keyword esai' || $valStr === 'kunci esai') {
                $map['keyword_esai'] = $idx;
            } elseif ($valStr === 'opsi_a' || $valStr === 'opsia' || $valStr === 'opsi a' || $valStr === 'a') {
                $map['opsi_a'] = $idx;
            } elseif ($valStr === 'opsi_b' || $valStr === 'opsib' || $valStr === 'opsi b' || $valStr === 'b') {
                $map['opsi_b'] = $idx;
            } elseif ($valStr === 'opsi_c' || $valStr === 'opsic' || $valStr === 'opsi c' || $valStr === 'c') {
                $map['opsi_c'] = $idx;
            } elseif ($valStr === 'opsi_d' || $valStr === 'opsid' || $valStr === 'opsi d' || $valStr === 'd') {
                $map['opsi_d'] = $idx;
            } elseif ($valStr === 'opsi_e' || $valStr === 'opsie' || $valStr === 'opsi e' || $valStr === 'e') {
                $map['opsi_e'] = $idx;
            }
        }
        return $map;
    }

    public function collection(Collection $rows)
    {
        $rowsArray = $rows->toArray();
        if (empty($rowsArray)) {
            return;
        }

        // 1. Deteksi template: cari header CBT (maksimal cari di 15 baris pertama)
        $cbtHeaderMap = null;
        $cbtHeaderRowIdx = -1;

        for ($i = 0; $i < min(15, count($rowsArray)); $i++) {
            $map = $this->getCbtHeaderMap($rowsArray[$i]);
            if ($map !== null) {
                $cbtHeaderMap = $map;
                $cbtHeaderRowIdx = $i;
                break;
            }
        }

        if ($cbtHeaderMap !== null) {
            // == MEMPROSES CBT TEMPLATE (VERTIKAL) ==
            $currentSoal = null;
            $noIdx = $cbtHeaderMap['no'] ?? null;
            $jenisIdx = $cbtHeaderMap['jenis'];
            $kodeIdx = $cbtHeaderMap['kode'];
            $isiIdx = $cbtHeaderMap['isi'];
            $statusIdx = $cbtHeaderMap['status'] ?? null;
            $butirIdx = $cbtHeaderMap['butir'] ?? null;
            $topikIdx = $cbtHeaderMap['topik'] ?? null;
            $keywordEsaiIdx = $cbtHeaderMap['keyword_esai'] ?? null;

            for ($i = $cbtHeaderRowIdx + 1; $i < count($rowsArray); $i++) {
                $row = $rowsArray[$i];
                $jenis = strtoupper(trim((string)($row[$jenisIdx] ?? '')));
                $kode = strtoupper(trim((string)($row[$kodeIdx] ?? '')));
                $isi = $this->escapeHtmlOutsideMath(html_entity_decode(trim((string)($row[$isiIdx] ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $status = trim((string)($row[$statusIdx] ?? '0'));
                $butir = trim((string)($row[$butirIdx] ?? '1'));
                $no = trim((string)($row[$noIdx] ?? '0'));
                $topik = trim((string)($row[$topikIdx] ?? ''));
                $keywordEsaiRaw = trim((string)($row[$keywordEsaiIdx] ?? ''));
                $keywordEsaiArr = null;
                if ($keywordEsaiRaw !== '') {
                    $keywordEsaiArr = array_values(array_filter(array_map('trim', explode(',', $keywordEsaiRaw))));
                }

                if (empty($jenis) && empty($isi)) {
                    continue; // Skip baris kosong
                }

                if ($jenis === 'SOAL' || $kode === 'Q') {
                    // Simpan soal sebelumnya jika ada
                    if ($currentSoal !== null) {
                        $this->saveCbtSoal($currentSoal);
                    }

                    $currentSoal = [
                        'konten' => $isi,
                        'bobot'  => (int)$butir ?: 1,
                        'urutan' => (int)$no ?: 0,
                        'topik_materi' => $topik ?: null,
                        'keyword_esai' => $keywordEsaiArr,
                        'options' => []
                    ];
                } elseif (($jenis === 'JAWABAN' || $kode === 'A') && $currentSoal !== null) {
                    $currentSoal['options'][] = [
                        'konten'     => $isi,
                        'is_correct' => ($status === '1' || strtolower($status) === 'benar' || strtolower($status) === 'kunci' || $status == '1.0')
                    ];
                }
            }

            // Simpan soal terakhir
            if ($currentSoal !== null) {
                $this->saveCbtSoal($currentSoal);
            }

        } else {
            // == MEMPROSES TEMPLATE LAMA (HORIZONTAL) ==
            // Asumsikan baris pertama (indeks 0) adalah header
            $headerRow = $rowsArray[0];
            $oldHeaderMap = $this->getOldHeaderMap($headerRow);

            $tipeIdx = $oldHeaderMap['tipe'] ?? null;
            $soalIdx = $oldHeaderMap['soal'] ?? null;
            $bobotIdx = $oldHeaderMap['bobot'] ?? null;
            $urutanIdx = $oldHeaderMap['urutan'] ?? null;
            $kunciIdx = $oldHeaderMap['kunci'] ?? null;
            $topikMateriIdx = $oldHeaderMap['topik_materi'] ?? null;

            if ($soalIdx === null) {
                $this->errors[] = "Format template tidak dikenali. Pastikan kolom header sesuai.";
                return;
            }

            for ($i = 1; $i < count($rowsArray); $i++) {
                $row = $rowsArray[$i];
                $konten = $this->escapeHtmlOutsideMath(html_entity_decode(trim((string)($row[$soalIdx] ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                if (empty($konten)) {
                    continue; // Skip baris kosong
                }

                $tipe = $tipeIdx !== null && !empty($row[$tipeIdx]) ? strtoupper(trim((string)$row[$tipeIdx])) : 'PG';
                $bobot = $bobotIdx !== null ? (int)($row[$bobotIdx] ?? 1) : 1;
                $urutan = $urutanIdx !== null ? (int)($row[$urutanIdx] ?? 0) : 0;
                $kunci = $kunciIdx !== null ? strtoupper(trim((string)($row[$kunciIdx] ?? ''))) : '';
                $topikMateri = $topikMateriIdx !== null ? trim((string)($row[$topikMateriIdx] ?? '')) : '';

                try {
                    if ($this->isPreview) {
                        $opts = [];
                        if ($tipe === 'PG') {
                            $labels = ['A', 'B', 'C', 'D', 'E'];
                            $opsiIndices = [
                                'A' => $oldHeaderMap['opsi_a'] ?? null,
                                'B' => $oldHeaderMap['opsi_b'] ?? null,
                                'C' => $oldHeaderMap['opsi_c'] ?? null,
                                'D' => $oldHeaderMap['opsi_d'] ?? null,
                                'E' => $oldHeaderMap['opsi_e'] ?? null,
                            ];
                            foreach ($labels as $label) {
                                $colIdx = $opsiIndices[$label];
                                if ($colIdx !== null && isset($row[$colIdx]) && trim((string)$row[$colIdx]) !== '') {
                                    $opts[] = [
                                        'label' => $label,
                                        'konten' => $this->escapeHtmlOutsideMath(html_entity_decode(trim((string)$row[$colIdx]), ENT_QUOTES | ENT_HTML5, 'UTF-8')),
                                        'is_correct' => $kunci === $label
                                    ];
                                }
                            }
                        }
                        $this->questions[] = [
                            'tipe' => $tipe,
                            'konten' => $konten,
                            'bobot' => $bobot ?: 1,
                            'urutan' => $urutan ?: 0,
                            'topik_materi' => $topikMateri ?: null,
                            'kunci_essay' => $tipe === 'ESSAY' ? $kunci : null,
                            'options' => $opts
                        ];
                        $this->rowCount++;
                        continue;
                    }

                    $soalObj = Soal::create([
                        'mapel_id'    => $this->mapelId,
                        'tipe'        => $tipe,
                        'konten'      => $konten,
                        'bobot'       => $bobot ?: 1,
                        'urutan'      => $urutan ?: 0,
                        'topik_materi' => $topikMateri ?: null,
                        'kunci_essay' => $tipe === 'ESSAY' ? $kunci : null,
                    ]);

                    if ($tipe === 'PG') {
                        $labels = ['A', 'B', 'C', 'D', 'E'];
                        $opsiIndices = [
                            'A' => $oldHeaderMap['opsi_a'] ?? null,
                            'B' => $oldHeaderMap['opsi_b'] ?? null,
                            'C' => $oldHeaderMap['opsi_c'] ?? null,
                            'D' => $oldHeaderMap['opsi_d'] ?? null,
                            'E' => $oldHeaderMap['opsi_e'] ?? null,
                        ];

                        foreach ($labels as $label) {
                            $colIdx = $opsiIndices[$label];
                            if ($colIdx !== null && isset($row[$colIdx]) && trim((string)$row[$colIdx]) !== '') {
                                $soalObj->opsi()->create([
                                    'label'      => $label,
                                    'konten'     => $this->escapeHtmlOutsideMath(html_entity_decode(trim((string)$row[$colIdx]), ENT_QUOTES | ENT_HTML5, 'UTF-8')),
                                    'is_correct' => $kunci === $label,
                                ]);
                            }
                        }
                    }
                    $this->rowCount++;
                } catch (\Throwable $e) {
                    $this->errors[] = "Baris " . ($i + 1) . ": Gagal mengimpor soal. " . $e->getMessage();
                    Log::warning('Import soal error', ['row' => $i + 1, 'error' => $e->getMessage()]);
                }
            }
        }
    }

    /**
     * Simpan objek Soal dan Opsi dari template CBT ke database.
     */
    protected function saveCbtSoal(array $soalData)
    {
        if (empty($soalData['konten'])) {
            return;
        }

        // Tipe PG jika ada opsi, jika tidak ada, default ke ESSAY
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
                    'keyword_esai' => $soalData['keyword_esai'] ?? null,
                    'kunci_essay' => null,
                    'options' => $opts
                ];
                $this->rowCount++;
                return;
            }

            $soalObj = Soal::create([
                'mapel_id'    => $this->mapelId,
                'tipe'        => $tipe,
                'konten'      => $soalData['konten'],
                'bobot'       => $soalData['bobot'] ?: 1,
                'urutan'      => $soalData['urutan'] ?: 0,
                'topik_materi' => $soalData['topik_materi'] ?? null,
                'keyword_esai' => $soalData['keyword_esai'] ?? null,
                'kunci_essay' => null, // di template vertikal CBT, kunci diletakkan di baris opsi
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
            $this->errors[] = "Gagal mengimpor soal \"" . substr($soalData['konten'], 0, 40) . "...\": " . $e->getMessage();
            Log::warning('Import CBT soal error', ['error' => $e->getMessage(), 'konten' => $soalData['konten']]);
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

    private function escapeHtmlOutsideMath($text)
    {
        if (!$text) return '';
        // Split by math pattern to protect KaTeX formulas
        $parts = preg_split('/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        foreach ($parts as &$part) {
            if ($part && !str_starts_with($part, '$')) {
                $part = htmlspecialchars($part, ENT_NOQUOTES, 'UTF-8', false);
            }
        }
        return implode('', $parts);
    }
}

