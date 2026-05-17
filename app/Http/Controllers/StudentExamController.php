<?php

namespace App\Http\Controllers;

use App\Models\SesiUjian;
use App\Models\Student;
use App\Models\UjianPeserta;
use App\Models\JawabanPeserta;
use App\Models\Soal;
use App\Events\ParticipantStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StudentExamController extends Controller
{
    /**
     * Tampilkan Halaman Login Siswa
     */
    public function showLogin()
    {
        // Pastikan jika sudah login, langsung lempar ke dashboard
        if (session()->has('student_id')) {
            return redirect()->route('student.dashboard');
        }

        return Inertia::render('StudentLoginPage');
    }

    /**
     * Proses Login Siswa (Tanpa Token)
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Cek Kredensial Siswa
        $student = Student::where('username', $request->username)->first();
        if (!$student || !Hash::check($request->password, $student->password)) {
            return back()->withErrors(['message' => 'NISN atau Password salah.']);
        }

        if (!$student->is_active) {
            return back()->withErrors(['message' => 'Akun Anda dinonaktifkan.']);
        }

        // Set Student ID di Session PHP
        session([
            'student_id' => $student->id
        ]);

        return redirect()->route('student.dashboard');
    }

    /**
     * Halaman Dashboard Pemilihan Ujian Siswa
     */
    public function dashboard()
    {
        $studentId = session('student_id');
        if (!$studentId) {
            return redirect()->route('student.login');
        }

        $student = Student::with('kelas')->findOrFail($studentId);

        // Ambil sesi ujian aktif yang mapel-nya sesuai tingkat kelas siswa
        $activeSessions = SesiUjian::with('mapel')
            ->where('is_active', true)
            ->whereHas('mapel', function ($query) use ($student) {
                if ($student->kelas) {
                    $query->where('tingkat', $student->kelas->tingkat);
                }
            })
            ->get();

        // Mengambil seluruh rekaman status pengerjaan siswa dalam satu query tunggal untuk semua sesi aktif (Anti N+1 Query)
        $ujianList = UjianPeserta::where('student_id', $studentId)
            ->whereIn('sesi_id', $activeSessions->pluck('id'))
            ->get()
            ->keyBy('sesi_id');

        // Cek status pengerjaan siswa untuk setiap sesi di memori local (sangat cepat & ramah database)
        $sessions = $activeSessions->map(function ($sesi) use ($ujianList) {
            $ujian = $ujianList->get($sesi->id);

            return [
                'id'          => $sesi->id,
                'nama_sesi'   => $sesi->nama_sesi,
                'mapel_nama'  => $sesi->mapel->nama_mapel ?? 'Mata Pelajaran',
                'mapel_kode'  => $sesi->mapel->kode_mapel ?? '—',
                'tanggal'     => $sesi->tanggal->format('Y-m-d'),
                'jam_mulai'   => $sesi->jam_mulai,
                'durasi'      => $sesi->durasi,
                'use_token'   => $sesi->use_token,
                'status'      => $ujian ? $ujian->status : 'WAITING',
            ];
        });

        return Inertia::render('StudentDashboardPage', [
            'student'  => $student,
            'sessions' => $sessions
        ]);
    }

    /**
     * Mulai Ujian (Pilih Sesi & Input Token)
     */
    public function startExam(Request $request)
    {
        $request->validate([
            'sesi_id' => 'required|exists:sesi_ujian,id',
            'token'   => 'nullable|string'
        ]);

        $studentId = session('student_id');
        if (!$studentId) {
            return redirect()->route('student.login');
        }

        $student = Student::findOrFail($studentId);
        $sesi = SesiUjian::findOrFail($request->sesi_id);

        if (!$sesi->is_active) {
            return back()->withErrors(['message' => 'Sesi ujian ini sedang tidak aktif.']);
        }

        // Validasi Token jika sesi mewajibkan token
        if ($sesi->use_token) {
            if (!$request->filled('token') || strtoupper($request->token) !== strtoupper($sesi->token)) {
                return back()->withErrors(['message' => 'Token ujian salah atau wajib diisi.']);
            }
        }

        // Cek / Buat Rekaman UjianPeserta
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
            $ujian = UjianPeserta::create([
                'sesi_id' => $sesi->id,
                'student_id' => $student->id,
                'status' => 'START',
                'start_time' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Broadcast status
            event(new ParticipantStatusChanged($ujian));
        }

        // Set Sesi Ujian aktif di session PHP
        session([
            'sesi_id'          => $sesi->id,
            'ujian_peserta_id' => $ujian->id,
            'exam_end_time'    => time() + ($sesi->durasi * 60)
        ]);

        return redirect()->route('student.exam');
    }

    /**
     * Halaman Utama Pengerjaan Ujian
     */
    public function examPage()
    {
        $studentId = session('student_id');
        $sesiId    = session('sesi_id');
        $ujianId   = session('ujian_peserta_id');

        if (!$studentId) {
            return redirect()->route('student.login');
        }

        if (!$sesiId || !$ujianId) {
            return redirect()->route('student.dashboard');
        }

        $student = Student::findOrFail($studentId);
        $sesi    = SesiUjian::with('mapel')->findOrFail($sesiId);
        $ujian   = UjianPeserta::findOrFail($ujianId);

        if ($ujian->status === 'FINISH') {
            session()->forget(['sesi_id', 'ujian_peserta_id', 'exam_end_time']);
            return redirect()->route('student.dashboard')->withErrors(['message' => 'Ujian sudah diselesaikan.']);
        }

        // Ambil Soal Beserta Opsi dan Matching Items
        $soal = Soal::with(['opsi', 'matchingItems'])
            ->where('mapel_id', $sesi->mapel_id)
            ->get();

        // Acak Soal jika disetting random
        if ($sesi->random_soal) {
            $soal = $soal->shuffle();
        }

        // Acak Opsi jika disetting random
        $soal = $soal->map(function ($s) use ($sesi) {
            if ($s->tipe === 'PG' && $sesi->random_opsi) {
                $s->setRelation('opsi', $s->opsi->shuffle());
            }
            return $s;
        });

        // Ambil jawaban yang sudah tersimpan
        $jawabanSaved = JawabanPeserta::where('ujian_peserta_id', $ujian->id)
            ->pluck('jawaban', 'soal_id')
            ->toArray();

        // Sisa waktu (detik)
        $endTime = session('exam_end_time', time() + ($sesi->durasi * 60));
        $timeLeft = max(0, $endTime - time());

        return Inertia::render('ExamPage', [
            'student'  => $student,
            'sesi'     => $sesi,
            'ujian'    => $ujian,
            'soal'     => $soal,
            'jawaban'  => $jawabanSaved,
            'timeLeft' => $timeLeft,
        ]);
    }

    /**
     * Simpan Jawaban (Autosave via Ajax)
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

        $soal = Soal::findOrFail($request->soal_id);

        // Evaluasi jawaban benar untuk tipe PG dan MATCHING
        $isCorrect = null;
        if ($soal->tipe === 'PG') {
            $opsiBenar = $soal->opsi()->where('is_correct', true)->first();
            $isCorrect = ($opsiBenar && $opsiBenar->label === $request->jawaban);
        } elseif ($soal->tipe === 'MATCHING') {
            $matchingItems = $soal->matchingItems;
            $studentAnswers = json_decode($request->jawaban, true);
            
            if (is_array($studentAnswers) && count($matchingItems) > 0) {
                $allCorrect = true;
                foreach ($matchingItems as $item) {
                    $answeredRight = $studentAnswers[$item->id] ?? null;
                    if ($answeredRight !== $item->item_kanan) {
                        $allCorrect = false;
                        break;
                    }
                }
                $isCorrect = $allCorrect;
            } else {
                $isCorrect = false;
            }
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
    public function finishExam()
    {
        $ujianId = session('ujian_peserta_id');
        if (!$ujianId) {
            return redirect()->route('student.login');
        }

        $ujian = UjianPeserta::findOrFail($ujianId);
        if ($ujian->status === 'START') {
            // Hitung skor total
            $totalScore = JawabanPeserta::where('ujian_peserta_id', $ujian->id)
                ->where('is_correct', true)
                ->sum('score');

            $ujian->update([
                'status' => 'FINISH',
                'end_time' => now(),
                'score' => $totalScore
            ]);

            event(new ParticipantStatusChanged($ujian));
        }

        // Hapus session ujian tapi PERTAHANKAN student_id!
        session()->forget(['sesi_id', 'ujian_peserta_id', 'exam_end_time']);

        return redirect()->route('student.dashboard')->with('success', 'Ujian telah selesai. Terima kasih!');
    }

    /**
     * Keluar / Logout Manual Siswa
     */
    public function logout()
    {
        session()->forget(['student_id', 'sesi_id', 'ujian_peserta_id', 'exam_end_time']);
        return redirect()->route('student.login');
    }

    /**
     * Keluar Sementara dari Ujian (Kembali ke Dashboard)
     */
    public function leaveExam()
    {
        session()->forget(['sesi_id', 'ujian_peserta_id', 'exam_end_time']);
        return redirect()->route('student.dashboard');
    }
}
