import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * AuthGuard — lindungi route dari user yang belum login.
 * Opsional: `requiredRoles` untuk restrict akses berdasarkan role.
 */
export default function AuthGuard({ children, requiredRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore()

  // Belum login → redirect ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Cek role jika diperlukan
  if (requiredRoles.length > 0) {
    const userRoles = user?.roles ?? []
    const hasRole = requiredRoles.some(r => userRoles.includes(r))
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
