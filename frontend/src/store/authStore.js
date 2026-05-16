import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('z-exam-user') || 'null'),
  token: localStorage.getItem('z-exam-token') || null,
  isAuthenticated: !!localStorage.getItem('z-exam-token'),

  setAuth: (user, token) => {
    localStorage.setItem('z-exam-user', JSON.stringify(user))
    localStorage.setItem('z-exam-token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('z-exam-user')
    localStorage.removeItem('z-exam-token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  hasRole: (role) => {
    const user = JSON.parse(localStorage.getItem('z-exam-user') || 'null')
    return user?.roles?.includes(role) ?? false
  },
}))

export default useAuthStore
