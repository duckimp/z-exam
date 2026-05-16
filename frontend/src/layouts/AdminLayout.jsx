import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart2, HardDrive, Settings, LogOut, Moon, Sun,
  ShieldCheck,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import useAuthStore from '../store/authStore'
import api from '../services/api'

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
      { to: '/ujian',     icon: ClipboardList,    label: 'Sesi Ujian',     roles: ['super_admin', 'pengawas'] },
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
function Sidebar({ user }) {
  const navigate  = useNavigate()
  const { theme, toggle } = useTheme()
  const { logout } = useAuthStore()

  const userRoles  = user?.roles ?? []

  const handleLogout = async () => {
    try { await api.post('/logout') } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">Z</div>
        <div>
          <div className="sidebar-logo-text">Z-Exam</div>
          <div className="sidebar-logo-sub">v1.0.0</div>
        </div>
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
              {visible.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} className="nav-item-icon" />
                  {label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          onClick={toggle}
          className="nav-item"
          style={{ marginBottom: 2 }}
          title="Toggle tema"
        >
          {theme === 'dark' ? <Sun size={15} className="nav-item-icon" /> : <Moon size={15} className="nav-item-icon" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--color-danger)' }}>
          <LogOut size={15} className="nav-item-icon" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

// ── Topbar Component ──────────────────────────────────────────────────────────
function Topbar({ user }) {
  const location = useLocation()

  // Buat breadcrumb dari pathname
  const crumb = location.pathname.replace('/', '') || 'dashboard'
  const crumbLabel = crumb.charAt(0).toUpperCase() + crumb.slice(1)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-breadcrumb">
          z-exam / <span>{crumbLabel}</span>
        </span>
      </div>
      <div className="topbar-right">
        <div className="badge badge-default" style={{ gap: 4 }}>
          <ShieldCheck size={11} />
          {getRoleBadge(user?.roles ?? [])}
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar">{getInitials(user?.name)}</div>
          <span className="topbar-user-name">{user?.name ?? '—'}</span>
        </div>
      </div>
    </header>
  )
}

// ── Admin Layout (export utama) ───────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const { user } = useAuthStore()

  return (
    <div className="admin-shell">
      <Sidebar user={user} />
      <div className="main-area">
        <Topbar user={user} />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  )
}
