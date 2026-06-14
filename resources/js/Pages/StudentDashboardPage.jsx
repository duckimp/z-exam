import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { LogOut, BookOpen, Clock, FileText, ArrowRight, ShieldAlert } from 'lucide-react'

export default function StudentDashboardPage({ student, sessions }) {
  const { errors } = usePage().props
  const [tokens, setTokens] = useState({}) // Store token input per session id
  const [submitting, setSubmitting] = useState(null)

  const handleStartExam = (sesiId, useToken) => {
    const token = tokens[sesiId] || ''
    if (useToken && !token) {
      alert('Token ujian wajib diisi!')
      return
    }

    setSubmitting(sesiId)
    router.post('/student/exam/start', {
      sesi_id: sesiId,
      token: token
    }, {
      onFinish: () => setSubmitting(null)
    })
  }

  const handleLogout = () => {
    if (confirm('Keluar dari akun Anda?')) {
      router.post('/student/logout')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Head title="Dashboard Siswa" />

      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg">
            Z
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-850 leading-tight">Z-Exam CBT</h1>
            <p className="text-[10px] text-slate-400 font-bold">Modul Intranet LAN Siswa</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-slate-800">{student.nama}</div>
            <div className="text-[9px] text-slate-450 font-bold mt-0.5">NISN: {student.nisn} · Kelas: {student.kelas?.nama_kelas || '—'}</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all"
            title="Keluar / Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 animate-fade-in">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Selamat Datang</div>
            <h2 className="text-2xl font-black mt-1 leading-tight">{student.nama}</h2>
            <p className="text-xs text-indigo-100 mt-1 font-medium">Pilih mata pelajaran ujian aktif di bawah ini untuk memulai pengerjaan.</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl py-2 px-4 flex flex-col font-mono text-center">
            <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Tingkat Kelas</span>
            <span className="text-xl font-black">{student.kelas?.tingkat || '—'}</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errors.message && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold leading-relaxed flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{errors.message}</span>
          </div>
        )}

        {/* Exam Sessions List */}
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Daftar Mata Pelajaran Ujian Aktif</h3>
        
        <div className="flex flex-col gap-4">
          {sessions.length === 0 ? (
            <div className="panel bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <BookOpen size={36} className="text-slate-300" />
              <div className="text-xs font-mono">Belum ada mata pelajaran ujian aktif untuk kelas Anda saat ini.</div>
              <p className="text-[10px] text-slate-400 font-semibold max-w-xs">Silakan hubungi proktor atau pengawas ruangan jika jadwal ujian Anda sudah dimulai.</p>
            </div>
          ) : (
            sessions.map(s => {
              const isFinished = s.status === 'FINISH'
              const isBanned = s.status === 'BANNED'
              const isStarted = s.status === 'START'
              const isWaiting = s.status === 'WAITING'

              return (
                <div 
                  key={s.id} 
                  className={`panel bg-white border rounded-3xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                    isFinished ? 'border-slate-200 opacity-70 bg-slate-50/50' : 
                    isBanned ? 'border-rose-200 bg-rose-50/10' :
                    'border-slate-200 shadow-sm hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                      isFinished ? 'bg-slate-100 border-slate-200 text-slate-400' :
                      isBanned ? 'bg-rose-50 border-rose-200 text-rose-600' :
                      'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded-md uppercase border ${
                          isFinished ? 'bg-slate-100 border-slate-200 text-slate-400' :
                          isBanned ? 'bg-rose-50 border-rose-250 text-rose-600' :
                          'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                          {s.mapel_kode}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">ID Sesi: #{s.id}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mt-1 leading-tight">{s.mapel_nama}</h4>
                      <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-450">
                        <span className="flex items-center gap-1"><Clock size={12} /> {s.durasi} Menit</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.nama_sesi}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Inputs */}
                  <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 flex-shrink-0">
                    
                    {isWaiting && s.use_token && (
                      <div className="flex flex-col gap-1 w-full sm:w-28 flex-shrink-0">
                        <input 
                          className="input py-2 text-center text-xs font-black uppercase tracking-widest font-mono" 
                          placeholder="TOKEN" 
                          maxLength={6}
                          value={tokens[s.id] || ''}
                          onChange={e => setTokens({ ...tokens, [s.id]: e.target.value.toUpperCase() })} 
                        />
                      </div>
                    )}

                    {isWaiting && (
                      <button 
                        onClick={() => handleStartExam(s.id, s.use_token)}
                        disabled={submitting === s.id}
                        className="btn btn-primary font-bold text-xs py-2.5 px-5 justify-center"
                      >
                        {submitting === s.id ? 'Memuat...' : 'Mulai Ujian'}
                        <ArrowRight size={13} className="ml-1.5" />
                      </button>
                    )}

                    {isStarted && (
                      <button 
                        onClick={() => handleStartExam(s.id, false)}
                        disabled={submitting === s.id}
                        className="btn bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-2xl flex items-center justify-center"
                      >
                        {submitting === s.id ? 'Memuat...' : 'Lanjutkan Ujian'}
                        <ArrowRight size={13} className="ml-1.5" />
                      </button>
                    )}

                    {isFinished && (
                      <span className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl text-center">
                        Sudah Selesai
                      </span>
                    )}

                    {isBanned && (
                      <span className="px-4 py-2 border border-rose-200 bg-rose-50/50 text-rose-700 text-xs font-bold rounded-2xl text-center">
                        Diblokir
                      </span>
                    )}

                  </div>

                </div>
              )
            })
          )}
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-semibold">
        Copyright © 2026 Z-Exam - Developed by Andi FR. All rights reserved.
      </footer>
    </div>
  )
}
