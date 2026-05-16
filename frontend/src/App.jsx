import { Routes, Route, Navigate } from 'react-router-dom'

// Placeholder pages — akan diisi di Fase 1+
function ComingSoon({ name }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '12px',
      color: 'var(--color-text-muted)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-faint)' }}>
        z-exam / {name}
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>
        {name}
      </h2>
      <p style={{ fontSize: '13px' }}>Akan diimplementasikan di Fase berikutnya.</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<ComingSoon name="Login" />} />
      <Route path="/dashboard" element={<ComingSoon name="Dashboard" />} />
      <Route path="/siswa" element={<ComingSoon name="Manajemen Siswa" />} />
      <Route path="/soal" element={<ComingSoon name="Bank Soal" />} />
      <Route path="/ujian" element={<ComingSoon name="Manajemen Ujian" />} />
      <Route path="/laporan" element={<ComingSoon name="Laporan" />} />
      <Route path="/pengaturan" element={<ComingSoon name="Pengaturan" />} />
      <Route path="*" element={<ComingSoon name="404 — Halaman tidak ditemukan" />} />
    </Routes>
  )
}
