import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

interface Props { adminOnly?: boolean }

export default function ProtectedRoute({ adminOnly = false }: Props) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
