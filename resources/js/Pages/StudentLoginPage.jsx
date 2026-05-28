import { useState, useEffect, useRef } from 'react'
import { useForm, router, usePage } from '@inertiajs/react'
import { KeyRound, Hash, ArrowRight, Eye, EyeOff, QrCode, X, CameraOff } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export default function StudentLoginPage() {
  const { errors: pageErrors } = usePage().props
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: ''
  })

  const [showPassword, setShowPassword]   = useState(false)
  const [scannerOpen, setScannerOpen]     = useState(false)
  const [scanError, setScanError]         = useState(null)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const scannerRef    = useRef(null)
  const isRunningRef  = useRef(false)   // track apakah scanner benar-benar running
  const SCANNER_ID    = 'qr-reader'

  // Gabungkan error dari form submit dan dari redirect (QR auto-login gagal)
  const flashError = pageErrors?.message || errors?.message

  // Mulai scanner saat modal dibuka
  useEffect(() => {
    if (!scannerOpen) return

    setScanError(null)
    setCameraBlocked(false)
    isRunningRef.current = false

    // Pastikan elemen DOM sudah ada sebelum init
    const el = document.getElementById(SCANNER_ID)
    if (!el) return

    const html5QrCode = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = html5QrCode

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        isRunningRef.current = false
        stopScanner()
        window.location.href = decodedText
      },
      () => {}
    ).then(() => {
      isRunningRef.current = true
    }).catch((err) => {
      isRunningRef.current = false
      scannerRef.current = null
      const msg = String(err).toLowerCase()
      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setCameraBlocked(true)
        setScanError('Akses kamera ditolak browser. Lihat petunjuk di bawah.')
      } else if (msg.includes('https') || msg.includes('secure') || msg.includes('streaming not supported')) {
        setCameraBlocked(true)
        setScanError('Browser memerlukan HTTPS untuk mengakses kamera di jaringan ini.')
      } else {
        setScanError('Kamera tidak dapat dibuka: ' + err)
      }
    })

    return () => { stopScanner() }
  }, [scannerOpen])

  const stopScanner = () => {
    if (scannerRef.current && isRunningRef.current) {
      isRunningRef.current = false
      scannerRef.current.stop().catch(() => {}).finally(() => {
        scannerRef.current = null
      })
    } else {
      scannerRef.current = null
    }
  }

  const closeScanner = () => {
    stopScanner()
    setScannerOpen(false)
    setScanError(null)
    setCameraBlocked(false)
  }

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

        {flashError && (
          <div className="login-error mb-4">
            {flashError}
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

        {/* ── QR Scanner Button ── */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-semibold cursor-pointer"
            style={{ background: 'none' }}
          >
            <QrCode size={16} />
            Login dengan Scan QR Kartu Ujian
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-250 text-center">
          <p className="text-[10px] text-muted mb-4 leading-relaxed">
            Gunakan browser Google Chrome atau Microsoft Edge terbaru.<br />
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

      {/* ── QR Scanner Modal ── */}
      {scannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          {/* Tombol close FLOATING — di luar modal, tidak bisa ketutupan video */}
          <button
            onClick={closeScanner}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 9999,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={22} color="#111" />
          </button>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[340px]" style={{ overflow: 'hidden' }}>

            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-white">
              <QrCode size={18} className="text-blue-600" />
              <span className="font-bold text-sm">Scan QR Kartu Ujian</span>
            </div>

            {/* Scanner area */}
            <div className="p-4 bg-white">
              {cameraBlocked ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CameraOff size={40} className="text-red-400" />
                  <p className="text-sm font-semibold text-red-600">{scanError}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left w-full">
                    <p className="text-xs font-bold text-amber-700 mb-1">Cara mengizinkan kamera di Chrome:</p>
                    <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                      <li>Buka <code className="bg-amber-100 px-1 rounded">chrome://flags</code></li>
                      <li>Cari <em>Insecure origins treated as secure</em></li>
                      <li>Tambahkan URL server ini, lalu Relaunch</li>
                    </ol>
                  </div>
                  <button onClick={closeScanner} className="btn btn-primary text-sm px-6 py-2 mt-1">
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '1' }}>
                    <div id={SCANNER_ID} className="w-full h-full" />
                    {/* Corner guides */}
                    {[
                      { pos: 'top-2 left-2',     br: 'none', bl: undefined, bb: 'none', bt: undefined },
                      { pos: 'top-2 right-2',    br: undefined, bl: 'none', bb: 'none', bt: undefined },
                      { pos: 'bottom-2 left-2',  br: 'none', bl: undefined, bb: undefined, bt: 'none' },
                      { pos: 'bottom-2 right-2', br: undefined, bl: 'none', bb: undefined, bt: 'none' },
                    ].map(({ pos, br, bl, bb, bt }, i) => (
                      <div key={i}
                        className={`absolute ${pos} w-7 h-7 border-white border-2 rounded-sm pointer-events-none`}
                        style={{ zIndex: 10, borderRight: br, borderLeft: bl, borderBottom: bb, borderTop: bt }}
                      />
                    ))}
                  </div>

                  {scanError && (
                    <p className="text-xs text-red-500 text-center mt-2">{scanError}</p>
                  )}

                  <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
                    Arahkan kamera ke QR Code pada kartu ujian.<br />
                    Login otomatis saat QR terdeteksi.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
