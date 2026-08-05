import { useState } from 'react'
import { useForm, router, Head, Link, usePage } from '@inertiajs/react'
import { 
  ClipboardList, Plus, Edit2, Trash2, 
  Activity, Play, Pause, RefreshCw, Clock, Calendar, X, Copy, ShieldCheck
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function SesiUjianPage({ sesi, mapel, kelas }) {
  const { auth } = usePage().props
  const userRoles = auth?.user?.roles ?? []
  const isSuperAdmin = userRoles.includes('super_admin')
  const isPengawas = userRoles.includes('pengawas')

  const [showModal, setShowModal] = useState(false)
  const [editingData, setEditingData] = useState(null)

  // ── Filter States ──
  const todayStr = new Date().toISOString().split('T')[0]
  const [filterDate, setFilterDate] = useState('today')
  const [filterTingkat, setFilterTingkat] = useState('all')

  const tingkatList = [...new Set(mapel.map(m => m.tingkat).filter(Boolean))].sort()

  const filteredSesi = sesi.filter(s => {
    const sDate = s.tanggal ? s.tanggal.substring(0, 10) : ''
    if (filterDate === 'today') {
      if (sDate !== todayStr) return false
    } else if (filterDate !== 'all') {
      if (sDate !== filterDate) return false
    }

    if (filterTingkat !== 'all') {
      if (s.mapel?.tingkat !== filterTingkat) return false
    }

    return true
  })

  const form = useForm({
    nama_sesi: '',
    mapel_id: '',
    kelas_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '07:30',
    durasi: 90,
    random_soal: true,
    random_opsi: true,
    anti_curang: false,
    use_token: true,
  })

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingData(null)
    form.setData({
      nama_sesi: '',
      mapel_id: '',
      kelas_id: '',
      tanggal: new Date().toISOString().split('T')[0],
      jam_mulai: '07:30',
      durasi: 90,
      random_soal: true,
      random_opsi: true,
      anti_curang: false,
      use_token: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (s) => {
    setEditingData(s)
    form.setData({
      nama_sesi: s.nama_sesi,
      mapel_id: s.mapel_id,
      kelas_id: s.kelas_id || '',
      tanggal: s.tanggal,
      jam_mulai: s.jam_mulai.substring(0, 5),
      durasi: s.durasi,
      random_soal: !!s.random_soal,
      random_opsi: !!s.random_opsi,
      anti_curang: !!s.anti_curang,
      use_token: !!s.use_token,
    })
    setShowModal(true)
  }

  const handleOpenDuplicate = (s) => {
    setEditingData(null)
    form.setData({
      nama_sesi: s.nama_sesi,
      mapel_id: s.mapel_id,
      kelas_id: s.kelas_id || '',
      tanggal: s.tanggal,
      jam_mulai: s.jam_mulai.substring(0, 5),
      durasi: s.durasi,
      random_soal: !!s.random_soal,
      random_opsi: !!s.random_opsi,
      anti_curang: !!s.anti_curang,
      use_token: !!s.use_token,
    })
    setShowModal(true)
  }

  const submit = (e) => {
    e.preventDefault()
    if (editingData) {
      form.put(`/ujian/sesi/${editingData.id}`, {
        onSuccess: () => setShowModal(false)
      })
    } else {
      form.post('/ujian/sesi', {
        onSuccess: () => setShowModal(false)
      })
    }
  }

  const handleDelete = (id) => {
    if (!confirm('Hapus sesi ini? Semua data jawaban peserta di sesi ini akan hilang secara permanen!')) return
    router.delete(`/ujian/sesi/${id}`)
  }

  const handleToggleActive = (s) => {
    router.put(`/ujian/sesi/${s.id}`, {
      is_active: !s.is_active
    })
  }

  const handleRefreshToken = (id) => {
    if (!confirm('Ganti token sesi ini? Peserta harus memasukkan token baru.')) return
    router.post(`/ujian/sesi/${id}/refresh-token`)
  }

  return (
    <AdminLayout>
      <Head title="Sesi Ujian" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header flex justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-slate-800">Sesi Ujian</h1>
            <p className="page-desc text-sm text-slate-500 mt-1">Kontrol jadwal, anti-curang, token, dan pemantauan ujian siswa secara real-time.</p>
          </div>
          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={14} className="mr-1.5" /> Buat Sesi Baru
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="panel bg-white border border-slate-200 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            
            {/* Filter Tanggal */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Ujian</span>
              <div className="flex items-center gap-2">
                <select 
                  className="input py-2 text-xs font-bold bg-white"
                  value={filterDate === 'today' || filterDate === 'all' ? filterDate : 'custom'}
                  onChange={e => {
                    const val = e.target.value
                    if (val === 'today') setFilterDate('today')
                    else if (val === 'all') setFilterDate('all')
                    else setFilterDate(todayStr)
                  }}
                >
                  <option value="today">Hari Ini</option>
                  <option value="all">Semua Tanggal</option>
                  <option value="custom">Pilih Tanggal...</option>
                </select>

                {filterDate !== 'today' && filterDate !== 'all' && (
                  <input 
                    type="date"
                    className="input py-1.5 text-xs font-mono font-bold"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Filter Tingkat Kelas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tingkat Kelas</span>
              <select
                className="input py-2 text-xs font-bold bg-white min-w-[140px]"
                value={filterTingkat}
                onChange={e => setFilterTingkat(e.target.value)}
              >
                <option value="all">Semua Tingkat</option>
                {tingkatList.map(t => (
                  <option key={t} value={t}>Kelas {t}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="text-xs text-slate-400 font-bold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl font-mono">
            Menampilkan: <span className="text-indigo-600 font-extrabold">{filteredSesi.length}</span> dari {sesi.length} Sesi
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredSesi.length === 0 ? (
            <div className="panel bg-white border border-slate-200 rounded-xl p-16 text-center text-xs font-mono text-slate-450">
              Tidak ada sesi ujian yang sesuai filter.
            </div>
          ) : (
            filteredSesi.map(s => (
              <div key={s.id} className="panel bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
                  
                  {/* Status Indicator & Main Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${s.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {s.is_active ? <Activity size={24} className="animate-pulse" /> : <Pause size={24} />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{s.nama_sesi}</h3>
                        <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-750 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {s.mapel?.nama_mapel}
                        </span>
                        {s.kelas && (
                          <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-750 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            {s.kelas.nama_kelas}
                          </span>
                        )}
                        {!s.is_active && (
                          <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-750 text-[9px] font-black rounded-lg uppercase tracking-wider">
                            Tutup
                          </span>
                        )}
                        {s.anti_curang ? (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-250 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-wider">
                            Anti-Curang
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-450 mt-1 font-mono">
                        <span className="flex items-center gap-1"><Calendar size={13} /> {s.tanggal ? s.tanggal.substring(0, 10) : ''}</span>
                        <span className="flex items-center gap-1"><Clock size={13} /> {s.jam_mulai.substring(0, 5)} · {s.durasi} Menit</span>
                        <span className="flex items-center gap-1"><ClipboardList size={13} /> {s.peserta_ujian_count || 0} Peserta</span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={13} /> {s.pengawas ? `Pengawas: ${s.pengawas.name}` : 'Belum ada pengawas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Token Section */}
                  {s.use_token ? (
                    <div className="w-full lg:w-44 text-center px-6 py-4 lg:py-0 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-1.5">
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token</div>
                        <div className="text-2xl font-black text-indigo-600 font-mono tracking-widest mt-0.5 select-all">{s.token}</div>
                      </div>
                      {isSuperAdmin && (
                        <button className="btn btn-sm btn-ghost text-[10px] font-bold p-1 text-slate-400 hover:text-indigo-600 flex items-center gap-1" onClick={() => handleRefreshToken(s.id)}>
                          <RefreshCw size={10} /> Regenerasi
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full lg:w-44 text-center px-6 py-4 lg:py-0 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 flex flex-col justify-center gap-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akses</div>
                      <div className="text-sm font-black text-emerald-600 mt-1">Tanpa Token</div>
                    </div>
                  )}

                  {/* Actions Section */}
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                    <Link href={`/monitoring/${s.id}`} className="btn btn-outline py-2.5 font-bold flex items-center gap-1.5">
                      <Activity size={14} /> Monitoring
                    </Link>
                    {isSuperAdmin && (
                      <>
                        <button 
                          className={`btn py-2.5 px-4 font-bold flex items-center justify-center ${s.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`} 
                          onClick={() => handleToggleActive(s)} 
                          title={s.is_active ? 'Matikan Sesi' : 'Aktifkan Sesi'}
                        >
                          {s.is_active ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
                          {s.is_active ? 'Tutup' : 'Buka'}
                        </button>
                        <button className="btn btn-ghost p-2.5 text-slate-400 hover:text-indigo-650 border border-slate-200 rounded-xl" onClick={() => handleOpenDuplicate(s)} title="Duplikat Sesi">
                          <Copy size={15} />
                        </button>
                        <button className="btn btn-ghost p-2.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl" onClick={() => handleOpenEdit(s)} title="Edit Sesi">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-ghost p-2.5 text-slate-400 hover:text-red-650 border border-slate-200 rounded-xl" onClick={() => handleDelete(s.id)} title="Hapus Sesi">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Modal: Sesi Ujian ── */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">{editingData ? 'Edit Sesi Ujian' : 'Buat Sesi Ujian Baru'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Nama Sesi (Contoh: Ujian Tengah Semester)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.data.nama_sesi} 
                    onChange={e => form.setData('nama_sesi', e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Mata Pelajaran</label>
                  <select 
                    className="input bg-white font-semibold" 
                    value={form.data.mapel_id} 
                    onChange={e => form.setData('mapel_id', e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapel.map(m => (
                      <option key={m.id} value={m.id}>{m.nama_mapel} ({m.kode_mapel})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Kelas Peserta</label>
                  <select 
                    className="input bg-white font-semibold" 
                    value={form.data.kelas_id} 
                    onChange={e => form.setData('kelas_id', e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.nama_kelas} ({k.tingkat})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tanggal</label>
                    <input 
                      type="date" 
                      className="input" 
                      value={form.data.tanggal} 
                      onChange={e => form.setData('tanggal', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Jam Mulai</label>
                    <input 
                      type="time" 
                      className="input font-mono" 
                      value={form.data.jam_mulai} 
                      onChange={e => form.setData('jam_mulai', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Durasi (Menit)</label>
                    <input 
                      type="number" 
                      className="input font-semibold" 
                      value={form.data.durasi} 
                      onChange={e => form.setData('durasi', e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* Toggles (Requested Toggles for anti-cheat, shuffle, token) */}
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 mt-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pengaturan Fleksibilitas</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Toggle: Acak Soal */}
                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-150 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="mt-1"
                        checked={form.data.random_soal}
                        onChange={e => form.setData('random_soal', e.target.checked)}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-700">Acak Urutan Soal</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Mengacak urutan butir soal siswa</div>
                      </div>
                    </label>

                    {/* Toggle: Acak Opsi */}
                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-150 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="mt-1"
                        checked={form.data.random_opsi}
                        onChange={e => form.setData('random_opsi', e.target.checked)}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-700">Acak Pilihan Opsi</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Mengacak letak opsi A, B, C, D</div>
                      </div>
                    </label>

                    {/* Toggle: Anti-Curang */}
                    <label className="flex items-start gap-3 p-3 bg-red-50/20 rounded-xl border border-red-150/40 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="mt-1 accent-indigo-600"
                        checked={form.data.anti_curang}
                        onChange={e => form.setData('anti_curang', e.target.checked)}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-indigo-750">Mode Anti-Curang</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Kunci tab pengerjaan & deteksi keluar</div>
                      </div>
                    </label>

                    {/* Toggle: Wajibkan Token */}
                    <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-150 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="mt-1"
                        checked={form.data.use_token}
                        onChange={e => form.setData('use_token', e.target.checked)}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-700">Wajibkan Token</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Memerlukan token 6 digit untuk login</div>
                      </div>
                    </label>

                  </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={form.processing}>
                    {form.processing ? 'Menyimpan...' : 'Simpan Sesi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
