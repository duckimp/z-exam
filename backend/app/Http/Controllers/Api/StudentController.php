<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use App\Models\Kelas;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{
    // ── List siswa ────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Student::with('kelas')
            ->orderBy('nama');

        // Filter by kelas
        if ($request->filled('kelas_id')) {
            $query->where('kelas_id', $request->kelas_id);
        }

        // Search by nama atau NISN
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama', 'like', '%'.$request->search.'%')
                  ->orWhere('nisn', 'like', '%'.$request->search.'%');
            });
        }

        return response()->json($query->paginate(25));
    }

    // ── Buat siswa satu per satu ──────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'kelas_id'     => 'nullable|exists:kelas,id',
            'nisn'         => 'required|string|max:20|unique:students,nisn',
            'nama'         => 'required|string|max:100',
            'ttl'          => 'nullable|date',
            'tempat_lahir' => 'nullable|string|max:100',
            'jk'           => 'nullable|in:L,P',
        ]);

        $student = Student::create($data);

        return response()->json($student->load('kelas'), 201);
    }

    // ── Tampilkan satu siswa ──────────────────────────────────────────────────
    public function show(Student $student)
    {
        return response()->json($student->load('kelas'));
    }

    // ── Update siswa ──────────────────────────────────────────────────────────
    public function update(Request $request, Student $student)
    {
        $data = $request->validate([
            'kelas_id'     => 'nullable|exists:kelas,id',
            'nisn'         => 'sometimes|required|string|max:20|unique:students,nisn,'.$student->id,
            'nama'         => 'sometimes|required|string|max:100',
            'ttl'          => 'nullable|date',
            'tempat_lahir' => 'nullable|string|max:100',
            'jk'           => 'nullable|in:L,P',
            'is_active'    => 'boolean',
        ]);

        $student->update($data);

        return response()->json($student->load('kelas'));
    }

    // ── Hapus siswa ───────────────────────────────────────────────────────────
    public function destroy(Student $student)
    {
        $student->delete();
        return response()->json(null, 204);
    }

    // ── Reset password ke NISN ────────────────────────────────────────────────
    public function resetPassword(Student $student)
    {
        $student->update(['password' => bcrypt($student->nisn)]);
        return response()->json(['message' => 'Password direset ke NISN.']);
    }

    // ── Bulk import Excel ─────────────────────────────────────────────────────
    public function import(Request $request)
    {
        $request->validate([
            'file'     => 'required|file|mimes:xlsx,xls,csv',
            'kelas_id' => 'nullable|exists:kelas,id',
        ]);

        $import = new StudentsImport($request->kelas_id);
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => 'Import berhasil.',
            'imported' => $import->getRowCount(),
            'errors'   => $import->getErrors(),
        ]);
    }

    // ── Generate PDF kartu ujian ──────────────────────────────────────────────
    public function exportKartu(Request $request)
    {
        $request->validate([
            'kelas_id' => 'required|exists:kelas,id',
        ]);

        $kelas    = Kelas::findOrFail($request->kelas_id);
        $students = Student::where('kelas_id', $request->kelas_id)
            ->where('is_active', true)
            ->orderBy('nama')
            ->get();

        // Buat QR code data (base64 URL encode kredensial)
        $students = $students->map(function ($s) {
            $s->qr_data = base64_encode(json_encode([
                'u' => $s->username,
                'n' => $s->nama,
            ]));
            return $s;
        });

        $pdf = Pdf::loadView('pdf.kartu-ujian', compact('students', 'kelas'))
            ->setPaper('A4')
            ->setOption('margin-top', '8mm')
            ->setOption('margin-bottom', '8mm')
            ->setOption('margin-left', '8mm')
            ->setOption('margin-right', '8mm');

        $filename = 'kartu-ujian-'.$kelas->nama_kelas.'.pdf';

        return $pdf->stream($filename);
    }
}
