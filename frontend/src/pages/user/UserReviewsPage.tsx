import { useState } from 'react'
import {
  useGetMyReviewsQuery,
  useSubmitReviewMutation,
  useClearMyReviewsMutation,
} from '@/features/reviews/reviewApi'
import { useGetBookingsQuery } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Star, Trash2, X, MessageSquare } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Booking } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────────
function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}) {
  const [hovered, setHovered] = useState(0)
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}
        >
          <Star
            className={`${s} transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ── Review Modal ──────────────────────────────────────────────────────────────
const reviewSchema = z.object({
  text: z
    .string()
    .min(1, 'Please write a short review')
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length <= 30, 'Max 30 words'),
  rating: z.number().min(1).max(5),
})
type ReviewForm = z.infer<typeof reviewSchema>

function ReviewModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [submit, { isLoading }] = useSubmitReviewMutation()
  const [rating, setRating] = useState(5)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { text: '', rating: 5 },
  })

  const text = watch('text') ?? ''
  const wordCount = countWords(text)

  const handleRatingChange = (v: number) => {
    setRating(v)
    setValue('rating', v)
  }

  const onSubmit = async (data: ReviewForm) => {
    try {
      await submit({ booking: booking.id, text: data.text.trim(), rating: data.rating }).unwrap()
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
          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <StarRating value={rating} onChange={handleRatingChange} />
            <input type="hidden" {...register('rating', { valueAsNumber: true })} />
          </div>

          {/* Text */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Your experience <span className="text-red-500">*</span>
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

// ── Clear All Dialog ──────────────────────────────────────────────────────────
function ClearAllDialog({
  count,
  onConfirm,
  onCancel,
  isLoading,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Clear all reviews?</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This will permanently delete {count} review{count === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Clearing…' : 'Clear all'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserReviewsPage() {
  const { data: myReviews, isLoading: reviewsLoading } = useGetMyReviewsQuery()
  const { data: returnedData, isLoading: bookingsLoading } = useGetBookingsQuery({ status: 'returned' })
  const [clearMyReviews, { isLoading: clearing }] = useClearMyReviewsMutation()

  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)

  const reviewedBookingIds = new Set((myReviews ?? []).map((r) => r.booking))
  const pendingReviews = (returnedData?.results ?? []).filter((b) => !reviewedBookingIds.has(b.id))
  const hasReviews = (myReviews?.length ?? 0) > 0

  const handleClearAll = async () => {
    try {
      await clearMyReviews().unwrap()
      setShowClearDialog(false)
      toast.success('All reviews cleared')
    } catch {
      toast.error('Failed to clear reviews')
    }
  }

  const isLoading = reviewsLoading || bookingsLoading

  return (
    <div className={showClearDialog ? 'relative' : undefined}>
      {showClearDialog && (
        <ClearAllDialog
          count={myReviews?.length ?? 0}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearDialog(false)}
          isLoading={clearing}
        />
      )}

      <div className={showClearDialog ? 'blur-sm pointer-events-none select-none' : undefined}>
        <PageHeader
          title="My Reviews"
          subtitle="Reviews you've left for returned assets"
          action={hasReviews ? (
            <button
              onClick={() => setShowClearDialog(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          ) : undefined}
        />

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Pending reviews section */}
            {pendingReviews.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">Awaiting your review</h2>
                  <span className="rounded-full bg-primary-light text-primary text-xs font-medium px-2 py-0.5">
                    {pendingReviews.length}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {pendingReviews.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-primary/15 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {booking.asset_detail?.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-gray-500">{booking.asset_detail?.category_name}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            Returned {formatDate(booking.returned_at ?? booking.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                        >
                          <Star className="h-3 w-3" /> Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted reviews */}
            <div>
              {hasReviews && (
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Submitted reviews</h2>
              )}

              {!hasReviews && pendingReviews.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No reviews yet"
                  description="Reviews will appear here after you return a booked asset."
                />
              ) : !hasReviews ? null : (
                <div className="space-y-3">
                  {myReviews!.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-gray-100 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {review.asset_name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDateTime(review.created_at)}
                          </p>
                        </div>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 leading-relaxed">
                        {review.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {reviewBooking && (
        <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} />
      )}
    </div>
  )
}
