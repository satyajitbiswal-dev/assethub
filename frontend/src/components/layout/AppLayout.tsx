import { Outlet } from 'react-router-dom'
import { useNotificationSocket } from '@/features/notifications/useNotificationSocket'
import Sidebar from './Sidebar'

export default function AppLayout() {
  useNotificationSocket()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
