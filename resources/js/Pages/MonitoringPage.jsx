import { useState, useEffect } from 'react'
import { router, Head, Link } from '@inertiajs/react'
import { 
  Activity, CheckCircle, Clock, AlertTriangle, 
  ArrowLeft, RefreshCw, LogOut, Power, Search, Unlock
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function MonitoringPage({ sesi, peserta }) {
  const [search, setSearch] = useState('')

  // Fallback Polling effect for LAN environment
  useEffect(() => {
    // 5-second automatic background refresh for active monitoring
    const interval = setInterval(() => {
      router.reload({ 
        only: ['peserta'],
        preserveScroll: true,
        preserveState: true
      })
    }, 5000)

    // Optional Echo Listener if Reverb is active
    if (window.Echo) {
      const channel = window.Echo.channel(`monitoring.${sesi.id}`)
        .listen('.status.changed', (e) => {
          router.reload({ only: ['peserta'] })
        })
      return () => {
        channel.stopListening('.status.changed')
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [sesi.id])

  const stats = {
    total: peserta.length,
    working: peserta.filter(p => p.status === 'START').length,
    finished: peserta.filter(p => p.status === 'FINISH').length,
    waiting: peserta.filter(p => p.status === 'WAITING').length,
  }

  const handleForceFinish = (pid) => {
    if (!confirm('Paksa peserta ini selesai ujian?')) return
    router.post(`/monitoring/peserta/${pid}/force-finish`)
  }

  const handleReset = (pid) => {
    if (!confirm('Reset pengerjaan peserta ini? Siswa akan dapat login kembali dan mengulang pengerjaan dari awal.')) return
    router.post(`/monitoring/peserta/${pid}/reset`)
  }

  const handleUnlock = (pid) => {
    if (!confirm('Buka kembali akses ujian peserta ini? Siswa akan dapat masuk kembali dan melanjutkan pekerjaannya dengan jawaban yang sudah terisi sebelumnya.')) return
    router.post(`/monitoring/peserta/${pid}/unlock`)
  }

  const filteredPeserta = peserta.filter(p => 
    p.student?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    p.student?.nisn?.includes(search)
  )

  return (
    <AdminLayout>
      <Head title="Monitoring Real-time" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header flex justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link 
              href="/ujian/sesi" 
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="page-title text-2xl font-black text-slate-800">Monitoring Real-time</h1>
              <p className="page-desc text-sm text-slate-500 mt-1">{sesi.nama_sesi} — {sesi.mapel?.nama_mapel}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Token Akses</div>
                <div className="text-lg font-black text-indigo-600 font-mono tracking-wider mt-0.5">
                  {sesi.use_token ? (sesi.token || '—') : 'Tanpa Token'}
                </div>
             </div>
             <button className="btn btn-outline py-2.5 font-bold" onClick={() => router.reload({ only: ['peserta'] })}>
                <RefreshCw size={14} className="mr-1.5" /> Segarkan
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Peserta</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{stats.total}</div>
            <div className="text-[10px] text-slate-450 font-bold mt-1">Siswa terdaftar sesi</div>
          </div>

          <div className="panel bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Sedang Mengerjakan</div>
            <div className="text-3xl font-black text-indigo-600 mt-2 flex items-center gap-2">
              {stats.working}
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            </div>
            <div className="text-[10px] text-indigo-500 font-bold mt-1">Aktif di layar ujian</div>
          </div>

          <div className="panel bg-white border border-emerald-205 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Telah Selesai</div>
            <div className="text-3xl font-black text-emerald-600 mt-2">{stats.finished}</div>
            <div className="text-[10px] text-emerald-500 font-bold mt-1">Sudah kirim jawaban</div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Belum Masuk</div>
            <div className="text-3xl font-black text-slate-450 mt-2">{stats.waiting}</div>
            <div className="text-[10px] text-slate-400 font-bold mt-1">Menunggu di gerbang</div>
          </div>

        </div>

        {/* Main Table Panel */}
        <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input 
                className="input pl-9 text-xs font-semibold py-2" 
                placeholder="Cari nama atau NISN..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="text-xs text-slate-400 font-mono font-bold animate-pulse">
              ● Pembaruan otomatis aktif
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 bg-slate-50/30 uppercase tracking-wider">
                  <th className="p-4 pl-6">NISN</th>
                  <th className="p-4">Nama Peserta</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Mulai</th>
                  <th className="p-4">Selesai</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 pr-6 text-right">Kontrol</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeserta.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-16 text-center text-xs font-mono text-slate-400">
                      Tidak ada peserta aktif yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPeserta.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="p-4 pl-6 font-mono text-xs text-slate-600">{p.student?.nisn}</td>
                      <td className="p-4 font-bold text-slate-800">{p.student?.nama}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                          p.status === 'START' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 animate-pulse' :
                          p.status === 'FINISH' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                          p.status === 'BANNED' ? 'bg-red-50 border border-red-200 text-red-700' : 
                          'bg-slate-100 border border-slate-200 text-slate-500'
                        }`}>
                          {p.status === 'START' ? 'Pengerjaan' : p.status === 'FINISH' ? 'Selesai' : p.status === 'BANNED' ? 'Diblokir' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-450 font-mono">
                        {p.start_time ? new Date(p.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-450 font-mono">
                        {p.end_time ? new Date(p.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-450 font-mono">{p.ip_address || '—'}</td>
                      <td className="p-4 pr-6 text-right flex justify-end gap-1">
                        {p.status !== 'WAITING' ? (
                          <>
                            {p.status === 'START' && (
                              <button className="btn btn-sm btn-ghost p-2 text-amber-600 hover:text-amber-850" title="Paksa Selesai Ujian" onClick={() => handleForceFinish(p.id)}>
                                <Power size={14} />
                              </button>
                            )}
                            {(p.status === 'FINISH' || p.status === 'BANNED') && (
                              <button className="btn btn-sm btn-ghost p-2 text-indigo-600 hover:text-indigo-850" title="Buka Kunci (Lanjutkan Ujian)" onClick={() => handleUnlock(p.id)}>
                                <Unlock size={14} />
                              </button>
                            )}
                            <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-red-600" title="Reset & Logout Siswa" onClick={() => handleReset(p.id)}>
                              <LogOut size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-350 italic font-semibold mr-2">Belum Masuk</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
