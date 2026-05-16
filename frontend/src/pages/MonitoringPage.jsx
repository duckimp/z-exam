import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Activity, Users, CheckCircle, Clock, AlertTriangle, 
  ArrowLeft, RefreshCw, LogOut, Power, Search
} from 'lucide-react'
import api from '../services/api'
import echo from '../services/echo'

export default function MonitoringPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState({ sesi: null, peserta: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchMonitoring = async () => {
    try {
      const res = await api.get(`/sesi/${id}/monitoring`)
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchMonitoring()

    // ── Real-time Listener (Reverb) ──
    const channel = echo.channel(`monitoring.${id}`)
      .listen('.status.changed', (e) => {
        console.log('Real-time update:', e)
        setData(prev => {
          const updatedPeserta = [...prev.peserta]
          const idx = updatedPeserta.findIndex(p => p.id === e.peserta.id)
          
          if (idx !== -1) {
            updatedPeserta[idx] = e.peserta
          } else {
            updatedPeserta.push(e.peserta)
          }

          return { ...prev, peserta: updatedPeserta }
        })
      })

    // Polling setiap 30 detik (sebagai safety net)
    const interval = setInterval(fetchMonitoring, 30000)
    
    return () => {
      channel.stopListening('.status.changed')
      clearInterval(interval)
    }
  }, [id])

  const stats = {
    total: data.peserta.length,
    working: data.peserta.filter(p => p.status === 'START').length,
    finished: data.peserta.filter(p => p.status === 'FINISH').length,
    waiting: data.peserta.filter(p => p.status === 'WAITING').length,
  }

  const handleForceFinish = async (pid) => {
    if (!confirm('Paksa peserta ini selesai?')) return
    try {
      await api.post(`/peserta/${pid}/force-finish`)
      fetchMonitoring()
    } catch (err) { alert('Gagal') }
  }

  const handleReset = async (pid) => {
    if (!confirm('Reset peserta ini? Siswa bisa login dan mulai ulang ujian.')) return
    try {
      await api.post(`/peserta/${pid}/reset`)
      fetchMonitoring()
    } catch (err) { alert('Gagal') }
  }

  const filteredPeserta = data.peserta.filter(p => 
    p.student?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    p.student?.nisn?.includes(search)
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/ujian')} style={{ padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Monitoring Real-time</h1>
            <p className="page-desc">{data.sesi?.nama_sesi} — {data.sesi?.mapel?.nama_mapel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="text-right mr-4">
              <div className="text-xs text-faint">TOKEN AKTIF</div>
              <div className="text-xl font-black text-accent font-mono">{data.sesi?.token}</div>
           </div>
           <button className="btn btn-outline" onClick={fetchMonitoring} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="metric-grid mb-6">
        <div className="metric-card">
          <div className="metric-label">Total Peserta</div>
          <div className="metric-value">{stats.total}</div>
          <div className="metric-sub">Peserta terdaftar</div>
        </div>
        <div className="metric-card" style={{ borderColor: 'var(--color-primary)' }}>
          <div className="metric-label">Sedang Ujian</div>
          <div className="metric-value text-primary">{stats.working}</div>
          <div className="metric-sub">Siswa aktif mengerjakan</div>
        </div>
        <div className="metric-card" style={{ borderColor: 'var(--color-success)' }}>
          <div className="metric-label">Selesai</div>
          <div className="metric-value text-success">{stats.finished}</div>
          <div className="metric-sub">Sudah kirim jawaban</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Belum Mulai</div>
          <div className="metric-value text-muted">{stats.waiting}</div>
          <div className="metric-sub">Menunggu di gate</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-3 text-muted" />
            <input className="input pl-9" placeholder="Cari nama atau NISN..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>NISN</th>
                <th>Nama Peserta</th>
                <th>Status</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Kontrol</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeserta.map(p => (
                <tr key={p.id}>
                  <td className="text-mono text-xs">{p.student?.nisn}</td>
                  <td style={{ fontWeight: 600 }}>{p.student?.nama}</td>
                  <td>
                    <span className={`badge ${
                      p.status === 'START' ? 'badge-primary animate-pulse' :
                      p.status === 'FINISH' ? 'badge-success' :
                      p.status === 'BANNED' ? 'badge-danger' : 'badge-default'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-xs text-muted">{p.start_time ? new Date(p.start_time).toLocaleTimeString() : '—'}</td>
                  <td className="text-xs text-muted">{p.end_time ? new Date(p.end_time).toLocaleTimeString() : '—'}</td>
                  <td className="text-xs text-mono">{p.ip_address || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex justify-end gap-1">
                      {p.status === 'START' && (
                        <button className="btn btn-sm btn-ghost text-warning" title="Paksa Selesai" onClick={() => handleForceFinish(p.id)}>
                          <Power size={14} />
                        </button>
                      )}
                      <button className="btn btn-sm btn-ghost text-danger" title="Reset/Log Out" onClick={() => handleReset(p.id)}>
                        <LogOut size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPeserta.length === 0 && (
                <tr><td colSpan="7" className="p-10 text-center text-faint">Tidak ada peserta yang aktif.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
