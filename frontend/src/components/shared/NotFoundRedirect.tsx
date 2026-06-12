import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

export default function NotFoundRedirect() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <Navigate
      to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
      replace
    />
  )
}
