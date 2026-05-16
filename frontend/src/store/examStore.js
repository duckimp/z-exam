import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useExamStore = create(
  persist(
    (set, get) => ({
      examStarted: false,
      student: null,
      sesi: null,
      ujian: null,
      questions: [],
      answers: {}, // soal_id -> jawaban
      currentIdx: 0,
      endTime: null, // timestamp

      setExamData: (student, sesi, ujian, questions, answers = [], endTime) => {
        const initialAnswers = {}
        answers.forEach(a => { initialAnswers[a.soal_id] = a.jawaban })
        
        set({
          examStarted: true,
          student,
          sesi,
          ujian,
          questions,
          answers: initialAnswers,
          currentIdx: 0,
          endTime
        })
      },

      setAnswer: (soalId, value) => {
        set(state => ({
          answers: { ...state.answers, [soalId]: value }
        }))
      },

      nextQuestion: () => {
        const { currentIdx, questions } = get()
        if (currentIdx < questions.length - 1) set({ currentIdx: currentIdx + 1 })
      },

      prevQuestion: () => {
        const { currentIdx } = get()
        if (currentIdx > 0) set({ currentIdx: currentIdx - 1 })
      },

      goToQuestion: (idx) => set({ currentIdx: idx }),

      clearExam: () => set({
        examStarted: false,
        student: null,
        sesi: null,
        ujian: null,
        questions: [],
        answers: {},
        currentIdx: 0,
        endTime: null
      })
    }),
    { name: 'z-exam-session' }
  )
)

export default useExamStore
