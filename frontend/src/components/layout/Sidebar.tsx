import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, BookOpen, Bell,
  LogOut, Shield, BarChart2, ScanLine, MessageSquarePlus, Mail, Phone, Star,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'
import { useLogoutMutation } from '@/features/auth/authApi'
import { useGetNotificationsQuery } from '@/features/notifications/notificationsApi'
import { useGetMyReviewsQuery } from '@/features/reviews/reviewApi'
import { useGetBookingsQuery } from '@/features/bookings/bookingsApi'
import { cn } from '@/lib/utils'

const buildAdminLinks = (unread: number, pendingBookings: number) => [
  { to: '/admin/dashboard',  icon: LayoutDashboard,   label: 'Dashboard',     badge: 0 },
  { to: '/admin/assets',     icon: Package,           label: 'Assets',        badge: 0 },
  { to: '/admin/bookings',   icon: BookOpen,          label: 'Bookings',      badge: pendingBookings },
  { to: '/admin/analytics',  icon: BarChart2,         label: 'Analytics',     badge: 0 },
  { to: '/admin/users',      icon: Shield,            label: 'Users',         badge: 0 },
  { to: '/admin/notifications', icon: Bell,           label: 'Notifications', badge: unread },
  { to: '/admin/feedback',   icon: MessageSquarePlus, label: 'Feedback',      badge: 0 },
  { to: '/admin/scan',       icon: ScanLine,          label: 'QR Scanner',    badge: 0 },
]

interface SidebarProps {
  /** mobile: is the drawer open? */
  mobileOpen: boolean
  onMobileClose: () => void
  /** desktop: is the sidebar in icon-only collapsed state? */
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const dispatch    = useAppDispatch()
  const navigate    = useNavigate()
  const { user, refreshToken } = useAppSelector((s) => s.auth)
  const [logoutApi] = useLogoutMutation()
  const isAdmin = user?.role === 'admin'
  const { data: notifs } = useGetNotificationsQuery()
  const { data: myReviews } = useGetMyReviewsQuery(undefined, { skip: isAdmin })
  const { data: returnedBookings } = useGetBookingsQuery({ status: 'returned' }, { skip: isAdmin })
  const { data: pendingBookings } = useGetBookingsQuery(
    { status: 'pending' },
    { skip: !isAdmin, pollingInterval: 15000 },
  )

  const unread = notifs?.unread_count ?? 0
  const pendingCount = pendingBookings?.count ?? 0

  const reviewedBookingIds = new Set((myReviews ?? []).map((r) => r.booking))
  const pendingReviewCount = (returnedBookings?.results ?? []).filter(
    (b) => !reviewedBookingIds.has(b.id)
  ).length

  const userLinks = [
    { to: '/dashboard',     icon: LayoutDashboard,    label: 'Dashboard',     badge: 0 },
    { to: '/assets',        icon: Package,            label: 'Assets',        badge: 0 },
    { to: '/my-bookings',   icon: BookOpen,           label: 'My Bookings',   badge: 0 },
    { to: '/reviews',       icon: Star,               label: 'My Reviews',    badge: pendingReviewCount },
    { to: '/scan',          icon: ScanLine,           label: 'QR Scanner',    badge: 0 },
    { to: '/notifications', icon: Bell,               label: 'Notifications', badge: unread },
    { to: '/feedback',      icon: MessageSquarePlus,  label: 'Feedback',      badge: 0 },
  ]

  const links = isAdmin ? buildAdminLinks(unread, pendingCount) : userLinks

  const handleLogout = async () => {
    if (refreshToken) await logoutApi({ refresh: refreshToken }).catch(() => {})
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  // Shared nav item renderer
  const NavItem = ({ to, icon: Icon, label, badge = 0 }: { to: string; icon: React.ElementType; label: string; badge?: number }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onMobileClose}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-lg text-sm transition-all duration-150',
        collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5',
        isActive
          ? 'bg-primary-light text-primary-dark font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="bg-primary text-white text-[10px] font-semibold rounded-full min-w-[18px] px-1 h-[18px] flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {collapsed && badge > 0 && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary" />
      )}
    </NavLink>
  )

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center border-b border-gray-100 shrink-0', collapsed ? 'px-3 py-4 justify-center' : 'px-5 py-4 gap-2.5')}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-none">AssetHub</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{isAdmin ? 'Admin Panel' : 'User Portal'}</p>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="ml-auto p-1 rounded-lg hover:bg-gray-100 md:hidden"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon, label, ...rest }) => (
          <div key={to} className="relative">
            <NavItem to={to} icon={icon} label={label} badge={'badge' in rest ? (rest as { badge: number }).badge : 0} />
          </div>
        ))}
      </nav>

      {/* Contact Us — hide when collapsed */}
      {!collapsed && (
        <div className="px-4 py-3 mx-2 mb-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact Us</p>
          <a
            href="mailto:support@assethub.iitroorkee.ac.in"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors mb-1.5"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">support@assethub.iitr.ac.in</span>
          </a>
          <a
            href="tel:+911234567890"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors"
          >
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>+91 12345 67890</span>
          </a>
        </div>
      )}

      {/* User footer */}
      <div className={cn('border-t border-gray-100 shrink-0', collapsed ? 'px-2 py-3 flex flex-col items-center gap-2' : 'px-3 py-3')}>
        {!collapsed ? (
          <Link
            to={isAdmin ? '/admin/profile' : '/profile'}
            onClick={onMobileClose}
            className="block px-3 py-2 mb-1 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <p className="text-xs font-medium text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
            <span className={cn(
              'inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium',
              isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-primary-light text-primary-dark',
            )}>{user?.role}</span>
          </Link>
        ) : (
          <Link
            to={isAdmin ? '/admin/profile' : '/profile'}
            onClick={onMobileClose}
            title={user?.full_name ?? 'Profile'}
            className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary-dark text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </Link>
        )}
        <button
          onClick={handleLogout}
          title="Sign out"
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors',
            collapsed ? 'w-full justify-center px-2.5 py-2.5' : 'w-full px-3 py-2.5',
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Sign out'}
        </button>
      </div>

      {/* Desktop collapse toggle */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden md:flex absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center hover:bg-gray-50 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />}
      </button>
    </aside>
  )

  return (
    <>
      {/* Desktop — always visible sticky sidebar */}
      <div className="hidden md:block relative h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile — drawer overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onMobileClose}
        />
        {/* Drawer */}
        <div
          className={cn(
            'absolute left-0 top-0 h-full transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* On mobile, never collapsed */}
          <aside className="flex flex-col h-full bg-white border-r border-gray-100 w-72">
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 leading-none">AssetHub</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{isAdmin ? 'Admin Panel' : 'User Portal'}</p>
              </div>
              <button onClick={onMobileClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {links.map(({ to, icon: Icon, label, ...rest }) => {
                const badge = 'badge' in rest ? (rest as { badge: number }).badge : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onMobileClose}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-primary-light text-primary-dark font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="bg-primary text-white text-[10px] font-semibold rounded-full min-w-[18px] px-1 h-[18px] flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>

            {/* Contact */}
            <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact Us</p>
              <a href="mailto:support@assethub.iitroorkee.ac.in" className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors mb-1.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">support@assethub.iitr.ac.in</span>
              </a>
              <a href="tel:+911234567890" className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>+91 12345 67890</span>
              </a>
            </div>

            {/* User footer */}
            <div className="px-3 py-3 border-t border-gray-100 shrink-0">
              <Link
                to={isAdmin ? '/admin/profile' : '/profile'}
                onClick={onMobileClose}
                className="block px-3 py-2 mb-1 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <p className="text-xs font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                <span className={cn(
                  'inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium',
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-primary-light text-primary-dark',
                )}>{user?.role}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
