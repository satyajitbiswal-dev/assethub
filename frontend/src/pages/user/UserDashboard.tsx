import { Link } from 'react-router-dom'
import { useGetBookingsQuery } from '@/features/bookings/bookingsApi'
import { useGetAssetsQuery } from '@/features/assets/assetsApi'
import { useAppSelector } from '@/app/hooks'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { Package, ArrowRight } from 'lucide-react'

export default function UserDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const { data: bookings, isLoading: bLoading } = useGetBookingsQuery({ status: 'issued' })
  const { data: pending } = useGetBookingsQuery({ status: 'pending' })
  const { data: assets } = useGetAssetsQuery({ available_only: true })

  return (
    <div>
      <PageHeader title={`Hello, ${user?.first_name || user?.email} 👋`} subtitle="Here's what's happening with your assets" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active bookings', value: bookings?.count ?? 0, color: 'bg-primary-light text-primary-dark' },
          { label: 'Pending requests', value: pending?.count ?? 0, color: 'bg-warning-light text-warning' },
          { label: 'Assets available', value: assets?.count ?? 0, color: 'bg-blue-50 text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Currently issued</h2>
            <Link to="/my-bookings" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {bLoading ? <LoadingSpinner size="sm" /> : !bookings?.results.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">No active bookings</p>
          ) : (
            <div className="space-y-3">
              {bookings.results.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.asset_detail?.name}</p>
                    <p className="text-xs text-gray-400">Due {formatDate(b.end_date)}</p>
                  </div>
                  {b.is_overdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Browse assets</h2>
            <Link to="/assets" className="text-xs text-primary hover:underline flex items-center gap-1">All assets <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {assets?.results.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.available_qty} available</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
