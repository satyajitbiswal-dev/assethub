import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, BookOpen, Bell,
  LogOut, Shield, BarChart2, QrCode, ScanLine,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { useLogoutMutation } from '@/features/auth/authApi'
import { useGetNotificationsQuery } from '@/features/notifications/notificationsApi'
import { cn } from '@/lib/utils'

const userLinks = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets',        icon: Package,         label: 'Assets' },
  { to: '/my-bookings',   icon: BookOpen,        label: 'My Bookings' },
  { to: '/scan',          icon: ScanLine,        label: 'QR Scanner' },
  { to: '/notifications', icon: Bell,            label: 'Notifications' },
]

const adminLinks = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/assets',     icon: Package,         label: 'Assets' },
  { to: '/admin/bookings',   icon: BookOpen,        label: 'Bookings' },
  { to: '/admin/analytics',  icon: BarChart2,       label: 'Analytics' },
  { to: '/admin/users',      icon: Shield,          label: 'Users' },
  { to: '/notifications',    icon: Bell,            label: 'Notifications' },
]

export default function Sidebar() {
  const dispatch    = useAppDispatch()
  const navigate    = useNavigate()
  const { user, refreshToken } = useAppSelector((s) => s.auth)
  const [logoutApi] = useLogoutMutation()
  const { data: notifs } = useGetNotificationsQuery()
  const unread  = notifs?.unread_count ?? 0
  const isAdmin = user?.role === 'admin'
  const links   = isAdmin ? adminLinks : userLinks

  const handleLogout = async () => {
    if (refreshToken) await logoutApi({ refresh: refreshToken }).catch(() => {})
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">AssetHub</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{isAdmin ? 'Admin Panel' : 'User Portal'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-primary-light text-primary-dark font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Notifications' && unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-semibold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1 rounded-lg bg-gray-50">
          <p className="text-xs font-medium text-gray-900 truncate">{user?.full_name}</p>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
          <span className={cn(
            'inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium',
            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-primary-light text-primary-dark',
          )}>{user?.role}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
