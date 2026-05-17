<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class SystemController extends Controller
{
    public function getSettings()
    {
        $settings = DB::table('settings')->get()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->all();
        foreach ($data as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }
        return response()->json(['message' => 'Pengaturan berhasil diperbarui.']);
    }

    public function getBackups()
    {
        $path = storage_path('app/backups');
        if (!File::exists($path)) File::makeDirectory($path, 0755, true);

        $files = File::files($path);
        $backups = collect($files)->map(function ($file) {
            return [
                'name' => $file->getFilename(),
                'size' => round($file->getSize() / 1024, 2) . ' KB',
                'date' => date('Y-m-d H:i:s', $file->getMTime()),
            ];
        })->sortByDesc('date')->values();

        return response()->json($backups);
    }

    public function createBackup()
    {
        $dbPath = database_path('database.sqlite');
        if (!File::exists($dbPath)) {
            return response()->json(['message' => 'Database tidak ditemukan.'], 404);
        }

        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) File::makeDirectory($backupDir, 0755, true);

        $filename = 'backup_' . date('Ymd_His') . '.sqlite';
        File::copy($dbPath, $backupDir . '/' . $filename);

        return response()->json(['message' => 'Backup berhasil dibuat.']);
    }

    public function restoreBackup(Request $request)
    {
        $filename = $request->filename;
        $backupPath = storage_path('app/backups/' . $filename);

        if (!File::exists($backupPath)) {
            return response()->json(['message' => 'File backup tidak ditemukan.'], 404);
        }

        $dbPath = database_path('database.sqlite');
        File::copy($backupPath, $dbPath);

        return response()->json(['message' => 'Sistem berhasil direstore. Silakan refresh halaman.']);
    }

    public function deleteBackup($filename)
    {
        $backupPath = storage_path('app/backups/' . $filename);
        if (File::exists($backupPath)) {
            File::delete($backupPath);
        }
        return response()->json(['message' => 'Backup dihapus.']);
    }

    public function downloadBackup($filename)
    {
        $backupPath = storage_path('app/backups/' . $filename);
        if (File::exists($backupPath)) {
            return response()->download($backupPath);
        }
        return response()->json(['message' => 'File tidak ditemukan.'], 404);
    }
}
