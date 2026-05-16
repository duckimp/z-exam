import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
})

// Inject token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('z-exam-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 (unauthorized) — hapus token & redirect ke login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('z-exam-token')
      localStorage.removeItem('z-exam-user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
