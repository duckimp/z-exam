import { useState, useEffect } from 'react'
import { 
  BarChart2, FileText, Download, PieChart, 
  ArrowRight, Search, Calendar, ClipboardCheck,
  TrendingUp, Award, Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function LaporanPage() {
  const navigate = useNavigate()
  const [sesi, setSesi] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchSesi = async () => {
    try {
      const res = await api.get('/sesi')
      setSesi(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSesi() }, [])

  const handleExportExcel = (id, name) => {
    window.open(`${import.meta.env.VITE_API_URL}/laporan/sesi/${id}/excel`, '_blank')
  }

  const filteredSesi = sesi.filter(s => 
    s.nama_sesi.toLowerCase().includes(search.toLowerCase()) ||
    s.mapel?.nama_mapel.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan & Analitik</h1>
          <p className="page-desc">Unduh rekap nilai dan analisis hasil ujian.</p>
        </div>
      </div>

      <div className="panel mb-6">
        <div className="panel-header">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-3 text-muted" />
            <input className="input pl-9" placeholder="Cari sesi atau mata pelajaran..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Sesi Ujian</th>
                <th>Mata Pelajaran</th>
                <th>Tanggal</th>
                <th>Peserta</th>
                <th style={{ textAlign: 'right' }}>Aksi Laporan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center"><span className="spinner"></span></td></tr>
              ) : filteredSesi.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="font-bold">{s.nama_sesi}</div>
                    <div className="text-xs text-faint">ID: {s.id} · Token: {s.token}</div>
                  </td>
                  <td><span className="badge badge-default">{s.mapel?.nama_mapel}</span></td>
                  <td className="text-sm text-muted">{s.tanggal}</td>
                  <td>
                     <div className="flex items-center gap-1 text-sm">
                        <Users size={12} className="text-muted" /> {s.peserta_count}
                     </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex justify-end gap-2">
                       <button className="btn btn-sm btn-outline gap-2" onClick={() => navigate(`/analitik/${s.id}`)}>
                         <BarChart2 size={14} /> Analisis
                       </button>
                       <button className="btn btn-sm btn-primary gap-2" onClick={() => handleExportExcel(s.id, s.nama_sesi)}>
                         <Download size={14} /> Excel
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSesi.length === 0 && !loading && (
                <tr><td colSpan="5" className="p-10 text-center text-faint">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="panel p-6 bg-accent text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
               <Award size={24} />
            </div>
            <div>
               <div className="text-2xl font-black">{sesi.length}</div>
               <div className="text-xs opacity-80 uppercase font-bold tracking-wider">Total Sesi Terarsip</div>
            </div>
         </div>
         <div className="panel p-6 bg-success text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
               <ClipboardCheck size={24} />
            </div>
            <div>
               <div className="text-2xl font-black">{sesi.reduce((acc, curr) => acc + (curr.peserta_count || 0), 0)}</div>
               <div className="text-xs opacity-80 uppercase font-bold tracking-wider">Total Lembar Jawaban</div>
            </div>
         </div>
         <div className="panel p-6 bg-surface-2 flex items-center gap-4 border-2 border-dashed">
            <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
               <TrendingUp size={24} />
            </div>
            <div>
               <div className="text-sm font-bold">Analitik Cerdas</div>
               <div className="text-xs text-muted">Fitur AI Prediction coming soon</div>
            </div>
         </div>
      </div>
    </div>
  )
}
