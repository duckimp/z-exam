import { useState, useEffect } from 'react'
import { useForm, router, Head, Link } from '@inertiajs/react'
import {
  Users, Plus, Upload, Printer, Search,
  Edit2, Trash2, KeyRound, X, ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function SiswaPage({ siswa, kelas, filters }) {
  const [activeTab, setActiveTab] = useState(filters?.tab || 'peserta')
  const [search, setSearch] = useState(filters?.search || '')
  const [selectedKelas, setSelectedKelas] = useState(filters?.kelas_id || 'all')
  const [selectedIds, setSelectedIds] = useState([])

  const [siswaToDelete, setSiswaToDelete] = useState(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Modals & States
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalImportSiswa, setShowModalImportSiswa] = useState(false)
  const [showModalImportKelas, setShowModalImportKelas] = useState(false)
  const [showModalKelas, setShowModalKelas] = useState(false)
  const [editingData, setEditingData] = useState(null)

  // Forms
  const formSiswa = useForm({
    kelas_id: '',
    nisn: '',
    nama: '',
    ttl: '',
    tempat_lahir: '',
    jk: 'L',
    is_active: true
  })

  const formKelas = useForm({
    nama_kelas: '',
    tingkat: 'XI',
    tahun_ajar: '2025/2026',
    wali_kelas: ''
  })

  const formImport = useForm({
    file: null,
    kelas_id: ''
  })

  // Sync filters to backend
  useEffect(() => {
    if (activeTab === 'peserta') {
      const timer = setTimeout(() => {
        router.get('/siswa', { search, kelas_id: selectedKelas, tab: 'peserta' }, { 
          preserveState: true,
          replace: true
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [search, selectedKelas, activeTab])

  // ── Bulk Actions ─────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    const currentPageIds = siswa.data.map(s => s.id)
    const allSelected = currentPageIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      setSelectedIds(prev => {
        const next = [...prev]
        currentPageIds.forEach(id => {
          if (!next.includes(id)) next.push(id)
        })
        return next;
      })
    }
  }

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true)
  }

  const confirmBulkDelete = () => {
    router.post('/siswa/bulk-delete', { ids: selectedIds }, {
      onSuccess: () => {
        setSelectedIds([])
        setShowBulkDeleteConfirm(false)
      }
    })
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleDeleteSiswa = (siswaObj) => {
    setSiswaToDelete(siswaObj)
  }

  const confirmDeleteSiswa = () => {
    if (!siswaToDelete) return
    router.delete(`/siswa/${siswaToDelete.id}`, {
      onSuccess: () => {
        setSiswaToDelete(null)
      }
    })
  }

  const handleResetPassword = (id) => {
    if (!confirm('Yakin ingin mereset password peserta ke NISN?')) return
    router.post(`/siswa/${id}/reset-password`)
  }

  const handlePrintKartu = () => {
    window.open(`/siswa/export-kartu?kelas_id=${selectedKelas}`, '_blank')
  }

  const handleOpenEditSiswa = (s) => {
    setEditingData(s)
    formSiswa.setData({
      kelas_id: s.kelas_id || '',
      nisn: s.nisn,
      nama: s.nama,
      ttl: s.ttl || '',
      tempat_lahir: s.tempat_lahir || '',
      jk: s.jk || 'L',
      is_active: s.is_active
    })
    setShowModalSiswa(true)
  }

  const handleOpenAddSiswa = () => {
    setEditingData(null)
    formSiswa.reset()
    setShowModalSiswa(true)
  }

  const submitSiswa = (e) => {
    e.preventDefault()
    if (editingData) {
      formSiswa.put(`/siswa/${editingData.id}`, {
        onSuccess: () => {
          setShowModalSiswa(false)
          formSiswa.reset()
        }
      })
    } else {
      formSiswa.post('/siswa', {
        onSuccess: () => {
          setShowModalSiswa(false)
          formSiswa.reset()
        }
      })
    }
  }

  // ── Kelas Actions ───────────────────────────────────────────────────────────
  const handleOpenEditKelas = (k) => {
    setEditingData(k)
    formKelas.setData({
      nama_kelas: k.nama_kelas,
      tingkat: k.tingkat,
      tahun_ajar: k.tahun_ajar,
      wali_kelas: k.wali_kelas || ''
    })
    setShowModalKelas(true)
  }

  const handleOpenAddKelas = () => {
    setEditingData(null)
    formKelas.reset()
    setShowModalKelas(true)
  }

  const submitKelas = (e) => {
    e.preventDefault()
    if (editingData) {
      formKelas.put(`/kelas/${editingData.id}`, {
        onSuccess: () => {
          setShowModalKelas(false)
          formKelas.reset()
        }
      })
    } else {
      formKelas.post('/kelas', {
        onSuccess: () => {
          setShowModalKelas(false)
          formKelas.reset()
        }
      })
    }
  }

  const handleDeleteKelas = (id) => {
    if (!confirm('Yakin hapus kelas ini? Pastikan tidak ada peserta di kelas ini.')) return
    router.delete(`/kelas/${id}`)
  }

  const submitImportSiswa = (e) => {
    e.preventDefault()
    formImport.post('/siswa/import', {
      onSuccess: () => {
        setShowModalImportSiswa(false)
        formImport.reset()
      }
    })
  }

  const submitImportKelas = (e) => {
    e.preventDefault()
    formImport.post('/kelas/import', {
      onSuccess: () => {
        setShowModalImportKelas(false)
        formImport.reset()
      }
    })
  }

  return (
    <AdminLayout>
      <Head title="Manajemen Peserta" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-slate-800">Manajemen Peserta</h1>
            <p className="page-desc text-sm text-slate-500 mt-1">Kelola data peserta ujian, tingkatan kelas, dan kartu ujian.</p>
          </div>
          <div className="flex gap-2.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'peserta' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => { setActiveTab('peserta'); router.get('/siswa', { tab: 'peserta' }) }}
            >
              Peserta Ujian
            </button>
            <button
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'kelas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => { setActiveTab('kelas'); router.get('/siswa', { tab: 'kelas' }) }}
            >
              Kelas
            </button>
          </div>
        </div>

        {/* Tab Peserta */}
        {activeTab === 'peserta' && (
          <div className="panel bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            
            {/* Action Bar */}
            {selectedIds.length > 0 ? (
              <div className="panel-header px-6 py-5 bg-red-50 border-b border-red-100 flex items-center justify-between animate-fade-in w-full">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-600">{selectedIds.length} siswa terpilih</span>
                  <button onClick={() => setSelectedIds([])} className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer">Batalkan pilihan</button>
                </div>
                <button className="btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer" onClick={handleBulkDelete}>
                  <Trash2 size={14} /> Hapus Terpilih
                </button>
              </div>
            ) : (
              <div className="panel-header px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 max-w-xl">
                  <div className="relative flex-1 flex items-center">
                    <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none z-10" />
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Cari NISN atau Nama..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                  <select 
                    className="input sm:w-44 bg-white" 
                    value={selectedKelas} 
                    onChange={e => setSelectedKelas(e.target.value)}
                  >
                    <option value="all">Semua Kelas</option>
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
                  <button className="btn btn-outline py-2.5" onClick={() => setShowModalImportSiswa(true)}>
                    <Upload size={14} className="mr-1.5" /> Import
                  </button>
                  <button className="btn btn-outline py-2.5" onClick={handlePrintKartu}>
                    <Printer size={14} className="mr-1.5" /> Cetak Kartu
                  </button>
                  <button className="btn btn-primary py-2.5" onClick={handleOpenAddSiswa}>
                    <Plus size={14} className="mr-1.5" /> Tambah
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 bg-slate-50/30 uppercase tracking-wider">
                    <th className="p-4 pl-6 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                        checked={siswa.data.length > 0 && siswa.data.map(s => s.id).every(id => selectedIds.includes(id))}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th className="p-4">NISN</th>
                    <th className="p-4">Nama Lengkap</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">JK</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-16 text-center text-xs font-mono text-slate-400">
                        Tidak ada data peserta ujian.
                      </td>
                    </tr>
                  ) : (
                    siswa.data.map(s => (
                      <tr key={s.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors text-sm">
                        <td className="p-4 pl-6">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => handleToggleSelect(s.id)}
                          />
                        </td>
                        <td className="p-4 font-mono text-slate-600">{s.nisn}</td>
                        <td className="p-4 font-bold text-slate-800">{s.nama}</td>
                        <td className="p-4 text-slate-500 font-semibold">{s.kelas?.nama_kelas ?? '—'}</td>
                        <td className="p-4 text-slate-500">{s.jk || '—'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {s.is_active ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-1">
                          <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-indigo-600 cursor-pointer" title="Reset Password" onClick={() => handleResetPassword(s.id)}>
                            <KeyRound size={14} />
                          </button>
                          <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-indigo-600 cursor-pointer" onClick={() => handleOpenEditSiswa(s)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-red-600 cursor-pointer" onClick={() => handleDeleteSiswa(s)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {siswa.total > 0 && (
              <div className="panel-header px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-mono">Total: {siswa.total} peserta</span>
                <div className="flex gap-2">
                  <Link 
                    href={siswa.prev_page_url || '#'} 
                    only={['siswa']}
                    className={`btn btn-sm btn-outline px-3 py-1.5 ${!siswa.prev_page_url ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <ChevronLeft size={14} />
                  </Link>
                  <Link 
                    href={siswa.next_page_url || '#'} 
                    only={['siswa']}
                    className={`btn btn-sm btn-outline px-3 py-1.5 ${!siswa.next_page_url ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Kelas */}
        {activeTab === 'kelas' && (
          <div className="panel bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="panel-header px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <span className="panel-title text-sm font-bold text-slate-700">Daftar Kategori Kelas</span>
              <div className="flex gap-2.5">
                <button className="btn btn-outline py-2" onClick={() => setShowModalImportKelas(true)}>
                  <Upload size={14} className="mr-1.5" /> Import Kelas
                </button>
                <button className="btn btn-primary py-2" onClick={handleOpenAddKelas}>
                  <Plus size={14} className="mr-1.5" /> Tambah Kelas
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 bg-slate-50/30 uppercase tracking-wider">
                    <th className="p-4 pl-6">Tingkat</th>
                    <th className="p-4">Nama Kelas</th>
                    <th className="p-4">Tahun Ajar</th>
                    <th className="p-4">Wali Kelas</th>
                    <th className="p-4">Jml Peserta</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kelas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-16 text-center text-xs font-mono text-slate-400">
                        Belum ada data kelas terdaftar.
                      </td>
                    </tr>
                  ) : (
                    kelas.map(k => (
                      <tr key={k.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors text-sm">
                        <td className="p-4 pl-6 text-slate-500 font-mono">{k.tingkat}</td>
                        <td className="p-4 font-bold text-slate-800">{k.nama_kelas}</td>
                        <td className="p-4 text-slate-400 font-semibold">{k.tahun_ajar}</td>
                        <td className="p-4 text-slate-600 font-bold">{k.wali_kelas || '—'}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-black rounded-full">
                            {k.students_count || 0}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right flex justify-end gap-1">
                          <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-indigo-600" onClick={() => handleOpenEditKelas(k)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-red-600" onClick={() => handleDeleteKelas(k.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Modal: Siswa ── */}
        {showModalSiswa && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">{editingData ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}</h3>
                <button onClick={() => setShowModalSiswa(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitSiswa} className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">NISN</label>
                    <input 
                      type="text" 
                      className="input font-mono" 
                      value={formSiswa.data.nisn} 
                      onChange={e => formSiswa.setData('nisn', e.target.value)} 
                      required 
                    />
                    {formSiswa.errors.nisn && <span className="text-xs text-red-600">{formSiswa.errors.nisn}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Kelas</label>
                    <select 
                      className="input bg-white" 
                      value={formSiswa.data.kelas_id} 
                      onChange={e => formSiswa.setData('kelas_id', e.target.value)}
                    >
                      <option value="">Pilih Kelas</option>
                      {kelas.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formSiswa.data.nama} 
                    onChange={e => formSiswa.setData('nama', e.target.value)} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tempat Lahir</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formSiswa.data.tempat_lahir} 
                      onChange={e => formSiswa.setData('tempat_lahir', e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      className="input" 
                      value={formSiswa.data.ttl} 
                      onChange={e => formSiswa.setData('ttl', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Jenis Kelamin</label>
                    <select 
                      className="input bg-white" 
                      value={formSiswa.data.jk} 
                      onChange={e => formSiswa.setData('jk', e.target.value)}
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  
                  {editingData && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">Status Akun</label>
                      <select 
                        className="input bg-white" 
                        value={formSiswa.data.is_active ? '1' : '0'} 
                        onChange={e => formSiswa.setData('is_active', e.target.value === '1')}
                      >
                        <option value="1">Aktif</option>
                        <option value="0">Non-aktif</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 mt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalSiswa(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formSiswa.processing}>
                    {formSiswa.processing ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Kelas ── */}
        {showModalKelas && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">{editingData ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}</h3>
                <button onClick={() => setShowModalKelas(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitKelas} className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tingkat</label>
                    <select 
                      className="input bg-white"
                      value={formKelas.data.tingkat}
                      onChange={e => formKelas.setData('tingkat', e.target.value)}
                    >
                      <option value="X">X</option>
                      <option value="XI">XI</option>
                      <option value="XII">XII</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tahun Ajar</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formKelas.data.tahun_ajar} 
                      onChange={e => formKelas.setData('tahun_ajar', e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Nama Kelas</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Contoh: XI RPL 1"
                    value={formKelas.data.nama_kelas} 
                    onChange={e => formKelas.setData('nama_kelas', e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Wali Kelas</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Nama Wali Kelas beserta gelar"
                    value={formKelas.data.wali_kelas} 
                    onChange={e => formKelas.setData('wali_kelas', e.target.value)} 
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalKelas(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formKelas.processing}>
                    {formKelas.processing ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Import Siswa ── */}
        {showModalImportSiswa && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">Import Peserta Excel</h3>
                <button onClick={() => setShowModalImportSiswa(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitImportSiswa} className="p-6 flex flex-col gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">1. Unduh Template Panduan</label>
                  <a 
                    href="/siswa/template" 
                    className="btn btn-outline justify-center py-3 text-slate-600 text-xs font-bold bg-slate-50"
                  >
                     <FileSpreadsheet size={16} className="mr-2 text-emerald-600" /> Unduh Template Excel
                  </a>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold text-slate-500">2. Pilih File Excel (.xlsx / .xls)</label>
                  <input 
                    type="file" 
                    className="input py-2" 
                    accept=".xlsx, .xls, .csv"
                    onChange={e => formImport.setData('file', e.target.files[0])}
                    required 
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalImportSiswa(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formImport.processing}>
                    {formImport.processing ? 'Mengimpor...' : 'Mulai Impor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Import Kelas ── */}
        {showModalImportKelas && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">Import Kategori Kelas Excel</h3>
                <button onClick={() => setShowModalImportKelas(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitImportKelas} className="p-6 flex flex-col gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">1. Unduh Template Panduan</label>
                  <a 
                    href="/kelas/template" 
                    className="btn btn-outline justify-center py-3 text-slate-600 text-xs font-bold bg-slate-50"
                  >
                     <FileSpreadsheet size={16} className="mr-2 text-emerald-600" /> Unduh Template Kelas Excel
                  </a>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold text-slate-500">2. Pilih File Excel (.xlsx / .xls)</label>
                  <input 
                    type="file" 
                    className="input py-2" 
                    accept=".xlsx, .xls, .csv"
                    onChange={e => formImport.setData('file', e.target.files[0])}
                    required 
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalImportKelas(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formImport.processing}>
                    {formImport.processing ? 'Mengimpor...' : 'Mulai Impor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ── Modal: Konfirmasi Hapus Single ── */}
        {siswaToDelete && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Hapus Peserta?</h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                    Apakah Anda yakin ingin menghapus peserta <span className="text-slate-800 font-bold">"{siswaToDelete.nama}"</span>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="flex gap-2.5 w-full mt-2">
                  <button type="button" className="btn btn-outline flex-1 py-2.5 cursor-pointer" onClick={() => setSiswaToDelete(null)}>
                    Batal
                  </button>
                  <button type="button" className="btn bg-red-600 hover:bg-red-700 text-white flex-1 py-2.5 font-bold rounded-lg shadow-sm cursor-pointer" onClick={confirmDeleteSiswa}>
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Konfirmasi Hapus Bulk ── */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Hapus Terpilih?</h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                    Apakah Anda yakin ingin menghapus <span className="text-red-600 font-bold">{selectedIds.length} peserta</span> terpilih sekaligus? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="flex gap-2.5 w-full mt-2">
                  <button type="button" className="btn btn-outline flex-1 py-2.5 cursor-pointer" onClick={() => setShowBulkDeleteConfirm(false)}>
                    Batal
                  </button>
                  <button type="button" className="btn bg-red-600 hover:bg-red-700 text-white flex-1 py-2.5 font-bold rounded-lg shadow-sm cursor-pointer" onClick={confirmBulkDelete}>
                    Ya, Hapus Semua
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
