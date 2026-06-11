import { useState } from 'react'
import { useGetReviewsByAssetQuery } from '@/features/reviews/reviewApi'
import { X, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface Props {
  assetId: string
  assetName: string
  onClose: () => void
}

export default function AssetReviewsModal({ assetId, assetName, onClose }: Props) {
  const { data: reviews, isLoading } = useGetReviewsByAssetQuery(assetId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const count = reviews?.length ?? 0
  const hasExpanded = expandedId !== null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {assetName} · {count} review{count === 1 ? '' : 's'}
            </p>
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
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                          <p className="text-xs text-gray-400 truncate">
                            {r.user_detail?.enrollment_no} · {formatDateTime(r.created_at)}
                          </p>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
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
