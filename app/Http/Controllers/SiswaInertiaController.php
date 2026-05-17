<?php

namespace App\Http\Controllers;

use App\Exports\StudentTemplateExport;
use App\Exports\KelasTemplateExport;
use App\Imports\StudentsImport;
use App\Imports\KelasImport;
use App\Models\Kelas;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class SiswaInertiaController extends Controller
{
    /**
     * Tampilkan Halaman Manajemen Siswa & Kelas
     */
    public function index(Request $request)
    {
        $siswaQuery = Student::with('kelas')
            ->orderBy('nama');

        // Filter by kelas
        if ($request->filled('kelas_id') && $request->kelas_id !== 'all') {
            $siswaQuery->where('kelas_id', $request->kelas_id);
        }

        // Search by nama atau NISN
        if ($request->filled('search')) {
            $siswaQuery->where(function ($q) use ($request) {
                $q->where('nama', 'like', '%'.$request->search.'%')
                  ->orWhere('nisn', 'like', '%'.$request->search.'%');
            });
        }

        $siswa = $siswaQuery->paginate(25)->withQueryString();
        $kelas = Kelas::withCount('students')->orderBy('tingkat')->orderBy('nama_kelas')->get();

        return Inertia::render('SiswaPage', [
            'siswa' => $siswa,
            'kelas' => $kelas,
            'filters' => $request->only(['search', 'kelas_id', 'tab'])
        ]);
    }

    /**
     * Tambah Peserta Ujian
     */
    public function storeSiswa(Request $request)
    {
        $data = $request->validate([
            'kelas_id'     => 'nullable|exists:kelas,id',
            'nisn'         => 'required|string|max:20|unique:students,nisn',
            'nama'         => 'required|string|max:100',
            'ttl'          => 'nullable|date',
            'tempat_lahir' => 'nullable|string|max:100',
            'jk'           => 'nullable|in:L,P',
        ]);

        $data['username'] = $data['nisn'];
        $data['password'] = Hash::make($data['nisn']);
        $data['is_active'] = true;

        Student::create($data);

        return back()->with('success', 'Peserta berhasil ditambahkan.');
    }

    /**
     * Update Peserta Ujian
     */
    public function updateSiswa(Request $request, Student $student)
    {
        $data = $request->validate([
            'kelas_id'     => 'nullable|exists:kelas,id',
            'nisn'         => 'required|string|max:20|unique:students,nisn,'.$student->id,
            'nama'         => 'required|string|max:100',
            'ttl'          => 'nullable|date',
            'tempat_lahir' => 'nullable|string|max:100',
            'jk'           => 'nullable|in:L,P',
            'is_active'    => 'boolean',
        ]);

        // Sync username if NISN changed
        $data['username'] = $data['nisn'];

        $student->update($data);

        return back()->with('success', 'Data peserta berhasil diubah.');
    }

    /**
     * Hapus Peserta Ujian
     */
    public function destroySiswa(Student $student)
    {
        $student->delete();
        return back()->with('success', 'Peserta berhasil dihapus.');
    }

    /**
     * Hapus Banyak Peserta Ujian Sekaligus (Bulk Delete)
     */
    public function bulkDestroySiswa(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:students,id'
        ]);

        Student::whereIn('id', $request->ids)->delete();

        return back()->with('success', count($request->ids) . ' peserta berhasil dihapus sekaligus.');
    }

    /**
     * Reset Password Peserta
     */
    public function resetPassword(Student $student)
    {
        $student->update(['password' => Hash::make($student->nisn)]);
        return back()->with('success', 'Password peserta telah direset ke NISN.');
    }

    /**
     * Tambah Kelas Baru
     */
    public function storeKelas(Request $request)
    {
        $data = $request->validate([
            'nama_kelas'  => 'required|string|max:50',
            'tingkat'     => 'required|string|max:20',
            'tahun_ajar'  => 'required|string|max:20',
            'wali_kelas'  => 'nullable|string|max:100',
        ]);

        Kelas::create($data);

        return back()->with('success', 'Kelas berhasil ditambahkan.');
    }

    /**
     * Update Kelas
     */
    public function updateKelas(Request $request, Kelas $kelas)
    {
        $data = $request->validate([
            'nama_kelas'  => 'required|string|max:50',
            'tingkat'     => 'required|string|max:20',
            'tahun_ajar'  => 'required|string|max:20',
            'wali_kelas'  => 'nullable|string|max:100',
        ]);

        $kelas->update($data);

        return back()->with('success', 'Kelas berhasil diperbarui.');
    }

    /**
     * Hapus Kelas
     */
    public function destroyKelas(Kelas $kelas)
    {
        if ($kelas->students()->exists()) {
            return back()->withErrors(['kelas' => 'Kelas tidak bisa dihapus karena masih memiliki peserta ujian.']);
        }

        $kelas->delete();
        return back()->with('success', 'Kelas berhasil dihapus.');
    }

    /**
     * Download Template Kelas Excel
     */
    public function downloadKelasTemplate()
    {
        return Excel::download(new KelasTemplateExport, 'template_kelas.xlsx');
    }

    /**
     * Import Kelas Excel
     */
    public function importKelas(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        $import = new KelasImport();
        Excel::import($import, $request->file('file'));

        if (count($import->getErrors()) > 0) {
            return back()->withErrors(['message' => implode(' | ', $import->getErrors())]);
        }

        return back()->with('success', 'Impor kelas berhasil. ' . $import->getRowCount() . ' kelas berhasil diimpor.');
    }

    /**
     * Download Template Siswa Excel
     */
    public function downloadStudentTemplate()
    {
        return Excel::download(new StudentTemplateExport, 'template_peserta.xlsx');
    }

    /**
     * Import Siswa Excel
     */
    public function importStudent(Request $request)
    {
        $request->validate([
            'file'     => 'required|file|mimes:xlsx,xls,csv',
            'kelas_id' => 'nullable|exists:kelas,id',
        ]);

        $import = new StudentsImport($request->kelas_id);
        Excel::import($import, $request->file('file'));

        if (count($import->getErrors()) > 0) {
            return back()->withErrors(['message' => implode(' | ', $import->getErrors())]);
        }

        return back()->with('success', 'Impor peserta berhasil. ' . $import->getRowCount() . ' peserta berhasil diimpor.');
    }

    /**
     * Cetak PDF Kartu Ujian Siswa
     */
    public function exportKartu(Request $request)
    {
        $kelasId = $request->kelas_id;
        $isAll = !$kelasId || $kelasId === 'all';

        if (!$isAll) {
            $kelas = Kelas::findOrFail($kelasId);
            $students = Student::where('kelas_id', $kelasId);
        } else {
            $kelas = (object) ['nama_kelas' => 'Semua Kelas', 'tahun_ajar' => '2025/2026'];
            $students = Student::query();
        }

        $students = $students->where('is_active', true)
            ->orderBy('kelas_id')
            ->orderBy('nama')
            ->get();

        // LAN friendly: bypass barcode / QR external
        $students = $students->map(function ($s) {
            $s->qr_base64 = null;
            return $s;
        });

        $pdf = Pdf::loadView('pdf.kartu-ujian', compact('students', 'kelas'))
            ->setPaper('A4')
            ->setOption('margin-top', '8mm')
            ->setOption('margin-bottom', '8mm')
            ->setOption('margin-left', '8mm')
            ->setOption('margin-right', '8mm');

        return $pdf->stream("kartu_ujian_" . strtolower(str_replace(' ', '_', $kelas->nama_kelas)) . ".pdf");
    }
}
