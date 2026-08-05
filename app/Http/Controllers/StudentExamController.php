<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\Student;
use App\Models\UjianPeserta;
use App\Models\JawabanPeserta;
use App\Models\Soal;
use App\Events\ParticipantStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StudentExamController extends Controller
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Ambil student_id dari session, redirect ke login jika tidak ada */
    private function requireStudent(): int|null
    {
        return session('student_id');
    }

    // ── Auto Login via QR ─────────────────────────────────────────────────────

    public function autoLogin(Request $request)
    {
        $username = $request->query('username');
        $token    = $request->query('token');

        if (!$username || !$token) {
            return redirect()->route('student.login')
                ->withErrors(['message' => 'QR Code tidak valid.']);
        }

        $decoded = base64_decode(urldecode($token), true);
        if (!$decoded || !str_contains($decoded, ':')) {
            return redirect()->route('student.login')
                ->withErrors(['message' => 'QR Code tidak valid atau sudah kadaluarsa.']);
        }

        [$tokenUsername, $nisn] = explode(':', $decoded, 2);

        if ($tokenUsername !== $username) {
            return redirect()->route('student.login')
                ->withErrors(['message' => 'QR Code tidak valid.']);
        }

        $student = Student::where('username', $username)->first();

        if (!$student) {
            return redirect()->route('student.login')
                ->withErrors(['message' => 'Akun tidak ditemukan.']);
        }

        if (!Hash::check($nisn, $student->password)) {
            return redirect()->route('student.login')
                ->withErrors(['message' => 'QR Code tidak cocok dengan akun ini.']);
        }

        if (!$student->is_active) {
            return redirect()->route('student.login')
                ->withErrors(['message' => 'Akun Anda dinonaktifkan.']);
        }

        session(['student_id' => $student->id]);
        session()->save();

        return redirect()->route('student.dashboard');
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public function showLogin()
    {
        if (session()->has('student_id')) {
            return redirect()->route('student.dashboard');
        }
        return Inertia::render('StudentLoginPage');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $student = Student::where('username', $request->username)->first();
        if (!$student || !Hash::check($request->password, $student->password)) {
            return back()->withErrors(['message' => 'NISN atau Password salah.']);
        }

        if (!$student->is_active) {
            return back()->withErrors(['message' => 'Akun Anda dinonaktifkan.']);
        }

        session(['student_id' => $student->id]);

        return redirect()->route('student.dashboard');
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function dashboard()
    {
        $studentId = $this->requireStudent();
        if (!$studentId) return redirect()->route('student.login');

        $student = Student::with('kelas')->findOrFail($studentId);

        $kelasId = $student->kelas_id;
        $tingkat = $student->kelas?->tingkat ?? '';

        // Ambil ID mapel yang sesuai tingkat (untuk fallback sesi tanpa kelas_id)
        $mapelIdsByTingkat = $tingkat
            ? \DB::table('mata_pelajaran')->where('tingkat', $tingkat)->pluck('id')
            : collect();

        // Ambil sesi aktif yang cocok dengan kelas spesifik siswa (kelas_id),
        // ATAU sesi yang kelas_id-nya null dan mapel-nya sesuai tingkat kelas siswa (backward compat).
        // Hindari join di dalam closure — gunakan whereIn subquery agar kompatibel PostgreSQL.
        $activeSessions = SesiUjian::with('mapel')
            ->where('is_active', true)
            ->where(function ($q) use ($kelasId, $mapelIdsByTingkat) {
                // Sesi spesifik kelas ini
                if ($kelasId) {
                    $q->where('kelas_id', $kelasId);
                }
                // Fallback: sesi lama tanpa kelas_id yang mapel-nya sesuai tingkat
                if ($mapelIdsByTingkat->isNotEmpty()) {
                    $q->orWhere(function ($q2) use ($mapelIdsByTingkat) {
                        $q2->whereNull('kelas_id')
                           ->whereIn('mapel_id', $mapelIdsByTingkat);
                    });
                }
            })
            ->get();

        // Anti N+1 — satu query untuk semua status ujian siswa ini
        $ujianList = UjianPeserta::where('student_id', $studentId)
            ->whereIn('sesi_id', $activeSessions->pluck('id'))
            ->get()
            ->keyBy('sesi_id');

        $sessions = $activeSessions->map(function ($sesi) use ($ujianList) {
            $ujian = $ujianList->get($sesi->id);
            return [
                'id'         => $sesi->id,
                'nama_sesi'  => $sesi->nama_sesi,
                'mapel_nama' => $sesi->mapel->nama_mapel ?? 'Mata Pelajaran',
                'mapel_kode' => $sesi->mapel->kode_mapel ?? '—',
                'tanggal'    => $sesi->tanggal->format('Y-m-d'),
                'jam_mulai'  => $sesi->jam_mulai,
                'durasi'     => $sesi->durasi,
                'use_token'  => $sesi->use_token,
                'status'     => $ujian ? $ujian->status : 'WAITING',
            ];
        });

        return Inertia::render('StudentDashboardPage', [
            'student'  => $student,
            'sessions' => $sessions,
        ]);
    }
    // ── Start Exam ────────────────────────────────────────────────────────────

    public function startExam(Request $request)
    {
        $request->validate([
            'sesi_id' => 'required|exists:sesi_ujian,id',
            'token'   => 'nullable|string',
        ]);

        $studentId = $this->requireStudent();
        if (!$studentId) return redirect()->route('student.login');

        $student = Student::findOrFail($studentId);
        $sesi    = SesiUjian::findOrFail($request->sesi_id);

        if (!$sesi->is_active) {
            return back()->withErrors(['message' => 'Sesi ujian ini sedang tidak aktif.']);
        }

        if ($sesi->use_token) {
            if (!$request->filled('token') || strtoupper($request->token) !== strtoupper($sesi->token)) {
                return back()->withErrors(['message' => 'Token ujian salah atau wajib diisi.']);
            }
        }

        $ujian = UjianPeserta::where('sesi_id', $sesi->id)
            ->where('student_id', $student->id)
            ->first();

        if ($ujian && $ujian->status === 'FINISH') {
            return back()->withErrors(['message' => 'Anda sudah menyelesaikan ujian ini.']);
        }

        if ($ujian && $ujian->status === 'BANNED') {
            return back()->withErrors(['message' => 'Akses pengerjaan Anda untuk sesi ini diblokir.']);
        }

        if (!$ujian) {
            // Fix #4 — generate & persist urutan soal saat pertama kali masuk
            $soalIds = Soal::where('mapel_id', $sesi->mapel_id)->pluck('id')->toArray();
            if ($sesi->random_soal) {
                shuffle($soalIds);
            }

            $ujian = UjianPeserta::create([
                'sesi_id'    => $sesi->id,
                'student_id' => $student->id,
                'status'     => 'START',
                'start_time' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'soal_order' => $soalIds,
            ]);

            event(new ParticipantStatusChanged($ujian));
        }

        session([
            'sesi_id'          => $sesi->id,
            'ujian_peserta_id' => $ujian->id,
            'exam_end_time'    => time() + ($sesi->durasi * 60),
        ]);

        return redirect()->route('student.exam');
    }

    // ── Exam Page ─────────────────────────────────────────────────────────────

    public function examPage()
    {
        $studentId = $this->requireStudent();
        $sesiId    = session('sesi_id');
        $ujianId   = session('ujian_peserta_id');

        if (!$studentId) return redirect()->route('student.login');
        if (!$sesiId || !$ujianId) return redirect()->route('student.dashboard');

        $student = Student::findOrFail($studentId);
        $sesi    = SesiUjian::with('mapel')->findOrFail($sesiId);
        $ujian   = UjianPeserta::findOrFail($ujianId);

        if ($ujian->status === 'FINISH') {
            session()->forget(['sesi_id', 'ujian_peserta_id', 'exam_end_time']);
            return redirect()->route('student.dashboard')
                ->withErrors(['message' => 'Ujian sudah diselesaikan.']);
        }

        // Fix #3 — hanya ambil kolom yang dibutuhkan, bukan select *
        // Fix #4 — gunakan urutan soal yang sudah dipersist
        $soalQuery = Soal::with([
                'opsi:id,soal_id,label,konten',          // hanya kolom yang dirender
                'matchingItems:id,soal_id,item_kiri,item_kanan',
            ])
            ->where('mapel_id', $sesi->mapel_id)
            ->select(['id', 'mapel_id', 'tipe', 'konten', 'bobot']);

        if ($ujian->soal_order) {
            // Urutan sudah dipersist — gunakan langsung tanpa shuffle ulang
            $soalMap = $soalQuery->get()->keyBy('id');
            $soal = collect($ujian->soal_order)
                ->map(fn($id) => $soalMap->get($id))
                ->filter()
                ->values();
        } else {
            // Fallback untuk ujian lama yang belum punya soal_order
            $soal = $soalQuery->get();
            if ($sesi->random_soal) {
                $soal = $soal->shuffle()->values();
            }
        }

        // Fix #3 — acak opsi di sini (client tidak perlu tahu is_correct)
        if ($sesi->random_opsi) {
            $soal = $soal->map(function ($s) {
                if ($s->tipe === 'PG') {
                    $s->setRelation('opsi', $s->opsi->shuffle()->values());
                }
                return $s;
            });
        }

        // Ambil jawaban tersimpan — satu query, pluck ke array
        $jawabanSaved = JawabanPeserta::where('ujian_peserta_id', $ujian->id)
            ->pluck('jawaban', 'soal_id')
            ->toArray();

        $endTime  = session('exam_end_time', time() + ($sesi->durasi * 60));
        $timeLeft = max(0, $endTime - time());

        return Inertia::render('ExamPage', [
            'student'  => $student,
            'sesi'     => $sesi,
            'ujian'    => $ujian,
            'soal'     => $soal->values(),
            'jawaban'  => $jawabanSaved,
            'timeLeft' => $timeLeft,
        ]);
    }

    // ── Save Answer ───────────────────────────────────────────────────────────

    /**
     * Fix #1 & #2 — Pure upsert, TIDAK evaluasi is_correct di sini.
     * Scoring dipindah sepenuhnya ke finishExam().
     * Ini menghilangkan N+1 query (opsi + matchingItems) pada endpoint terpanas.
     */
    public function saveAnswer(Request $request)
    {
        $request->validate([
            'soal_id' => 'required|exists:soal,id',
            'jawaban' => 'nullable',
        ]);

        $ujianId = session('ujian_peserta_id');
        if (!$ujianId) {
            return response()->json(['message' => 'Sesi ujian Anda tidak valid.'], 403);
        }

        $ujian = UjianPeserta::findOrFail($ujianId);
        if ($ujian->status !== 'START') {
            return response()->json(['message' => 'Sesi ujian sudah diselesaikan.'], 403);
        }

        // Satu query saja — upsert raw jawaban tanpa evaluasi
        JawabanPeserta::updateOrCreate(
            ['ujian_peserta_id' => $ujian->id, 'soal_id' => $request->soal_id],
            ['jawaban' => $request->jawaban]
        );

        return response()->json(['status' => 'saved']);
    }

    /**
     * Beacon endpoint — dipanggil saat browser/tab ditutup (beforeunload).
     * sendBeacon mengirim Content-Type: text/plain, jadi perlu decode manual.
     * Tidak perlu return response (browser tidak menunggu).
     */
    public function saveBeacon(Request $request)
    {
        // Beacon mengirim body sebagai raw text/plain JSON
        $body = json_decode($request->getContent(), true);

        $soalId = $body['soal_id'] ?? null;
        $jawaban = $body['jawaban'] ?? null;

        if (!$soalId) return response()->noContent();

        $ujianId = session('ujian_peserta_id');
        if (!$ujianId) return response()->noContent();

        $ujian = UjianPeserta::find($ujianId);
        if (!$ujian || $ujian->status !== 'START') return response()->noContent();

        // Validasi soal_id exists tanpa throwing exception
        if (!\App\Models\Soal::where('id', $soalId)->exists()) return response()->noContent();

        JawabanPeserta::updateOrCreate(
            ['ujian_peserta_id' => $ujian->id, 'soal_id' => $soalId],
            ['jawaban' => $jawaban]
        );

        return response()->noContent();
    }

    // ── Finish Exam ───────────────────────────────────────────────────────────

    /**
     * Fix #1 & #2 — Semua scoring dihitung di sini, bukan di saveAnswer.
     * Dijalankan sekali saja saat ujian selesai.
     */
    public function finishExam()
    {
        $ujianId = session('ujian_peserta_id');
        if (!$ujianId) return redirect()->route('student.login');

        $ujian = UjianPeserta::findOrFail($ujianId);

        if ($ujian->status === 'START') {
            $sesi = SesiUjian::findOrFail($ujian->sesi_id);

            // Ambil semua jawaban siswa ini sekaligus
            $jawabanList = JawabanPeserta::where('ujian_peserta_id', $ujian->id)->get();

            // Ambil semua soal yang relevan beserta opsi & matching — satu query
            $soalIds = $jawabanList->pluck('soal_id')->unique()->toArray();
            $soalMap = Soal::with(['opsi', 'matchingItems'])
                ->whereIn('id', $soalIds)
                ->get()
                ->keyBy('id');

            $totalScore = 0;

            foreach ($jawabanList as $jawaban) {
                $soal = $soalMap->get($jawaban->soal_id);
                if (!$soal) continue;

                $isCorrect = null;
                $score     = 0;

                if ($soal->tipe === 'PG') {
                    $opsiBenar = $soal->opsi->firstWhere('is_correct', true);
                    $isCorrect = $opsiBenar && $opsiBenar->label === $jawaban->jawaban;
                    $score     = $isCorrect ? $soal->bobot : 0;

                } elseif ($soal->tipe === 'MATCHING') {
                    $studentAnswers = json_decode($jawaban->jawaban, true);
                    if (is_array($studentAnswers) && $soal->matchingItems->isNotEmpty()) {
                        $isCorrect = $soal->matchingItems->every(
                            fn($item) => ($studentAnswers[$item->id] ?? null) === $item->item_kanan
                        );
                        $score = $isCorrect ? $soal->bobot : 0;
                    } else {
                        $isCorrect = false;
                    }
                }
                // ESSAY — is_correct tetap null, dinilai manual oleh guru

                $jawaban->update([
                    'is_correct' => $isCorrect,
                    'score'      => $score,
                ]);

                $totalScore += $score;
            }

            $ujian->update([
                'status'   => 'FINISH',
                'end_time' => now(),
                'score'    => $totalScore,
            ]);

            event(new ParticipantStatusChanged($ujian));
        }

        session()->forget(['sesi_id', 'ujian_peserta_id', 'exam_end_time']);

        return redirect()->route('student.dashboard')
            ->with('success', 'Ujian telah selesai. Terima kasih!');
    }

    // ── Logout & Leave ────────────────────────────────────────────────────────

    public function logout()
    {
        session()->forget(['student_id', 'sesi_id', 'ujian_peserta_id', 'exam_end_time']);
        return redirect()->route('student.login');
    }

    public function leaveExam()
    {
        session()->forget(['sesi_id', 'ujian_peserta_id', 'exam_end_time']);
        return redirect()->route('student.dashboard');
    }
}
