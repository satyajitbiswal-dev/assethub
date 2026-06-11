import { useState } from 'react'
import { useGetReviewsByAssetQuery, useClearAssetReviewsMutation } from '@/features/reviews/reviewApi'
import { X, ChevronDown, ChevronUp, Star, Trash2, AlertTriangle } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import toast from 'react-hot-toast'

interface Props {
  assetId: string
  assetName: string
  onClose: () => void
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function AssetReviewsModal({ assetId, assetName, onClose }: Props) {
  // Fetching marks all reviews as seen on the backend
  const { data: reviews, isLoading } = useGetReviewsByAssetQuery(assetId)
  const [clearAssetReviews, { isLoading: clearing }] = useClearAssetReviewsMutation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const count = reviews?.length ?? 0
  const hasExpanded = expandedId !== null

  const avgRating =
    count > 0
      ? (reviews!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / count).toFixed(1)
      : null

  const handleClearAll = async () => {
    try {
      await clearAssetReviews(assetId).unwrap()
      toast.success(`All reviews for "${assetName}" have been cleared`)
      onClose()
    } catch {
      toast.error('Failed to clear reviews')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500">
                {assetName} · {count} review{count === 1 ? '' : 's'}
              </p>
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-gray-700">{avgRating}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasExpanded && (
              <button
                onClick={() => setExpandedId(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Collapse all
              </button>
            )}
            {count > 0 && !confirmClear && (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmation banner */}
        {confirmClear && (
          <div className="mx-4 mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Delete all {count} reviews?</p>
              <p className="text-xs text-red-600 mt-0.5">This cannot be undone.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {clearing ? 'Deleting…' : 'Delete all'}
              </button>
            </div>
          </div>
        )}

        {/* Review list */}
        <div className="overflow-y-auto px-4 py-2 flex-1">
          {isLoading ? (
            <LoadingSpinner />
          ) : !reviews?.length ? (
            <div className="py-10 text-center">
              <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No reviews yet for this asset</p>
            </div>
          ) : (
            <div className="space-y-1">
              {reviews.map((r) => {
                const isOpen = expandedId === r.id
                return (
                  <div
                    key={r.id}
                    className={cn(
                      'rounded-xl border transition-all',
                      isOpen ? 'border-primary/20 bg-primary-light/20' : 'border-gray-100 bg-white',
                    )}
                  >
                    <button
                      onClick={() => setExpandedId(isOpen ? null : r.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/80 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary-light text-primary-dark flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {(r.user_detail?.full_name || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {r.user_detail?.full_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 truncate">
                              {r.user_detail?.enrollment_no} · {formatDateTime(r.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StarDisplay rating={r.rating ?? 5} />
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-700 bg-white rounded-lg border border-gray-100 px-3 py-2.5 leading-relaxed whitespace-pre-wrap">
                          {r.text}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
