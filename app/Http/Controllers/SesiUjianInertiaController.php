<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\MataPelajaran;
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
        $sesi = SesiUjian::with('mapel')
            ->withCount('pesertaUjian')
            ->latest()
            ->get();
            
        $mapel = MataPelajaran::orderBy('nama_mapel')->get();

        return Inertia::render('SesiUjianPage', [
            'sesi' => $sesi,
            'mapel' => $mapel,
        ]);
    }

    /**
     * Buat Sesi Baru
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_sesi'   => 'required|string|max:150',
            'mapel_id'    => 'required|exists:mata_pelajaran,id',
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
        $data = $request->validate([
            'nama_sesi'   => 'sometimes|required|string|max:150',
            'mapel_id'    => 'sometimes|required|exists:mata_pelajaran,id',
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
        $sesi->delete();
        return back()->with('success', 'Sesi ujian berhasil dihapus.');
    }
}
