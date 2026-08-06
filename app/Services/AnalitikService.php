<?php

namespace App\Services;

use App\Models\Soal;
use App\Models\JawabanPeserta;
use App\Models\SesiUjian;
use App\Models\UjianPeserta;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * AnalitikService
 * 
 * Service untuk analisis butir soal, deteksi anomali, dan pemetaan remedial
 */
class AnalitikService
{
    /**
     * Analisis Butir Soal (Item Analysis)
     * Menghitung Tingkat Kesukaran dan Daya Pembeda
     * 
     * @param int $sesiId
     * @return array
     */
    public function analisisSoal(int $sesiId): array
    {
        $sesi = SesiUjian::with(['mapel'])->findOrFail($sesiId);
        
        // Ambil semua soal dari mapel sesi ini
        $soalList = Soal::with('opsi')->where('mapel_id', $sesi->mapel_id)
            ->orderBy('urutan')
            ->get();

        $hasil = [];

        foreach ($soalList as $soal) {
            // Ambil semua jawaban untuk soal ini di sesi ini
            $jawaban = JawabanPeserta::whereHas('ujian', function($q) use ($sesiId) {
                $q->where('sesi_id', $sesiId);
            })
            ->where('soal_id', $soal->id)
            ->get();

            $totalPeserta = $jawaban->count();

            if ($totalPeserta == 0) {
                continue; // Skip soal yang tidak dijawab
            }

            // Hitung Tingkat Kesukaran (P)
            $benarCount = $jawaban->where('is_correct', true)->count();
            $tingkatKesukaran = $totalPeserta > 0 ? ($benarCount / $totalPeserta) : 0;

            // Kategori Tingkat Kesukaran
            if ($tingkatKesukaran >= 0.70) {
                $kategoriKesukaran = 'Mudah';
            } elseif ($tingkatKesukaran >= 0.30) {
                $kategoriKesukaran = 'Sedang';
            } else {
                $kategoriKesukaran = 'Sukar';
            }

            // Hitung Daya Pembeda (D)
            $dayaPembeda = $this->hitungDayaPembeda($sesiId, $soal->id, $totalPeserta);

            // Kategori Daya Pembeda
            if ($dayaPembeda >= 0.40) {
                $kategoriDayaPembeda = 'Baik Sekali';
            } elseif ($dayaPembeda >= 0.30) {
                $kategoriDayaPembeda = 'Baik';
            } elseif ($dayaPembeda >= 0.20) {
                $kategoriDayaPembeda = 'Cukup';
            } elseif ($dayaPembeda >= 0.00) {
                $kategoriDayaPembeda = 'Jelek';
            } else {
                $kategoriDayaPembeda = 'Sangat Jelek (Ambigu)';
            }

            // Status Soal berdasarkan hasil analisis
            if ($kategoriDayaPembeda === 'Sangat Jelek (Ambigu)' || $kategoriDayaPembeda === 'Jelek') {
                $statusSoal = 'REVISI';
            } elseif ($kategoriDayaPembeda === 'Cukup' || $kategoriKesukaran === 'Sukar') {
                $statusSoal = 'PERBAIKAN';
            } else {
                $statusSoal = 'LAYAK';
            }

            // Distractor / Pengecoh Analysis untuk soal PG
            $analisisPengecoh = [];
            if ($soal->tipe === 'PG') {
                foreach ($soal->opsi as $opsiItem) {
                    if (!$opsiItem->is_correct) {
                        $pemilihCount = $jawaban->where('jawaban', $opsiItem->label)->count();
                        $persen = $totalPeserta > 0 ? round(($pemilihCount / $totalPeserta) * 100, 1) : 0;
                        $analisisPengecoh[] = [
                            'label' => $opsiItem->label,
                            'pemilih' => $pemilihCount,
                            'persentase' => $persen,
                            'efektif' => $pemilihCount > 0
                        ];
                    }
                }
            }

            $hasil[] = [
                'soal_id' => $soal->id,
                'nomor' => $soal->urutan ?? 0,
                'konten_soal' => $soal->konten,
                'tipe' => $soal->tipe,
                'topik_materi' => $soal->topik_materi,
                'tingkat_kesukaran' => round($tingkatKesukaran, 2),
                'kategori_kesukaran' => $kategoriKesukaran,
                'daya_pembeda' => round($dayaPembeda, 2),
                'kategori_daya_pembeda' => $kategoriDayaPembeda,
                'status_soal' => $statusSoal,
                'total_peserta' => $totalPeserta,
                'benar_count' => $benarCount,
                'salah_count' => $totalPeserta - $benarCount,
                'analisis_pengecoh' => $analisisPengecoh,
            ];
        }

        return $hasil;
    }

    /**
     * Hitung Daya Pembeda (Discrimination Index)
     * Membandingkan kelompok atas (27%) dengan kelompok bawah (27%)
     */
    private function hitungDayaPembeda(int $sesiId, int $soalId, int $totalPeserta): float
    {
        // Ambil semua peserta ujian beserta score total mereka
        $peserta = UjianPeserta::where('sesi_id', $sesiId)
            ->orderBy('score', 'desc')
            ->get();

        if ($peserta->count() < 6) {
            return 0; // Tidak cukup data untuk analisis
        }

        // Tentukan kelompok atas dan bawah (27% atau minimal 3 orang)
        $jumlahKelompok = max(3, (int)($peserta->count() * 0.27));

        $kelompokAtas = $peserta->take($jumlahKelompok);
        $kelompokBawah = $peserta->reverse()->take($jumlahKelompok);

        // Hitung berapa dari kelompok atas yang menjawab benar
        $benarAtas = JawabanPeserta::whereIn('ujian_peserta_id', $kelompokAtas->pluck('id'))
            ->where('soal_id', $soalId)
            ->where('is_correct', true)
            ->count();

        // Hitung berapa dari kelompok bawah yang menjawab benar
        $benarBawah = JawabanPeserta::whereIn('ujian_peserta_id', $kelompokBawah->pluck('id'))
            ->where('soal_id', $soalId)
            ->where('is_correct', true)
            ->count();

        // Daya Pembeda (D) = (BA - BB) / N
        $dayaPembeda = ($benarAtas - $benarBawah) / $jumlahKelompok;

        return $dayaPembeda;
    }

    /**
     * Deteksi Anomali & Indikasi Kecurangan
     * 
     * @param int $sesiId
     * @return array
     */
    public function deteksiAnomali(int $sesiId): array
    {
        $sesi = SesiUjian::findOrFail($sesiId);
        $pesertaList = UjianPeserta::where('sesi_id', $sesiId)
            ->with(['student.kelas', 'jawaban'])
            ->get();

        $anomali = [];

        foreach ($pesertaList as $peserta) {
            $issues = [];

            // 1. Speed-Run Detection (selesai terlalu cepat dengan nilai tinggi)
            if ($peserta->start_time && $peserta->end_time) {
                $durasi = strtotime($peserta->end_time) - strtotime($peserta->start_time);
                $durasiMenit = $durasi / 60;
                $jumlahSoal = $peserta->jawaban->count();

                // Rata-rata < 30 detik per soal dan nilai > 80
                if ($jumlahSoal > 0 && ($durasiMenit / $jumlahSoal) < 0.5 && $peserta->score > 80) {
                    $issues[] = [
                        'type' => 'speed_run',
                        'severity' => 'high',
                        'message' => sprintf(
                            'Menyelesaikan %d soal dalam %.1f menit (%.0f detik/soal) dengan nilai %.0f',
                            $jumlahSoal,
                            $durasiMenit,
                            ($durasiMenit * 60) / $jumlahSoal,
                            $peserta->score
                        )
                    ];
                }
            }

            // 2. Pola Jawaban Identik (dibandingkan dengan peserta lain)
            $polaIdentik = $this->cekPolaJawabanIdentik($peserta, $pesertaList);
            if ($polaIdentik) {
                $issues[] = [
                    'type' => 'identical_pattern',
                    'severity' => 'medium',
                    'message' => sprintf(
                        'Pola jawaban %.0f%% identik dengan %s',
                        $polaIdentik['similarity'],
                        $polaIdentik['with_student']
                    )
                ];
            }

            // 3. Nilai Terlalu Sempurna pada soal sukar
            $nilaiSempurna = $this->cekNilaiSempurnaSoalSukar($peserta);
            if ($nilaiSempurna) {
                $issues[] = [
                    'type' => 'perfect_on_hard',
                    'severity' => 'low',
                    'message' => $nilaiSempurna
                ];
            }

            if (!empty($issues)) {
                // Jenis anomali yang sudah ditandai WAJAR oleh pengawas (dismissed)
                $dismissed = $peserta->anomali_dismissed ?? [];

                foreach ($issues as $issue) {
                    // Lewati anomali yang sudah di-dismiss agar tidak muncul lagi
                    if (in_array($issue['type'], $dismissed, true)) {
                        continue;
                    }

                    $anomali[] = [
                        'peserta_id' => $peserta->id,
                        'peserta_nama' => $peserta->student->nama ?? 'Unknown',
                        'peserta_kelas' => $peserta->student->kelas->nama_kelas ?? '-',
                        'peserta_nisn' => $peserta->student->nisn ?? '-',
                        'score' => $peserta->score,
                        'jenis_anomali' => $this->labelJenisAnomali($issue['type']),
                        'tipe' => $issue['type'],
                        'severity' => $issue['severity'],
                        'detail' => $issue['message'],
                    ];
                }
            }
        }

        return $anomali;
    }

    /**
     * Cek pola jawaban identik antara 2 peserta
     */
    private function cekPolaJawabanIdentik(UjianPeserta $peserta, Collection $pesertaList): ?array
    {
        $jawabanPeserta = $peserta->jawaban->pluck('jawaban', 'soal_id')->toArray();

        foreach ($pesertaList as $other) {
            if ($other->id === $peserta->id) continue;

            $jawabanOther = $other->jawaban->pluck('jawaban', 'soal_id')->toArray();

            // Cari soal yang sama
            $commonSoal = array_intersect_key($jawabanPeserta, $jawabanOther);

            if (count($commonSoal) < 5) continue; // Minimal 5 soal untuk perbandingan

            // Hitung similarity
            $identik = 0;
            foreach ($commonSoal as $soalId => $jawaban) {
                if ($jawabanPeserta[$soalId] === $jawabanOther[$soalId]) {
                    $identik++;
                }
            }

            $similarity = ($identik / count($commonSoal)) * 100;

            // Jika > 90% identik, return
            if ($similarity > 90) {
                return [
                    'similarity' => $similarity,
                    'with_student' => $other->student->nama ?? 'Unknown'
                ];
            }
        }

        return null;
    }

    /**
     * Cek apakah peserta menjawab sempurna pada soal sukar
     */
    private function cekNilaiSempurnaSoalSukar(UjianPeserta $peserta): ?string
    {
        // Ambil soal-soal sukar dari sesi ini
        $sesi = $peserta->sesi;
        $analisis = $this->analisisSoal($sesi->id);
        
        $soalSukar = collect($analisis)
            ->where('kategori_kesukaran', 'Sukar')
            ->pluck('soal_id')
            ->toArray();

        if (empty($soalSukar)) return null;

        // Cek berapa soal sukar yang dijawab benar
        $benarSukar = $peserta->jawaban()
            ->whereIn('soal_id', $soalSukar)
            ->where('is_correct', true)
            ->count();

        // Jika menjawab benar semua soal sukar
        if ($benarSukar === count($soalSukar) && $benarSukar >= 3) {
            return sprintf(
                'Menjawab benar %d/%d soal kategori SUKAR',
                $benarSukar,
                count($soalSukar)
            );
        }

        return null;
    }

    /**
     * Label Indonesia untuk jenis anomali
     */
    private function labelJenisAnomali(string $type): string
    {
        $labels = [
            'speed_run' => 'Speed-Run (Selesai Terlalu Cepat)',
            'identical_pattern' => 'Pola Jawaban Identik',
            'perfect_on_hard' => 'Nilai Sempurna pada Soal Sukar',
        ];

        return $labels[$type] ?? ucwords(str_replace('_', ' ', $type));
    }

    /**
     * Pemetaan Remedial (Skill Matrix)
     * Mengelompokkan siswa berdasarkan topik yang lemah
     * 
     * @param int $sesiId
     * @return array
     */
    public function petaRemedial(int $sesiId): array
    {
        $sesi = SesiUjian::with(['mapel'])->findOrFail($sesiId);
        
        // Ambil semua soal; soal yang tidak memiliki topik_materi dikelompokkan
        // sebagai "Umum / Belum Dikategorikan" agar Peta Remedial tidak pernah
        // kosong dan guru langsung sadar ada soal yang belum diberi topik.
        $soalList = Soal::where('mapel_id', $sesi->mapel_id)
            ->get();

        $topikMap = [];

        foreach ($soalList as $soal) {
            $topik = trim((string) $soal->topik_materi) !== ''
                ? $soal->topik_materi
                : 'Umum / Belum Dikategorikan';
            
            if (!isset($topikMap[$topik])) {
                $topikMap[$topik] = [
                    'topik' => $topik,
                    'total_soal' => 0,
                    'total_salah' => 0,
                    'siswa_lemah' => [],
                ];
            }

            $topikMap[$topik]['total_soal']++;

            // Ambil jawaban salah untuk soal ini
            $jawabanSalah = JawabanPeserta::whereHas('ujian', function($q) use ($sesiId) {
                $q->where('sesi_id', $sesiId);
            })
            ->where('soal_id', $soal->id)
            ->where('is_correct', false)
            ->with(['ujian.student'])
            ->get();

            $topikMap[$topik]['total_salah'] += $jawabanSalah->count();

            // Track siswa yang salah di topik ini
            foreach ($jawabanSalah as $jawaban) {
                $studentId = $jawaban->ujian->student_id;
                $studentName = $jawaban->ujian->student->nama ?? 'Unknown';

                if (!isset($topikMap[$topik]['siswa_lemah'][$studentId])) {
                    $topikMap[$topik]['siswa_lemah'][$studentId] = [
                        'student_id' => $studentId,
                        'student_name' => $studentName,
                        'salah_count' => 0,
                    ];
                }

                $topikMap[$topik]['siswa_lemah'][$studentId]['salah_count']++;
            }
        }

        // Transform hasil
        $hasil = [];
        foreach ($topikMap as $topik => $data) {
            $totalPeserta = UjianPeserta::where('sesi_id', $sesiId)->count();
            $persentaseSalah = $totalPeserta > 0 
                ? ($data['total_salah'] / ($data['total_soal'] * $totalPeserta)) * 100 
                : 0;

            // Filter siswa yang butuh remedial (salah >= 50% dari soal topik ini)
            $siswaRemedial = collect($data['siswa_lemah'])
                ->filter(function($siswa) use ($data) {
                    return ($siswa['salah_count'] / $data['total_soal']) >= 0.5;
                })
                ->values()
                ->toArray();

            $hasil[] = [
                'topik' => $topik,
                'total_soal' => $data['total_soal'],
                'persentase_salah' => round($persentaseSalah, 2),
                'tingkat_kesulitan' => $this->kategoriTingkatKesulitan($persentaseSalah),
                'jumlah_siswa_remedial' => count($siswaRemedial),
                'siswa_remedial' => $siswaRemedial,
                'prioritas' => $persentaseSalah >= 70 ? 'Tinggi' : ($persentaseSalah >= 50 ? 'Sedang' : 'Rendah'),
                'rekomendasi' => sprintf(
                    'Fokus remedial pada topik %s untuk %d siswa; lakukan pembelajaran ulang, pembahasan soal, dan latihan tambahan.',
                    $topik,
                    count($siswaRemedial)
                ),
            ];
        }

        // Urutkan berdasarkan persentase salah (tertinggi dulu)
        usort($hasil, function($a, $b) {
            return $b['persentase_salah'] <=> $a['persentase_salah'];
        });

        return $hasil;
    }

    /**
     * Kategori tingkat kesulitan berdasarkan persentase salah
     */
    private function kategoriTingkatKesulitan(float $persentaseSalah): string
    {
        if ($persentaseSalah >= 70) {
            return 'Sangat Sulit';
        } elseif ($persentaseSalah >= 50) {
            return 'Sulit';
        } elseif ($persentaseSalah >= 30) {
            return 'Sedang';
        } else {
            return 'Mudah';
        }
    }




    /**
     * Generate Narasi Otomatis (Dynamic Insights)
     * Membuat paragraf ringkasan hasil ujian
     * 
     * @param int $sesiId
     * @return string
     */
    public function generateNarasiOtomatis(int $sesiId): string
    {
        $sesi = SesiUjian::with(['mapel', 'kelas'])->findOrFail($sesiId);
        $peserta = UjianPeserta::where('sesi_id', $sesiId)->get();

        if ($peserta->isEmpty()) {
            return "Tidak ada data peserta untuk sesi ini.";
        }

        $totalPeserta = $peserta->count();
        $rataRata = round($peserta->avg('score'), 2);
        $tertinggi = $peserta->max('score');
        $terendah = $peserta->min('score');

        // Hitung kelulusan (asumsi KKM 75)
        $kkm = 75;
        $lulus = $peserta->where('score', '>=', $kkm)->count();
        $tidakLulus = $totalPeserta - $lulus;
        $persentaseLulus = round(($lulus / $totalPeserta) * 100, 2);

        // Analisis butir soal
        $analisisSoal = $this->analisisSoal($sesiId);
        $soalBermasalah = collect($analisisSoal)
            ->where('kategori_daya_pembeda', 'Sangat Jelek (Ambigu)')
            ->count();

        // Pemetaan remedial
        $remedial = $this->petaRemedial($sesiId);
        $topikTersulit = $remedial[0]['topik'] ?? '-';

        // Deteksi anomali
        $anomali = $this->deteksiAnomali($sesiId);
        $jumlahAnomali = count($anomali);

        // Buat narasi
        $narasi = sprintf(
            "Pada sesi ujian %s untuk mata pelajaran %s kelas %s, terdapat %d peserta yang mengikuti ujian. " .
            "Nilai rata-rata kelas adalah %.2f dengan nilai tertinggi %.2f dan terendah %.2f. " .
            "Sebanyak %d siswa (%s%%) dinyatakan lulus dengan nilai di atas KKM %d, sedangkan %d siswa memerlukan remedial. ",
            $sesi->nama_sesi,
            $sesi->mapel->nama_mapel ?? '-',
            $sesi->kelas->nama_kelas ?? '-',
            $totalPeserta,
            $rataRata,
            $tertinggi,
            $terendah,
            $lulus,
            $persentaseLulus,
            $kkm,
            $tidakLulus
        );

        if ($soalBermasalah > 0) {
            $narasi .= sprintf(
                "Dari analisis butir soal, ditemukan %d soal dengan kategori daya pembeda sangat jelek (ambigu) yang perlu direview. ",
                $soalBermasalah
            );
        }

        if (!empty($remedial)) {
            $narasi .= sprintf(
                "Topik materi yang paling banyak mengalami kesalahan adalah '%s' dengan tingkat kesulitan %s. ",
                $topikTersulit,
                $remedial[0]['tingkat_kesulitan'] ?? 'Sedang'
            );
        }

        if ($jumlahAnomali > 0) {
            $narasi .= sprintf(
                "Sistem mendeteksi %d indikasi anomali yang memerlukan verifikasi pengawas. ",
                $jumlahAnomali
            );
        }

        $narasi .= "Rekomendasi: " . $this->generateRekomendasi($rataRata, $persentaseLulus, $soalBermasalah);

        return $narasi;
    }

    /**
     * Generate rekomendasi berdasarkan hasil analisis
     */
    private function generateRekomendasi(float $rataRata, float $persentaseLulus, int $soalBermasalah): string
    {
        $rekomendasi = [];

        if ($rataRata < 60) {
            $rekomendasi[] = "Nilai rata-rata kelas masih rendah, disarankan untuk melakukan review menyeluruh materi pembelajaran";
        }

        if ($persentaseLulus < 50) {
            $rekomendasi[] = "Tingkat kelulusan rendah, pertimbangkan untuk mengadakan program remedial intensif";
        }

        if ($soalBermasalah > 0) {
            $rekomendasi[] = "Lakukan review dan perbaikan pada soal-soal yang memiliki daya pembeda negatif";
        }

        if (empty($rekomendasi)) {
            return "Hasil ujian secara keseluruhan cukup baik, pertahankan kualitas pembelajaran.";
        }

        return implode('; ', $rekomendasi) . '.';
    }
}

