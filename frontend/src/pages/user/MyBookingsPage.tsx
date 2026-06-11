import { useState } from 'react'
import { useGetBookingsQuery, useCancelBookingMutation } from '@/features/bookings/bookingsApi'
import { useGetMyReviewsQuery } from '@/features/reviews/reviewApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { BookOpen, AlertTriangle, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useGetBookingsQuery({ status: statusFilter })
  const { data: myReviews } = useGetMyReviewsQuery()
  const [cancel] = useCancelBookingMutation()

  const reviewedBookingIds = new Set((myReviews ?? []).map((r) => r.booking))

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await cancel(id).unwrap()
      toast.success('Booking cancelled')
    } catch {
      toast.error('Failed to cancel')
    }
  }

  const statuses = ['pending', 'approved', 'issued', 'returned', 'rejected', 'cancelled']

  return (
    <div>
      <PageHeader title="My Bookings" subtitle="Track all your asset requests" />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.results.length ? (
        <EmptyState icon={BookOpen} title="No bookings yet" description="Browse the asset catalog to make your first booking" />
      ) : (
        <div className="space-y-3">
          {data.results.map((booking) => {
            const alreadyReviewed = reviewedBookingIds.has(booking.id)

            return (
              <div
                key={booking.id}
                className={`rounded-xl border p-5 ${booking.is_overdue ? 'border-red-200' : 'border-gray-100'} bg-white`}
              >
                {booking.is_overdue && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Overdue — please return immediately
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{booking.asset_detail?.name}</h3>
                      <span className="text-xs text-gray-400">×{booking.quantity}</span>
                    </div>
                    <p className="text-xs text-gray-500">{booking.asset_detail?.category_name}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </p>
                    {booking.rejection_reason && (
                      <p className="mt-1.5 text-xs text-red-500">Reason: {booking.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={booking.status} />
                    {(booking.status === 'pending' || booking.status === 'approved') && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === 'returned' && (
                      alreadyReviewed ? (
                        <Link
                          to="/reviews"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                          <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> View review
                        </Link>
                      ) : (
                        <Link
                          to="/reviews"
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
                        >
                          <Star className="h-3 w-3" /> Write a review
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
