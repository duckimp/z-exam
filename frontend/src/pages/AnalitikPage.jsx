import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts'
import { 
  ArrowLeft, Download, Award, TrendingUp, TrendingDown, 
  Users, Activity, FileText
} from 'lucide-react'
import api from '../services/api'

export default function AnalitikPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await api.get(`/laporan/sesi/${id}/stats`)
      setStats(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [id])

  if (loading) return <div className="p-20 text-center"><span className="spinner"></span></div>
  if (!stats) return <div className="p-20 text-center">Data tidak ditemukan.</div>

  const chartData = Object.keys(stats.distribusi).map(key => ({
    range: key,
    jumlah: stats.distribusi[key]
  }))

  const COLORS = ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981', '#6366f1']

  return (
    <div className="animate-fade-in pb-10">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/laporan')} style={{ padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Analitik Hasil Ujian</h1>
            <p className="page-desc">Visualisasi statistik dan distribusi skor peserta.</p>
          </div>
        </div>
        <button className="btn btn-outline gap-2" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/laporan/sesi/${id}/excel`, '_blank')}>
          <Download size={14} /> Export Detail (Excel)
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="panel p-6 border-left-4 border-accent">
           <div className="text-xs text-faint uppercase font-bold tracking-widest mb-1">Rata-rata Skor</div>
           <div className="text-3xl font-black">{stats.rata_rata}</div>
        </div>
        <div className="panel p-6 border-left-4 border-success">
           <div className="text-xs text-faint uppercase font-bold tracking-widest mb-1">Skor Tertinggi</div>
           <div className="text-3xl font-black text-success">{stats.tertinggi}</div>
        </div>
        <div className="panel p-6 border-left-4 border-danger">
           <div className="text-xs text-faint uppercase font-bold tracking-widest mb-1">Skor Terendah</div>
           <div className="text-3xl font-black text-danger">{stats.terendah}</div>
        </div>
        <div className="panel p-6 border-left-4 border-muted">
           <div className="text-xs text-faint uppercase font-bold tracking-widest mb-1">Total Peserta</div>
           <div className="text-3xl font-black">{stats.total_peserta}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart: Distribusi Nilai */}
        <div className="panel p-6">
           <h3 className="font-bold mb-6 flex items-center gap-2">
             <Activity size={16} className="text-accent" /> Distribusi Skor
           </h3>
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'var(--color-surface-2)'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Insight Card */}
        <div className="flex flex-col gap-6">
           <div className="panel p-6 bg-surface-2 flex-1">
              <h3 className="font-bold mb-4">Informasi Penting</h3>
              <div className="flex flex-col gap-4">
                 <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                       <TrendingUp size={16} />
                    </div>
                    <div>
                       <div className="text-sm font-bold">Kualitas Soal Baik</div>
                       <div className="text-xs text-muted">Sebagian besar siswa berada pada rentang nilai menengah ke atas.</div>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                       <TrendingDown size={16} />
                    </div>
                    <div>
                       <div className="text-sm font-bold">Butuh Remedial</div>
                       <div className="text-xs text-muted">{stats.distribusi['0-20'] + stats.distribusi['21-40']} siswa membutuhkan bimbingan tambahan.</div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="panel p-6 border-accent/20 bg-accent/5">
              <div className="flex items-center justify-between mb-2">
                 <div className="text-sm font-bold text-accent uppercase tracking-tighter">Export Raport</div>
                 <FileText size={20} className="text-accent" />
              </div>
              <p className="text-xs text-muted mb-4">Ingin mencetak detail jawaban siswa dalam format PDF secara massal?</p>
              <button className="btn btn-sm btn-accent w-full justify-center">Generate Batch PDF (Soon)</button>
           </div>
        </div>
      </div>
    </div>
  )
}
