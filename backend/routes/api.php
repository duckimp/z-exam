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

    // ─ Fase 2: Siswa & Kelas (akan ditambah) ─
    // Route::apiResource('siswa', SiswaController::class);
    // Route::apiResource('kelas', KelasController::class);

    // ─ Fase 3: Bank Soal (akan ditambah) ─
    // Route::apiResource('mapel', MapelController::class);
    // Route::apiResource('soal', SoalController::class);

    // ─ Fase 4: Sesi Ujian (akan ditambah) ─
    // Route::apiResource('sesi', SesiUjianController::class);

    // ─ Fase 7: Laporan (akan ditambah) ─
    // Route::get('laporan/{sesi}', [LaporanController::class, 'show']);
});
