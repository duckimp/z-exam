<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\Request;

class KelasController extends Controller
{
    public function index()
    {
        return response()->json(
            Kelas::withCount('students')->orderBy('tingkat')->orderBy('nama_kelas')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_kelas'  => 'required|string|max:50',
            'tingkat'     => 'required|string|max:20',
            'tahun_ajar'  => 'required|string|max:20',
            'wali_kelas'  => 'nullable|string|max:100',
        ]);

        $kelas = Kelas::create($data);

        return response()->json($kelas, 201);
    }

    public function update(Request $request, Kelas $kelas)
    {
        $data = $request->validate([
            'nama_kelas'  => 'sometimes|required|string|max:50',
            'tingkat'     => 'sometimes|required|string|max:20',
            'tahun_ajar'  => 'sometimes|required|string|max:20',
            'wali_kelas'  => 'nullable|string|max:100',
        ]);

        $kelas->update($data);

        return response()->json($kelas);
    }

    public function destroy(Kelas $kelas)
    {
        if ($kelas->students()->exists()) {
            return response()->json(['message' => 'Kelas masih memiliki siswa, tidak bisa dihapus.'], 422);
        }
        $kelas->delete();
        return response()->json(null, 204);
    }
}
