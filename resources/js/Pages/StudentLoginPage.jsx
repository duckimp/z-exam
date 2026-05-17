import { useState } from 'react'
import { useForm, router } from '@inertiajs/react'
import { KeyRound, Hash, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function StudentLoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    post('/student/login')
  }

  return (
    <div className="login-page bg-surface-2 min-h-screen flex items-center justify-center p-4">
      <div className="panel animate-fade-in w-full max-w-[380px] p-8 shadow-lg">
        
        <div className="login-header text-center mb-8">
          <div className="login-logo-mark bg-accent mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm">
            Z
          </div>
          <h1 className="login-title text-2xl font-black">Pintu Masuk Siswa</h1>
          <p className="login-sub text-xs text-muted leading-relaxed mt-1">Masukkan NISN & Password untuk masuk ke Dashboard Ujian</p>
        </div>

        {errors.message && (
          <div className="login-error mb-4">
            {errors.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form flex flex-col gap-4">
          <div className="form-field flex flex-col gap-1">
            <label className="label text-sm font-semibold">NISN (Username)</label>
            <div className="relative w-full flex items-center">
              <Hash size={16} className="absolute left-3 text-muted pointer-events-none z-10" />
              <input 
                className="input input-mono w-full" 
                placeholder="Nomor Induk Siswa Nasional" 
                value={data.username} 
                onChange={e => setData('username', e.target.value)} 
                required 
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>
          
          <div className="form-field flex flex-col gap-1">
            <label className="label text-sm font-semibold">Password</label>
            <div className="relative w-full flex items-center">
              <KeyRound size={16} className="absolute left-3 text-muted pointer-events-none z-10" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="input input-mono w-full" 
                placeholder="Password Anda" 
                value={data.password} 
                onChange={e => setData('password', e.target.value)} 
                required 
                style={{ paddingLeft: '36px', paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 text-muted hover:text-accent cursor-pointer flex items-center justify-center z-10"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary justify-center mt-2 py-3 w-full" 
            disabled={processing}
          >
            {processing ? <span className="spinner"></span> : 'Masuk Dashboard'}
            {!processing && <ArrowRight size={15} className="ml-1.5" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-250 text-center">
          <p className="text-[10px] text-muted mb-4 leading-relaxed">
            Gunakan browser Google Chrome atau Microsoft Edge terbaru.<br/>
            Pastikan koneksi Wi-Fi terhubung ke server lokal sekolah.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <button 
              onClick={() => router.visit('/login')} 
              className="text-accent hover:underline font-bold text-xs cursor-pointer"
            >
              Masuk sebagai Admin/Guru/Operator
            </button>
            <span className="text-[9px] text-slate-400 font-semibold mt-3">
              Copyright © 2026 Z-Exam - Developed by Andi FR. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
