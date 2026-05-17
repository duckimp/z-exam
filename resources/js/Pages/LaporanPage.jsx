import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { 
  BarChart2, Download, Search, ClipboardCheck,
  TrendingUp, Award, Users
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function LaporanPage({ sesi }) {
  const [search, setSearch] = useState('')

  const handleExportExcel = (id) => {
    window.open(`/laporan/sesi/${id}/excel`, '_blank')
  }

  const filteredSesi = sesi.filter(s => 
    s.nama_sesi.toLowerCase().includes(search.toLowerCase()) ||
    s.mapel?.nama_mapel.toLowerCase().includes(search.toLowerCase())
  )

  const totalSheets = sesi.reduce((acc, curr) => acc + (curr.peserta_ujian_count || 0), 0)

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

          {/* Card 3: Analitik Cerdas (Kini Serasi & Premium!) */}
          <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">Aktif</div>
              <div className="text-[10px] opacity-80 uppercase font-black tracking-wider">Analitik Cerdas Sistem</div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  )
}
