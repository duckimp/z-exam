import { useRef, useState } from 'react'
import { useForm, Head } from '@inertiajs/react'
import { Save, School, Palette, Info, FileSignature, Upload, X, CalendarDays } from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function SettingsPage({ settings }) {
  const form = useForm({
    app_name:            settings?.app_name            || 'Z-Exam',
    school_name:         settings?.school_name         || 'Sekolah Menengah Kejuruan',
    footer_text:         settings?.footer_text         || 'Copyright © 2026 Z-Exam',
    theme_color:         settings?.theme_color         || '#6366f1',
    kepala_sekolah_nama: settings?.kepala_sekolah_nama || '',
    kepala_sekolah_nip:  settings?.kepala_sekolah_nip  || '',
    kartu_tanggal_cetak: settings?.kartu_tanggal_cetak || '',
    kepala_sekolah_ttd:  null,   // file object, null = tidak diubah
  })

  const fileInputRef = useRef(null)
  const [ttdPreview, setTtdPreview] = useState(
    settings?.kepala_sekolah_ttd
      ? '/storage/' + settings.kepala_sekolah_ttd
      : null
  )
  const [removeTtd, setRemoveTtd] = useState(false)

  const handleTtdChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    form.setData('kepala_sekolah_ttd', file)
    setTtdPreview(URL.createObjectURL(file))
    setRemoveTtd(false)
  }

  const handleRemoveTtd = () => {
    form.setData('kepala_sekolah_ttd', null)
    setTtdPreview(null)
    setRemoveTtd(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    form.post('/pengaturan', {
      forceFormData: true,   // wajib untuk upload file
    })
  }

  return (
    <AdminLayout>
      <Head title="Pengaturan Sistem" />
      <div className="animate-fade-in max-w-4xl">

        {/* Header */}
        <div className="page-header mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-slate-800">Pengaturan Sistem</h1>
            <p className="page-desc text-sm text-slate-500 mt-1">Konfigurasi identitas aplikasi, nama instansi sekolah, dan preferensi visual.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Identitas ── */}
          <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="panel-header px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <School size={16} className="text-indigo-600" />
              <span className="panel-title text-sm font-bold text-slate-700">Identitas Sekolah &amp; Aplikasi</span>
            </div>
            <div className="panel-body p-6 flex flex-col gap-5">
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Nama Aplikasi</label>
                <input className="input font-semibold" value={form.data.app_name}
                  onChange={e => form.setData('app_name', e.target.value)} required />
              </div>
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Nama Sekolah / Instansi</label>
                <input className="input font-semibold" value={form.data.school_name}
                  onChange={e => form.setData('school_name', e.target.value)} required />
              </div>
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Teks Kaki (Footer Text)</label>
                <input className="input font-semibold" value={form.data.footer_text}
                  onChange={e => form.setData('footer_text', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Tampilan ── */}
          <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="panel-header px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Palette size={16} className="text-indigo-600" />
              <span className="panel-title text-sm font-bold text-slate-700">Preferensi Tampilan</span>
            </div>
            <div className="panel-body p-6 flex flex-col gap-4">
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Warna Aksen Utama</label>
                <div className="flex gap-4 items-center">
                  <input type="color"
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200 p-0 overflow-hidden flex-shrink-0"
                    value={form.data.theme_color}
                    onChange={e => form.setData('theme_color', e.target.value)} />
                  <input className="input flex-1 font-mono uppercase"
                    value={form.data.theme_color}
                    onChange={e => form.setData('theme_color', e.target.value)} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                  <Info size={12} className="text-indigo-500" /> Warna ini akan digunakan sebagai identitas aksen visual di seluruh modul.
                </span>
              </div>
            </div>
          </div>

          {/* ── Kartu Ujian ── */}
          <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="panel-header px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FileSignature size={16} className="text-indigo-600" />
              <span className="panel-title text-sm font-bold text-slate-700">Kartu Ujian — Tanda Tangan Kepala Sekolah</span>
            </div>
            <div className="panel-body p-6 flex flex-col gap-5">

              {/* Nama & NIP — 2 kolom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-field flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Nama Kepala Sekolah</label>
                  <input className="input font-semibold"
                    placeholder="Drs. Budi Santoso, M.Pd."
                    value={form.data.kepala_sekolah_nama}
                    onChange={e => form.setData('kepala_sekolah_nama', e.target.value)} />
                </div>
                <div className="form-field flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">NIP</label>
                  <input className="input font-mono"
                    placeholder="19700101 199903 1 001"
                    value={form.data.kepala_sekolah_nip}
                    onChange={e => form.setData('kepala_sekolah_nip', e.target.value)} />
                </div>
              </div>

              {/* Tanggal Cetak */}
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <CalendarDays size={12} className="text-indigo-500" /> Tanggal Cetak Kartu
                </label>
                <input className="input font-semibold"
                  placeholder="Contoh: Bandung, 28 Mei 2026"
                  value={form.data.kartu_tanggal_cetak}
                  onChange={e => form.setData('kartu_tanggal_cetak', e.target.value)} />
                <span className="text-[10px] text-slate-400 mt-1">
                  Teks ini muncul di atas nama kepala sekolah pada kartu ujian.
                </span>
              </div>

              {/* Upload TTD */}
              <div className="form-field flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">Gambar Tanda Tangan (PNG transparan, maks 2MB)</label>

                {ttdPreview ? (
                  <div className="flex items-start gap-4">
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-center"
                      style={{ width: 160, height: 80 }}>
                      <img src={ttdPreview} alt="Preview TTD"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div className="flex flex-col gap-2 mt-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="btn text-xs px-3 py-1.5 flex items-center gap-1"
                        style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                        <Upload size={12} /> Ganti Gambar
                      </button>
                      <button type="button" onClick={handleRemoveTtd}
                        className="btn text-xs px-3 py-1.5 flex items-center gap-1"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                        <X size={12} /> Hapus TTD
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-6 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
                    style={{ background: 'none' }}>
                    <Upload size={18} />
                    <span className="text-sm font-semibold">Klik untuk upload gambar TTD</span>
                  </button>
                )}

                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg"
                  className="hidden" onChange={handleTtdChange} />

                {/* Flag hapus TTD — dikirim sebagai field hidden */}
                {removeTtd && <input type="hidden" name="remove_ttd" value="1" />}

                <span className="text-[10px] text-slate-400">
                  Gunakan PNG dengan background transparan agar TTD terlihat bersih di kartu ujian.
                </span>
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="submit" className="btn btn-primary py-3 px-8 font-bold" disabled={form.processing}>
              <Save size={16} className="mr-1.5" />
              {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

      </div>
    </AdminLayout>
  )
}
