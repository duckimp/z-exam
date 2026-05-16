import { useState, useEffect } from 'react'
import {
  Users, Plus, Upload, Printer, Search, MoreVertical,
  Edit2, Trash2, KeyRound, RefreshCw, X
} from 'lucide-react'
import api from '../services/api'

export default function SiswaPage() {
  const [activeTab, setActiveTab] = useState('peserta') // 'peserta' atau 'kelas'

  // Data
  const [kelas, setKelas] = useState([])
  const [siswa, setSiswa] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')

  // Modals & States
  const [loading, setLoading] = useState(false)
  const [showModalSiswa, setShowModalSiswa] = useState(false)
  const [showModalImport, setShowModalImport] = useState(false)
  const [showModalKelas, setShowModalKelas] = useState(false)
  const [editingData, setEditingData] = useState(null)

  // Fetch Data
  const fetchKelas = async () => {
    try {
      const res = await api.get('/kelas')
      setKelas(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSiswa = async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/siswa?page=${page}&search=${search}&kelas_id=${selectedKelas}`)
      setSiswa(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKelas()
  }, [])

  useEffect(() => {
    if (activeTab === 'peserta') {
      const timer = setTimeout(() => fetchSiswa(1), 300)
      return () => clearTimeout(timer)
    }
  }, [search, selectedKelas, activeTab])

  // ── Actions: Siswa ────────────────────────────────────────────────────────
  const handleDeleteSiswa = async (id) => {
    if (!confirm('Yakin ingin menghapus peserta ini?')) return
    try {
      await api.delete(`/siswa/${id}`)
      fetchSiswa(siswa.current_page)
    } catch (err) {
      alert('Gagal menghapus peserta')
    }
  }

  const handleResetPassword = async (id) => {
    if (!confirm('Yakin ingin mereset password ke NISN?')) return
    try {
      const res = await api.post(`/siswa/${id}/reset-password`)
      alert(res.data.message)
    } catch (err) {
      alert('Gagal mereset password')
    }
  }

  const handlePrintKartu = () => {
    if (!selectedKelas) return alert('Pilih kelas terlebih dahulu untuk mencetak kartu!')
    const token = localStorage.getItem('z-exam-token')
    window.open(`${api.defaults.baseURL}/siswa-export-kartu?kelas_id=${selectedKelas}&token=${token}`, '_blank')
  }

  // ── Modals & Forms ───────────────────────────────────────────────────────
  // (Formulir disederhanakan untuk contoh, idealnya dipisah ke komponen terpisah)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Peserta</h1>
          <p className="page-desc">Kelola data peserta ujian, kelas, dan cetak kartu ujian.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'peserta' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('peserta')}
          >
            Peserta Ujian
          </button>
          <button
            className={`btn ${activeTab === 'kelas' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('kelas')}
          >
            Kelas
          </button>
        </div>
      </div>

      {activeTab === 'peserta' && (
        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 300 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Cari NISN atau Nama..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
              </div>
              <select className="input" style={{ width: 150 }} value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelas.map(k => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowModalImport(true)}>
                <Upload size={14} /> Import Excel
              </button>
              <button className="btn btn-outline" onClick={handlePrintKartu} disabled={!selectedKelas}>
                <Printer size={14} /> Cetak Kartu
              </button>
              <button className="btn btn-primary" onClick={() => { setEditingData(null); setShowModalSiswa(true); }}>
                <Plus size={14} /> Tambah
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>NISN</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th>JK</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}><span className="spinner"></span></td></tr>
                ) : siswa.data.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-faint)' }}>Tidak ada data peserta.</td></tr>
                ) : (
                  siswa.data.map(s => (
                    <tr key={s.id}>
                      <td className="text-mono">{s.nisn}</td>
                      <td style={{ fontWeight: 500 }}>{s.nama}</td>
                      <td>{s.kelas?.nama_kelas ?? '—'}</td>
                      <td>{s.jk ?? '—'}</td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {s.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-ghost" title="Reset Password" onClick={() => handleResetPassword(s.id)}><KeyRound size={13} /></button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEditingData(s); setShowModalSiswa(true); }}><Edit2 size={13} /></button>
                        <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDeleteSiswa(s.id)}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination simple */}
          <div className="panel-header" style={{ justifyContent: 'space-between', borderTop: 'var(--border)', borderBottom: 'none' }}>
            <span className="text-xs text-muted">Total: {siswa.total} peserta</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-outline" disabled={siswa.current_page === 1} onClick={() => fetchSiswa(siswa.current_page - 1)}>Prev</button>
              <button className="btn btn-sm btn-outline" disabled={siswa.current_page === siswa.last_page} onClick={() => fetchSiswa(siswa.current_page + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kelas' && (
        <KelasTab
          kelas={kelas}
          fetchKelas={fetchKelas}
          onEdit={(k) => { setEditingData(k); setShowModalKelas(true); }}
          onAdd={() => { setEditingData(null); setShowModalKelas(true); }}
        />
      )}

      {/* Modals placeholders */}
      {showModalSiswa && (
        <SiswaModal
          data={editingData}
          kelasOptions={kelas}
          onClose={() => setShowModalSiswa(false)}
          onSuccess={() => { setShowModalSiswa(false); fetchSiswa(siswa.current_page); }}
        />
      )}
      
      {showModalKelas && (
        <KelasModal
          data={editingData}
          onClose={() => setShowModalKelas(false)}
          onSuccess={() => { setShowModalKelas(false); fetchKelas(); }}
        />
      )}

      {showModalImport && (
        <ImportModal
          kelasOptions={kelas}
          onClose={() => setShowModalImport(false)}
          onSuccess={() => { setShowModalImport(false); fetchSiswa(1); }}
        />
      )}

    </div>
  )
}

// ── Komponen Sub / Modals ─────────────────────────────────────────────────────

function KelasTab({ kelas, fetchKelas, onEdit, onAdd }) {
  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus kelas ini? Pastikan tidak ada peserta di kelas ini.')) return
    try {
      await api.delete(`/kelas/${id}`)
      fetchKelas()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kelas')
    }
  }

  return (
    <div className="panel animate-fade-in">
      <div className="panel-header">
        <span className="panel-title">Daftar Kelas</span>
        <button className="btn btn-primary" onClick={onAdd}><Plus size={14} /> Tambah Kelas</button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Tingkat</th>
              <th>Nama Kelas</th>
              <th>Tahun Ajar</th>
              <th>Jml Peserta</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kelas.map(k => (
              <tr key={k.id}>
                <td>{k.tingkat}</td>
                <td style={{ fontWeight: 600 }}>{k.nama_kelas}</td>
                <td className="text-muted">{k.tahun_ajar}</td>
                <td><span className="badge badge-default">{k.students_count || 0}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => onEdit(k)}><Edit2 size={13} /></button>
                  <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(k.id)}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
            {kelas.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-faint)' }}>Belum ada data kelas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ModalWrapper({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(2px)'
    }}>
      <div className="panel animate-fade-in" style={{ width: '100%', maxWidth: 450, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          <span className="panel-title">{title}</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={16} /></button>
        </div>
        <div className="panel-body" style={{ overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function KelasModal({ data, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nama_kelas: data?.nama_kelas || '',
    tingkat: data?.tingkat || '',
    tahun_ajar: data?.tahun_ajar || '2025/2026',
    wali_kelas: data?.wali_kelas || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (data) await api.put(`/kelas/${data.id}`, form)
      else await api.post('/kelas', form)
      onSuccess()
    } catch (err) {
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper title={data ? 'Edit Kelas' : 'Tambah Kelas'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-field">
          <label className="label">Nama Kelas (Contoh: VII A)</label>
          <input className="input" value={form.nama_kelas} onChange={e => setForm({...form, nama_kelas: e.target.value})} required />
        </div>
        <div className="form-field">
          <label className="label">Tingkat (Contoh: VII, 10, X)</label>
          <input className="input" value={form.tingkat} onChange={e => setForm({...form, tingkat: e.target.value})} required />
        </div>
        <div className="form-field">
          <label className="label">Tahun Ajar</label>
          <input className="input" value={form.tahun_ajar} onChange={e => setForm({...form, tahun_ajar: e.target.value})} required />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>Simpan</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

function SiswaModal({ data, kelasOptions, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nisn: data?.nisn || '',
    nama: data?.nama || '',
    kelas_id: data?.kelas_id || '',
    jk: data?.jk || 'L',
    is_active: data ? data.is_active : true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (data) await api.put(`/siswa/${data.id}`, form)
      else await api.post('/siswa', form)
      onSuccess()
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper title={data ? 'Edit Peserta' : 'Tambah Peserta'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-field">
          <label className="label">NISN (Digunakan untuk Username & Password Awal)</label>
          <input className="input text-mono" value={form.nisn} onChange={e => setForm({...form, nisn: e.target.value})} required maxLength={20} />
        </div>
        <div className="form-field">
          <label className="label">Nama Lengkap</label>
          <input className="input" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required />
        </div>
        <div className="form-field">
          <label className="label">Kelas</label>
          <select className="input" value={form.kelas_id} onChange={e => setForm({...form, kelas_id: e.target.value})} required>
            <option value="">-- Pilih Kelas --</option>
            {kelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="label">Jenis Kelamin</label>
          <select className="input" value={form.jk} onChange={e => setForm({...form, jk: e.target.value})}>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        {data && (
          <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
            <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Akun Aktif (Bisa Login)</label>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>Simpan</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

function ImportModal({ kelasOptions, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [kelasId, setKelasId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert('Pilih file Excel terlebih dahulu')
    
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (kelasId) formData.append('kelas_id', kelasId)

    try {
      const res = await api.post('/siswa-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal import data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper title="Import Peserta via Excel" onClose={onClose}>
      {!result ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="label">Target Kelas (Opsional)</label>
            <select className="input" value={kelasId} onChange={e => setKelasId(e.target.value)}>
              <option value="">-- Set otomatis / tanpa kelas --</option>
              {kelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="label">File Excel (.xlsx, .xls)</label>
            <input type="file" className="input" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files[0])} required />
            <span className="text-xs text-muted" style={{ marginTop: 4 }}>
              Pastikan baris pertama adalah header (NISN, Nama, JK, dll). Sistem akan otomatis membaca kolom yang sesuai.
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !file}>
              {loading ? 'Mengimpor...' : 'Mulai Import'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--color-success-soft)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 600 }}>
            {result.message} ({result.imported} baris berhasil)
          </div>
          {result.errors?.length > 0 && (
            <div style={{ padding: 12, background: 'var(--color-warning-soft)', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-warning)', marginBottom: 8 }}>Log Peringatan / Error:</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <button className="btn btn-primary" onClick={onSuccess} style={{ width: '100%', justifyContent: 'center' }}>Selesai</button>
        </div>
      )}
    </ModalWrapper>
  )
}
