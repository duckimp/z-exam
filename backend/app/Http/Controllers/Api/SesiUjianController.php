<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SesiUjian;
use App\Models\UjianPeserta;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SesiUjianController extends Controller
{
    public function index()
    {
        return response()->json(
            SesiUjian::with('mapel')->withCount('peserta')->orderBy('tanggal', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mapel_id'   => 'required|exists:mata_pelajaran,id',
            'nama_sesi'  => 'required|string|max:100',
            'tanggal'    => 'required|date',
            'jam_mulai'  => 'required',
            'durasi'     => 'required|integer|min:1',
            'random_soal' => 'boolean',
            'random_opsi' => 'boolean',
        ]);

        $data['token'] = strtoupper(Str::random(6));
        $data['is_active'] = true;

        $sesi = SesiUjian::create($data);

        return response()->json($sesi->load('mapel'), 201);
    }

    public function show(SesiUjian $sesi)
    {
        return response()->json($sesi->load('mapel'));
    }

    public function update(Request $request, SesiUjian $sesi)
    {
        $data = $request->validate([
            'nama_sesi'  => 'sometimes|required|string|max:100',
            'tanggal'    => 'sometimes|required|date',
            'jam_mulai'  => 'sometimes|required',
            'durasi'     => 'sometimes|required|integer|min:1',
            'is_active'  => 'boolean',
            'random_soal' => 'boolean',
            'random_opsi' => 'boolean',
        ]);

        $sesi->update($data);

        return response()->json($sesi->load('mapel'));
    }

    public function refreshToken(SesiUjian $sesi)
    {
        $sesi->update(['token' => strtoupper(Str::random(6))]);
        return response()->json(['token' => $sesi->token]);
    }

    public function destroy(SesiUjian $sesi)
    {
        $sesi->delete();
        return response()->json(null, 204);
    }

    // ── Monitoring ────────────────────────────────────────────────────────────
    
    public function monitoring(SesiUjian $sesi)
    {
        $peserta = UjianPeserta::with('student')
            ->where('sesi_id', $sesi->id)
            ->get();
            
        return response()->json([
            'sesi' => $sesi->load('mapel'),
            'peserta' => $peserta
        ]);
    }

    public function forceFinish(UjianPeserta $peserta)
    {
        $peserta->update(['status' => 'FINISH', 'end_time' => now()]);
        return response()->json(['message' => 'Peserta dipaksa selesai.']);
    }

    public function resetPeserta(UjianPeserta $peserta)
    {
        $peserta->delete(); // Hapus rekaman agar bisa mulai lagi (atau update status ke WAITING)
        return response()->json(['message' => 'Peserta direset.']);
    }
}
