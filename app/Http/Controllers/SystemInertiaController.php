<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SystemInertiaController extends Controller
{
    /**
     * Tampilkan Halaman Pengaturan Sistem
     */
    public function settings()
    {
        $settings = DB::table('settings')->get()->pluck('value', 'key');
        
        return Inertia::render('SettingsPage', [
            'settings' => $settings
        ]);
    }

    /**
     * Simpan Pengaturan Sistem
     */
    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'app_name'              => 'required|string|max:100',
            'school_name'           => 'required|string|max:100',
            'footer_text'           => 'nullable|string|max:150',
            'theme_color'           => 'nullable|string|max:20',
            'kepala_sekolah_nama'   => 'nullable|string|max:100',
            'kepala_sekolah_nip'    => 'nullable|string|max:30',
            'kartu_tanggal_cetak'   => 'nullable|string|max:50',
            'kepala_sekolah_ttd'    => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        // Handle upload TTD
        if ($request->hasFile('kepala_sekolah_ttd')) {
            // Hapus file lama jika ada
            $oldTtd = DB::table('settings')->where('key', 'kepala_sekolah_ttd')->value('value');
            if ($oldTtd && Storage::disk('public')->exists($oldTtd)) {
                Storage::disk('public')->delete($oldTtd);
            }
            $path = $request->file('kepala_sekolah_ttd')->store('ttd', 'public');
            $data['kepala_sekolah_ttd'] = $path;
        } elseif ($request->input('remove_ttd') == '1') {
            // Hapus TTD
            $oldTtd = DB::table('settings')->where('key', 'kepala_sekolah_ttd')->value('value');
            if ($oldTtd && Storage::disk('public')->exists($oldTtd)) {
                Storage::disk('public')->delete($oldTtd);
            }
            $data['kepala_sekolah_ttd'] = null;
        } else {
            unset($data['kepala_sekolah_ttd']);
        }

        foreach ($data as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
    }

    /**
     * Tampilkan Halaman Backup & Restore
     */
    public function backups()
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
        })->sortByDesc('date')->values()->toArray();

        return Inertia::render('BackupPage', [
            'backups' => $backups
        ]);
    }

    /**
     * Buat Backup Database Baru
     */
    public function createBackup()
    {
        $dbPath = database_path('database.sqlite');
        if (!File::exists($dbPath)) {
            return back()->withErrors(['message' => 'Database SQLite tidak ditemukan.']);
        }

        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) File::makeDirectory($backupDir, 0755, true);

        $filename = 'backup_' . date('Ymd_His') . '.sqlite';
        File::copy($dbPath, $backupDir . '/' . $filename);

        return back()->with('success', 'Backup database berhasil dibuat.');
    }

    /**
     * Restore Database dari File Backup
     */
    public function restoreBackup(Request $request)
    {
        $request->validate([
            'filename' => 'required|string'
        ]);

        $filename = $request->filename;
        $backupPath = storage_path('app/backups/' . $filename);

        if (!File::exists($backupPath)) {
            return back()->withErrors(['message' => 'File backup tidak ditemukan.']);
        }

        $dbPath = database_path('database.sqlite');
        File::copy($backupPath, $dbPath);

        return back()->with('success', 'Sistem berhasil direstore. Halaman akan direfresh otomatis.');
    }

    /**
     * Hapus File Backup
     */
    public function deleteBackup($filename)
    {
        $backupPath = storage_path('app/backups/' . $filename);
        if (File::exists($backupPath)) {
            File::delete($backupPath);
        }
        return back()->with('success', 'File backup berhasil dihapus.');
    }

    /**
     * Download File Backup
     */
    public function downloadBackup($filename)
    {
        $backupPath = storage_path('app/backups/' . $filename);
        if (File::exists($backupPath)) {
            return response()->download($backupPath);
        }
        abort(404, 'File backup tidak ditemukan.');
    }
}
