import { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { 
  ArrowLeft, Download, Award, TrendingUp, TrendingDown, 
  Users, Activity, FileText, X, Check, Filter, ChevronDown, 
  Trophy, AlertTriangle, GraduationCap
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// Helper to escape unsafe HTML tags
function escapeUnsafeHtml(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (match, slash, tagName, attribs) => {
    const lowerTag = tagName.toLowerCase();
    const safeTags = ['strong', 'b', 'em', 'i', 'u', 'br', 'img', 'div', 'span', 'p'];
    
    // Allow 'a' tag ONLY if it has an href attribute (i.e. it's a real formatting link)
    if (lowerTag === 'a' && attribs.toLowerCase().includes('href')) {
      return match;
    }
    
    if (safeTags.includes(lowerTag)) {
      return match;
    }
    
    return `&lt;${slash}${tagName}${attribs}&gt;`;
  });
}

// Helper to parse math from text
function renderMathContent(text = '') {
  if (!text) return ''
  
  // Simple check to render equations if they exist
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const eq = part.slice(2, -2)
      return <BlockMath key={idx} math={eq} />
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const eq = part.slice(1, -1)
      return <InlineMath key={idx} math={eq} />
    }
    return <span key={idx} dangerouslySetInnerHTML={{ __html: escapeUnsafeHtml(part) }} />
  })
}

export default function AnalitikPage({ 
  sesi, 
  stats, 
  peserta = [], 
  top_3_tertinggi = [], 
  top_3_terendah = [],
  filter_options = { kelas: [], generasi: [] },
  current_filter = { kelas_id: null, generasi: null, semua: false }
}) {
  const [selectedPeserta, setSelectedPeserta] = useState(null)
  const [nilai, setNilai] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    kelas_id: current_filter.kelas_id || '',
    generasi: current_filter.generasi || '',
    semua: current_filter.semua || false
  })

  const openKoreksiModal = (p) => {
    setSelectedPeserta(p)
    const initialNilai = {}
    p.jawaban?.forEach(j => {
      if (j.soal?.tipe === 'ESSAY') {
        initialNilai[j.soal_id] = j.score ?? 0
      }
    })
    setNilai(initialNilai)
  }

  const closeKoreksiModal = () => {
    setSelectedPeserta(null)
    setNilai({})
  }

  const handleNilaiChange = (soalId, val) => {
    setNilai(prev => ({
      ...prev,
      [soalId]: val
    }))
  }

  const saveKoreksi = () => {
    setSaving(true)
    router.post(`/laporan/peserta/${selectedPeserta.id}/koreksi`, { nilai }, {
      onSuccess: () => {
        alert('Penilaian essay berhasil disimpan dan skor akhir peserta telah diperbarui!')
        closeKoreksiModal()
      },
      onError: (err) => {
        alert('Terjadi kesalahan saat menyimpan penilaian.')
      },
      onFinish: () => {
        setSaving(false)
      }
    })
  }

  const essayAnswers = selectedPeserta 
    ? (selectedPeserta.jawaban?.filter(j => j.soal?.tipe === 'ESSAY') || [])
    : []

  const chartData = Object.keys(stats.distribusi).map(key => ({
    range: key,
    jumlah: stats.distribusi[key]
  }))

  const COLORS = ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981', '#6366f1']
  
  // Find maximum value to scale the premium custom bar graph
  const maxCount = Math.max(...chartData.map(d => d.jumlah), 1)

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setIsFiltering(true)
    const params = {}
    if (filters.semua) {
      params.semua = 'true'
    } else {
      if (filters.kelas_id) params.kelas_id = filters.kelas_id
      if (filters.generasi) params.generasi = filters.generasi
    }
    
    router.get(`/laporan/analitik/${sesi.id}`, params, {
      preserveScroll: true,
      onFinish: () => {
        setIsFiltering(false)
        setFilterOpen(false)
      }
    })
  }

  const resetFilters = () => {
    setFilters({ kelas_id: '', generasi: '', semua: false })
    setIsFiltering(true)
    router.get(`/laporan/analitik/${sesi.id}`, {}, {
      preserveScroll: true,
      onFinish: () => {
        setIsFiltering(false)
        setFilterOpen(false)
      }
    })
  }

  const hasActiveFilters = filters.kelas_id || filters.generasi || filters.semua

  return (
    <AdminLayout>
      <Head title="Analitik Hasil Ujian" />
      <div className="animate-fade-in pb-10">
        
        {/* Header */}
        <div className="page-header flex justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link 
              href="/laporan" 
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="page-title text-2xl font-black text-slate-800">Analitik Hasil Ujian</h1>
              <p className="page-desc text-sm text-slate-500 mt-1">Visualisasi statistik nilai dan sebaran distribusi skor peserta.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={`/laporan/sesi/${sesi.id}/excel`} 
              className="btn btn-outline py-2.5 font-bold flex items-center gap-1.5"
              target="_blank"
              rel="noreferrer"
            >
              <Download size={14} /> Export Excel
            </a>
            {/* Filter Button */}
            <div className="relative">
              <button
                className={`btn btn-outline py-2.5 font-bold flex items-center gap-1.5 ${hasActiveFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter size={14} /> Filter
                <ChevronDown size={14} />
                {hasActiveFilters && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
              </button>
              
              {/* Filter Dropdown */}
              {filterOpen && (
                <>
                  {/* Backdrop overlay */}
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  {/* Dropdown content - positioned relative to the button's parent (relative container) */}
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">Filter Data</h3>
                      {hasActiveFilters && (
                        <button 
                          className="text-xs text-indigo-600 hover:underline"
                          onClick={resetFilters}
                          disabled={isFiltering}
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {/* Semua Siswa */}
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors">
                        <input
                          type="radio"
                          name="filter_type"
                          checked={filters.semua}
                          onChange={() => handleFilterChange('semua', true)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <Users size={14} className="text-slate-400" />
                            Semua Siswa
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">Tampilkan semua peserta tanpa filter</div>
                        </div>
                      </label>

                      {/* Per Kelas */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors">
                          <input
                            type="radio"
                            name="filter_type"
                            checked={!!filters.kelas_id && !filters.semua}
                            onChange={() => handleFilterChange('kelas_id', filter_options.kelas[0]?.id || '')}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800 flex items-center gap-1.5">
                              <GraduationCap size={14} className="text-slate-400" />
                              Per Kelas
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">Filter berdasarkan kelas spesifik</div>
                          </div>
                        </label>
                        {filter_options.kelas.length > 0 && (
                          <select
                            value={filters.kelas_id}
                            onChange={(e) => handleFilterChange('kelas_id', e.target.value)}
                            disabled={filters.semua}
                            className="w-full mt-2 p-2 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                          >
                            <option value="">-- Pilih Kelas --</option>
                            {filter_options.kelas.map(k => (
                              <option key={k.id} value={k.id}>{k.label}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Per Generasi/Paralel */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors">
                          <input
                            type="radio"
                            name="filter_type"
                            checked={!!filters.generasi && !filters.semua && !filters.kelas_id}
                            onChange={() => handleFilterChange('generasi', filter_options.generasi[0]?.value || '')}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800 flex items-center gap-1.5">
                              <Award size={14} className="text-slate-400" />
                              Per Generasi / Paralel
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">Filter berdasarkan tingkat kelas (semua paralel)</div>
                          </div>
                        </label>
                        {filter_options.generasi.length > 0 && (
                          <select
                            value={filters.generasi}
                            onChange={(e) => handleFilterChange('generasi', e.target.value)}
                            disabled={filters.semua || !!filters.kelas_id}
                            className="w-full mt-2 p-2 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                          >
                            <option value="">-- Pilih Generasi --</option>
                            {filter_options.generasi.map(g => (
                              <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        className="btn btn-outline py-2 px-4 font-bold"
                        onClick={() => setFilterOpen(false)}
                      >
                        Batal
                      </button>
                      <button
                        className="btn btn-primary py-2 px-4 font-bold flex items-center gap-1.5"
                        onClick={applyFilters}
                        disabled={isFiltering}
                      >
                        {isFiltering ? 'Menerapkan...' : 'Terapkan Filter'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1.5">Rata-rata Skor</div>
             <div className="text-3xl font-black text-indigo-600 font-mono">{stats.rata_rata}</div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1.5">Skor Tertinggi</div>
             <div className="text-3xl font-black text-emerald-600 font-mono">{stats.tertinggi}</div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1.5">Skor Terendah</div>
             <div className="text-3xl font-black text-rose-600 font-mono">{stats.terendah}</div>
          </div>

          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1.5">Total Peserta</div>
             <div className="text-3xl font-black text-slate-800 font-mono">{stats.total_peserta}</div>
          </div>

        </div>

        {/* Top 3 Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Top 3 Tertinggi */}
          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-700 mb-5 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-emerald-700">Top 3 Nilai Tertinggi</span>
            </h3>
            
            {top_3_tertinggi.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400">
                Belum ada data nilai tertinggi.
              </div>
            ) : (
              <div className="space-y-3">
                {top_3_tertinggi.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl hover:bg-emerald-50/50 transition-colors">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
                         style={{ 
                           backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7f32' 
                         }}>
                      {index + 1}
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{item.nama}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <GraduationCap size={10} />
                        <span>{item.kelas}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-400">NISN: {item.nisn}</span>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600 font-mono">{item.score}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Skor</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 3 Terendah */}
          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-700 mb-5 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" />
              <span className="text-rose-700">Top 3 Nilai Terendah</span>
            </h3>
            
            {top_3_terendah.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400">
                Belum ada data nilai terendah.
              </div>
            ) : (
              <div className="space-y-3">
                {top_3_terendah.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-rose-50/30 border border-rose-100 rounded-xl hover:bg-rose-50/50 transition-colors">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-black text-slate-500 text-lg">
                      {top_3_tertinggi.length + index + 1}
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{item.nama}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <GraduationCap size={10} />
                        <span>{item.kelas}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-400">NISN: {item.nisn}</span>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-rose-600 font-mono">{item.score}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Skor</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sebaran Nilai Grafis (100% Offline LAN-friendly) */}
          <div className="panel bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-sm font-extrabold text-slate-700 mb-6 flex items-center gap-2">
               <Activity size={16} className="text-indigo-600" /> Distribusi Sebaran Skor
             </h3>
             
             {/* Beautiful CSS bar graph */}
             <div className="flex flex-col gap-5 pt-2">
               {chartData.map((d, idx) => {
                 const pct = (d.jumlah / maxCount) * 100
                 return (
                   <div key={d.range} className="flex flex-col gap-1.5">
                     <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                       <span className="font-mono">{d.range}</span>
                       <span className="font-mono text-slate-750">{d.jumlah} Siswa ({Math.round((d.jumlah / (stats.total_peserta || 1)) * 100)}%)</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                       <div 
                         className="h-full rounded-full transition-all duration-500" 
                         style={{ 
                           width: `${pct}%`,
                           backgroundColor: COLORS[idx % COLORS.length]
                         }} 
                       />
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>

          {/* Insight Card */}
          <div className="flex flex-col gap-6">
             <div className="panel p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex-1">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4">Informasi Hasil Ujian</h3>
                <div className="flex flex-col gap-5">
                   
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                         <TrendingUp size={16} />
                      </div>
                      <div>
                         <div className="text-sm font-bold text-slate-800">Evaluasi Rata-Rata</div>
                         <div className="text-xs text-slate-450 mt-0.5 leading-relaxed font-semibold">
                           Rata-rata pencapaian siswa adalah <span className="font-bold text-slate-700">{stats.rata_rata}</span> dari total {stats.total_peserta} peserta.
                         </div>
                      </div>
                   </div>

                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                         <TrendingDown size={16} />
                      </div>
                      <div>
                         <div className="text-sm font-bold text-slate-800">Rentang Rendah</div>
                         <div className="text-xs text-slate-455 mt-0.5 leading-relaxed font-semibold">
                           Terdapat <span className="font-bold text-slate-750">{stats.distribusi['0-20'] + stats.distribusi['21-40']} siswa</span> yang berada pada rentang nilai di bawah 40.
                         </div>
                      </div>
                   </div>

                </div>
             </div>
             
             <div className="panel p-5 bg-indigo-50/30 border border-indigo-150 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col gap-1 pr-4">
                   <div className="text-xs font-black text-indigo-750 uppercase tracking-wide">Hasil Detail</div>
                   <p className="text-[10px] text-slate-450 font-bold leading-relaxed">Gunakan tombol ekspor untuk mencetak seluruh detail rekap nilai siswa ke format Excel (.xlsx) secara instan.</p>
                </div>
                <FileText size={28} className="text-indigo-500 flex-shrink-0" />
             </div>
          </div>

        </div>


         {/* Table of Participant Results */}
         <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
               <span className="text-sm font-extrabold text-slate-800">Daftar Hasil & Lembar Jawaban Siswa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 bg-slate-50/30 uppercase tracking-wider">
                    <th className="p-4 pl-6">NISN</th>
                    <th className="p-4">Nama Peserta</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Skor Akhir</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {peserta.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-16 text-center text-xs font-mono text-slate-400">
                        Belum ada peserta yang mengikuti sesi ujian ini.
                      </td>
                    </tr>
                  ) : (
                    peserta.map(p => {
                      const hasEssays = p.jawaban?.some(j => j.soal?.tipe === 'ESSAY');
                      
                      return (
                        <tr key={p.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors text-sm">
                          <td className="p-4 pl-6 font-mono text-xs text-slate-600">{p.student?.nisn}</td>
                          <td className="p-4 font-bold text-slate-800">{p.student?.nama}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                              p.status === 'START' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' :
                              p.status === 'FINISH' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                              p.status === 'BANNED' ? 'bg-red-50 border border-red-200 text-red-700' : 
                              'bg-slate-100 border border-slate-200 text-slate-500'
                            }`}>
                              {p.status === 'START' ? 'Pengerjaan' : p.status === 'FINISH' ? 'Selesai' : p.status === 'BANNED' ? 'Diblokir' : 'Menunggu'}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-black text-slate-700 text-base">
                            {p.score ?? 0}
                          </td>
                          <td className="p-4 pr-6 text-right flex justify-end gap-2">
                            {hasEssays && (
                              <button 
                                className="btn btn-xs btn-outline py-1.5 font-bold flex items-center gap-1.5 text-indigo-650 border-indigo-200 hover:bg-indigo-50/50 cursor-pointer"
                                onClick={() => openKoreksiModal(p)}
                              >
                                <FileText size={12} /> Koreksi Essay
                              </button>
                            )}
                            <button 
                              className="btn btn-xs btn-outline py-1.5 font-bold flex items-center gap-1.5 text-slate-650 hover:bg-slate-50 cursor-pointer"
                              onClick={() => window.open(`/laporan/peserta/${p.id}/pdf`, '_blank')}
                            >
                              <Download size={12} /> Cetak LJA
                            </button>
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

      {/* Modal Koreksi Essay */}
      {selectedPeserta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
               <div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Koreksi Jawaban Manual</span>
                 <h3 className="text-base font-extrabold text-slate-800 mt-0.5">Koreksi Essay: {selectedPeserta.student?.nama}</h3>
               </div>
               <button 
                 className="p-1.5 text-slate-400 hover:text-slate-755 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all cursor-pointer"
                 onClick={closeKoreksiModal}
               >
                 <X size={16} />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
               {essayAnswers.length === 0 ? (
                 <div className="p-8 text-center text-xs font-mono text-slate-400">
                    Tidak ditemukan jawaban essay untuk siswa ini.
                 </div>
               ) : (
                 essayAnswers.map((j, idx) => (
                   <div key={j.id} className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col gap-4">
                      
                      {/* Soal */}
                      <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Soal Essay #{idx + 1} (Bobot Maks: {j.soal?.bobot ?? 0})</span>
                         <div className="text-sm font-bold text-slate-755 mt-1.5 leading-relaxed">{renderMathContent(j.soal?.konten)}</div>
                      </div>

                      {/* Jawaban Siswa */}
                      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                         <span className="text-[9px] font-black text-indigo-650 uppercase tracking-wider">Jawaban Siswa</span>
                         <p className="text-sm font-semibold text-slate-700 whitespace-pre-line mt-1.5 leading-relaxed">
                            {j.jawaban || <span className="text-slate-350 italic font-medium">Siswa tidak mengisi jawaban.</span>}
                         </p>
                      </div>

                      {/* Kunci Jawaban Essay */}
                      <div className="p-4 bg-amber-50/40 border border-amber-150 rounded-lg">
                         <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Kunci Jawaban Guru / Referensi</span>
                         <p className="text-sm font-bold text-amber-850 whitespace-pre-line mt-1.5 leading-relaxed">
                            {j.soal?.kunci_essay || <span className="text-amber-600/50 italic font-medium">Tidak ada kunci jawaban kustom yang diinput.</span>}
                         </p>
                      </div>

                      {/* Input Nilai */}
                      <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-lg w-max shadow-sm">
                         <label className="text-xs font-black text-slate-555 uppercase tracking-wider">Berikan Nilai:</label>
                         <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              className="w-20 p-2 text-center text-sm font-black border border-slate-200 focus:border-indigo-600 focus:outline-none rounded-lg bg-slate-50"
                              min="0"
                              max={j.soal?.bobot ?? 100}
                              value={nilai[j.soal_id] ?? 0}
                              onChange={(e) => handleNilaiChange(j.soal_id, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-xs font-bold text-slate-400">/ {j.soal?.bobot ?? 0} Poin</span>
                         </div>
                      </div>

                   </div>
                 ))
               )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
               <button 
                 className="btn btn-outline py-2.5 px-6 font-bold cursor-pointer"
                 onClick={closeKoreksiModal}
                 disabled={saving}
               >
                 Batal
               </button>
               <button 
                 className="btn btn-primary py-2.5 px-8 font-bold flex items-center gap-1.5 cursor-pointer"
                 onClick={saveKoreksi}
                 disabled={saving || essayAnswers.length === 0}
               >
                 {saving ? 'Menyimpan...' : 'Simpan & Hitung Skor'} <Check size={14} />
               </button>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  )
}