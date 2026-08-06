import { useState, useEffect } from 'react'
import { router, Head, Link } from '@inertiajs/react'
import { 
  Activity, CheckCircle, Clock, AlertTriangle, 
  ArrowLeft, RefreshCw, LogOut, Power, Search, Unlock, ShieldAlert, Users
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'
import axios from 'axios'

export default function MonitoringPage({ sesi, peserta }) {
  const [search, setSearch] = useState('')
  const [anomalies, setAnomalies] = useState([])

  const fetchAnomalies = async () => {
    try {
      const res = await axios.get(`/api/laporan/sesi/${sesi.id}/deteksi-anomali`)
      setAnomalies(res.data || [])
    } catch (err) {
      console.error('Error fetching real-time anomalies:', err)
    }
  }

  // Fallback Polling effect for LAN environment
  useEffect(() => {
    fetchAnomalies()

    // 5-second automatic background refresh for active monitoring & anomalies
    const interval = setInterval(() => {
      router.reload({ 
        only: ['peserta'],
        preserveScroll: true,
        preserveState: true
      })
      fetchAnomalies()
    }, 5000)

    // Optional Echo Listener if Reverb is active
    if (window.Echo) {
      const channel = window.Echo.channel(`monitoring.${sesi.id}`)
        .listen('.status.changed', (e) => {
          router.reload({ only: ['peserta'] })
          fetchAnomalies()
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
    anomaly: anomalies.length
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

  // Map anomalies by peserta_id for quick lookup
  const anomalyMap = {}
  anomalies.forEach(a => {
    if (!anomalyMap[a.peserta_id]) {
      anomalyMap[a.peserta_id] = []
    }
    anomalyMap[a.peserta_id].push(a)
  })

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
             <button className="btn btn-outline py-2.5 px-4 text-xs font-bold gap-2 bg-white" onClick={() => { router.reload({ only: ['peserta'] }); fetchAnomalies(); }}>
               <RefreshCw size={14} /> Refresh Data
             </button>
          </div>
        </div>

        {/* Real-time Warning Banner for Anomalies / Speed-Run */}
        {anomalies.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-900">Perhatian Pengawas: Terdeteksi {anomalies.length} Indikasi Pengerjaan Tidak Wajar</h3>
                <p className="text-xs text-amber-700 mt-0.5">Ada peserta yang terindikasi <strong className="font-bold">Speed-Run (Pengerjaan Sangat Cepat)</strong> atau anomali aktivitas. Cek baris bertanda khusus di bawah.</p>
              </div>
            </div>
            <Link href={`/laporan`} className="btn btn-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 shrink-0">
              Analisis Detail
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="panel bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              <Users size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Peserta</div>
              <div className="text-xl font-black text-slate-800 font-mono mt-0.5">{stats.total}</div>
            </div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              <Activity size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sedang Mengerjakan</div>
              <div className="text-xl font-black text-indigo-600 font-mono mt-0.5">{stats.working}</div>
            </div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai</div>
              <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">{stats.finished}</div>
            </div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <Clock size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Belum Masuk</div>
              <div className="text-xl font-black text-amber-600 font-mono mt-0.5">{stats.waiting}</div>
            </div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anomali / Speed-Run</div>
              <div className="text-xl font-black text-rose-600 font-mono mt-0.5">{stats.anomaly}</div>
            </div>
          </div>
        </div>

        {/* Table Peserta */}
        <div className="panel bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="font-bold text-slate-800 text-sm">Daftar Kehadiran & Aktivitas Peserta</h3>
            </div>

            <div className="relative w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama atau NISN..." 
                className="input pl-10 py-2 text-xs w-full bg-white font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">NISN</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Indikator / Anomali</th>
                  <th className="p-4">Mulai</th>
                  <th className="p-4">Selesai</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 pr-6 text-right">Aksi Pengawas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPeserta.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-16 text-center text-xs font-mono text-slate-400">
                      Tidak ada peserta aktif yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPeserta.map(p => {
                    const studentAnomalies = anomalyMap[p.id] || [];
                    const isCheatAnomaly = studentAnomalies.length > 0;

                    return (
                      <tr key={p.id} className={`border-b border-slate-100 last:border-b-0 transition-colors text-sm ${isCheatAnomaly ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/50'}`}>
                        <td className="p-4 pl-6 font-mono text-xs text-slate-600">{p.student?.nisn}</td>
                        <td className="p-4 font-bold text-slate-800">
                          {p.student?.nama}
                        </td>
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
                        <td className="p-4">
                          {studentAnomalies.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {studentAnomalies.map((anom, idx) => (
                                <span 
                                  key={idx} 
                                  className={`px-2 py-0.5 text-[10px] font-black rounded-md border flex items-center gap-1 ${
                                    anom.tipe?.toLowerCase().includes('speed') || anom.tipe?.toLowerCase().includes('cepat')
                                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                                      : 'bg-rose-100 border-rose-300 text-rose-800'
                                  }`}
                                  title={anom.keterangan || anom.tipe}
                                >
                                  <AlertTriangle size={11} className="shrink-0" />
                                  {anom.tipe}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-350 font-mono">—</span>
                          )}
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
