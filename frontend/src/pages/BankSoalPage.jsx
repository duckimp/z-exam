import { useState, useEffect } from 'react'
import {
  BookOpen, Plus, Search, MoreVertical, Edit2, Trash2,
  FileText, ListChecks, ArrowRight, X, Image as ImageIcon,
  ChevronRight, Save
} from 'lucide-react'
import api from '../services/api'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

export default function BankSoalPage() {
  const [mapel, setMapel] = useState([])
  const [selectedMapel, setSelectedMapel] = useState(null)
  const [soal, setSoal] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list') // 'list' (mapel), 'detail' (soal list), 'form' (editor)

  const [showModalMapel, setShowModalMapel] = useState(false)
  const [editingMapel, setEditingMapel] = useState(null)
  const [editingSoal, setEditingSoal] = useState(null)

  // Fetch Mapel
  const fetchMapel = async () => {
    try {
      const res = await api.get('/mapel')
      setMapel(res.data)
    } catch (err) { console.error(err) }
  }

  // Fetch Soal
  const fetchSoal = async (mapelId) => {
    setLoading(true)
    try {
      const res = await api.get(`/soal?mapel_id=${mapelId}`)
      setSoal(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMapel() }, [])

  const handleSelectMapel = (m) => {
    setSelectedMapel(m)
    fetchSoal(m.id)
    setView('detail')
  }

  const handleDeleteSoal = async (id) => {
    if (!confirm('Hapus soal ini?')) return
    try {
      await api.delete(`/soal/${id}`)
      fetchSoal(selectedMapel.id)
    } catch (err) { alert('Gagal menghapus soal') }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {view !== 'list' && (
            <button className="btn btn-sm btn-ghost" onClick={() => setView(view === 'form' ? 'detail' : 'list')} style={{ padding: 4 }}>
              <X size={16} />
            </button>
          )}
          <div>
            <h1 className="page-title">
              {view === 'list' ? 'Bank Soal' : selectedMapel?.nama_mapel}
            </h1>
            <p className="page-desc">
              {view === 'list' 
                ? 'Kelola mata pelajaran dan bank soal.' 
                : `${selectedMapel?.kode_mapel} · ${selectedMapel?.tingkat || 'Semua Tingkat'}`}
            </p>
          </div>
        </div>
        {view === 'list' && (
          <button className="btn btn-primary" onClick={() => { setEditingMapel(null); setShowModalMapel(true); }}>
            <Plus size={14} /> Tambah Mapel
          </button>
        )}
        {view === 'detail' && (
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={() => { /* logic import */ }}>
              <FileText size={14} /> Import Excel
            </button>
            <button className="btn btn-primary" onClick={() => { setEditingSoal(null); setView('form'); }}>
              <Plus size={14} /> Tambah Soal
            </button>
          </div>
        )}
      </div>

      {view === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {mapel.map(m => (
            <div key={m.id} className="panel card-mapel" style={{ cursor: 'pointer', transition: 'transform 0.1s' }} onClick={() => handleSelectMapel(m)}>
              <div className="panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="badge badge-default" style={{ marginBottom: 8 }}>{m.kode_mapel}</div>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{m.nama_mapel}</h3>
                  <div className="text-xs text-muted">Tingkat: {m.tingkat || '—'}</div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{m.soal_count || 0}</div>
                  <div className="text-xs text-faint">Soal</div>
                </div>
              </div>
              <div className="panel-header" style={{ borderTop: 'var(--border)', borderBottom: 'none', background: 'transparent' }}>
                <span className="text-xs text-accent" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Lihat Soal <ChevronRight size={12} />
                </span>
                <div onClick={e => e.stopPropagation()}>
                   <button className="btn btn-sm btn-ghost" onClick={() => { setEditingMapel(m); setShowModalMapel(true); }}><Edit2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
          {mapel.length === 0 && (
            <div className="panel" style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--color-text-faint)' }}>
              Belum ada mata pelajaran.
            </div>
          )}
        </div>
      )}

      {view === 'detail' && (
        <div className="flex flex-col gap-4">
          {loading ? (
             <div className="panel" style={{ padding: 40, textAlign: 'center' }}><span className="spinner"></span></div>
          ) : soal.length === 0 ? (
            <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-faint)' }}>
              Belum ada soal untuk mapel ini.
            </div>
          ) : (
            soal.map((s, idx) => (
              <div key={s.id} className="panel animate-fade-in">
                <div className="panel-header" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-default">#{idx + 1}</span>
                    <span className="badge badge-primary">{s.tipe}</span>
                    <span className="text-xs text-muted">Bobot: {s.bobot}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditingSoal(s); setView('form'); }}><Edit2 size={13} /></button>
                    <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDeleteSoal(s.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="soal-konten" style={{ marginBottom: 16 }}>
                    <div dangerouslySetInnerHTML={{ __html: s.konten }} />
                  </div>
                  
                  {s.tipe === 'PG' && (
                    <div className="flex flex-col gap-2">
                      {s.opsi.map(o => (
                        <div key={o.id} className={`flex items-start gap-3 p-2 rounded border ${o.is_correct ? 'border-success bg-success-soft' : 'border-transparent'}`} style={{ fontSize: 13 }}>
                          <span className="font-bold">{o.label}.</span>
                          <div dangerouslySetInnerHTML={{ __html: o.konten }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {s.tipe === 'MATCHING' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="label">Item Kiri</div>
                        {s.matching_items.map(m => (
                          <div key={m.id} className="p-2 border rounded text-sm">{m.item_kiri}</div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="label">Item Kanan</div>
                        {s.matching_items.map(m => (
                          <div key={m.id} className="p-2 border rounded text-sm bg-surface-2">{m.item_kanan}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {s.tipe === 'ESSAY' && (
                    <div className="p-3 bg-surface-2 rounded border">
                      <div className="label">Kunci Jawaban</div>
                      <div className="text-sm">{s.kunci_essay || '—'}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'form' && (
        <SoalForm 
          mapelId={selectedMapel.id}
          data={editingSoal} 
          onSuccess={() => { setView('detail'); fetchSoal(selectedMapel.id); }}
          onCancel={() => setView('detail')}
        />
      )}

      {showModalMapel && (
        <MapelModal 
          data={editingMapel} 
          onClose={() => setShowModalMapel(false)} 
          onSuccess={() => { setShowModalMapel(false); fetchMapel(); }}
        />
      )}
    </div>
  )
}

// ── Modals & Forms ─────────────────────────────────────────────────────────────

function MapelModal({ data, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nama_mapel: data?.nama_mapel || '',
    kode_mapel: data?.kode_mapel || '',
    tingkat: data?.tingkat || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (data) await api.put(`/mapel/${data.id}`, form)
      else await api.post('/mapel', form)
      onSuccess()
    } catch (err) { alert(err.response?.data?.message || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="panel" style={{ width: 400 }}>
        <div className="panel-header">
          <span className="panel-title">{data ? 'Edit Mapel' : 'Tambah Mapel'}</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-field">
              <label className="label">Nama Mata Pelajaran</label>
              <input className="input" value={form.nama_mapel} onChange={e => setForm({...form, nama_mapel: e.target.value})} required />
            </div>
            <div className="form-field">
              <label className="label">Kode Mapel (Contoh: BIND-VII)</label>
              <input className="input text-mono" value={form.kode_mapel} onChange={e => setForm({...form, kode_mapel: e.target.value})} required />
            </div>
            <div className="form-field">
              <label className="label">Tingkat</label>
              <input className="input" value={form.tingkat} onChange={e => setForm({...form, tingkat: e.target.value})} placeholder="Semua" />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function SoalForm({ mapelId, data, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    mapel_id: mapelId,
    tipe: data?.tipe || 'PG',
    konten: data?.konten || '',
    bobot: data?.bobot || 1,
    urutan: data?.urutan || 0,
    kunci_essay: data?.kunci_essay || '',
    opsi: data?.opsi || [
      { label: 'A', konten: '', is_correct: false },
      { label: 'B', konten: '', is_correct: false },
      { label: 'C', konten: '', is_correct: false },
      { label: 'D', konten: '', is_correct: false },
    ],
    matching: data?.matching_items || [{ item_kiri: '', item_kanan: '' }],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (data) await api.put(`/soal/${data.id}`, form)
      else await api.post('/soal', form)
      onSuccess()
    } catch (err) { alert('Gagal menyimpan soal') }
    finally { setLoading(false) }
  }

  const addMatching = () => setForm({...form, matching: [...form.matching, { item_kiri: '', item_kanan: '' }]})
  const removeMatching = (idx) => setForm({...form, matching: form.matching.filter((_, i) => i !== idx)})

  return (
    <div className="panel animate-fade-in">
      <div className="panel-header">
        <span className="panel-title">{data ? 'Edit Soal' : 'Tambah Soal Baru'}</span>
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-field">
              <label className="label">Tipe Soal</label>
              <select className="input" value={form.tipe} onChange={e => setForm({...form, tipe: e.target.value})}>
                <option value="PG">Pilihan Ganda</option>
                <option value="ESSAY">Essay / Uraian</option>
                <option value="MATCHING">Mencocokkan</option>
              </select>
            </div>
            <div className="form-field">
              <label className="label">Bobot Nilai</label>
              <input type="number" step="0.1" className="input" value={form.bobot} onChange={e => setForm({...form, bobot: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="label">Urutan</label>
              <input type="number" className="input" value={form.urutan} onChange={e => setForm({...form, urutan: e.target.value})} />
            </div>
          </div>

          <div className="form-field">
            <label className="label">Konten Soal (Support KaTeX: $x^2$ atau $$x^2$$)</label>
            <textarea className="input" rows={4} value={form.konten} onChange={e => setForm({...form, konten: e.target.value})} required />
          </div>

          {form.tipe === 'PG' && (
            <div className="flex flex-col gap-4">
              <label className="label">Opsi Jawaban</label>
              {form.opsi.map((o, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="text-mono font-bold" style={{ width: 20 }}>{o.label}</div>
                  <input className="input" value={o.konten} onChange={e => {
                    const newOpsi = [...form.opsi]
                    newOpsi[idx].konten = e.target.value
                    setForm({...form, opsi: newOpsi})
                  }} placeholder={`Konten opsi ${o.label}...`} required />
                  <label className="flex items-center gap-1 cursor-pointer" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    <input type="radio" name="is_correct" checked={o.is_correct} onChange={() => {
                       const newOpsi = form.opsi.map((opt, i) => ({ ...opt, is_correct: i === idx }))
                       setForm({...form, opsi: newOpsi})
                    }} />
                    Benar
                  </label>
                </div>
              ))}
            </div>
          )}

          {form.tipe === 'MATCHING' && (
            <div className="flex flex-col gap-3">
              <label className="label">Item Pasangan</label>
              {form.matching.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input className="input" value={m.item_kiri} onChange={e => {
                    const nm = [...form.matching]; nm[idx].item_kiri = e.target.value; setForm({...form, matching: nm})
                  }} placeholder="Kiri..." required />
                  <ArrowRight size={14} className="text-muted" />
                  <input className="input" value={m.item_kanan} onChange={e => {
                    const nm = [...form.matching]; nm[idx].item_kanan = e.target.value; setForm({...form, matching: nm})
                  }} placeholder="Kanan..." required />
                  <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => removeMatching(idx)}><X size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline" onClick={addMatching} style={{ width: 'fit-content' }}>
                <Plus size={12} /> Tambah Pasangan
              </button>
            </div>
          )}

          {form.tipe === 'ESSAY' && (
             <div className="form-field">
                <label className="label">Kunci Jawaban / Rubrik (Opsional)</label>
                <textarea className="input" rows={3} value={form.kunci_essay} onChange={e => setForm({...form, kunci_essay: e.target.value})} />
             </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-top">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={14} /> {loading ? 'Menyimpan...' : 'Simpan Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
