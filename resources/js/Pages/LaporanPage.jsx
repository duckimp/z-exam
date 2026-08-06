import { useState, useEffect, useMemo } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { 
  BarChart2, Download, Search, ClipboardCheck,
  TrendingUp, Award, Users, ChevronDown, Sparkles, AlertTriangle, BookOpen, ExternalLink
} from 'lucide-react'
import axios from 'axios'
import AdminLayout from '@/Layouts/AdminLayout'

export default function LaporanPage({ sesi }) {
  const [search, setSearch] = useState('')
  const [selectedSesiId, setSelectedSesiId] = useState('')
  const [widgetStats, setWidgetStats] = useState(null)
  const [widgetAnomalies, setWidgetAnomalies] = useState([])
  const [widgetRemedial, setWidgetRemedial] = useState([])
  const [widgetLoading, setWidgetLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleExportExcel = (id) => {
    window.open(`/laporan/sesi/${id}/excel`, '_blank')
  }

  const filteredSesi = sesi.filter(s => 
    s.nama_sesi.toLowerCase().includes(search.toLowerCase()) ||
    s.mapel?.nama_mapel.toLowerCase().includes(search.toLowerCase())
  )

  const totalSheets = sesi.reduce((acc, curr) => acc + (curr.peserta_ujian_count || 0), 0)

  // Default selected sesi: yang punya peserta terbanyak atau teratas
  useEffect(() => {
    if (sesi && sesi.length > 0 && !selectedSesiId) {
      const topSesi = [...sesi].sort((a, b) => (b.peserta_ujian_count || 0) - (a.peserta_ujian_count || 0))[0]
      setSelectedSesiId(topSesi ? topSesi.id.toString() : sesi[0].id.toString())
    }
  }, [sesi])

  // Fetch summary stats whenever selectedSesiId changes
  useEffect(() => {
    if (!selectedSesiId) return

    setWidgetLoading(true)
    
    // Fetch basic stats
    axios.get(`/api/laporan/sesi/${selectedSesiId}/stats`)
      .then(res => {
        setWidgetStats(res.data)
      })
      .catch(err => {
        console.error('Error fetching widget stats:', err)
      })

    // Fetch anomalies count
    axios.get(`/api/laporan/sesi/${selectedSesiId}/deteksi-anomali`)
      .then(res => {
        setWidgetAnomalies(res.data || [])
      })
      .catch(err => {
        console.error('Error fetching anomalies:', err)
      })

    // Fetch remedial map for weakest topic
    axios.get(`/api/laporan/sesi/${selectedSesiId}/peta-remedial`)
      .then(res => {
        setWidgetRemedial(res.data || [])
      })
      .catch(err => {
        console.error('Error fetching remedial:', err)
      })
      .finally(() => {
        setWidgetLoading(false)
      })
  }, [selectedSesiId])

  const selectedSesiObj = sesi.find(s => s.id.toString() === selectedSesiId.toString())

  const handleSesiSelect = (sesiId) => {
    setSelectedSesiId(sesiId.toString())
    setDropdownOpen(false)
  }

  const handleNavigateToAnalitik = () => {
    if (selectedSesiObj) {
      router.get(`/laporan/analitik/${selectedSesiObj.id}`)
    }
  }

  return (
    <AdminLayout>
      <Head title="Laporan & Analitik" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-[var(--color-text)]">Laporan & Analitik</h1>
            <p className="page-desc text-sm text-[var(--color-text-muted)] mt-1">Unduh rekap nilai kelulusan kelas dan analisis hasil statistik butir soal.</p>
          </div>
        </div>

        {/* Main Panel */}
        <div className="panel bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="relative w-full max-w-sm flex items-center">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] z-10" />
              <input 
                className="input text-xs font-semibold py-2.5" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Cari sesi atau mata pelajaran..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] uppercase tracking-wider">
                  <th className="p-4 pl-6">Sesi Ujian</th>
                  <th className="p-4">Mata Pelajaran</th>
                  <th className="p-4">Tanggal Pelaksanaan</th>
                  <th className="p-4 text-center">Peserta</th>
                  <th className="p-4 pr-6 text-right">Rekap Laporan</th>
                </tr>
              </thead>
              <tbody>
                {filteredSesi.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center text-xs font-mono text-[var(--color-text-muted)]">
                      Tidak ada sesi laporan aktif.
                    </td>
                  </tr>
                ) : (
                  filteredSesi.map(s => (
                    <tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)] transition-colors text-sm">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-[var(--color-text)]">{s.nama_sesi}</div>
                        <div className="text-[10px] font-semibold font-mono text-[var(--color-text-muted)] mt-0.5">Kode: {s.token} · Sesi ID: #{s.id}</div>
                      </td>
                      <td className="p-4">
                        <span 
                          className="px-2.5 py-1 text-xs font-bold rounded-lg uppercase border tracking-wider"
                          style={{
                            backgroundColor: 'var(--color-accent-soft)',
                            color: 'var(--color-accent-text)',
                            borderColor: 'var(--color-border)'
                          }}
                        >
                          {s.mapel?.nama_mapel}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold text-[var(--color-text-2)] font-mono">{s.tanggal}</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-xs font-bold rounded-lg font-mono flex items-center gap-1.5 justify-center w-max mx-auto">
                          <Users size={12} className="text-[var(--color-text-faint)]" /> {s.peserta_ujian_count || 0}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/laporan/analitik/${s.id}`} className="btn btn-sm btn-outline py-2 font-bold flex items-center gap-1.5">
                            <BarChart2 size={13} /> Analisis
                          </Link>
                          <button className="btn btn-sm btn-primary py-2 font-bold flex items-center gap-1.5" onClick={() => handleExportExcel(s.id)}>
                            <Download size={13} /> Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Total Sesi */}
          <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-sm text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
              <Award size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{sesi.length}</div>
              <div className="text-[10px] opacity-80 uppercase font-black tracking-wider">Total Sesi Terarsip</div>
            </div>
          </div>

          {/* Card 2: Lembar Jawaban */}
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-sm text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{totalSheets}</div>
              <div className="text-[10px] opacity-80 uppercase font-black tracking-wider">Lembar Jawaban Dikirim</div>
            </div>
          </div>

          {/* Card 3: Analitik Cerdas - Interactive Quick Stats Widget */}
          {sesi.length > 0 ? (
            <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm text-white relative overflow-hidden group">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

              {/* Left side: Stats */}
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <div className="text-[10px] opacity-80 uppercase font-black tracking-wider">Analitik Cerdas</div>
                    <div className="text-xs font-bold opacity-90">Quick Stats Widget</div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Rata-rata Kelulusan Global */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="text-[9px] opacity-70 uppercase font-black tracking-wider mb-1">Rata-rata Global</div>
                    <div className="text-2xl font-black font-mono">
                      {widgetLoading ? (
                        <span className="animate-pulse">--</span>
                      ) : widgetStats ? (
                        `${widgetStats.rata_rata ?? '-'}`
                      ) : (
                        '-'
                      )}
                    </div>
                    <div className="text-[9px] opacity-60 font-mono">/ 100</div>
                  </div>

                  {/* Anomali Terdeteksi */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="flex items-center gap-1 text-[9px] opacity-70 uppercase font-black tracking-wider mb-1">
                      <AlertTriangle size={10} />
                      Anomali Terdeteksi
                    </div>
                    <div className="text-2xl font-black font-mono">
                      {widgetLoading ? (
                        <span className="animate-pulse">--</span>
                      ) : (
                        widgetAnomalies.length
                      )}
                    </div>
                    <div className="text-[9px] opacity-60">kasus</div>
                  </div>

                  {/* Topik Paling Lemah */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 min-w-0">
                    <div className="text-[9px] opacity-70 uppercase font-black tracking-wider mb-1">Topik Lemah</div>
                    <div className="text-sm font-bold truncate" title={widgetRemedial[0]?.topik}>
                      {widgetLoading ? (
                        <span className="animate-pulse bg-white/20 h-4 w-24 rounded inline-block" />
                      ) : widgetRemedial[0]?.topik ? (
                        widgetRemedial[0].topik
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </div>
                    {widgetRemedial[0]?.persentase_salah && !widgetLoading && (
                      <div className="text-[9px] opacity-60 font-mono">
                        {widgetRemedial[0].persentase_salah.toFixed(1)}% kesalahan
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all text-sm font-bold"
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <BookOpen size={14} className="flex-shrink-0" />
                      <span className="truncate">
                        {selectedSesiObj?.nama_sesi || 'Pilih Sesi Ujian'}
                      </span>
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={`flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-fade-in">
                      <div className="p-2 max-h-60 overflow-y-auto">
                        {sesi.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleSesiSelect(s.id)}
                            className={`w-full px-3 py-2.5 rounded-lg text-left transition-colors flex items-center gap-3 ${
                              selectedSesiId === s.id.toString()
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedSesiId === s.id.toString() ? 'bg-purple-500' : 'bg-slate-300'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate">{s.nama_sesi}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {s.mapel?.nama_mapel} • {s.peserta_ujian_count || 0} peserta
                              </div>
                            </div>
                            {selectedSesiId === s.id.toString() && (
                              <Sparkles size={14} className="text-purple-500 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Action button */}
              <div className="relative z-10 flex items-end mt-4 md:mt-0">
                <button
                  onClick={handleNavigateToAnalitik}
                  disabled={!selectedSesiObj || widgetLoading}
                  className="w-full md:w-auto px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  <span>Buka Analitik Sesi</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-2xl font-black">-</div>
                <div className="text-[10px] opacity-80 uppercase font-black tracking-wider">Analitik Cerdas Sistem</div>
                <div className="text-[10px] font-bold mt-1.5 opacity-90">Belum ada sesi ujian</div>
              </div>
            </div>
          )}

        </div>

      </div>
    </AdminLayout>
  )
}
