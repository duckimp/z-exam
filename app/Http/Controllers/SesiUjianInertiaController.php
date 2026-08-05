<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\MataPelajaran;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SesiUjianInertiaController extends Controller
{
    /**
     * Tampilkan Halaman Daftar Sesi Ujian
     */
    public function index()
    {
        $sesi = SesiUjian::with(['mapel', 'kelas', 'pengawas'])
            ->withCount('pesertaUjian')
            ->latest()
            ->get();
            
        $mapel = MataPelajaran::orderBy('nama_mapel')->get();
        $kelas = Kelas::orderBy('tingkat')->orderBy('nama_kelas')->get();

        return Inertia::render('SesiUjianPage', [
            'sesi' => $sesi,
            'mapel' => $mapel,
            'kelas' => $kelas,
        ]);
    }

    /**
     * Buat Sesi Baru
     */
    public function store(Request $request)
    {
        if (!auth()->user()->hasRole('super_admin')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $data = $request->validate([
            'nama_sesi'   => 'required|string|max:150',
            'mapel_id'    => 'required|exists:mata_pelajaran,id',
            'kelas_id'    => 'required|exists:kelas,id',
            'tanggal'     => 'required|date',
            'jam_mulai'   => 'required|string',
            'durasi'      => 'required|integer|min:1',
            'random_soal' => 'boolean',
            'random_opsi' => 'boolean',
            'anti_curang' => 'boolean',
            'use_token'   => 'boolean',
        ]);

        $data['token'] = Str::upper(Str::random(6));
        $data['is_active'] = true; // Sesi baru default aktif

        SesiUjian::create($data);

        return back()->with('success', 'Sesi ujian berhasil dibuat.');
    }

    /**
     * Update Sesi Ujian
     */
    public function update(Request $request, SesiUjian $sesi)
    {
        // Pengawas hanya boleh mengupdate keaktifan atau merilis sesi?
        // Tapi demi keamanan, matikan akses update umum bagi pengawas.
        if (!auth()->user()->hasRole('super_admin')) {
            // Pengawas hanya boleh mengubah status aktif/tidak jika diizinkan,
            // tapi kita batasi update umum hanya untuk super admin
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $data = $request->validate([
            'nama_sesi'   => 'sometimes|required|string|max:150',
            'mapel_id'    => 'sometimes|required|exists:mata_pelajaran,id',
            'kelas_id'    => 'sometimes|required|exists:kelas,id',
            'tanggal'     => 'sometimes|required|date',
            'jam_mulai'   => 'sometimes|required|string',
            'durasi'      => 'sometimes|required|integer|min:1',
            'random_soal' => 'boolean',
            'random_opsi' => 'boolean',
            'anti_curang' => 'boolean',
            'use_token'   => 'boolean',
            'is_active'   => 'boolean',
        ]);

        $sesi->update($data);

        return back()->with('success', 'Sesi ujian berhasil diperbarui.');
    }

    /**
     * Refresh Token Sesi
     */
    public function refreshToken(SesiUjian $sesi)
    {
        if (!auth()->user()->hasRole('super_admin')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $sesi->update([
            'token' => Str::upper(Str::random(6))
        ]);

        return back()->with('success', 'Token sesi ujian berhasil diganti.');
    }

    /**
     * Hapus Sesi Ujian
     */
    public function destroy(SesiUjian $sesi)
    {
        if (!auth()->user()->hasRole('super_admin')) {
            abort(403, 'Aksi ini hanya untuk Super Admin.');
        }

        $sesi->delete();
        return back()->with('success', 'Sesi ujian berhasil dihapus.');
    }

    /**
     * Klaim Kepengawasan Sesi Ujian oleh Pengawas
     */
    public function claimSesi(Request $request, SesiUjian $sesi)
    {
        if (!auth()->user()->hasRole('pengawas')) {
            abort(403, 'Hanya Pengawas yang dapat mengklaim sesi.');
        }

        $sesi->update([
            'pengawas_id' => auth()->id()
        ]);

        return back()->with('success', 'Anda berhasil mendaftarkan diri sebagai Pengawas untuk sesi ini.');
    }

    /**
     * Batalkan Klaim Kepengawasan Sesi Ujian oleh Pengawas
     */
    public function releaseSesi(Request $request, SesiUjian $sesi)
    {
        if (!auth()->user()->hasRole('pengawas') && !auth()->user()->hasRole('super_admin')) {
            abort(403);
        }

        if (auth()->user()->hasRole('pengawas') && $sesi->pengawas_id !== auth()->id()) {
            return back()->withErrors(['message' => 'Anda tidak berwenang membatalkan pengawas lain.']);
        }

        $sesi->update([
            'pengawas_id' => null
        ]);

        return back()->with('success', 'Status pengawas sesi ujian berhasil dibatalkan.');
    }
}
