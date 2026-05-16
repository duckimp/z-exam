<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SesiUjian;
use App\Models\Student;
use App\Models\UjianPeserta;
use App\Models\JawabanPeserta;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    /**
     * Login Siswa ke Sesi Ujian
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string', // Default password is NISN
            'token'    => 'required|string|size:6',
        ]);

        // 1. Cek Sesi by Token
        $sesi = SesiUjian::where('token', strtoupper($request->token))
            ->where('is_active', true)
            ->first();

        if (!$sesi) {
            return response()->json(['message' => 'Token tidak valid atau sesi ditutup.'], 422);
        }

        // 2. Cek Student Credentials
        $student = Student::where('username', $request->username)->first();
        
        if (!$student || !\Hash::check($request->password, $student->password)) {
            return response()->json(['message' => 'NISN atau Password salah.'], 401);
        }

        if (!$student->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan.'], 403);
        }

        // 3. Cek apakah sudah pernah masuk ke sesi ini
        $ujian = UjianPeserta::where('sesi_id', $sesi->id)
            ->where('student_id', $student->id)
            ->first();

        if ($ujian && $ujian->status === 'FINISH') {
            return response()->json(['message' => 'Anda sudah menyelesaikan ujian ini.'], 403);
        }

        // 4. Generate Token khusus untuk Ujian (menggunakan Sanctum atau custom)
        // Untuk kesederhanaan, kita gunakan Sanctum tapi dengan scope khusus jika perlu.
        // Karena sistem ini intranet, kita bisa return info sesi langsung.
        
        return response()->json([
            'student' => $student,
            'sesi'    => $sesi->load('mapel'),
            'ujian'   => $ujian
        ]);
    }

    /**
     * Mulai Ujian — Ambil Soal
     */
    public function start(Request $request)
    {
        $request->validate([
            'sesi_id'    => 'required|exists:sesi_ujian,id',
            'student_id' => 'required|exists:students,id',
        ]);

        return DB::transaction(function () use ($request) {
            $sesi = SesiUjian::findOrFail($request->sesi_id);
            
            // Cek/Buat rekaman UjianPeserta
            $ujian = UjianPeserta::firstOrCreate(
                ['sesi_id' => $sesi->id, 'student_id' => $request->student_id],
                [
                    'status' => 'START',
                    'start_time' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]
            );

            if ($ujian->status === 'FINISH') {
                return response()->json(['message' => 'Ujian sudah selesai.'], 403);
            }

            // Ambil Soal
            $soal = Soal::with(['opsi', 'matchingItems'])
                ->where('mapel_id', $sesi->mapel_id)
                ->get();

            // Acak jika diminta
            if ($sesi->random_soal) {
                $soal = $soal->shuffle();
            }

            // Map soal agar opsinya juga teracak jika diminta
            $soal = $soal->map(function ($s) use ($sesi) {
                if ($s->tipe === 'PG' && $sesi->random_opsi) {
                    $s->setRelation('opsi', $s->opsi->shuffle());
                }
                return $s;
            });

            // Ambil jawaban yang sudah tersimpan (jika ada — untuk resume)
            $jawaban = JawabanPeserta::where('ujian_peserta_id', $ujian->id)->get();

            return response()->json([
                'ujian'   => $ujian,
                'soal'    => $soal,
                'jawaban' => $jawaban
            ]);
        });
    }

    /**
     * Simpan Jawaban (Autosave)
     */
    public function save(Request $request)
    {
        $request->validate([
            'ujian_peserta_id' => 'required|exists:ujian_peserta,id',
            'soal_id'          => 'required|exists:soal,id',
            'jawaban'          => 'nullable', // Bisa string (PG) atau text (Essay) atau JSON (Matching)
        ]);

        $ujian = UjianPeserta::findOrFail($request->ujian_peserta_id);
        if ($ujian->status !== 'START') {
            return response()->json(['message' => 'Sesi ujian tidak aktif.'], 403);
        }

        $soal = Soal::findOrFail($request->soal_id);

        // Cek kebenaran (untuk PG)
        $isCorrect = null;
        if ($soal->tipe === 'PG') {
            $opsiBenar = $soal->opsi()->where('is_correct', true)->first();
            $isCorrect = ($opsiBenar && $opsiBenar->label === $request->jawaban);
        }

        $jawaban = JawabanPeserta::updateOrCreate(
            ['ujian_peserta_id' => $ujian->id, 'soal_id' => $soal->id],
            [
                'jawaban'    => $request->jawaban,
                'is_correct' => $isCorrect,
                'score'      => $isCorrect ? $soal->bobot : 0
            ]
        );

        return response()->json(['status' => 'saved', 'jawaban' => $jawaban]);
    }

    /**
     * Selesaikan Ujian
     */
    public function finish(Request $request)
    {
        $request->validate([
            'ujian_peserta_id' => 'required|exists:ujian_peserta,id',
        ]);

        $ujian = UjianPeserta::findOrFail($request->ujian_peserta_id);
        
        // Hitung skor total
        $totalScore = JawabanPeserta::where('ujian_peserta_id', $ujian->id)
            ->where('is_correct', true)
            ->sum('score');

        $ujian->update([
            'status' => 'FINISH',
            'end_time' => now(),
            'score' => $totalScore
        ]);

        return response()->json(['message' => 'Ujian berhasil diselesaikan.', 'score' => $totalScore]);
    }
}
