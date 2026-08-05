import { useState, useEffect, useRef, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { 
  ChevronLeft, ChevronRight, Clock, User, 
  CheckCircle2, AlertTriangle, Menu, X, Save, ShieldCheck, LogOut
} from 'lucide-react'
import axios from 'axios'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// Helper to escape unsafe HTML tags
function escapeUnsafeHtml(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (match, slash, tagName, attribs) => {
    const lowerTag = tagName.toLowerCase();
    const safeTags = ['strong', 'b', 'em', 'i', 'u', 'br', 'img', 'div', 'span', 'p'];
    
    // Allow 'a' tag ONLY if it has an href attribute (i.e. it's a real formatting link)
    if (lowerTag === 'a' && attribs.toLowerCase().includes('href')) {
      return match;
    }
    
    if (safeTags.includes(lowerTag)) {
      return match;
    }
    
    return `&lt;${slash}${tagName}${attribs}&gt;`;
  });
}

// Helper to parse math from text
function renderMathContent(text = '') {
  if (!text) return ''
  
  // Simple check to render equations if they exist
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const eq = part.slice(2, -2)
      return <BlockMath key={idx} math={eq} />
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const eq = part.slice(1, -1)
      return <InlineMath key={idx} math={eq} />
    }
    return <span key={idx} dangerouslySetInnerHTML={{ __html: escapeUnsafeHtml(part) }} />
  })
}

export default function ExamPage({ student, sesi, ujian, soal, jawaban, timeLeft: initialTimeLeft }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState(jawaban || {})
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [violations, setViolations] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [agreedToSubmit, setAgreedToSubmit] = useState(false)

  // Refs untuk menghindari stale closure & memory leak
  const finishingRef    = useRef(false)   // cegah double-submit
  const antiCurangRef   = useRef(sesi?.anti_curang)  // Fix #13 — tidak perlu sesi object di deps

  // ── Keamanan: Fullscreen ──────────────────────────────────────────────────
  const requestFullscreen = () => {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.msRequestFullscreen) el.msRequestFullscreen()
    setIsFullscreen(true)
  }

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        setViolations(v => v + 1)
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])  // mount/unmount saja

  // Fix #11 — submitFinish di luar setState, pakai useCallback agar stabil
  const submitFinish = useCallback(async () => {
    if (finishingRef.current) return   // cegah double-submit
    finishingRef.current = true
    setFinishing(true)
    router.post('/student/finish', {}, {
      onFinish: () => {
        setFinishing(false)
        setShowConfirmModal(false)
        finishingRef.current = false
      }
    })
  }, [])

  // Fix #11 & #13 — violations watcher terpisah, tidak ada side effect di setState
  useEffect(() => {
    if (violations >= 3 && antiCurangRef.current) {
      alert('Peringatan: Anda terdeteksi meninggalkan halaman ujian lebih dari 3 kali. Ujian akan dihentikan.')
      submitFinish()
    }
  }, [violations, submitFinish])

  // Fix #13 — gunakan antiCurangRef, bukan sesi object sebagai dependency
  useEffect(() => {
    if (!antiCurangRef.current) return

    const handleContext = (e) => e.preventDefault()
    const handleKey = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'u', 'p', 's'].includes(e.key.toLowerCase())) ||
        ['F12', 'PrintScreen'].includes(e.key)
      ) {
        e.preventDefault()
        alert('Fitur ini dinonaktifkan demi keamanan ujian.')
      }
    }
    const handleBlur = () => {
      setViolations(v => {
        const newVal = v + 1
        if (newVal < 3) {
          alert(`Peringatan (${newVal}/3): Jangan meninggalkan halaman ujian!`)
        }
        return newVal
      })
    }

    document.addEventListener('contextmenu', handleContext)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('contextmenu', handleContext)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])  // Fix #13 — mount/unmount saja, tidak bergantung pada sesi object

  // Fix #12 — Timer stabil, tidak restart setiap detik
  useEffect(() => {
    if (initialTimeLeft <= 0) {
      handleAutoFinish()
      return
    }
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleAutoFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])  // Fix #12 — hanya mount, tidak [timeLeft]

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Save Answer — update lokal dulu, kirim ke server hanya saat forcePersist
  const saveAnswer = async (soalId, value, forcePersist = false) => {
    setAnswers(prev => ({ ...prev, [soalId]: value }))

    if (forcePersist) {
      setSaving(true)
      try {
        await axios.post('/student/save', {
          soal_id: soalId,
          jawaban: value
        })
      } catch (err) {
        console.error('Failed to autosave', err)
      } finally {
        setSaving(false)
      }
    }
  }

  // Refs untuk akses nilai terbaru di dalam event listener tanpa re-render
  const answersRef    = useRef(answers)
  const currentIdxRef = useRef(currentIdx)
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { currentIdxRef.current = currentIdx }, [currentIdx])

  // Flush jawaban soal aktif saat browser/tab ditutup atau HP mati
  // Menggunakan sendBeacon agar request tetap terkirim meski halaman sudah unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const idx     = currentIdxRef.current
      const current = soal[idx]
      if (!current) return

      const value = answersRef.current[current.id]
      if (value === undefined || value === null) return

      // sendBeacon — fire-and-forget, tidak butuh response, aman saat unload
      const payload = JSON.stringify({
        soal_id: current.id,
        jawaban: value,
        _token:  document.querySelector('meta[name="csrf-token"]')?.content ?? '',
      })
      navigator.sendBeacon('/student/save-beacon', payload)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [soal])  // soal tidak berubah selama ujian, aman sebagai dep
  const navigateTo = async (newIdx) => {
    const currentVal = answers[currentSoal?.id]
    if (currentVal !== undefined && currentSoal) {
      await saveAnswer(currentSoal.id, currentVal, true)
    }
    setCurrentIdx(newIdx)
  }

  const handleAutoFinish = () => {
    alert('Waktu habis! Ujian Anda selesai.')
    submitFinish()
  }

  // submitFinish sudah didefinisikan di atas via useCallback

  const handleManualLeave = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari layar ujian? Ujian Anda akan tetap aktif di server dan dapat dilanjutkan selama sisa waktu masih ada.')) {
      router.post('/student/exam/leave')
    }
  }

  const currentSoal = soal[currentIdx]

  if (!currentSoal) return null

  // Helper untuk memparsing jawaban matching yang disimpan sebagai JSON
  const getMatchingAnswers = (soalId) => {
    const raw = answers[soalId]
    if (!raw) return {}
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (e) {
      return {}
    }
  }

  const handleMatchingChange = (itemId, selectedValue) => {
    const currentMatchingAnswers = getMatchingAnswers(currentSoal.id)
    const updated = {
      ...currentMatchingAnswers,
      [itemId]: selectedValue
    }
    saveAnswer(currentSoal.id, JSON.stringify(updated), false)
  }

  return (
    <div className="exam-shell bg-slate-50 min-h-screen flex flex-col overflow-hidden">
      {/* Keamanan Fullscreen Overlay */}
      {sesi?.anti_curang && !isFullscreen && (
        <div className="fixed inset-0 bg-slate-900/95 z-[999] flex items-center justify-center p-6 text-center text-white backdrop-blur-md">
           <div className="max-w-md animate-fade-in p-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                 <ShieldCheck size={36} />
              </div>
              <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Mode Ujian Aman</h2>
              <p className="text-sm opacity-80 mb-8 leading-relaxed">
                Halaman ini harus berjalan dalam mode Layar Penuh (Fullscreen). 
                Ujian akan otomatis terhenti jika Anda mencoba keluar dari mode ini.
              </p>
              <button 
                className="w-full justify-center py-4 text-lg bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95" 
                onClick={requestFullscreen}
              >
                 AKTIFKAN LAYAR PENUH & MULAI
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="exam-header flex items-center justify-between px-6 py-4 border-b bg-white relative z-[50] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="logo-mark sm bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">Z</div>
          <div>
            <div className="font-bold text-sm uppercase tracking-tight text-slate-800 truncate max-w-[150px] sm:max-w-none">
              {sesi?.mapel?.nama_mapel || 'Ujian'}
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none">
              {sesi?.nama_sesi || 'Sesi Ujian'}
            </div>
          </div>
          {violations > 0 && (
            <div className="flex items-center gap-1.5 text-red-600 animate-bounce ml-2 sm:ml-4 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
               <AlertTriangle size={14} />
               <span className="text-[10px] sm:text-xs font-bold uppercase">Pelanggaran: {violations}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            <Clock size={16} className={timeLeft < 300 ? 'text-red-500' : 'text-indigo-600'} />
            <span className={`text-base sm:text-lg font-black font-mono text-slate-800 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-none">{student?.nama}</div>
              <div className="text-[10px] text-slate-400 mt-1 leading-none">NISN: {student?.nisn}</div>
            </div>
            <button 
              onClick={handleManualLeave}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
              title="Keluar ke Dashboard"
            >
              <LogOut size={18} />
            </button>
          </div>
          
          <button 
            className="btn btn-sm btn-ghost sm:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Nav (Desktop & Mobile Overlay) */}
        <aside className={`exam-sidebar fixed inset-y-0 left-0 bg-white shadow-2xl transition-all duration-300 z-[40] border-r border-slate-200
          ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} 
          sm:relative sm:translate-x-0 sm:w-80 sm:shadow-none sm:z-10
          flex flex-col
        `}>
           <div className="p-5 flex-1 overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Navigasi Soal</div>
              <div className="grid grid-cols-5 gap-2.5">
                {soal.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => { navigateTo(idx); if(window.innerWidth < 640) setIsSidebarOpen(false); }}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all border ${
                      currentIdx === idx ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-md shadow-indigo-100' :
                      answers[q.id] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
           </div>

           <div className="p-5 border-t border-slate-100">
             <button 
               className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50" 
               onClick={() => setShowConfirmModal(true)} 
               disabled={finishing}
             >
               {finishing ? <span className="spinner"></span> : <><CheckCircle2 size={16} /> SELESAI UJIAN</>}
             </button>
           </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[30] sm:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 bg-slate-50">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6" key={currentSoal.id}>
            
            {/* Question Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
               <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">SOAL NOMOR {currentIdx + 1}</span>
                  {saving && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Save size={12} className="animate-pulse" /> Menyimpan...
                    </span>
                  )}
               </div>
               <div className="p-6 sm:p-10">
                  <div className="text-lg leading-relaxed mb-8 text-slate-800 select-none">
                    <div>{renderMathContent(currentSoal.konten)}</div>
                  </div>

                  {/* Options / Answer Box */}
                  <div className="flex flex-col gap-4">
                    {/* PG (Pilihan Ganda) */}
                    {currentSoal.tipe === 'PG' && currentSoal.opsi.map((o, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx); // 65 is 'A', 66 is 'B', etc.
                      return (
                        <button
                          key={o.id}
                          onClick={() => saveAnswer(currentSoal.id, o.label, false)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            answers[currentSoal.id] === o.label 
                              ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-600' 
                              : 'bg-white border-slate-200 hover:border-indigo-100 hover:bg-slate-50/30'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold transition-colors ${
                            answers[currentSoal.id] === o.label ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {letter}
                          </span>
                          <div className="flex-1 pt-1 text-sm font-semibold text-slate-700">{renderMathContent(o.konten)}</div>
                        </button>
                      )
                    })}

                    {/* ESSAY */}
                    {currentSoal.tipe === 'ESSAY' && (
                        <textarea 
                          className="w-full min-h-[220px] p-4 text-base leading-relaxed border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-300"
                          placeholder="Ketik jawaban Anda di sini..."
                          value={answers[currentSoal.id] || ''}
                          onChange={e => saveAnswer(currentSoal.id, e.target.value, false)}
                          onBlur={e => saveAnswer(currentSoal.id, e.target.value, true)}
                        />
                    )}

                    {/* MATCHING (Mencocokkan) */}
                    {currentSoal.tipe === 'MATCHING' && (
                       <div className="flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <div className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <span className="w-2.5 h-4 bg-indigo-600 rounded-full shrink-0"></span>
                            <span>Pasangkanlah setiap pernyataan di kolom kiri dengan pasangan yang tepat di kolom kanan!</span>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            {currentSoal.matching_items?.map((item) => {
                              const currentSelected = getMatchingAnswers(currentSoal.id)[item.id] || '';
                              
                              // List opsi kanan yang unik untuk dropdown
                              const rightOptions = [
                                ...new Set(currentSoal.matching_items.map(mi => mi.item_kanan))
                              ];

                              return (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:border-indigo-100 transition-all duration-150">
                                  <div className="md:col-span-5 font-bold text-sm text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-150">
                                    {item.item_kiri}
                                  </div>
                                  <div className="md:col-span-2 text-center text-slate-400 font-black text-lg">
                                    ➔
                                  </div>
                                  <div className="md:col-span-5">
                                    <select 
                                      value={currentSelected}
                                      onChange={(e) => handleMatchingChange(item.id, e.target.value)}
                                      className="w-full p-3 text-sm font-bold border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl bg-white cursor-pointer transition-all"
                                    >
                                      <option value="">-- Pilih Pasangan --</option>
                                      {rightOptions.map((optVal, oIdx) => (
                                        <option key={oIdx} value={optVal}>{optVal}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                       </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mt-4">
              <button 
                className="flex items-center gap-1.5 px-3.5 sm:px-6 py-2.5 sm:py-3 border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/20 text-slate-700 font-bold rounded-xl transition-all text-xs sm:text-sm" 
                onClick={() => navigateTo(Math.max(0, currentIdx - 1))} 
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} /> KEMBALI
              </button>

              {/* Tombol Daftar Soal khusus HP */}
              <button 
                className="flex sm:hidden items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95 text-xs"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={14} /> SOAL
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400">
                Dikerjakan: {Object.keys(answers).filter(k => answers[k] && answers[k] !== '{}').length} / {soal.length}
              </div>

              {currentIdx === soal.length - 1 ? (
                <button 
                  className="flex items-center gap-1.5 px-3.5 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-100 active:scale-95 text-xs sm:text-sm" 
                  onClick={() => setShowConfirmModal(true)}
                >
                  SELESAI <span className="hidden xs:inline">UJIAN</span> <CheckCircle2 size={16} />
                </button>
              ) : (
                <button 
                  className="flex items-center gap-1.5 px-3.5 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 text-xs sm:text-sm" 
                  onClick={() => navigateTo(Math.min(soal.length - 1, currentIdx + 1))}
                >
                  BERIKUTNYA <ChevronRight size={16} />
                </button>
              )}
            </div>

          </div>
        </main>

      </div>

      {/* Modal Konfirmasi Selesai Ujian (Premium & Safe Modal!) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 flex-shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base leading-tight">Konfirmasi Selesai Ujian</h3>
                <p className="text-xs text-slate-450 mt-0.5">Sesi: {sesi?.nama_sesi}</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="text-sm text-slate-600 leading-relaxed mb-6">
                Apakah Anda yakin ingin menyelesaikan ujian ini? 
                Setelah menyelesaikan ujian, Anda **tidak dapat** masuk kembali atau mengubah jawaban Anda lagi.
              </div>

              {/* Status Jawaban Ringkas */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 mb-6 flex flex-col gap-2.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Total Soal:</span>
                  <span className="font-mono font-bold text-slate-700">{soal.length} Soal</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Jawaban Terisi:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Object.keys(answers).filter(k => answers[k] && answers[k] !== '{}').length} / {soal.length}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Sisa Waktu:</span>
                  <span className="font-mono font-bold text-indigo-600">{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Checkbox Konfirmasi */}
              <label className="flex items-start gap-3 p-3.5 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl cursor-pointer select-none transition-colors group">
                <input 
                  type="checkbox"
                  checked={agreedToSubmit}
                  onChange={(e) => setAgreedToSubmit(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-red-650 border-slate-350 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-red-900 leading-tight group-hover:text-red-950">
                  Saya menyatakan bahwa saya telah menyelesaikan seluruh rangkaian ujian dengan jujur dan bersedia mengirimkan lembar jawaban saya ke server.
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => { setShowConfirmModal(false); setAgreedToSubmit(false); }}
                className="px-4 py-2.5 border-2 border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition-all"
                disabled={finishing}
              >
                Batal
              </button>
              <button 
                onClick={submitFinish}
                disabled={!agreedToSubmit || finishing}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-red-100/30 disabled:shadow-none"
              >
                {finishing ? (
                  <>
                    <span className="spinner mr-1"></span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Selesaikan Ujian
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
