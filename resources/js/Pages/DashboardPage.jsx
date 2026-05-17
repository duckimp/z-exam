import { usePage, Head } from '@inertiajs/react'
import { LayoutDashboard, Users, Clock, BookOpen } from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function DashboardPage({ stats }) {
  const { props } = usePage()
  const user = props.auth?.user

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  const metrics = [
    { label: 'Total Peserta', value: stats?.total_peserta || 0, sub: 'Siswa terdaftar', icon: Users, color: 'var(--color-accent)' },
    { label: 'Sesi Ujian', value: stats?.sesi_aktif || 0, sub: 'Ujian berlangsung', icon: Clock, color: 'var(--color-accent)' },
    { label: 'Mapel Terunggah', value: stats?.total_mapel || 0, sub: 'Mata pelajaran', icon: BookOpen, color: 'var(--color-accent)' },
    { label: 'Status Server', value: 'OK', sub: 'Semua normal', icon: LayoutDashboard, color: 'var(--color-accent)' },
  ]

  return (
    <AdminLayout>
      <Head title="Dashboard" />
      <div className="animate-fade-in">
        <div className="page-header mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-[var(--color-text)]">Dashboard</h1>
            <p className="page-desc text-sm text-[var(--color-text-muted)] mt-1">{greeting}, {user?.name?.split(' ')[0] ?? 'Admin'}. Selamat datang di Z-Exam.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="panel bg-[var(--color-surface)] p-5 border border-[var(--color-border)] rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-faint)] mb-1">{m.label}</div>
                  <div className="text-3xl font-black text-[var(--color-text)]">{m.value}</div>
                </div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 8, 
                  background: 'var(--color-surface-2)',
                  color: m.color
                }}>
                  <m.icon size={20} />
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-2 font-semibold">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="panel bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
          <div className="panel-header px-6 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
            <span className="panel-title text-sm font-bold text-[var(--color-text)]">Aktivitas Ujian Terbaru</span>
          </div>
          <div className="panel-body p-0">
            {stats?.recent_exams && stats.recent_exams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {stats.recent_exams.map(ex => (
                      <tr key={ex.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]/50 transition-colors">
                        <td className="p-4 w-12 text-center">
                           <div style={{ 
                              width: 36, height: 36, borderRadius: '50%', 
                              background: ex.is_active ? 'var(--color-success-soft)' : 'var(--color-surface-2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: ex.is_active ? 'var(--color-success)' : 'var(--color-text-faint)'
                            }}>
                              <Clock size={16} />
                           </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-sm text-[var(--color-text-2)]">{ex.nama_sesi}</div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1 font-semibold">{ex.mapel?.nama_mapel} · {ex.tanggal}</div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${ex.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                            {ex.is_active ? 'Berlangsung' : 'Selesai'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] text-center font-mono py-16">
                Belum ada aktivitas ujian.
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
