import { useState } from 'react'
import { useGetBookingsQuery, useCancelBookingMutation } from '@/features/bookings/bookingsApi'
import { useGetMyReviewsQuery, useSubmitReviewMutation } from '@/features/reviews/reviewApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { BookOpen, AlertTriangle, X, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Booking } from '@/types'

const reviewSchema = z.object({
  text: z
    .string()
    .min(1, 'Please write a short review')
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length <= 30, 'Max 30 words'),
})

type ReviewForm = z.infer<typeof reviewSchema>

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
}

function ReviewModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [submit, { isLoading }] = useSubmitReviewMutation()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { text: '' },
  })

  const text = watch('text') ?? ''
  const wordCount = countWords(text)

  const onSubmit = async (data: ReviewForm) => {
    try {
      await submit({ booking: booking.id, text: data.text.trim() }).unwrap()
      toast.success('Thanks for your review!')
      onClose()
    } catch (err: unknown) {
      const body = (err as { data?: { message?: string; text?: string[] } })?.data
      toast.error(body?.message ?? body?.text?.[0] ?? 'Failed to submit review')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Write a review</h2>
            <p className="mt-0.5 text-sm text-gray-500">{booking.asset_detail?.name}</p>
            <p className="mt-1 text-xs text-gray-400">One-time review · max 30 words</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Your experience
            </label>
            <textarea
              {...register('text')}
              rows={4}
              maxLength={200}
              placeholder="How was the asset? Any issues or feedback?"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.text ? <p className="text-xs text-red-500">{errors.text.message}</p> : <span />}
              <p className={`ml-auto text-xs ${wordCount > 30 ? 'text-red-500' : 'text-gray-400'}`}>
                {wordCount}/30 words
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || wordCount === 0 || wordCount > 30}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useGetBookingsQuery({ status: statusFilter })
  const { data: returnedData, isLoading: returnedLoading } = useGetBookingsQuery({ status: 'returned' })
  const { data: myReviews } = useGetMyReviewsQuery()
  const [cancel] = useCancelBookingMutation()
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

  const returnedBookings = returnedData?.results ?? []
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

      {!statusFilter && (
        <div className="mb-6 rounded-2xl border border-primary/10 bg-primary-light/40 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Returned items</h2>
              <p className="mt-0.5 text-xs text-gray-500">Leave a one-time review for any returned asset.</p>
            </div>
            {returnedBookings.length > 0 && (
              <span className="rounded-full border border-primary/10 bg-white px-3 py-1.5 text-xs font-medium text-primary">
                {returnedBookings.length} item{returnedBookings.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {returnedLoading ? (
            <LoadingSpinner />
          ) : returnedBookings.length === 0 ? (
            <p className="text-sm text-gray-500">No returned items yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {returnedBookings.map((booking) => {
                const alreadyReviewed = reviewedBookingIds.has(booking.id)
                return (
                  <div key={booking.id} className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900">{booking.asset_detail?.name}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{booking.asset_detail?.category_name}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          Returned on {formatDate(booking.returned_at ?? booking.updated_at)}
                        </p>
                      </div>

                      {alreadyReviewed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                          <Star className="h-3 w-3 fill-gray-300 text-gray-300" /> Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Star className="h-3 w-3" /> Review
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
          {statusFilter === 'returned' && (
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Returned history</h2>
              <p className="text-xs text-gray-500">Click Review to share your experience.</p>
            </div>
          )}

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
                    {booking.status === 'returned' &&
                      (alreadyReviewed ? (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Star className="h-3 w-3 fill-gray-300 text-gray-300" /> Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
                        >
                          <Star className="h-3 w-3" /> Write a review
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewBooking && <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} />}
    </div>
  )
}
