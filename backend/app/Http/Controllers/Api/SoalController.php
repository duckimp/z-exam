<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Soal;
use App\Imports\SoalExcelImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class SoalController extends Controller
{
    public function index(Request $request)
    {
        $query = Soal::with(['opsi', 'matchingItems'])
            ->where('mapel_id', $request->mapel_id)
            ->orderBy('urutan');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'mapel_id'   => 'required|exists:mata_pelajaran,id',
            'tipe'       => 'required|in:PG,ESSAY,MATCHING',
            'konten'     => 'required|string',
            'bobot'      => 'nullable|numeric',
            'opsi'       => 'nullable|array',
            'opsi.*.konten' => 'required|string',
            'opsi.*.label'  => 'required|string',
            'opsi.*.is_correct' => 'required|boolean',
            'matching'   => 'nullable|array',
            'matching.*.item_kiri'  => 'required|string',
            'matching.*.item_kanan' => 'required|string',
        ]);

        return DB::transaction(function () use ($request) {
            $soal = Soal::create($request->only(['mapel_id', 'tipe', 'konten', 'bobot', 'urutan']));

            if ($request->tipe === 'PG' && $request->has('opsi')) {
                foreach ($request->opsi as $o) {
                    $soal->opsi()->create($o);
                }
            }

            if ($request->tipe === 'MATCHING' && $request->has('matching')) {
                foreach ($request->matching as $m) {
                    $soal->matchingItems()->create($m);
                }
            }

            if ($request->tipe === 'ESSAY') {
                $soal->update(['kunci_essay' => $request->kunci_essay]);
            }

            return response()->json($soal->load(['opsi', 'matchingItems']), 201);
        });
    }

    public function show(Soal $soal)
    {
        return response()->json($soal->load(['opsi', 'matchingItems']));
    }

    public function update(Request $request, Soal $soal)
    {
        $request->validate([
            'tipe'       => 'sometimes|required|in:PG,ESSAY,MATCHING',
            'konten'     => 'sometimes|required|string',
            'bobot'      => 'nullable|numeric',
            'opsi'       => 'nullable|array',
            'matching'   => 'nullable|array',
        ]);

        return DB::transaction(function () use ($request, $soal) {
            $soal->update($request->only(['tipe', 'konten', 'bobot', 'urutan', 'kunci_essay']));

            if ($request->has('opsi') && $soal->tipe === 'PG') {
                $soal->opsi()->delete();
                foreach ($request->opsi as $o) {
                    $soal->opsi()->create($o);
                }
            }

            if ($request->has('matching') && $soal->tipe === 'MATCHING') {
                $soal->matchingItems()->delete();
                foreach ($request->matching as $m) {
                    $soal->matchingItems()->create($m);
                }
            }

            return response()->json($soal->load(['opsi', 'matchingItems']));
        });
    }

    public function destroy(Soal $soal)
    {
        $soal->delete();
        return response()->json(null, 204);
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'file'     => 'required|mimes:xlsx,xls,csv',
            'mapel_id' => 'required|exists:mata_pelajaran,id',
        ]);

        Excel::import(new SoalExcelImport($request->mapel_id), $request->file('file'));

        return response()->json(['message' => 'Import berhasil']);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('soal', 'public');
            return response()->json(['url' => Storage::url($path)]);
        }

        return response()->json(['message' => 'Upload gagal'], 400);
    }
}
