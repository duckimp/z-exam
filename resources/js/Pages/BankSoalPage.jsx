import { useState, useEffect } from 'react'
import { useForm, router, Head, Link } from '@inertiajs/react'
import {
  BookOpen, Plus, Search, Edit2, Trash2,
  FileText, ArrowRight, X, ChevronRight, Save, Upload, FileSpreadsheet
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

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
    return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />
  })
}

export default function BankSoalPage({ mapel, selectedMapel, soal, filters }) {
  const [view, setView] = useState(filters?.view || 'list') // 'list', 'detail', 'form'
  const [showModalMapel, setShowModalMapel] = useState(false)
  const [showModalImport, setShowModalImport] = useState(false)
  const [editingMapel, setEditingMapel] = useState(null)
  const [editingSoal, setEditingSoal] = useState(null)

  // Preview states
  const [showModalPreview, setShowModalPreview] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState([])
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isSavingPreview, setIsSavingPreview] = useState(false)

  // Bulk weight states
  const [showModalBulkWeight, setShowModalBulkWeight] = useState(false)
  const [bulkWeightTipe, setBulkWeightTipe] = useState('ALL')
  const [bulkWeightValue, setBulkWeightValue] = useState(1)

  // Forms
  const formMapel = useForm({
    nama_mapel: '',
    kode_mapel: '',
    tingkat: ''
  })

  const formSoal = useForm({
    mapel_id: '',
    tipe: 'PG',
    konten: '',
    bobot: 1,
    urutan: 0,
    kunci_essay: '',
    opsi: [
      { label: 'A', konten: '', is_correct: false },
      { label: 'B', konten: '', is_correct: false },
      { label: 'C', konten: '', is_correct: false },
      { label: 'D', konten: '', is_correct: false },
    ],
    matching: [{ item_kiri: '', item_kanan: '' }]
  })

  const formImport = useForm({
    file: null,
    mapel_id: ''
  })

  // Sync view states
  useEffect(() => {
    if (selectedMapel && view === 'list') {
      setView('detail')
    }
  }, [selectedMapel])

  // ── Mapel Actions ───────────────────────────────────────────────────────────
  const handleOpenAddMapel = () => {
    setEditingMapel(null)
    formMapel.reset()
    setShowModalMapel(true)
  }

  const handleOpenEditMapel = (m, e) => {
    e.stopPropagation()
    setEditingMapel(m)
    formMapel.setData({
      nama_mapel: m.nama_mapel,
      kode_mapel: m.kode_mapel,
      tingkat: m.tingkat || ''
    })
    setShowModalMapel(true)
  }

  const submitMapel = (e) => {
    e.preventDefault()
    if (editingMapel) {
      formMapel.put(`/soal/mapel/${editingMapel.id}`, {
        onSuccess: () => setShowModalMapel(false)
      })
    } else {
      formMapel.post('/soal/mapel', {
        onSuccess: () => setShowModalMapel(false)
      })
    }
  }

  const handleDeleteMapel = (m, e) => {
    e.stopPropagation()
    if (confirm(`Yakin ingin menghapus mata pelajaran ${m.nama_mapel}? Semua soal di dalamnya akan terhapus!`)) {
      router.delete(`/soal/mapel/${m.id}`, {
        onSuccess: () => setView('list')
      })
    }
  }

  const handleSelectMapel = (m) => {
    router.get('/soal', { mapel_id: m.id, view: 'detail' })
  }

  // ── Soal Actions ────────────────────────────────────────────────────────────
  const handleOpenAddSoal = () => {
    setEditingSoal(null)
    formSoal.setData({
      mapel_id: selectedMapel.id,
      tipe: 'PG',
      konten: '',
      bobot: 1,
      urutan: soal.length,
      kunci_essay: '',
      opsi: [
        { label: 'A', konten: '', is_correct: false },
        { label: 'B', konten: '', is_correct: false },
        { label: 'C', konten: '', is_correct: false },
        { label: 'D', konten: '', is_correct: false },
      ],
      matching: [{ item_kiri: '', item_kanan: '' }]
    })
    setView('form')
  }

  const handleOpenEditSoal = (s) => {
    setEditingSoal(s)
    
    // Parse opsi
    const mappedOpsi = s.tipe === 'PG' ? s.opsi.map(o => ({
      label: o.label,
      konten: o.konten,
      is_correct: !!o.is_correct
    })) : [
      { label: 'A', konten: '', is_correct: false },
      { label: 'B', konten: '', is_correct: false },
      { label: 'C', konten: '', is_correct: false },
      { label: 'D', konten: '', is_correct: false },
    ];

    // Parse matching items
    const mappedMatching = s.tipe === 'MATCHING' && s.matching_items?.length > 0
      ? s.matching_items.map(m => ({
          item_kiri: m.item_kiri,
          item_kanan: m.item_kanan
        }))
      : [{ item_kiri: '', item_kanan: '' }];

    formSoal.setData({
      mapel_id: selectedMapel.id,
      tipe: s.tipe,
      konten: s.konten,
      bobot: s.bobot,
      urutan: s.urutan ?? 0,
      kunci_essay: s.kunci_essay || '',
      opsi: mappedOpsi,
      matching: mappedMatching
    })
    setView('form')
  }

  const submitSoal = (e) => {
    e.preventDefault()
    if (editingSoal) {
      formSoal.put(`/soal/${editingSoal.id}`, {
        onSuccess: () => {
          setView('detail')
          router.reload({ only: ['soal', 'mapel'] })
        }
      })
    } else {
      formSoal.post('/soal', {
        onSuccess: () => {
          setView('detail')
          router.reload({ only: ['soal', 'mapel'] })
        }
      })
    }
  }

  const handleDeleteSoal = (id) => {
    if (confirm('Yakin ingin menghapus soal ini?')) {
      router.delete(`/soal/${id}`, {
        onSuccess: () => router.reload({ only: ['soal', 'mapel'] })
      })
    }
  }

  const handleImportSoal = (e) => {
    e.preventDefault()
    if (!formImport.data.file) {
      alert('Pilih file terlebih dahulu!')
      return
    }

    const formData = new FormData()
    formData.append('file', formImport.data.file)
    formData.append('mapel_id', selectedMapel.id)

    setIsPreviewLoading(true)
    fetch('/soal/import/preview', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      }
    })
    .then(async (res) => {
      const contentType = res.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      
      if (!res.ok) {
        if (isJson) {
          const err = await res.json()
          throw new Error(err.errors ? err.errors.join(' | ') : (err.message || 'Gagal memuat preview.'));
        } else {
          throw new Error(`Terjadi kesalahan server (Kode: ${res.status}). Harap periksa koneksi atau hubungi Admin.`);
        }
      }
      
      if (!isJson) {
        throw new Error('Format respon dari server tidak valid (Bukan JSON). Harap periksa log server.');
      }
      
      return res.json()
    })
    .then(data => {
      setPreviewQuestions(data.questions || [])
      setShowModalImport(false)
      setShowModalPreview(true)
      formImport.reset()
    })
    .catch(err => {
      alert(err.message)
    })
    .finally(() => {
      setIsPreviewLoading(false)
    })
  }

  const handleConfirmSaveImport = () => {
    setIsSavingPreview(true)
    fetch('/soal/import/confirm', {
      method: 'POST',
      body: JSON.stringify({
        mapel_id: selectedMapel.id,
        questions: previewQuestions
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      }
    })
    .then(async (res) => {
      const contentType = res.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      
      if (!res.ok) {
        if (isJson) {
          const err = await res.json()
          throw new Error(err.message || 'Gagal menyimpan soal.');
        } else {
          throw new Error(`Terjadi kesalahan server saat menyimpan (Kode: ${res.status}).`);
        }
      }
      
      if (!isJson) {
        throw new Error('Respon penyimpanan tidak valid (Bukan JSON).');
      }
      
      return res.json()
    })
    .then(data => {
      if (data.success) {
        setShowModalPreview(false)
        setPreviewQuestions([])
        router.reload({ only: ['soal', 'mapel'] })
      } else {
        alert(data.message || 'Gagal menyimpan soal.')
      }
    })
    .catch(err => alert(err.message))
    .finally(() => setIsSavingPreview(false))
  }

  const handleBulkWeightSubmit = (e) => {
    e.preventDefault()
    router.post('/soal/bulk-weight', {
      mapel_id: selectedMapel.id,
      tipe: bulkWeightTipe,
      bobot: bulkWeightValue
    }, {
      onSuccess: () => {
        setShowModalBulkWeight(false)
      }
    })
  }

  const handleDeleteAllSoal = () => {
    if (confirm('APAKAH ANDA YAKIN? Tindakan ini akan menghapus SEMUA soal dalam mata pelajaran ini secara permanen!')) {
      router.delete(`/soal/mapel/${selectedMapel.id}/destroy-all`, {
        onSuccess: () => router.reload({ only: ['soal', 'mapel'] })
      })
    }
  }

  const addMatchingItem = () => {
    formSoal.setData('matching', [...formSoal.data.matching, { item_kiri: '', item_kanan: '' }])
  }

  const removeMatchingItem = (index) => {
    formSoal.setData('matching', formSoal.data.matching.filter((_, idx) => idx !== index))
  }

  return (
    <AdminLayout>
      <Head title="Bank Soal" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header flex justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button 
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm"
                onClick={() => { setView('list'); router.get('/soal') }}
              >
                <X size={16} />
              </button>
            )}
            <div>
              <h1 className="page-title text-2xl font-black text-slate-800">
                {view === 'list' ? 'Bank Soal' : selectedMapel?.nama_mapel}
              </h1>
              <p className="page-desc text-sm text-slate-500 mt-1">
                {view === 'list' 
                  ? 'Kelola mata pelajaran dan butir soal ujian.' 
                  : `${selectedMapel?.kode_mapel} · ${selectedMapel?.tingkat || 'Semua Tingkat'}`}
              </p>
            </div>
          </div>
          
          {view === 'list' && (
            <button className="btn btn-primary" onClick={handleOpenAddMapel}>
              <Plus size={14} className="mr-1.5" /> Tambah Mapel
            </button>
          )}

          {view === 'detail' && (
            <div className="flex gap-2.5 flex-wrap">
              <button 
                className="btn btn-outline border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all font-black text-xs px-4" 
                onClick={() => {
                  setBulkWeightTipe('ALL');
                  setBulkWeightValue(1);
                  setShowModalBulkWeight(true);
                }}
              >
                Atur Bobot Semua
              </button>
              <button 
                className="btn btn-outline border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-all font-black text-xs px-4" 
                onClick={handleDeleteAllSoal}
              >
                Hapus Semua Soal
              </button>
              <button className="btn btn-outline font-black text-xs px-4" onClick={() => {
                formImport.setData('mapel_id', selectedMapel.id)
                setShowModalImport(true)
              }}>
                <FileText size={14} className="mr-1.5 text-slate-500" /> Import Excel / Word
              </button>
              <button className="btn btn-primary font-black text-xs px-4" onClick={handleOpenAddSoal}>
                <Plus size={14} className="mr-1.5" /> Tambah Soal
              </button>
            </div>
          )}
        </div>

        {/* View 1: List Mapel Cards */}
        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mapel.map(m => (
              <div 
                key={m.id} 
                className="panel bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden"
                onClick={() => handleSelectMapel(m)}
              >
                <div className="p-6 flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                      {m.kode_mapel}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mt-3 leading-tight">{m.nama_mapel}</h3>
                    <div className="text-xs text-slate-400 mt-2 font-semibold">Tingkat: {m.tingkat || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-800">{m.soal_count || 0}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Butir Soal</div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    Lihat Soal <ChevronRight size={14} />
                  </span>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-ghost p-1.5 text-slate-400 hover:text-slate-700" onClick={(e) => handleOpenEditMapel(m, e)}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-sm btn-ghost p-1.5 text-slate-400 hover:text-red-600" onClick={(e) => handleDeleteMapel(m, e)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {mapel.length === 0 && (
              <div className="panel bg-white border border-slate-200 rounded-xl p-16 text-center text-xs font-mono text-slate-450 col-span-3">
                Belum ada mata pelajaran terdaftar.
              </div>
            )}
          </div>
        )}

        {/* View 2: List Soal Cards */}
        {view === 'detail' && (
          <div className="flex flex-col gap-6">
            {soal.length === 0 ? (
              <div className="panel bg-white border border-slate-200 rounded-xl p-16 text-center text-xs font-mono text-slate-450">
                Belum ada butir soal untuk mata pelajaran ini.
              </div>
            ) : (
              soal.map((s, idx) => (
                <div key={s.id} className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-xs font-black rounded-lg"># {idx + 1}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.tipe === 'PG' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : s.tipe === 'MATCHING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {s.tipe === 'PG' ? 'PILIHAN GANDA' : s.tipe === 'MATCHING' ? 'MENCOCOKKAN' : 'ESSAY'}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold font-mono">Bobot: {s.bobot}</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-ghost p-1.5 text-slate-400 hover:text-slate-700" onClick={() => handleOpenEditSoal(s)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-sm btn-ghost p-1.5 text-slate-400 hover:text-red-600" onClick={() => handleDeleteSoal(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    
                    {/* Soal Content */}
                    <div className="text-base text-slate-800 leading-relaxed mb-6 font-semibold select-none">
                      {renderMathContent(s.konten)}
                    </div>
                    
                    {/* Options (PG) */}
                    {s.tipe === 'PG' && (
                      <div className="flex flex-col gap-3 max-w-2xl">
                        {s.opsi.map(o => (
                          <div 
                            key={o.id} 
                            className={`flex items-start gap-3 p-3 rounded-xl border text-sm font-semibold ${o.is_correct ? 'border-emerald-250 bg-emerald-50/50 text-emerald-800' : 'border-slate-100 bg-slate-50/20 text-slate-600'}`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${o.is_correct ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {o.label}
                            </span>
                            <div className="pt-0.5" dangerouslySetInnerHTML={{ __html: o.konten }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching Items */}
                    {s.tipe === 'MATCHING' && (
                      <div className="max-w-2xl bg-slate-50 border border-slate-150 rounded-xl p-5">
                        <div className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-200 pb-2">Butir Pasangan Mencocokkan</div>
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-5 text-xs font-bold text-slate-500">Item Kiri</div>
                          <div className="col-span-2 text-center text-slate-300 font-bold">➔</div>
                          <div className="col-span-5 text-xs font-bold text-slate-500">Item Kanan (Kunci Pasangan)</div>

                          {s.matching_items?.map((item, mIdx) => (
                            <div key={item.id || mIdx} className="col-span-12 grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-5 p-2.5 bg-white border border-slate-200 rounded font-semibold text-xs text-slate-700">{item.item_kiri}</div>
                              <div className="col-span-2 text-center text-slate-400">➔</div>
                              <div className="col-span-5 p-2.5 bg-indigo-50/30 border border-indigo-150 rounded font-semibold text-xs text-indigo-700">{item.item_kanan}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Essay Solution */}
                    {s.tipe === 'ESSAY' && (
                      <div className="max-w-2xl bg-slate-50 border border-slate-150 rounded-xl p-5 text-xs">
                        <div className="font-bold text-slate-500 mb-2">Kunci Jawaban Uraian / Rubrik:</div>
                        <p className="font-mono text-slate-700 whitespace-pre-line leading-relaxed">{s.kunci_essay || '—'}</p>
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* View 3: Soal Form Editor */}
        {view === 'form' && (
          <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100">
              <span className="panel-title text-sm font-bold text-slate-700">{editingSoal ? 'Edit Butir Soal' : 'Tambah Soal Baru'}</span>
            </div>
            <div className="p-6 sm:p-8">
              <form onSubmit={submitSoal} className="flex flex-col gap-6">
                
                <div className="grid grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tipe Soal</label>
                    <select 
                      className="input bg-white font-semibold text-sm" 
                      value={formSoal.data.tipe} 
                      onChange={e => formSoal.setData('tipe', e.target.value)}
                    >
                      <option value="PG">Pilihan Ganda</option>
                      <option value="ESSAY">Essay / Uraian</option>
                      <option value="MATCHING">Mencocokkan</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Bobot Nilai</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input text-sm font-semibold" 
                      value={formSoal.data.bobot} 
                      onChange={e => formSoal.setData('bobot', e.target.value)} 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Nomor Urutan</label>
                    <input 
                      type="number" 
                      className="input text-sm font-semibold" 
                      value={formSoal.data.urutan} 
                      onChange={e => formSoal.setData('urutan', e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 flex justify-between items-center">
                    <span>Konten / Isi Soal</span>
                    <span className="text-[10px] text-indigo-600 font-mono">Format Matematika: $x^2$ (inline) atau $$x^2$$ (blok)</span>
                  </label>
                  <textarea 
                    className="input min-h-[140px] text-sm leading-relaxed p-4" 
                    placeholder="Tulis soal di sini..."
                    value={formSoal.data.konten} 
                    onChange={e => formSoal.setData('konten', e.target.value)} 
                    required 
                  />
                </div>

                {/* PG Options Editor */}
                {formSoal.data.tipe === 'PG' && (
                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                    <label className="text-xs font-bold text-slate-500">Pilihan Opsi Jawaban</label>
                    {formSoal.data.opsi.map((o, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm flex-shrink-0">
                          {o.label}
                        </span>
                        <input 
                          type="text"
                          className="input flex-1 text-sm font-semibold"
                          placeholder={`Isi opsi jawaban ${o.label}...`}
                          value={o.konten}
                          onChange={e => {
                            const newOpsi = [...formSoal.data.opsi]
                            newOpsi[idx].konten = e.target.value
                            formSoal.setData('opsi', newOpsi)
                          }}
                          required
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-500 select-none flex-shrink-0">
                          <input 
                            type="radio" 
                            name="is_correct" 
                            checked={o.is_correct} 
                            onChange={() => {
                              const newOpsi = formSoal.data.opsi.map((opt, i) => ({ ...opt, is_correct: i === idx }))
                              formSoal.setData('opsi', newOpsi)
                            }} 
                          />
                          Kunci Benar
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Items Editor */}
                {formSoal.data.tipe === 'MATCHING' && (
                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                    <label className="text-xs font-bold text-slate-500">Daftar Pasangan Mencocokkan</label>
                    
                    {formSoal.data.matching.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input 
                          type="text" 
                          placeholder="Item Kiri..." 
                          className="input flex-1 text-sm font-semibold"
                          value={item.item_kiri}
                          onChange={e => {
                            const newMatching = [...formSoal.data.matching]
                            newMatching[idx].item_kiri = e.target.value
                            formSoal.setData('matching', newMatching)
                          }}
                          required
                        />
                        <span className="text-slate-450 font-bold">➔</span>
                        <input 
                          type="text" 
                          placeholder="Item Kanan (Pasangannya)..." 
                          className="input flex-1 text-sm font-semibold"
                          value={item.item_kanan}
                          onChange={e => {
                            const newMatching = [...formSoal.data.matching]
                            newMatching[idx].item_kanan = e.target.value
                            formSoal.setData('matching', newMatching)
                          }}
                          required
                        />
                        <button 
                          type="button" 
                          className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-red-600 flex-shrink-0"
                          onClick={() => removeMatchingItem(idx)}
                          disabled={formSoal.data.matching.length <= 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline py-2 w-max"
                      onClick={addMatchingItem}
                    >
                      <Plus size={14} className="mr-1" /> Tambah Baris Pasangan
                    </button>
                  </div>
                )}

                {/* Essay Editor */}
                {formSoal.data.tipe === 'ESSAY' && (
                  <div className="flex flex-col gap-1 border-t border-slate-100 pt-5">
                    <label className="text-xs font-bold text-slate-500">Kunci Jawaban / Rubrik Penilaian (Opsional)</label>
                    <textarea 
                      className="input min-h-[110px] text-sm leading-relaxed p-4" 
                      placeholder="Masukkan kunci jawaban deskripsi..."
                      value={formSoal.data.kunci_essay} 
                      onChange={e => formSoal.setData('kunci_essay', e.target.value)} 
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-5">
                  <button type="button" className="btn btn-outline" onClick={() => setView('detail')}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formSoal.processing}>
                    <Save size={14} className="mr-1.5" /> Simpan Soal
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Mapel ── */}
        {showModalMapel && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">{editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru'}</h3>
                <button onClick={() => setShowModalMapel(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitMapel} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Nama Mata Pelajaran</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formMapel.data.nama_mapel} 
                    onChange={e => formMapel.setData('nama_mapel', e.target.value)} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Kode Mapel (Contoh: BIND-VII)</label>
                  <input 
                    type="text" 
                    className="input font-mono uppercase" 
                    value={formMapel.data.kode_mapel} 
                    onChange={e => formMapel.setData('kode_mapel', e.target.value.toUpperCase())} 
                    required 
                  />
                  {formMapel.errors.kode_mapel && <span className="text-xs text-red-600 font-bold">{formMapel.errors.kode_mapel}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Tingkatan Sekolah</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Contoh: VII, XI, XII"
                    value={formMapel.data.tingkat} 
                    onChange={e => formMapel.setData('tingkat', e.target.value)} 
                  />
                </div>
                
                <div className="flex justify-end gap-2.5 mt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalMapel(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formMapel.processing}>
                    {formMapel.processing ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Import Soal ── */}
        {showModalImport && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">Import Soal Excel / Word</h3>
                <button onClick={() => setShowModalImport(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleImportSoal} className="p-6 flex flex-col gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">1. Unduh Template Panduan (Excel)</label>
                  <a 
                    href="/soal/template" 
                    className="btn btn-outline justify-center py-3 text-slate-600 text-xs font-bold bg-slate-50"
                  >
                     <FileSpreadsheet size={16} className="mr-2 text-emerald-600" /> Unduh Template Excel Soal
                  </a>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Untuk Word (.docx), buat tabel dengan susunan kolom yang sama: <strong>No, Jenis, Isi, Jawaban</strong>.
                  </p>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold text-slate-500">2. Pilih File Excel / Word (.xlsx, .xls, .csv, .docx)</label>
                  <input 
                    type="file" 
                    className="input py-2" 
                    accept=".xlsx, .xls, .csv, .docx"
                    onChange={e => formImport.setData('file', e.target.files[0])}
                    required 
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalImport(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary bg-indigo-600 border-indigo-600 hover:bg-indigo-700" disabled={isPreviewLoading}>
                    {isPreviewLoading ? 'Memproses Preview...' : 'Mulai Impor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Preview Hasil Impor Soal ── */}
        {showModalPreview && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Preview Hasil Impor Soal</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Silakan periksa susunan layout, gambar, dan kunci jawaban sebelum menyimpan ke database.</p>
                </div>
                <button onClick={() => { setShowModalPreview(false); setPreviewQuestions([]); }} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-6">
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                  💡 <strong>Informasi:</strong> Gambar dan format tulisan tebal/miring/garis bawah di bawah ini dirender persis seperti yang akan tampil pada layar ujian siswa. Pastikan kunci jawaban telah ditandai dengan benar.
                </div>
                
                {previewQuestions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold">Tidak ada soal yang terdeteksi untuk di-preview.</div>
                ) : (
                  previewQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase">
                          Soal #{idx + 1} ({q.tipe})
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          Bobot default: <span className="text-indigo-600 font-black">{q.bobot}</span> poin
                        </span>
                      </div>
                      
                      {/* Konten Pertanyaan */}
                      <div className="text-slate-700 text-sm leading-relaxed font-semibold">
                        {renderMathContent(q.konten)}
                      </div>
                      
                      {/* Opsi (jika PG) */}
                      {q.tipe === 'PG' && q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 gap-2.5 mt-2 pl-4 border-l-2 border-slate-200">
                          {q.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx} 
                              className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-semibold ${
                                opt.is_correct 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 shadow-sm' 
                                  : 'bg-slate-50 border-slate-150 text-slate-600'
                              }`}
                            >
                              <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                                opt.is_correct 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {opt.label}
                              </span>
                              <div className="flex-1 pt-0.5" dangerouslySetInnerHTML={{ __html: opt.konten }} />
                              {opt.is_correct && (
                                <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0">
                                  Kunci
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">
                  Total terdeteksi: <strong className="text-indigo-600">{previewQuestions.length}</strong> butir soal
                </span>
                <div className="flex gap-2.5">
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => { setShowModalPreview(false); setPreviewQuestions([]); }}
                    disabled={isSavingPreview}
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700" 
                    onClick={handleConfirmSaveImport}
                    disabled={isSavingPreview}
                  >
                    {isSavingPreview ? 'Menyimpan...' : 'Simpan ke Database'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Edit Bobot Semua Soal ── */}
        {showModalBulkWeight && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">Atur Bobot Semua Soal</h3>
                <button onClick={() => setShowModalBulkWeight(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleBulkWeightSubmit} className="p-6 flex flex-col gap-4">
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                  ⚠️ <strong>Penting:</strong> Tindakan ini akan memperbarui bobot nilai semua butir soal yang dipilih sekaligus dalam mata pelajaran ini.
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Pilih Tipe Soal</label>
                  <select 
                    className="input py-2.5"
                    value={bulkWeightTipe}
                    onChange={e => setBulkWeightTipe(e.target.value)}
                  >
                    <option value="ALL">Semua Tipe Soal</option>
                    <option value="PG">Pilihan Ganda (PG)</option>
                    <option value="ESSAY">Essay</option>
                    <option value="MATCHING">Menjodohkan</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold text-slate-500">Bobot / Nilai Per Butir Soal</label>
                  <input 
                    type="number" 
                    step="any"
                    className="input py-2.5" 
                    placeholder="Contoh: 2.5"
                    value={bulkWeightValue}
                    onChange={e => setBulkWeightValue(e.target.value)}
                    min="0"
                    required 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Gunakan desimal (titik) jika bobot bukan bilangan bulat. Misal: jika ada 40 soal PG, isi 2.5 agar total skor maksimal 100.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalBulkWeight(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">
                    Simpan Bobot Baru
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
