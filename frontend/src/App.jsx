import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Layout & Guard
import AdminLayout from './layouts/AdminLayout'
import AuthGuard from './components/AuthGuard'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SiswaPage from './pages/SiswaPage'
import BankSoalPage from './pages/BankSoalPage'
import SesiUjianPage from './pages/SesiUjianPage'
import MonitoringPage from './pages/MonitoringPage'

// ── Placeholder untuk fase berikutnya ─────────────────────────────────────
function ComingSoon({ name }) {
  return (
    <div className="animate-fade-in" style={{ padding: '60px 0', textAlign: 'center' }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-faint)',
        marginBottom: 8,
      }}>
        z-exam / {name.toLowerCase()}
      </p>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
        {name}
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        Modul ini akan diimplementasikan pada fase berikutnya.
      </p>
    </div>
  )
}

// ── Protected layout wrapper ─────────────────────────────────────────────────
function ProtectedPage({ children }) {
  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  )
}

// ── App Router ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — Admin Panel */}
      <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
      <Route path="/siswa"     element={<ProtectedPage><SiswaPage /></ProtectedPage>} />
      <Route path="/soal"      element={<ProtectedPage><BankSoalPage /></ProtectedPage>} />
      <Route path="/ujian"     element={<ProtectedPage><SesiUjianPage /></ProtectedPage>} />
      <Route path="/monitoring/:id" element={<ProtectedPage><MonitoringPage /></ProtectedPage>} />
      <Route path="/laporan"   element={<ProtectedPage><ComingSoon name="Laporan & Analitik" /></ProtectedPage>} />
      <Route path="/backup"    element={<ProtectedPage><ComingSoon name="Backup & Restore" /></ProtectedPage>} />
      <Route path="/pengaturan" element={<ProtectedPage><ComingSoon name="Pengaturan Sistem" /></ProtectedPage>} />

      {/* Redirect */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
