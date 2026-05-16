<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Z-Exam API Routes
|--------------------------------------------------------------------------
*/

// ── Public routes ──────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Protected routes (Sanctum) ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ─ Fase 2: Siswa & Kelas ─
    Route::apiResource('kelas', \App\Http\Controllers\Api\KelasController::class);
    Route::apiResource('siswa', \App\Http\Controllers\Api\StudentController::class);
    Route::post('siswa/{student}/reset-password', [\App\Http\Controllers\Api\StudentController::class, 'resetPassword']);
    Route::post('siswa-import', [\App\Http\Controllers\Api\StudentController::class, 'import']);
    Route::get('siswa-export-kartu', [\App\Http\Controllers\Api\StudentController::class, 'exportKartu']);

    // ─ Fase 3: Bank Soal ─
    Route::apiResource('mapel', \App\Http\Controllers\Api\MapelController::class);
    Route::apiResource('soal', \App\Http\Controllers\Api\SoalController::class);
    Route::post('soal/import-excel', [\App\Http\Controllers\Api\SoalController::class, 'importExcel']);
    Route::post('soal/upload-image', [\App\Http\Controllers\Api\SoalController::class, 'uploadImage']);

    // ─ Fase 4: Sesi Ujian (akan ditambah) ─
    // Route::apiResource('sesi', SesiUjianController::class);

    // ─ Fase 7: Laporan (akan ditambah) ─
    // Route::get('laporan/{sesi}', [LaporanController::class, 'show']);
});
