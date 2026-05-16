<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SesiUjian;
use App\Models\UjianPeserta;
use App\Exports\RekapNilaiExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Rekap Nilai per Sesi (Excel)
     */
    public function exportExcel(SesiUjian $sesi)
    {
        return Excel::download(
            new RekapNilaiExport($sesi->id), 
            "Rekap_Nilai_{$sesi->nama_sesi}.xlsx"
        );
    }

    /**
     * Statistik Sesi Ujian (untuk Chart)
     */
    public function getStats(SesiUjian $sesi)
    {
        $peserta = UjianPeserta::where('sesi_id', $sesi->id)->get();
        
        $stats = [
            'total_peserta' => $peserta->count(),
            'rata_rata'     => round($peserta->avg('score'), 2),
            'tertinggi'      => $peserta->max('score'),
            'terendah'       => $peserta->min('score'),
            'distribusi'    => [
                '0-20'  => $peserta->whereBetween('score', [0, 20])->count(),
                '21-40' => $peserta->whereBetween('score', [21, 40])->count(),
                '41-60' => $peserta->whereBetween('score', [41, 60])->count(),
                '61-80' => $peserta->whereBetween('score', [61, 80])->count(),
                '81-100'=> $peserta->whereBetween('score', [81, 100])->count(),
            ]
        ];

        return response()->json($stats);
    }

    /**
     * Export Detail Jawaban Siswa (PDF)
     */
    public function exportPdfJawaban(UjianPeserta $peserta)
    {
        $peserta->load(['student', 'sesi.mapel', 'jawaban.soal']);
        
        $pdf = Pdf::loadView('pdf.hasil_ujian', compact('peserta'));
        return $pdf->download("Hasil_Ujian_{$peserta->student->nama}.pdf");
    }
}
