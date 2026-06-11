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
    submitReview: build.mutation<Review, { booking: string; text: string }>({
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
      providesTags: ['Review'],
    }),
    getReviewsByAsset: build.query<Review[], string>({
      query: (assetId) => `/bookings/reviews/by-asset/${assetId}/`,
      providesTags: (_r, _e, assetId) => [{ type: 'Review', id: `asset-${assetId}` }],
    }),
  }),
})

export const {
  useGetMyReviewsQuery,
  useSubmitReviewMutation,
  useGetReviewSummaryQuery,
  useGetReviewsByAssetQuery,
} = reviewsApi
