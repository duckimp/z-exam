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
     * Get Analisis Butir Soal untuk Sesi tertentu
     */
    public function getAnalisisSoal($sesiId)
    {
        $analitikService = new \App\Services\AnalitikService();
        $hasil = $analitikService->analisisSoal($sesiId);
        
        return response()->json($hasil);
    }

    /**
     * Get Deteksi Anomali
     */
    public function getDeteksiAnomali($sesiId)
    {
        $analitikService = new \App\Services\AnalitikService();
        $hasil = $analitikService->deteksiAnomali($sesiId);
        
        return response()->json($hasil);
    }

    /**
     * Get Peta Remedial
     */
    public function getPetaRemedial($sesiId)
    {
        $analitikService = new \App\Services\AnalitikService();
        $hasil = $analitikService->petaRemedial($sesiId);
        
        return response()->json($hasil);
    }

    /**
     * Get Narasi Otomatis
     */
    public function getNarasiOtomatis($sesiId)
    {
        $analitikService = new \App\Services\AnalitikService();
        $narasi = $analitikService->generateNarasiOtomatis($sesiId);
        
        return response()->json(['narasi' => $narasi]);
    }

    /**
     * Tandai anomali tertentu sebagai WAJAR (dismiss) untuk peserta tertentu.
     * Anomali yang di-dismiss tidak akan muncul lagi di dashboard pengawas.
     */
    public function dismissAnomali(Request $request, $pesertaId)
    {
        $request->validate([
            'tipe' => 'required|string|in:speed_run,identical_pattern,perfect_on_hard',
        ]);

        $peserta = UjianPeserta::findOrFail($pesertaId);
        $dismissed = $peserta->anomali_dismissed ?? [];

        if (!in_array($request->tipe, $dismissed, true)) {
            $dismissed[] = $request->tipe;
            $peserta->update(['anomali_dismissed' => $dismissed]);
        }

        return response()->json([
            'message' => 'Anomali ditandai wajar dan disembunyikan dari dashboard.',
            'dismissed' => $dismissed,
        ]);
    }
}

