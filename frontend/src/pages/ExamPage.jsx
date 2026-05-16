import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, ChevronRight, Clock, User, 
  CheckCircle2, AlertTriangle, Menu, X, Save
} from 'lucide-react'
import useExamStore from '../store/examStore'
import api from '../services/api'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

export default function ExamPage() {
  const navigate = useNavigate()
  const exam = useExamStore()
  
  const [timeLeft, setTimeLeft] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // Redirect if no session
  useEffect(() => {
    if (!exam.examStarted) navigate('/student-login', { replace: true })
  }, [exam.examStarted])

  // Timer Logic
  useEffect(() => {
    if (!exam.endTime) return
    
    const interval = setInterval(() => {
      const diff = exam.endTime - Date.now()
      if (diff <= 0) {
        clearInterval(interval)
        handleAutoFinish()
        return
      }

      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [exam.endTime])

  // Save Answer API
  const saveAnswer = async (soalId, value) => {
    setSaving(true)
    try {
      await api.post('/exam/save', {
        ujian_peserta_id: exam.ujian.id,
        soal_id: soalId,
        jawaban: value
      })
      exam.setAnswer(soalId, value)
    } catch (err) {
      console.error('Failed to autosave', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoFinish = async () => {
    alert('Waktu habis! Jawaban Anda akan dikirim otomatis.')
    submitFinish()
  }

  const submitFinish = async () => {
    setFinishing(true)
    try {
      await api.post('/exam/finish', { ujian_peserta_id: exam.ujian.id })
      exam.clearExam()
      navigate('/student-login', { replace: true })
      alert('Ujian selesai! Terima kasih.')
    } catch (err) {
      alert('Gagal mengirim jawaban. Coba lagi atau hubungi pengawas.')
    } finally {
      setFinishing(false)
    }
  }

  const currentSoal = exam.questions[exam.currentIdx]

  if (!currentSoal) return null

  return (
    <div className="exam-shell bg-surface-1 min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="exam-header flex items-center justify-between px-6 py-3 border-bottom bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="logo-mark sm bg-accent">Z</div>
          <div>
            <div className="font-bold text-sm uppercase tracking-tight">{exam.sesi?.mapel?.nama_mapel}</div>
            <div className="text-xs text-muted">{exam.sesi?.nama_sesi}</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 border">
            <Clock size={16} className={timeLeft.startsWith('00:05') ? 'text-danger' : 'text-accent'} />
            <span className={`text-lg font-black font-mono ${timeLeft.startsWith('00:05') ? 'text-danger animate-pulse' : ''}`}>
              {timeLeft}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold leading-none">{exam.student?.nama}</div>
              <div className="text-xs text-faint leading-none">{exam.student?.nisn}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center border">
              <User size={16} />
            </div>
          </div>
          
          <button className="btn btn-sm btn-ghost sm:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Nav (Desktop & Mobile Overlay) */}
        <aside className={`exam-sidebar flex flex-col border-right bg-white z-10 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden opacity-0 sm:opacity-100 sm:w-0'}`}>
           <div className="p-4 flex-1 overflow-y-auto">
              <div className="label mb-4">Navigasi Soal</div>
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => exam.goToQuestion(idx)}
                    className={`w-full aspect-square rounded flex items-center justify-center text-xs font-bold transition-all border ${
                      exam.currentIdx === idx ? 'bg-accent text-white border-accent scale-110 shadow-lg' :
                      exam.answers[q.id] ? 'bg-success-soft text-success border-success' : 'bg-surface-2 text-muted border-transparent hover:border-accent'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
           </div>

           <div className="p-4 border-top">
             <button className="btn btn-danger w-full justify-center py-3" onClick={() => { if(confirm('Selesaikan ujian sekarang? Pastikan semua jawaban sudah terisi.')) submitFinish(); }} disabled={finishing}>
               {finishing ? <span className="spinner"></span> : <><CheckCircle2 size={16} className="mr-2" /> SELESAI UJIAN</>}
             </button>
           </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 bg-surface-2">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in" key={currentSoal.id}>
            
            {/* Question Card */}
            <div className="panel bg-white shadow-sm overflow-hidden">
               <div className="panel-header border-bottom flex items-center justify-between">
                  <span className="badge badge-default">SOAL NOMOR {exam.currentIdx + 1}</span>
                  {saving && <span className="text-xs text-faint flex items-center gap-1"><Save size={10} /> Menyimpan...</span>}
               </div>
               <div className="panel-body p-6 sm:p-10">
                  <div className="text-lg leading-relaxed mb-8 select-none" style={{ color: 'var(--color-text)' }}>
                    <div dangerouslySetInnerHTML={{ __html: currentSoal.konten }} />
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-3">
                    {currentSoal.tipe === 'PG' && currentSoal.opsi.map(o => (
                      <button
                        key={o.id}
                        onClick={() => saveAnswer(currentSoal.id, o.label)}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          exam.answers[currentSoal.id] === o.label 
                            ? 'bg-accent-soft border-accent ring-1 ring-accent' 
                            : 'bg-white border-surface-3 hover:border-accent-soft'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black font-mono transition-colors ${
                          exam.answers[currentSoal.id] === o.label ? 'bg-accent text-white' : 'bg-surface-2 text-muted'
                        }`}>
                          {o.label}
                        </span>
                        <div className="flex-1 pt-1 text-sm font-medium" dangerouslySetInnerHTML={{ __html: o.konten }} />
                      </button>
                    ))}

                    {currentSoal.tipe === 'ESSAY' && (
                       <textarea 
                         className="input min-h-[200px] p-4 text-base leading-relaxed"
                         placeholder="Ketik jawaban Anda di sini..."
                         value={exam.answers[currentSoal.id] || ''}
                         onChange={e => exam.setAnswer(currentSoal.id, e.target.value)}
                         onBlur={e => saveAnswer(currentSoal.id, e.target.value)}
                       />
                    )}

                    {currentSoal.tipe === 'MATCHING' && (
                       <div className="text-center p-10 bg-surface-2 rounded-xl border border-dashed border-muted text-faint text-sm">
                          Modul mencocokkan sedang dimuat...<br/>
                          (Silakan hubungi proktor jika fitur ini belum aktif)
                       </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-between mt-4">
              <button 
                className="btn btn-outline py-3 px-6" 
                onClick={exam.prevQuestion} 
                disabled={exam.currentIdx === 0}
              >
                <ChevronLeft size={20} className="mr-2" /> KEMBALI
              </button>

              <div className="hidden sm:flex items-center gap-1 text-xs text-muted">
                Dikerjakan: {Object.keys(exam.answers).length} / {exam.questions.length}
              </div>

              <button 
                className="btn btn-primary py-3 px-6" 
                onClick={exam.nextQuestion}
                disabled={exam.currentIdx === exam.questions.length - 1}
              >
                BERIKUTNYA <ChevronRight size={20} className="ml-2" />
              </button>
            </div>

          </div>
        </main>

      </div>
    </div>
  )
}
