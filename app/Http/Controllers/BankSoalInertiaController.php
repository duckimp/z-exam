<?php

namespace App\Http\Controllers;

use App\Exports\SoalTemplateExport;
use App\Imports\SoalExcelImport;
use App\Models\MataPelajaran;
use App\Models\Soal;
use App\Models\OsiSoal;
use App\Models\MatchingItem;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class BankSoalInertiaController extends Controller
{
    /**
     * Tampilkan Halaman Utama Bank Soal
     */
    public function index(Request $request)
    {
        $mapel = MataPelajaran::withCount('soal')->orderBy('tingkat')->orderBy('nama_mapel')->get();
        $selectedMapel = null;
        $soal = [];

        if ($request->filled('mapel_id')) {
            $selectedMapel = MataPelajaran::findOrFail($request->mapel_id);
            $soal = Soal::with(['opsi', 'matchingItems'])
                ->where('mapel_id', $request->mapel_id)
                ->orderBy('urutan')
                ->orderBy('id')
                ->get();
        }

        return Inertia::render('BankSoalPage', [
            'mapel' => $mapel,
            'selectedMapel' => $selectedMapel,
            'soal' => $soal,
            'filters' => $request->only(['mapel_id', 'view'])
        ]);
    }

    /**
     * Simpan Mapel Baru
     */
    public function storeMapel(Request $request)
    {
        $data = $request->validate([
            'nama_mapel' => 'required|string|max:100',
            'kode_mapel' => 'required|string|max:50|unique:mata_pelajaran,kode_mapel',
            'tingkat'    => 'nullable|string|max:20',
        ]);

        MataPelajaran::create($data);

        return back()->with('success', 'Mata Pelajaran berhasil ditambahkan.');
    }

    /**
     * Update Mapel
     */
    public function updateMapel(Request $request, MataPelajaran $mapel)
    {
        $data = $request->validate([
            'nama_mapel' => 'required|string|max:100',
            'kode_mapel' => 'required|string|max:50|unique:mata_pelajaran,kode_mapel,'.$mapel->id,
            'tingkat'    => 'nullable|string|max:20',
        ]);

        $mapel->update($data);

        return back()->with('success', 'Mata Pelajaran berhasil diperbarui.');
    }

    /**
     * Hapus Mapel beserta Soal-soalnya
     */
    public function destroyMapel(MataPelajaran $mapel)
    {
        $mapel->delete();
        return redirect()->route('soal.index')->with('success', 'Mata Pelajaran berhasil dihapus.');
    }

    /**
     * Simpan Soal Baru
     */
    public function storeSoal(Request $request)
    {
        $request->validate([
            'mapel_id'    => 'required|exists:mata_pelajaran,id',
            'tipe'        => 'required|in:PG,ESSAY,MATCHING',
            'konten'      => 'required|string',
            'bobot'       => 'required|numeric|min:0',
            'urutan'      => 'integer',
            'kunci_essay' => 'nullable|string',
            'opsi'        => 'nullable|array',
            'matching'    => 'nullable|array',
        ]);

        \DB::transaction(function () use ($request) {
            $soal = Soal::create([
                'mapel_id'    => $request->mapel_id,
                'tipe'        => $request->tipe,
                'konten'      => $this->escapeHtmlOutsideMath($request->konten),
                'bobot'       => $request->bobot,
                'urutan'      => $request->urutan ?? 0,
                'kunci_essay' => $this->escapeHtmlOutsideMath($request->kunci_essay),
            ]);

            // Simpan Opsi (jika PG)
            if ($request->tipe === 'PG' && is_array($request->opsi)) {
                foreach ($request->opsi as $o) {
                    $soal->opsi()->create([
                        'label'      => $o['label'],
                        'konten'     => $this->escapeHtmlOutsideMath($o['konten'] ?? ''),
                        'is_correct' => $o['is_correct'] ?? false,
                    ]);
                }
            }

            // Simpan Matching (jika MATCHING)
            if ($request->tipe === 'MATCHING' && is_array($request->matching)) {
                foreach ($request->matching as $m) {
                    if (!empty($m['item_kiri']) && !empty($m['item_kanan'])) {
                        $soal->matchingItems()->create([
                            'item_kiri'  => $this->escapeHtmlOutsideMath($m['item_kiri']),
                            'item_kanan' => $this->escapeHtmlOutsideMath($m['item_kanan']),
                        ]);
                    }
                }
            }
        });

        return back()->with('success', 'Soal berhasil disimpan.');
    }

    /**
     * Update Soal
     */
    public function updateSoal(Request $request, Soal $soal)
    {
        $request->validate([
            'tipe'        => 'required|in:PG,ESSAY,MATCHING',
            'konten'      => 'required|string',
            'bobot'       => 'required|numeric|min:0',
            'urutan'      => 'integer',
            'kunci_essay' => 'nullable|string',
            'opsi'        => 'nullable|array',
            'matching'    => 'nullable|array',
        ]);

        \DB::transaction(function () use ($request, $soal) {
            $soal->update([
                'tipe'        => $request->tipe,
                'konten'      => $this->escapeHtmlOutsideMath($request->konten),
                'bobot'       => $request->bobot,
                'urutan'      => $request->urutan ?? 0,
                'kunci_essay' => $this->escapeHtmlOutsideMath($request->kunci_essay),
            ]);

            // Hapus relasi lama
            $soal->opsi()->delete();
            $soal->matchingItems()->delete();

            // Simpan Opsi (jika PG)
            if ($request->tipe === 'PG' && is_array($request->opsi)) {
                foreach ($request->opsi as $o) {
                    $soal->opsi()->create([
                        'label'      => $o['label'],
                        'konten'     => $this->escapeHtmlOutsideMath($o['konten'] ?? ''),
                        'is_correct' => $o['is_correct'] ?? false,
                    ]);
                }
            }

            // Simpan Matching (jika MATCHING)
            if ($request->tipe === 'MATCHING' && is_array($request->matching)) {
                foreach ($request->matching as $m) {
                    if (!empty($m['item_kiri']) && !empty($m['item_kanan'])) {
                        $soal->matchingItems()->create([
                            'item_kiri'  => $this->escapeHtmlOutsideMath($m['item_kiri']),
                            'item_kanan' => $this->escapeHtmlOutsideMath($m['item_kanan']),
                        ]);
                    }
                }
            }
        });

        return back()->with('success', 'Soal berhasil diperbarui.');
    }

    /**
     * Hapus Soal
     */
    public function destroySoal(Soal $soal)
    {
        $soal->delete();
        return back()->with('success', 'Soal berhasil dihapus.');
    }

    /**
     * Download Template Soal Excel
     */
    public function downloadTemplate()
    {
        return Excel::download(new SoalTemplateExport, 'template_soal.xlsx');
    }

    /**
     * Import Soal dari Excel / Word DOCX
     */
    public function importSoal(Request $request)
    {
        $request->validate([
            'file'     => 'required|file',
            'mapel_id' => 'required|exists:mata_pelajaran,id',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'docx') {
            $import = new \App\Imports\SoalDocxImport($request->mapel_id, false);
            $import->import($file->getRealPath());
        } else {
            $import = new SoalExcelImport($request->mapel_id, false);
            Excel::import($import, $file);
        }

        if (count($import->getErrors()) > 0) {
            return back()->withErrors(['message' => implode(' | ', $import->getErrors())]);
        }

        return back()->with('success', 'Import soal berhasil. ' . $import->getRowCount() . ' soal berhasil diimpor.');
    }

    /**
     * Preview Import Soal dari Excel / Word (No Save)
     */
    public function previewImport(Request $request)
    {
        $request->validate([
            'file'     => 'required|file',
            'mapel_id' => 'required|exists:mata_pelajaran,id',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'docx') {
            $import = new \App\Imports\SoalDocxImport($request->mapel_id, true);
            $import->import($file->getRealPath());
        } else {
            $import = new SoalExcelImport($request->mapel_id, true);
            Excel::import($import, $file);
        }

        if (count($import->getErrors()) > 0) {
            return response()->json(['errors' => $import->getErrors()], 422);
        }

        return response()->json([
            'questions' => $import->getQuestions(),
            'count'     => $import->getRowCount()
        ]);
    }

    /**
     * Konfirmasi Hasil Impor untuk Disimpan ke Database
     */
    public function confirmImport(Request $request)
    {
        $request->validate([
            'mapel_id'  => 'required|exists:mata_pelajaran,id',
            'questions' => 'required|array',
        ]);

        \DB::transaction(function () use ($request) {
            foreach ($request->questions as $soalData) {
                $soalObj = Soal::create([
                    'mapel_id'    => $request->mapel_id,
                    'tipe'        => $soalData['tipe'],
                    'konten'      => $soalData['konten'],
                    'bobot'       => $soalData['bobot'] ?? 1,
                    'urutan'      => $soalData['urutan'] ?? 0,
                    'kunci_essay' => $soalData['kunci_essay'] ?? null,
                ]);

                if ($soalData['tipe'] === 'PG' && is_array($soalData['options'])) {
                    foreach ($soalData['options'] as $opt) {
                        $soalObj->opsi()->create([
                            'label'      => $opt['label'],
                            'konten'     => $opt['konten'] ?? '',
                            'is_correct' => $opt['is_correct'] ?? false,
                        ]);
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => count($request->questions) . ' soal berhasil disimpan ke database.'
        ]);
    }

    /**
     * Hapus Semua Soal dalam Mapel
     */
    public function destroyAllSoal(MataPelajaran $mapel)
    {
        $mapel->soal()->delete();
        return back()->with('success', 'Semua soal dalam mata pelajaran ini berhasil dihapus.');
    }

    /**
     * Edit Bobot Semua Soal sekaligus
     */
    public function bulkWeight(Request $request)
    {
        $request->validate([
            'mapel_id' => 'required|exists:mata_pelajaran,id',
            'tipe'     => 'required|in:ALL,PG,ESSAY,MATCHING',
            'bobot'    => 'required|numeric|min:0',
        ]);

        $query = Soal::where('mapel_id', $request->mapel_id);

        if ($request->tipe !== 'ALL') {
            $query->where('tipe', $request->tipe);
        }

        $count = $query->update(['bobot' => $request->bobot]);

        return back()->with('success', 'Berhasil memperbarui bobot ' . $count . ' soal menjadi ' . $request->bobot . '.');
    }

    private function escapeHtmlOutsideMath($text)
    {
        if (!$text) return '';
        // Split by math pattern to protect KaTeX formulas
        $parts = preg_split('/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        foreach ($parts as &$part) {
            if ($part && !str_starts_with($part, '$')) {
                $part = htmlspecialchars($part, ENT_NOQUOTES, 'UTF-8', false);
            }
        }
        return implode('', $parts);
    }
}
