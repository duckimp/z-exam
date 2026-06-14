<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;

class MapelController extends Controller
{
    public function index()
    {
        return response()->json(
            MataPelajaran::withCount('soal')->orderBy('nama_mapel')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_mapel' => 'required|string|max:100',
            'kode_mapel' => 'required|string|max:20|unique:mata_pelajaran,kode_mapel',
            'tingkat'    => 'nullable|string|max:20',
        ]);

        $mapel = MataPelajaran::create($data);

        return response()->json($mapel, 201);
    }

    public function show(MataPelajaran $mapel)
    {
        return response()->json($mapel->loadCount('soal'));
    }

    public function update(Request $request, MataPelajaran $mapel)
    {
        $data = $request->validate([
            'nama_mapel' => 'sometimes|required|string|max:100',
            'kode_mapel' => 'sometimes|required|string|max:20|unique:mata_pelajaran,kode_mapel,'.$mapel->id,
            'tingkat'    => 'nullable|string|max:20',
        ]);

        $mapel->update($data);

        return response()->json($mapel);
    }

    public function destroy(MataPelajaran $mapel)
    {
        if ($mapel->soal()->exists()) {
            return response()->json(['message' => 'Mapel masih memiliki soal, tidak bisa dihapus.'], 422);
        }
        $mapel->delete();
        return response()->json(null, 204);
    }
}
