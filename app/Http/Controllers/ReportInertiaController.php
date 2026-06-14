<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\UjianPeserta;
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
    public function analitik($id)
    {
        $sesi = SesiUjian::with('mapel')->findOrFail($id);
        
        $peserta = UjianPeserta::with(['student', 'jawaban.soal'])
            ->where('sesi_id', $id)
            ->get();
        
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

        return Inertia::render('AnalitikPage', [
            'sesi' => $sesi,
            'stats' => $stats,
            'peserta' => $peserta
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
     */
    public function exportPdfJawaban(UjianPeserta $peserta)
    {
        $peserta->load(['student', 'sesi.mapel', 'jawaban.soal']);
        $pdf = Pdf::loadView('pdf.hasil_ujian', compact('peserta'));
        $filename = "hasil_ujian_" . strtolower(str_replace(' ', '_', $peserta->student->nama)) . ".pdf";
        return $pdf->stream($filename);
    }
}
