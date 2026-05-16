import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, User, Hash, ArrowRight, ShieldCheck } from 'lucide-react'
import api from '../services/api'
import useExamStore from '../store/examStore'

export default function StudentLoginPage() {
  const navigate = useNavigate()
  const { setExamData } = useExamStore()

  const [form, setForm] = useState({ username: '', password: '', token: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Login
      const loginRes = await api.post('/exam/login', form)
      const { student, sesi, ujian } = loginRes.data

      // 2. Fetch Questions & Start Session
      const startRes = await api.post('/exam/start', {
        sesi_id: sesi.id,
        student_id: student.id
      })

      const { soal, jawaban, ujian: ujianData } = startRes.data
      
      // Hitung end time: sekarang + durasi (menit)
      const endTime = Date.now() + (sesi.durasi * 60000)

      setExamData(student, sesi, ujianData, soal, jawaban, endTime)
      navigate('/exam', { replace: true })

    } catch (err) {
      setError(err.response?.data?.message || 'Gagal masuk. Cek NISN dan Token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page bg-surface-2">
      <div className="login-card animate-fade-in" style={{ maxWidth: 400 }}>
        <div className="login-header">
          <div className="login-logo-mark bg-accent">S</div>
          <h1 className="login-title">Pintu Masuk Siswa</h1>
          <p className="login-sub">Masukkan NISN dan Token Ujian</p>
        </div>

        {error && <div className="login-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-field">
            <label className="label">NISN (Username)</label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-3 text-muted" />
              <input className="input pl-10 text-mono" placeholder="Nomor Induk Siswa Nasional" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
            </div>
          </div>
          
          <div className="form-field">
            <label className="label">Password (Default NISN)</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-3 text-muted" />
              <input type="password" className="input pl-10" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
          </div>

          <div className="form-field">
            <label className="label">Token Ujian (6 Digit)</label>
            <div className="relative">
              <ShieldCheck size={16} className="absolute left-3 top-3 text-muted" />
              <input className="input pl-10 text-mono uppercase tracking-widest font-black" placeholder="ABCDEF" maxLength={6} value={form.token} onChange={e => setForm({...form, token: e.target.value.toUpperCase()})} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary justify-center mt-2 py-3" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Mulai Ujian SEKARANG'}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-top text-center">
          <p className="text-xs text-faint">
            Gunakan browser Google Chrome atau Microsoft Edge terbaru.<br/>
            Pastikan koneksi Wi-Fi terhubung ke server lokal sekolah.
          </p>
        </div>
      </div>
    </div>
  )
}
