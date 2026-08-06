<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\MapelController;
use App\Http\Controllers\Api\SoalController;
use App\Http\Controllers\Api\SesiUjianController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SystemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Z-Exam API Routes
|--------------------------------------------------------------------------
*/

// ── Public routes ──────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// Template download (Public biar gampang diakses window.open)
Route::get('siswa/template', [StudentController::class, 'downloadTemplate']);
Route::get('soal/template', [SoalController::class, 'downloadTemplate']);
Route::get('siswa/export-kartu', [StudentController::class, 'exportKartu']);

// ── Protected routes (Sanctum) ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ─ Fase 2: Siswa & Kelas ─
    Route::apiResource('kelas', KelasController::class);
    Route::apiResource('siswa', StudentController::class);
    Route::post('siswa/{student}/reset-password', [StudentController::class, 'resetPassword']);
    Route::post('siswa/import', [StudentController::class, 'import']);

    // ─ Fase 3: Bank Soal ─
    Route::apiResource('mapel', MapelController::class);
    Route::apiResource('soal', SoalController::class);
    Route::post('soal/import', [SoalController::class, 'importExcel']);
    Route::post('soal/upload-image', [SoalController::class, 'uploadImage']);

    // ─ Fase 4: Sesi Ujian ─
    Route::apiResource('sesi', SesiUjianController::class);
    Route::post('sesi/{sesi}/refresh-token', [SesiUjianController::class, 'refreshToken']);
    Route::get('sesi/{sesi}/monitoring', [SesiUjianController::class, 'monitoring']);
    Route::post('peserta/{peserta}/force-finish', [SesiUjianController::class, 'forceFinish']);
    Route::post('peserta/{peserta}/reset', [SesiUjianController::class, 'resetPeserta']);

    // ─ Fase 7: Laporan & Analitik ─
    Route::get('laporan/sesi/{sesi}/excel', [ReportController::class, 'exportExcel']);
    Route::get('laporan/sesi/{sesi}/stats', [ReportController::class, 'getStats']);
    Route::get('laporan/peserta/{peserta}/pdf', [ReportController::class, 'exportPdfJawaban']);
    
    // ─ Analitik Cerdas ─
    Route::get('laporan/sesi/{sesi}/analisis-soal', [ReportController::class, 'getAnalisisSoal']);
    Route::get('laporan/sesi/{sesi}/deteksi-anomali', [ReportController::class, 'getDeteksiAnomali']);
    Route::get('laporan/sesi/{sesi}/peta-remedial', [ReportController::class, 'getPetaRemedial']);
    Route::get('laporan/sesi/{sesi}/narasi', [ReportController::class, 'getNarasiOtomatis']);
    Route::post('laporan/anomali/{peserta}/dismiss', [ReportController::class, 'dismissAnomali']);

    // ─ Fase 8: Sistem & Backup ─
    Route::get('settings', [SystemController::class, 'getSettings']);
    Route::post('settings', [SystemController::class, 'updateSettings']);
    Route::get('backups', [SystemController::class, 'getBackups']);
    Route::post('backups', [SystemController::class, 'createBackup']);
    Route::post('backups/restore', [SystemController::class, 'restoreBackup']);
    Route::delete('backups/{filename}', [SystemController::class, 'deleteBackup']);
    Route::get('backups/{filename}/download', [SystemController::class, 'downloadBackup']);
});

// ── Exam Client (Siswa) - Public karena menggunakan auth kustom ──────────────
Route::post('exam/login', [ExamController::class, 'login']);
Route::post('exam/start', [ExamController::class, 'start']);
Route::post('exam/save', [ExamController::class, 'save']);
Route::post('exam/finish', [ExamController::class, 'finish']);
