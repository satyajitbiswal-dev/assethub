import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

/** Redirect authenticated users away from login/register pages. */
export default function GuestRoute() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  if (isAuthenticated) {
    const dest = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    return <Navigate to={dest} replace />
  }
  return <Outlet />
}
