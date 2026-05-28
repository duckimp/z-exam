<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use App\Exports\StudentTemplateExport;
use App\Models\Kelas;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\ErrorCorrectionLevel;

class StudentController extends Controller
{
    // ── List siswa ────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Student::with('kelas')
            ->orderBy('nama');

        // Filter by kelas
        if ($request->filled('kelas_id') && $request->kelas_id !== 'all') {
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

        // Sync username if NISN changed
        if (isset($data['nisn'])) {
            $data['username'] = $data['nisn'];
        }

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

    // ── Download Template Excel ───────────────────────────────────────────────
    public function downloadTemplate()
    {
        return Excel::download(new StudentTemplateExport, 'template_peserta.xlsx');
    }

    // ── Generate PDF kartu ujian ──────────────────────────────────────────────
    public function exportKartu(Request $request)
    {
        $kelasId = $request->kelas_id;
        $isAll = !$kelasId || $kelasId === 'all';

        if (!$isAll) {
            $kelas = Kelas::findOrFail($kelasId);
            $students = Student::where('kelas_id', $kelasId);
            $title = "Kartu Ujian — " . $kelas->nama_kelas;
        } else {
            $kelas = (object) ['nama_kelas' => 'Semua Kelas', 'tahun_ajar' => '2025/2026'];
            $students = Student::query();
            $title = "Kartu Ujian — Semua Kelas";
        }

        $students = $students->where('is_active', true)
            ->orderBy('kelas_id')
            ->orderBy('nama')
            ->get();

        // Generate QR code login otomatis per siswa (PNG via GD)
        // Auto-detect base URL dari request agar QR selalu sesuai IP/domain yang aktif
        $baseUrl = $request->getSchemeAndHttpHost();
        $students = $students->map(function ($s) use ($baseUrl) {
            $loginUrl = $baseUrl . '/student/auto-login?username=' . urlencode($s->username) . '&token=' . urlencode(base64_encode($s->username . ':' . $s->nisn));
            $qr = QrCode::create($loginUrl)
                ->setSize(160)
                ->setMargin(1)
                ->setErrorCorrectionLevel(ErrorCorrectionLevel::Medium);
            $writer = new PngWriter();
            $result = $writer->write($qr);
            $s->qr_base64 = 'data:image/png;base64,' . base64_encode($result->getString());
            return $s;
        });

        // Ambil settings kartu ujian
        $settings = DB::table('settings')->get()->pluck('value', 'key');

        // Konversi TTD ke base64 untuk DomPDF (tidak bisa akses storage via URL lokal)
        $ttdBase64 = null;
        if (!empty($settings['kepala_sekolah_ttd'])) {
            $ttdPath = storage_path('app/public/' . $settings['kepala_sekolah_ttd']);
            if (file_exists($ttdPath)) {
                $mime = mime_content_type($ttdPath);
                $ttdBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($ttdPath));
            }
        }

        $pdf = Pdf::loadView('pdf.kartu-ujian', compact('students', 'kelas', 'settings', 'ttdBase64'))
            ->setPaper('A4')
            ->setOption('margin-top', '8mm')
            ->setOption('margin-bottom', '8mm')
            ->setOption('margin-left', '8mm')
            ->setOption('margin-right', '8mm');

        $filename = 'kartu-ujian-'.($isAll ? 'semua-kelas' : $kelas->nama_kelas).'.pdf';

        return $pdf->stream($filename);
    }
}
