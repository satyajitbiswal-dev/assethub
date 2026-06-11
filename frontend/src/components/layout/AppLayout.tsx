import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Package, Bell } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useNotificationSocket } from '@/features/notifications/useNotificationSocket'
import { useGetNotificationsQuery } from '@/features/notifications/notificationsApi'
import Sidebar from './Sidebar'

export default function AppLayout() {
  useNotificationSocket()

  const [mobileOpen, setMobileOpen]       = useState(false)
  const [collapsed,  setCollapsed]        = useState(false)
  const { data: notifs } = useGetNotificationsQuery()
  const unread = notifs?.unread_count ?? 0

  // Close mobile sidebar on window resize to ≥ md breakpoint
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top-bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">AssetHub</span>
          </div>

          {/* Notification bell shortcut */}
          <NavLink
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-5 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
