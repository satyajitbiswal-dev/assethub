import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import AppLayout        from '@/components/layout/AppLayout'
import ProtectedRoute   from '@/components/shared/ProtectedRoute'
import GuestRoute       from '@/components/shared/GuestRoute'

import LoginPage        from '@/pages/LoginPage'
import RegisterPage     from '@/pages/RegisterPage'

import UserDashboard    from '@/pages/user/UserDashboard'
import AssetsPage       from '@/pages/user/AssetsPage'
import MyBookingsPage   from '@/pages/user/MyBookingsPage'
import QrScannerPage    from '@/pages/user/QrScannerPage'
import ProfilePage      from '@/pages/user/ProfilePage'

import AdminDashboard   from '@/pages/admin/AdminDashboard'
import AdminAssetsPage  from '@/pages/admin/AdminAssetsPage'
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage'
import AdminUsersPage   from '@/pages/admin/AdminUsersPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'

import NotificationsPage from '@/pages/NotificationsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '13px', borderRadius: '10px' },
          success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public — redirect to app if already logged in */}
        <Route element={<GuestRoute />}>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* User routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"     element={<UserDashboard />} />
            <Route path="/assets"        element={<AssetsPage />} />
            <Route path="/my-bookings"   element={<MyBookingsPage />} />
            <Route path="/scan"          element={<QrScannerPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile"       element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<AppLayout />}>
            <Route path="/admin/dashboard"  element={<AdminDashboard />} />
            <Route path="/admin/assets"     element={<AdminAssetsPage />} />
            <Route path="/admin/bookings"   element={<AdminBookingsPage />} />
            <Route path="/admin/users"      element={<AdminUsersPage />} />
            <Route path="/admin/analytics"  element={<AdminAnalyticsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/profile"       element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
