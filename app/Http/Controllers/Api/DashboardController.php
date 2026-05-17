<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\SesiUjian;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_peserta' => Student::count(),
            'sesi_aktif'    => SesiUjian::where('is_active', true)->count(),
            'total_mapel'   => MataPelajaran::count(),
            'recent_exams'  => SesiUjian::with('mapel')
                ->latest()
                ->take(5)
                ->get()
        ]);
    }
}
