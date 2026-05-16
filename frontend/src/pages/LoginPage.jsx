import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import useAuthStore from '../store/authStore'
import api from '../services/api'

export default function LoginPage() {
  const { theme, toggle } = useTheme()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/login', form)
      setAuth(data.user, data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0]
        || err.response?.data?.message
        || 'Terjadi kesalahan. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Theme Toggle */}
      <button
        onClick={toggle}
        className="theme-toggle-btn"
        title="Toggle tema"
        style={{ position: 'fixed', top: 16, right: 16 }}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      <div className="login-card animate-fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-mark">Z</div>
          <h1 className="login-title">Masuk ke Z-Exam</h1>
          <p className="login-sub">Sistem Ujian Berbasis Komputer — Intranet</p>
        </div>

        {/* Error */}
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input input-mono"
              placeholder="admin@z-exam.local"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label className="label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                className="input input-mono"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-faint)',
                  display: 'flex',
                  padding: 0,
                }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner" /> Memverifikasi...</>
              : 'Masuk'
            }
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-footer">
          <div style={{ marginBottom: 6 }}>Akun Demo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span>admin@z-exam.local · admin123</span>
            <span>guru@z-exam.local · guru123</span>
            <span>pengawas@z-exam.local · pengawas123</span>
          </div>
        </div>
      </div>
    </div>
  )
}
