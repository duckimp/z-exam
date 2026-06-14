import { useForm, Head, router } from '@inertiajs/react'
import { Database, Download, Trash2, RefreshCw, Plus, FileText, AlertTriangle } from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function BackupPage({ backups }) {
  const form = useForm({})

  const handleCreate = () => {
    form.post('/backup', {
      onSuccess: () => alert('Backup database berhasil dibuat!')
    })
  }

  const handleDelete = (filename) => {
    if (!confirm(`Hapus file backup ${filename}?`)) return
    router.delete(`/backup/${filename}`)
  }

  const handleRestore = (filename) => {
    if (!confirm(`PERINGATAN: Restore akan menimpa database saat ini dengan data dari file ${filename}. Semua data terbaru yang belum dibackup akan hilang. Lanjutkan?`)) return
    
    form.post('/backup/restore', {
      filename
    }, {
      onSuccess: () => {
        alert('Restore berhasil! Sistem akan memuat ulang halaman.')
        window.location.reload()
      }
    })
  }

  const handleDownload = (filename) => {
    window.open(`/backup/${filename}/download`, '_blank')
  }

  return (
    <AdminLayout>
      <Head title="Backup & Restore" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header flex justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-slate-800">Backup & Restore</h1>
            <p className="page-desc text-sm text-slate-500 mt-1">Amankan basis data ujian dan pulihkan cadangan berkala secara aman.</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={form.processing}>
            {form.processing ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : <Plus size={14} className="mr-1.5" />} 
            Buat Backup Baru
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Backups List */}
          <div className="lg:col-span-2">
            <div className="panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="panel-header px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="panel-title text-sm font-bold text-slate-700">Daftar File Cadangan SQLite</span>
                <button className="btn btn-sm btn-ghost p-1.5 text-slate-400 hover:text-slate-600" onClick={() => router.reload({ only: ['backups'] })} disabled={form.processing}>
                  <RefreshCw size={14} className={form.processing ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 bg-slate-50/30 uppercase tracking-wider">
                      <th className="p-4 pl-6">Nama File</th>
                      <th className="p-4">Ukuran</th>
                      <th className="p-4">Tanggal Pembuatan</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-16 text-center text-xs font-mono text-slate-400">
                          Belum ada file cadangan tersedia.
                        </td>
                      </tr>
                    ) : (
                      backups.map(b => (
                        <tr key={b.name} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors text-sm">
                          <td className="p-4 pl-6 font-mono text-xs text-slate-600">{b.name}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold rounded-lg font-mono">
                              {b.size}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-450 font-mono">{b.date}</td>
                          <td className="p-4 pr-6 text-right flex justify-end gap-1">
                            <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-indigo-600" title="Unduh File" onClick={() => handleDownload(b.name)}>
                              <Download size={14} />
                            </button>
                            <button className="btn btn-sm btn-ghost p-2 text-indigo-600 hover:text-indigo-850" title="Pulihkan / Restore" onClick={() => handleRestore(b.name)} disabled={form.processing}>
                              <Database size={14} />
                            </button>
                            <button className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-red-600" title="Hapus" onClick={() => handleDelete(b.name)}>
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
          </div>

          {/* Info Side Panels */}
          <div className="flex flex-col gap-6">
            
            {/* Warning Box */}
            <div className="panel bg-amber-50/30 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm mb-3">
                <AlertTriangle size={16} />
                <span>Peringatan Penting</span>
              </div>
              <div className="text-xs text-slate-500 leading-relaxed font-semibold flex flex-col gap-2.5">
                <p>Backup ini mencakup seluruh skema database dan data termasuk **Siswa, Soal, Sesi Ujian, and Jawaban Ujian**.</p>
                <p>Sangat disarankan mengunduh berkas cadangan ke flashdisk atau cloud server secara berkala.</p>
                <p className="text-amber-800 font-extrabold">Proses pemulihan (Restore) akan menimpa database aktif. Harap lakukan saat tidak ada ujian berlangsung!</p>
              </div>
            </div>

            {/* Sys Info Box */}
            <div className="panel bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm mb-4 pb-2 border-b border-slate-100">
                <FileText size={16} className="text-indigo-500" />
                <span>Informasi Sistem</span>
              </div>
              <div className="flex flex-col gap-3 font-semibold text-xs text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Engine Database</span>
                  <span className="font-mono font-black text-slate-800">SQLite 3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Penyimpanan Backup</span>
                  <span className="font-mono text-slate-800 text-[10px]">/storage/app/backups</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </AdminLayout>
  )
}
