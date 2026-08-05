<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\UjianPeserta;
use App\Models\Kelas;
use App\Models\Student;
use App\Exports\RekapNilaiExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportInertiaController extends Controller
{
    /**
     * Tampilkan Halaman Rekap Laporan
     */
    public function index()
    {
        $sesi = SesiUjian::with('mapel')
            ->withCount('pesertaUjian')
            ->latest()
            ->get();

        return Inertia::render('LaporanPage', [
            'sesi' => $sesi
        ]);
    }

    /**
     * Tampilkan Analitik Hasil Ujian Sesi
     */
    public function analitik(Request $request, $id)
    {
        $sesi = SesiUjian::with('mapel')->findOrFail($id);
        
        // Get filter parameters
        $kelasId = $request->query('kelas_id');
        $generasi = $request->query('generasi'); // tingkat
        $showAll = $request->query('semua', false);
        
        // Build base query for peserta - only load student and kelas for analytics
        // jawaban.soal is loaded separately when needed (e.g., essay correction modal)
        $pesertaQuery = UjianPeserta::with(['student.kelas'])
            ->where('sesi_id', $id);
        
        // Apply filters
        if ($kelasId && !$showAll) {
            $pesertaQuery->whereHas('student', function ($q) use ($kelasId) {
                $q->where('kelas_id', $kelasId);
            });
        } elseif ($generasi && !$showAll) {
            $pesertaQuery->whereHas('student.kelas', function ($q) use ($generasi) {
                $q->where('tingkat', $generasi);
            });
        }
        
        $peserta = $pesertaQuery->get();
        
        // Calculate stats
        $stats = [
            'total_peserta' => $peserta->count(),
            'rata_rata'     => round($peserta->avg('score') ?? 0, 2),
            'tertinggi'      => $peserta->max('score') ?? 0,
            'terendah'       => $peserta->min('score') ?? 0,
            'distribusi'    => [
                '0-20'  => $peserta->whereBetween('score', [0, 20])->count(),
                '21-40' => $peserta->whereBetween('score', [21, 40])->count(),
                '41-60' => $peserta->whereBetween('score', [41, 60])->count(),
                '61-80' => $peserta->whereBetween('score', [61, 80])->count(),
                '81-100'=> $peserta->whereBetween('score', [81, 100])->count(),
            ]
        ];
        
        // Get top 3 highest scores
        $top3Tertinggi = $peserta
            ->sortByDesc('score')
            ->take(3)
            ->map(function ($p) {
                return [
                    'nama' => $p->student->nama ?? '-',
                    'kelas' => $p->student->kelas->nama_kelas ?? '-',
                    'score' => $p->score ?? 0,
                    'nisn' => $p->student->nisn ?? '-',
                ];
            })
            ->values()
            ->toArray();
        
        // Get top 3 lowest scores (only those who have scores > 0 or have attempted)
        $top3Terendah = $peserta
            ->where('score', '>', 0) // Only count those who have attempted
            ->sortBy('score')
            ->take(3)
            ->map(function ($p) {
                return [
                    'nama' => $p->student->nama ?? '-',
                    'kelas' => $p->student->kelas->nama_kelas ?? '-',
                    'score' => $p->score ?? 0,
                    'nisn' => $p->student->nisn ?? '-',
                ];
            })
            ->values()
            ->toArray();
        
        // Get filter options - classes that have participants in this session
        $kelasOptions = Kelas::whereHas('students.ujianPeserta', function ($q) use ($id) {
                $q->where('sesi_id', $id);
            })
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'tingkat'])
            ->map(function ($k) {
                return [
                    'id' => $k->id,
                    'nama_kelas' => $k->nama_kelas,
                    'tingkat' => $k->tingkat,
                    'label' => "{$k->nama_kelas} (Kelas {$k->tingkat})"
                ];
            })
            ->toArray();
        
        // Get unique generasi/tingkat
        $generasiOptions = Kelas::whereHas('students.ujianPeserta', function ($q) use ($id) {
                $q->where('sesi_id', $id);
            })
            ->distinct('tingkat')
            ->orderBy('tingkat')
            ->pluck('tingkat')
            ->map(function ($t) {
                return [
                    'value' => $t,
                    'label' => "Kelas {$t} (Semua Paralel)"
                ];
            })
            ->toArray();

        return Inertia::render('AnalitikPage', [
            'sesi' => $sesi,
            'stats' => $stats,
            'peserta' => $peserta,
            'top_3_tertinggi' => $top3Tertinggi,
            'top_3_terendah' => $top3Terendah,
            'filter_options' => [
                'kelas' => $kelasOptions,
                'generasi' => $generasiOptions,
            ],
            'current_filter' => [
                'kelas_id' => $kelasId,
                'generasi' => $generasi,
                'semua' => $showAll,
            ],
        ]);
    }

    /**
     * Koreksi Jawaban Essay Peserta Ujian Secara Manual
     */
    public function koreksiEssay(Request $request, UjianPeserta $peserta)
    {
        $request->validate([
            'nilai' => 'required|array',
            'nilai.*' => 'required|numeric|min:0'
        ]);

        foreach ($request->nilai as $soalId => $score) {
            $soal = \App\Models\Soal::findOrFail($soalId);
            
            // Batasi nilai agar tidak melebihi bobot maksimal soal
            $finalScore = min($score, $soal->bobot);

            \App\Models\JawabanPeserta::updateOrCreate(
                ['ujian_peserta_id' => $peserta->id, 'soal_id' => $soalId],
                [
                    'score' => $finalScore,
                    'is_correct' => $finalScore > 0 ? true : false
                ]
            );
        }

        // Hitung ulang total skor ujian peserta (PG, Matching, dan Essay yang sudah bernilai)
        $totalScore = \App\Models\JawabanPeserta::where('ujian_peserta_id', $peserta->id)
            ->where('is_correct', true)
            ->sum('score');

        $peserta->update([
            'score' => $totalScore
        ]);

        return back()->with('success', 'Koreksi essay berhasil disimpan dan skor total diperbarui.');
    }

    /**
     * Export Rekap Nilai ke Excel
     */
    public function exportExcel($id)
    {
        $sesi = SesiUjian::findOrFail($id);
        
        return Excel::download(
            new RekapNilaiExport($sesi->id), 
            "Rekap_Nilai_{$sesi->nama_sesi}.xlsx"
        );
    }

    /**
     * Export Detail Jawaban Siswa (PDF)
     * Menampilkan SEMUA soal sesuai soal_order — termasuk yang tidak dijawab.
     */
    public function exportPdfJawaban(UjianPeserta $peserta)
    {
        $peserta->load(['student', 'sesi.mapel', 'jawaban']);

        // Ambil semua soal sesuai urutan yang dipersist di soal_order
        $soalOrder = $peserta->soal_order ?? [];
        if (empty($soalOrder)) {
            // Fallback: ambil semua soal mapel terurut
            $soalOrder = \App\Models\Soal::where('mapel_id', $peserta->sesi->mapel_id)
                ->orderBy('urutan')->pluck('id')->toArray();
        }

        $soalMap = \App\Models\Soal::with('opsi')
            ->whereIn('id', $soalOrder)
            ->get()
            ->keyBy('id');

        // Index jawaban by soal_id
        $jawabanMap = $peserta->jawaban->keyBy('soal_id');

        // Susun list soal+jawaban sesuai urutan
        $soalList = collect($soalOrder)->map(function ($soalId, $idx) use ($soalMap, $jawabanMap) {
            $soal   = $soalMap->get($soalId);
            $jawaban = $jawabanMap->get($soalId);
            return [
                'nomor'      => $idx + 1,
                'konten'     => $soal ? html_entity_decode($soal->konten, ENT_QUOTES | ENT_HTML5, 'UTF-8') : '[Soal tidak ditemukan]',
                'tipe'       => $soal?->tipe ?? 'PG',
                'jawaban'    => $jawaban?->jawaban ?? null,
                'is_correct' => $jawaban?->is_correct,
                'score'      => $jawaban?->score ?? 0,
                'dijawab'    => $jawaban !== null,
            ];
        })->values();

        // Hitung skor maksimal (jumlah bobot semua soal)
        $skorMaksimal = $soalMap->sum('bobot');

        $pdf = Pdf::loadView('pdf.hasil_ujian', [
            'peserta'      => $peserta,
            'soalList'     => $soalList,
            'totalSoal'    => count($soalOrder),
            'skorMaksimal' => $skorMaksimal,
        ]);

        $filename = "hasil_ujian_" . strtolower(str_replace(' ', '_', $peserta->student->nama)) . ".pdf";
        return $pdf->stream($filename);
    }
}