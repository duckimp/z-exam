import { useState } from 'react'
import { useForm, router, Head } from '@inertiajs/react'
import { Eye, EyeOff, Moon, Sun, User } from 'lucide-react'

export default function Login({ status }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    username: '',
    password: '',
    remember: true,
  })

  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/login', {
      onFinish: () => reset('password'),
    })
  }

  return (
    <div className="login-page bg-surface-2 min-h-screen flex items-center justify-center p-4">
      <Head title="Masuk Admin" />



      <div className="login-card animate-fade-in w-full max-w-[360px]">
        {/* Header */}
        <div className="login-header text-center mb-8">
          <div className="login-logo-mark bg-accent mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white">Z</div>
          <h1 className="login-title text-2xl font-black">Masuk ke Z-Exam</h1>
          <p className="login-sub text-xs text-muted leading-relaxed">Sistem Ujian Berbasis Komputer — Intranet</p>
        </div>

        {/* Status */}
        {status && (
          <div className="mb-4 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
            {status}
          </div>
        )}

        {/* Error */}
        {errors.username && (
          <div className="login-error mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            {errors.username}
          </div>
        )}

        {/* Form */}
        <form className="login-form flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="form-field flex flex-col gap-1">
            <label className="label text-sm font-semibold" htmlFor="username">Username</label>
            <div className="relative w-full flex items-center">
              <User size={16} className="absolute left-3 text-muted pointer-events-none z-10" />
              <input
                id="username"
                type="text"
                className="input input-mono w-full"
                placeholder="Username Anda"
                value={data.username}
                onChange={e => setData('username', e.target.value)}
                required
                autoFocus
                autoComplete="username"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="form-field flex flex-col gap-1">
            <label className="label text-sm font-semibold" htmlFor="password">Password</label>
            <div className="relative w-full flex items-center">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="input input-mono w-full"
                placeholder="••••••••"
                value={data.password}
                onChange={e => setData('password', e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 text-muted hover:text-accent cursor-pointer flex items-center justify-center z-10"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary justify-center mt-2 py-3 w-full"
            disabled={processing}
          >
            {processing ? <span className="spinner" /> : 'Masuk'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-footer mt-8 pt-6 border-t border-gray-250 text-center text-xs text-faint">       
          <div className="mt-6">
            <button 
              onClick={() => router.visit('/')}
              className="text-indigo-600 hover:underline font-bold">
              ➔ Pintu Masuk Siswa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
