<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\StudentExamController;

Route::get('/', [StudentExamController::class, 'showLogin'])->name('student.login');
Route::post('/student/login', [StudentExamController::class, 'login'])->middleware('throttle:10,1');
Route::get('/student/auto-login', [StudentExamController::class, 'autoLogin'])->name('student.auto-login');

// Fix #5 & #14 — student routes digroup, auth dicek di middleware bukan di tiap controller
Route::middleware('student.auth')->group(function () {
    Route::get('/student/dashboard', [StudentExamController::class, 'dashboard'])->name('student.dashboard');
    Route::post('/student/exam/start', [StudentExamController::class, 'startExam'])->name('student.exam.start');
    Route::get('/exam', [StudentExamController::class, 'examPage'])->name('student.exam');
    Route::post('/student/save', [StudentExamController::class, 'saveAnswer'])->middleware('throttle:60,1');
    Route::post('/student/save-beacon', [StudentExamController::class, 'saveBeacon']);  // beforeunload flush
    Route::post('/student/finish', [StudentExamController::class, 'finishExam']);
    Route::post('/student/exam/leave', [StudentExamController::class, 'leaveExam'])->name('student.exam.leave');
    Route::post('/student/logout', [StudentExamController::class, 'logout'])->name('student.logout');
});

use App\Models\Student;
use App\Models\SesiUjian;
use App\Models\MataPelajaran;

Route::get('/dashboard', function () {
    $stats = cache()->remember('admin_dashboard_stats', 30, function () {
        return [
            'total_peserta' => Student::count(),
            'sesi_aktif'    => SesiUjian::where('is_active', true)->count(),
            'total_mapel'   => MataPelajaran::count(),
            'recent_exams'  => SesiUjian::with(['mapel', 'kelas', 'pengawas'])
                ->latest()
                ->take(5)
                ->get()
        ];
    });

    $activeSessions = SesiUjian::with(['mapel', 'kelas', 'pengawas'])
        ->where('is_active', true)
        ->orderBy('tanggal')
        ->orderBy('jam_mulai')
        ->get();

    return Inertia::render('DashboardPage', [
        'stats' => $stats,
        'activeSessions' => $activeSessions,
    ]);
})->middleware(['auth', 'role:super_admin,guru,pengawas'])->name('dashboard');

use App\Http\Controllers\SiswaInertiaController;

use App\Http\Controllers\BankSoalInertiaController;

use App\Http\Controllers\SesiUjianInertiaController;

use App\Http\Controllers\SystemInertiaController;

use App\Http\Controllers\MonitoringInertiaController;

use App\Http\Controllers\ReportInertiaController;
use App\Http\Controllers\UserInertiaController;

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── KELAS 1: Akses Khusus Super Admin ────────────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        // Manajemen User
        Route::get('/users', [UserInertiaController::class, 'index'])->name('users.index');
        Route::post('/users', [UserInertiaController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserInertiaController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserInertiaController::class, 'destroy'])->name('users.destroy');

        // Siswa & Kelas
        Route::get('/siswa', [SiswaInertiaController::class, 'index'])->name('siswa.index');
        Route::post('/siswa', [SiswaInertiaController::class, 'storeSiswa']);
        Route::put('/siswa/{student}', [SiswaInertiaController::class, 'updateSiswa']);
        Route::delete('/siswa/{student}', [SiswaInertiaController::class, 'destroySiswa']);
        Route::post('/siswa/bulk-delete', [SiswaInertiaController::class, 'bulkDestroySiswa']);
        Route::post('/siswa/{student}/reset-password', [SiswaInertiaController::class, 'resetPassword']);

        Route::post('/kelas', [SiswaInertiaController::class, 'storeKelas']);
        Route::put('/kelas/{kelas}', [SiswaInertiaController::class, 'updateKelas']);
        Route::delete('/kelas/{kelas}', [SiswaInertiaController::class, 'destroyKelas']);
        Route::get('/kelas/template', [SiswaInertiaController::class, 'downloadKelasTemplate']);
        Route::post('/kelas/import', [SiswaInertiaController::class, 'importKelas']);

        Route::get('/siswa/template', [SiswaInertiaController::class, 'downloadStudentTemplate']);
        Route::post('/siswa/import', [SiswaInertiaController::class, 'importStudent']);
        Route::get('/siswa/export-kartu', [SiswaInertiaController::class, 'exportKartu']);

        // Pengaturan & Backup
        Route::get('/pengaturan', [SystemInertiaController::class, 'settings'])->name('settings.index');
        Route::post('/pengaturan', [SystemInertiaController::class, 'updateSettings']);
        Route::get('/backup', [SystemInertiaController::class, 'backups'])->name('backup.index');
        Route::post('/backup', [SystemInertiaController::class, 'createBackup']);
        Route::post('/backup/restore', [SystemInertiaController::class, 'restoreBackup']);
        Route::delete('/backup/{filename}', [SystemInertiaController::class, 'deleteBackup']);
        Route::get('/backup/{filename}/download', [SystemInertiaController::class, 'downloadBackup']);
    });

    // ── KELAS 2: Akses Super Admin & Guru ────────────────────────────────────
    Route::middleware('role:super_admin,guru')->group(function () {
        // Bank Soal
        Route::get('/soal', [BankSoalInertiaController::class, 'index'])->name('soal.index');
        Route::post('/soal/mapel', [BankSoalInertiaController::class, 'storeMapel']);
        Route::put('/soal/mapel/{mapel}', [BankSoalInertiaController::class, 'updateMapel']);
        Route::delete('/soal/mapel/{mapel}', [BankSoalInertiaController::class, 'destroyMapel']);
        Route::delete('/soal/mapel/{mapel}/destroy-all', [BankSoalInertiaController::class, 'destroyAllSoal']);
        Route::post('/soal', [BankSoalInertiaController::class, 'storeSoal']);
        Route::put('/soal/{soal}', [BankSoalInertiaController::class, 'updateSoal']);
        Route::delete('/soal/{soal}', [BankSoalInertiaController::class, 'destroySoal']);
        Route::get('/soal/template', [BankSoalInertiaController::class, 'downloadTemplate']);
        Route::post('/soal/import', [BankSoalInertiaController::class, 'importSoal']);
        Route::post('/soal/import/preview', [BankSoalInertiaController::class, 'previewImport']);
        Route::post('/soal/import/confirm', [BankSoalInertiaController::class, 'confirmImport']);
        Route::post('/soal/bulk-weight', [BankSoalInertiaController::class, 'bulkWeight']);

        // Laporan & Analitik
        Route::get('/laporan', [ReportInertiaController::class, 'index'])->name('laporan.index');
        Route::get('/laporan/analitik/{id}', [ReportInertiaController::class, 'analitik'])->name('laporan.analitik');
        Route::get('/laporan/sesi/{id}/excel', [ReportInertiaController::class, 'exportExcel'])->name('laporan.excel');
        Route::post('/laporan/peserta/{peserta}/koreksi', [ReportInertiaController::class, 'koreksiEssay']);
        Route::get('/laporan/peserta/{peserta}/pdf', [ReportInertiaController::class, 'exportPdfJawaban'])->name('laporan.pdf');
    });

    // ── KELAS 3: Akses Super Admin & Pengawas ────────────────────────────────
    Route::middleware('role:super_admin,pengawas')->group(function () {
        // Sesi Ujian
        Route::get('/ujian/sesi', [SesiUjianInertiaController::class, 'index'])->name('sesi.index');
        Route::post('/ujian/sesi', [SesiUjianInertiaController::class, 'store']);
        Route::put('/ujian/sesi/{sesi}', [SesiUjianInertiaController::class, 'update']);
        Route::delete('/ujian/sesi/{sesi}', [SesiUjianInertiaController::class, 'destroy']);
        Route::post('/ujian/sesi/{sesi}/refresh-token', [SesiUjianInertiaController::class, 'refreshToken']);
        Route::post('/ujian/sesi/{sesi}/claim', [SesiUjianInertiaController::class, 'claimSesi'])->name('sesi.claim');
        Route::post('/ujian/sesi/{sesi}/release', [SesiUjianInertiaController::class, 'releaseSesi'])->name('sesi.release');

        // Monitoring
        Route::get('/monitoring/{id}', [MonitoringInertiaController::class, 'index'])->name('monitoring.index');
        Route::post('/monitoring/peserta/{peserta}/force-finish', [MonitoringInertiaController::class, 'forceFinish']);
        Route::post('/monitoring/peserta/{peserta}/reset', [MonitoringInertiaController::class, 'resetPeserta']);
        Route::post('/monitoring/peserta/{peserta}/unlock', [MonitoringInertiaController::class, 'unlockPeserta']);
    });
});

require __DIR__.'/auth.php';
