import { LayoutDashboard, Users, Clock, BookOpen } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">{greeting}, {user?.name?.split(' ')[0] ?? 'Admin'}. Selamat datang di Z-Exam.</p>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="metric-grid">
        {[
          { label: 'Total Peserta',   value: '—', sub: 'Belum ada data',   icon: Users },
          { label: 'Sesi Aktif',      value: '—', sub: 'Belum ada ujian',  icon: Clock },
          { label: 'Mapel Terunggah', value: '—', sub: 'Belum ada soal',   icon: BookOpen },
          { label: 'Status Server',   value: 'OK', sub: 'Semua sistem normal', icon: LayoutDashboard },
        ].map(({ label, value, sub }) => (
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value}</div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Info Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Aktivitas Terkini</span>
        </div>
        <div className="panel-body">
          <p style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textAlign: 'center',
            padding: '40px 0',
          }}>
            Belum ada aktivitas. Sesi ujian akan muncul di sini.
          </p>
        </div>
      </div>
    </div>
  )
}
