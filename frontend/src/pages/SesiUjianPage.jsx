import { useState, useEffect } from 'react'
import { 
  ClipboardList, Plus, Search, MoreVertical, Edit2, Trash2, 
  Activity, Play, Pause, RefreshCw, Clock, Calendar, X, CheckCircle2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function SesiUjianPage() {
  const navigate = useNavigate()
  const [sesi, setSesi] = useState([])
  const [mapel, setMapel] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingData, setEditingData] = useState(null)

  const fetchSesi = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sesi')
      setSesi(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchMapel = async () => {
    try {
      const res = await api.get('/mapel')
      setMapel(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchSesi()
    fetchMapel()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Hapus sesi ini? Semua data jawaban peserta di sesi ini akan hilang!')) return
    try {
      await api.delete(`/sesi/${id}`)
      fetchSesi()
    } catch (err) { alert('Gagal menghapus sesi') }
  }

  const handleToggleActive = async (s) => {
    try {
      await api.put(`/sesi/${s.id}`, { is_active: !s.is_active })
      fetchSesi()
    } catch (err) { alert('Gagal update status') }
  }

  const handleRefreshToken = async (id) => {
    if (!confirm('Ganti token sesi ini? Peserta harus memasukkan token baru.')) return
    try {
      await api.post(`/sesi/${id}/refresh-token`)
      fetchSesi()
    } catch (err) { alert('Gagal refresh token') }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sesi Ujian</h1>
          <p className="page-desc">Kelola jadwal dan kontrol sesi ujian aktif.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingData(null); setShowModal(true); }}>
          <Plus size={14} /> Buat Sesi Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="panel p-10 text-center"><span className="spinner"></span></div>
        ) : sesi.length === 0 ? (
          <div className="panel p-10 text-center text-faint">Belum ada sesi ujian.</div>
        ) : (
          sesi.map(s => (
            <div key={s.id} className="panel card-sesi">
              <div className="panel-body flex items-center gap-6">
                {/* Status Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${s.is_active ? 'bg-success-soft text-success' : 'bg-surface-2 text-faint'}`}>
                   {s.is_active ? <Activity size={24} /> : <Pause size={24} />}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold">{s.nama_sesi}</h3>
                    <span className="badge badge-default">{s.mapel?.nama_mapel}</span>
                    {!s.is_active && <span className="badge badge-danger">DITUTUP</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {s.tanggal}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {s.jam_mulai.substring(0,5)} · {s.durasi} Menit</span>
                    <span className="flex items-center gap-1"><ClipboardList size={12} /> {s.peserta_count} Peserta</span>
                  </div>
                </div>

                {/* Token */}
                <div className="text-center px-6 border-left border-right">
                  <div className="text-xs text-faint mb-1">TOKEN</div>
                  <div className="text-2xl font-black text-accent font-mono tracking-widest">{s.token}</div>
                  <button className="btn btn-sm btn-ghost text-xs p-0 mt-1" onClick={() => handleRefreshToken(s.id)}>
                    <RefreshCw size={10} /> Ganti Token
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="btn btn-outline gap-2" onClick={() => navigate(`/monitoring/${s.id}`)}>
                    <Activity size={14} /> Monitoring
                  </button>
                  <button className={`btn ${s.is_active ? 'btn-ghost text-danger' : 'btn-ghost text-success'}`} onClick={() => handleToggleActive(s)} title={s.is_active ? 'Matikan Sesi' : 'Aktifkan Sesi'}>
                    {s.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setEditingData(s); setShowModal(true); }}><Edit2 size={16} /></button>
                  <button className="btn btn-ghost text-danger" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <SesiModal 
          data={editingData} 
          mapelOptions={mapel}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchSesi(); }}
        />
      )}
    </div>
  )
}

function SesiModal({ data, mapelOptions, onClose, onSuccess }) {
  const [form, setForm] = useState({
    mapel_id: data?.mapel_id || '',
    nama_sesi: data?.nama_sesi || '',
    tanggal: data?.tanggal || new Date().toISOString().split('T')[0],
    jam_mulai: data?.jam_mulai || '07:30',
    durasi: data?.durasi || 90,
    random_soal: data ? data.random_soal : true,
    random_opsi: data ? data.random_opsi : true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (data) await api.put(`/sesi/${data.id}`, form)
      else await api.post('/sesi', form)
      onSuccess()
    } catch (err) { alert('Gagal menyimpan sesi') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="panel animate-fade-in" style={{ width: 450 }}>
        <div className="panel-header">
          <span className="panel-title">{data ? 'Edit Sesi Ujian' : 'Buat Sesi Ujian Baru'}</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-field">
              <label className="label">Nama Sesi (Contoh: Penilaian Akhir Semester Ganjil)</label>
              <input className="input" value={form.nama_sesi} onChange={e => setForm({...form, nama_sesi: e.target.value})} required />
            </div>
            <div className="form-field">
              <label className="label">Mata Pelajaran</label>
              <select className="input" value={form.mapel_id} onChange={e => setForm({...form, mapel_id: e.target.value})} required>
                <option value="">-- Pilih Mata Pelajaran --</option>
                {mapelOptions.map(m => <option key={m.id} value={m.id}>{m.nama_mapel} ({m.kode_mapel})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="label">Tanggal</label>
                <input type="date" className="input" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} required />
              </div>
              <div className="form-field">
                <label className="label">Jam Mulai</label>
                <input type="time" className="input" value={form.jam_mulai} onChange={e => setForm({...form, jam_mulai: e.target.value})} required />
              </div>
            </div>
            <div className="form-field">
              <label className="label">Durasi (Menit)</label>
              <input type="number" className="input" value={form.durasi} onChange={e => setForm({...form, durasi: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2 p-3 bg-surface-2 rounded border">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.random_soal} onChange={e => setForm({...form, random_soal: e.target.checked})} />
                Acak Urutan Soal
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.random_opsi} onChange={e => setForm({...form, random_opsi: e.target.checked})} />
                Acak Urutan Opsi Jawaban
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {data ? 'Simpan Perubahan' : 'Buat Sesi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
