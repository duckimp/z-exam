<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\UjianPeserta;
use App\Events\ParticipantStatusChanged;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MonitoringInertiaController extends Controller
{
    /**
     * Tampilkan Halaman Monitoring Real-time Sesi Ujian
     */
    public function index($id)
    {
        $sesi = SesiUjian::with('mapel')->findOrFail($id);
        
        // Ambil semua murid yang se-tingkat dengan mata pelajaran sesi ini
        $tingkat = $sesi->mapel->tingkat ?? null;
        
        $expectedStudents = \App\Models\Student::with('kelas')
            ->where('is_active', true)
            ->when($tingkat, function ($query) use ($tingkat) {
                $query->whereHas('kelas', function ($q) use ($tingkat) {
                    $q->where('tingkat', $tingkat);
                });
            })
            ->get();

        // Ambil data ujian_peserta yang sudah ada
        $existingPeserta = UjianPeserta::with('student')
            ->where('sesi_id', $id)
            ->get()
            ->keyBy('student_id');

        // Gabungkan list murid dengan status pengerjaannya
        $peserta = $expectedStudents->map(function ($student) use ($existingPeserta, $id) {
            $ujian = $existingPeserta->get($student->id);
            
            if ($ujian) {
                return [
                    'id'          => $ujian->id,
                    'student_id'  => $student->id,
                    'sesi_id'     => $ujian->sesi_id,
                    'status'      => $ujian->status,
                    'start_time'  => $ujian->start_time,
                    'end_time'    => $ujian->end_time,
                    'ip_address'  => $ujian->ip_address,
                    'student'     => $student
                ];
            } else {
                return [
                    'id'          => 'waiting-' . $student->id,
                    'student_id'  => $student->id,
                    'sesi_id'     => $id,
                    'status'      => 'WAITING',
                    'start_time'  => null,
                    'end_time'    => null,
                    'ip_address'  => null,
                    'student'     => $student
                ];
            }
        })->toArray();

        // Cari peserta yang sudah ada di DB tapi tidak masuk expectedStudents (misal tingkat kelas berubah setelah ujian)
        foreach ($existingPeserta as $studentId => $ujian) {
            $alreadyIncluded = false;
            foreach ($peserta as $p) {
                if ($p['student_id'] == $studentId) {
                    $alreadyIncluded = true;
                    break;
                }
            }
            if (!$alreadyIncluded) {
                $peserta[] = [
                    'id'          => $ujian->id,
                    'student_id'  => $studentId,
                    'sesi_id'     => $ujian->sesi_id,
                    'status'      => $ujian->status,
                    'start_time'  => $ujian->start_time,
                    'end_time'    => $ujian->end_time,
                    'ip_address'  => $ujian->ip_address,
                    'student'     => $ujian->student
                ];
            }
        }

        return Inertia::render('MonitoringPage', [
            'sesi' => $sesi,
            'peserta' => $peserta
        ]);
    }

    /**
     * Paksa Selesai Peserta Ujian
     */
    public function forceFinish(UjianPeserta $peserta)
    {
        $peserta->update([
            'status' => 'FINISH',
            'end_time' => now()
        ]);

        // Broadcast event status changed
        event(new ParticipantStatusChanged($peserta));

        return back()->with('success', 'Peserta berhasil dipaksa selesai.');
    }

    /**
     * Reset Status Peserta agar Bisa Login Ulang
     */
    public function resetPeserta(UjianPeserta $peserta)
    {
        $peserta->delete();

        return back()->with('success', 'Siswa berhasil direset dan dapat login ulang.');
    }

    /**
     * Buka Kunci Akses Siswa agar Bisa Melanjutkan Ujian
     */
    public function unlockPeserta(UjianPeserta $peserta)
    {
        $peserta->update([
            'status' => 'START',
            'end_time' => null
        ]);

        // Broadcast event status changed
        event(new ParticipantStatusChanged($peserta));

        return back()->with('success', 'Akses pengerjaan siswa berhasil dibuka kembali. Siswa dapat login dan melanjutkan pengerjaan.');
    }
}
