import { baseApi } from '@/app/baseApi'
import { Review, AssetReviewSummary } from '@/types'

function normalizeReviews(res: { results: Review[] } | Review[]): Review[] {
  return Array.isArray(res) ? res : res.results
}

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyReviews: build.query<Review[], void>({
      query: () => '/bookings/reviews/',
      transformResponse: normalizeReviews,
      providesTags: ['Review'],
    }),
    submitReview: build.mutation<Review, { booking: string; text: string; rating: number }>({
      query: (body) => ({ url: '/bookings/reviews/', method: 'POST', body }),
      async onQueryStarted({ booking }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            reviewsApi.util.updateQueryData('getMyReviews', undefined, (draft) => {
              if (!draft.some((r) => r.booking === booking)) draft.unshift(data)
            }),
          )
        } catch {
          /* caller handles error */
        }
      },
      invalidatesTags: ['Review'],
    }),
    getReviewSummary: build.query<AssetReviewSummary[], void>({
      query: () => '/bookings/reviews/summary/',
      providesTags: ['ReviewSummary'],
    }),
    getReviewsByAsset: build.query<Review[], string>({
      query: (assetId) => `/bookings/reviews/by-asset/${assetId}/`,
      providesTags: (_r, _e, assetId) => [{ type: 'Review', id: `asset-${assetId}` }],
      // After the admin fetches reviews (backend marks them seen), invalidate the
      // summary so the green dot count refreshes automatically.
      async onQueryStarted(_assetId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(reviewsApi.util.invalidateTags(['ReviewSummary']))
        } catch {
          /* ignore */
        }
      },
    }),
    clearMyReviews: build.mutation<{ success: boolean; deleted: number }, void>({
      query: () => ({ url: '/bookings/reviews/clear-mine/', method: 'DELETE' }),
      invalidatesTags: ['Review'],
    }),
    clearAssetReviews: build.mutation<{ success: boolean; deleted: number }, string>({
      query: (assetId) => ({ url: `/bookings/reviews/by-asset/${assetId}/clear/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, assetId) => ['ReviewSummary', { type: 'Review', id: `asset-${assetId}` }],
    }),
  }),
})

export const {
  useGetMyReviewsQuery,
  useSubmitReviewMutation,
  useGetReviewSummaryQuery,
  useGetReviewsByAssetQuery,
  useClearMyReviewsMutation,
  useClearAssetReviewsMutation,
} = reviewsApi