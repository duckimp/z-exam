import { useForm, Head } from '@inertiajs/react'
import { Save, School, Palette, Info } from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function SettingsPage({ settings }) {
  const form = useForm({
    app_name: settings?.app_name || 'Z-Exam',
    school_name: settings?.school_name || 'Sekolah Menengah Kejuruan',
    footer_text: settings?.footer_text || 'Copyright © 2026 Z-Exam',
    theme_color: settings?.theme_color || '#6366f1'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    form.post('/pengaturan', {
      onSuccess: () => alert('Pengaturan berhasil disimpan!')
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
          
          {/* Identitas */}
          <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="panel-header px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <School size={16} className="text-indigo-600" />
              <span className="panel-title text-sm font-bold text-slate-700">Identitas Sekolah & Aplikasi</span>
            </div>
            <div className="panel-body p-6 flex flex-col gap-5">
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Nama Aplikasi</label>
                <input 
                  className="input font-semibold" 
                  value={form.data.app_name} 
                  onChange={e => form.setData('app_name', e.target.value)} 
                  required 
                />
              </div>
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Nama Sekolah / Instansi</label>
                <input 
                  className="input font-semibold" 
                  value={form.data.school_name} 
                  onChange={e => form.setData('school_name', e.target.value)} 
                  required 
                />
              </div>
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Teks Kaki (Footer Text)</label>
                <input 
                  className="input font-semibold" 
                  value={form.data.footer_text} 
                  onChange={e => form.setData('footer_text', e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Tampilan */}
          <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="panel-header px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Palette size={16} className="text-indigo-600" />
              <span className="panel-title text-sm font-bold text-slate-700">Preferensi Tampilan</span>
            </div>
            <div className="panel-body p-6 flex flex-col gap-4">
              <div className="form-field flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Warna Aksen Utama</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200 p-0 overflow-hidden flex-shrink-0" 
                    value={form.data.theme_color} 
                    onChange={e => form.setData('theme_color', e.target.value)} 
                  />
                  <input 
                    className="input flex-1 font-mono uppercase" 
                    value={form.data.theme_color} 
                    onChange={e => form.setData('theme_color', e.target.value)} 
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                  <Info size={12} className="text-indigo-500" /> Warna ini akan digunakan sebagai identitas aksen visual di seluruh modul.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="submit" className="btn btn-primary py-3 px-8 font-bold" disabled={form.processing}>
              <Save size={16} className="mr-1.5" /> {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

      </div>
    </AdminLayout>
  )
}
