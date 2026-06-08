import { useState } from 'react'
import { useGetBookingsQuery, useCancelBookingMutation } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { BookOpen, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useGetBookingsQuery({ status: statusFilter })
  const [cancel] = useCancelBookingMutation()

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await cancel(id).unwrap()
      toast.success('Booking cancelled')
    } catch { toast.error('Failed to cancel') }
  }

  const statuses = ['pending', 'approved', 'issued', 'returned', 'rejected', 'cancelled']

  return (
    <div>
      <PageHeader title="My Bookings" subtitle="Track all your asset requests" />
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : !data?.results.length ? (
        <EmptyState icon={BookOpen} title="No bookings yet" description="Browse the asset catalog to make your first booking" />
      ) : (
        <div className="space-y-3">
          {data.results.map((booking) => (
            <div key={booking.id} className={`bg-white rounded-xl border p-5 ${booking.is_overdue ? 'border-red-200' : 'border-gray-100'}`}>
              {booking.is_overdue && (
                <div className="flex items-center gap-2 text-red-600 text-xs mb-3 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" /> Overdue — please return immediately
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{booking.asset_detail?.name}</h3>
                    <span className="text-xs text-gray-400">×{booking.quantity}</span>
                  </div>
                  <p className="text-xs text-gray-500">{booking.asset_detail?.category_name}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                  </p>
                  {booking.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1.5">Reason: {booking.rejection_reason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={booking.status} />
                  {(booking.status === 'pending' || booking.status === 'approved') && (
                    <button onClick={() => handleCancel(booking.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
