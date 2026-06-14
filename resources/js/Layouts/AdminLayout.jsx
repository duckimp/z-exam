import { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart2, HardDrive, Settings, LogOut, ShieldCheck,
  Menu, X
} from 'lucide-react'

// ── Definisi navigasi ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    section: 'Utama',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',     roles: ['super_admin', 'guru', 'pengawas'] },
    ],
  },
  {
    section: 'Manajemen',
    items: [
      { to: '/siswa',     icon: Users,           label: 'Peserta',        roles: ['super_admin'] },
      { to: '/soal',      icon: BookOpen,         label: 'Bank Soal',      roles: ['super_admin', 'guru'] },
      { to: '/ujian/sesi', icon: ClipboardList,    label: 'Sesi Ujian',     roles: ['super_admin', 'pengawas'] },
    ],
  },
  {
    section: 'Analitik',
    items: [
      { to: '/laporan',   icon: BarChart2,        label: 'Laporan',        roles: ['super_admin', 'guru'] },
    ],
  },
  {
    section: 'Sistem',
    items: [
      { to: '/backup',    icon: HardDrive,        label: 'Backup',         roles: ['super_admin'] },
      { to: '/pengaturan',icon: Settings,         label: 'Pengaturan',     roles: ['super_admin'] },
    ],
  },
]

// ── Helper ───────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function getRoleBadge(roles = []) {
  if (roles.includes('super_admin')) return 'Admin'
  if (roles.includes('guru'))        return 'Guru'
  if (roles.includes('pengawas'))    return 'Pengawas'
  return '—'
}

// ── Sidebar Component ─────────────────────────────────────────────────────────
function Sidebar({ user, isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const { url } = usePage()
  const userRoles  = user?.roles ?? []

  const handleLogout = (e) => {
    e.preventDefault()
    router.post('/logout')
  }

  return (
    <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="sidebar-logo-mark">Z</div>
          <div>
            <div className="sidebar-logo-text">Z-Exam</div>
            <div className="sidebar-logo-sub">v1.0.0</div>
          </div>
        </div>

        {/* Close Button on Mobile (Toggled via CSS & JS) */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="mobile-toggle-close"
          style={{ 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            color: 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(group => {
          const visible = group.items.filter(item =>
            item.roles.some(r => userRoles.includes(r))
          )
          if (!visible.length) return null
          return (
            <div key={group.section}>
              <div className="sidebar-section-label">{group.section}</div>
              {visible.map(({ to, icon: Icon, label }) => {
                const isActive = url.startsWith(to)
                return (
                  <Link
                    key={to}
                    href={to}
                    onClick={() => setIsMobileSidebarOpen(false)} // Otomatis tutup sidebar setelah klik menu di mobile
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={15} className="nav-item-icon" />
                    {label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--color-danger)' }}>
          <LogOut size={15} className="nav-item-icon" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

// ── Topbar Component ──────────────────────────────────────────────────────────
function Topbar({ user, setIsMobileSidebarOpen }) {
  const { url } = usePage()

  // Buat breadcrumb dari pathname
  const cleanPath = url.split('?')[0]
  const crumb = cleanPath.replace('/', '') || 'dashboard'
  const crumbLabel = crumb.charAt(0).toUpperCase() + crumb.slice(1)

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Hamburger Toggle Button for Mobile */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="mobile-toggle"
          style={{ 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            color: 'var(--color-text-muted)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <Menu size={18} />
        </button>

        <span className="topbar-breadcrumb">
          z-exam / <span>{crumbLabel}</span>
        </span>
      </div>
      <div className="topbar-right">
        <div className="badge badge-default" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
          <ShieldCheck size={13} className="shrink-0" />
          <span>{getRoleBadge(user?.roles ?? [])}</span>
        </div>
        <Link href="/profile" className="topbar-user hover:opacity-80 transition-all cursor-pointer" style={{ textDecoration: 'none' }}>
          <div className="topbar-avatar">{getInitials(user?.name)}</div>
          <span className="topbar-user-name">{user?.name ?? '—'}</span>
        </Link>
      </div>
    </header>
  )
}

// ── Admin Layout (export utama) ───────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const { props } = usePage()
  const user = props.auth?.user
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="admin-shell">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar 
        user={user} 
        isMobileSidebarOpen={isMobileSidebarOpen} 
        setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
      />
      
      <div className="main-area">
        <Topbar 
          user={user} 
          setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
        />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  )
}
