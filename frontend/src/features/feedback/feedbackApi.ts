import { baseApi } from '@/app/baseApi'

export interface FeedbackCampaign {
  id: string
  title: string
  description: string
  is_active: boolean
  created_by: string
  created_by_name: string
  created_at: string
  deactivated_at: string | null
  response_count: number
}

export interface FeedbackResponse {
  id: string
  campaign: string
  campaign_title: string
  user: string
  user_detail: {
    id: string
    full_name: string
    email: string
    enrollment_no: string
    department: string
  }
  product_suggestions: string
  improvement_suggestions: string
  submitted_at: string
}

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Campaigns ─────────────────────────────────────────────────────────────
    getCampaigns: build.query<FeedbackCampaign[], void>({
      query: () => '/feedback/campaigns/',
      // DRF DefaultRouter returns paginated by default — handle both shapes
      transformResponse: (res: { results: FeedbackCampaign[] } | FeedbackCampaign[]) =>
        Array.isArray(res) ? res : res.results,
      providesTags: ['Feedback'],
    }),
    getActiveCampaign: build.query<FeedbackCampaign | null, void>({
      query: () => ({
        url: '/feedback/campaigns/active/',
        validateStatus: (response) => response.status === 200 || response.status === 404,
      }),
      transformResponse: (res: FeedbackCampaign | { detail?: string }) =>
        'id' in res ? res : null,
      providesTags: ['Feedback'],
    }),
    createCampaign: build.mutation<FeedbackCampaign, { title: string; description?: string; is_active?: boolean }>({
      query: (body) => ({ url: '/feedback/campaigns/', method: 'POST', body }),
      invalidatesTags: ['Feedback'],
    }),
    activateCampaign: build.mutation<FeedbackCampaign, string>({
      query: (id) => ({ url: `/feedback/campaigns/${id}/activate/`, method: 'PATCH' }),
      invalidatesTags: ['Feedback'],
    }),
    deactivateCampaign: build.mutation<FeedbackCampaign, string>({
      query: (id) => ({ url: `/feedback/campaigns/${id}/deactivate/`, method: 'PATCH' }),
      invalidatesTags: ['Feedback'],
    }),
    deleteCampaign: build.mutation<void, string>({
      query: (id) => ({ url: `/feedback/campaigns/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Feedback'],
    }),

    // ── Responses ─────────────────────────────────────────────────────────────
    getCampaignResponses: build.query<FeedbackResponse[], string>({
      query: (campaignId) => `/feedback/responses/?campaign=${campaignId}`,
      transformResponse: (res: { results: FeedbackResponse[] } | FeedbackResponse[]) =>
        Array.isArray(res) ? res : res.results,
      providesTags: ['Feedback'],
    }),
    getMyResponse: build.query<FeedbackResponse | null, string>({
      query: (campaignId) => ({
        url: `/feedback/responses/my/?campaign=${campaignId}`,
        validateStatus: (response) => response.status === 200 || response.status === 404,
      }),
      transformResponse: (res: FeedbackResponse | { detail?: string }) =>
        'id' in res ? res : null,
      providesTags: ['Feedback'],
    }),
    submitResponse: build.mutation<FeedbackResponse, {
      campaign: string
      product_suggestions: string
      improvement_suggestions: string
    }>({
      query: (body) => ({ url: '/feedback/responses/', method: 'POST', body }),
      async onQueryStarted({ campaign }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(feedbackApi.util.upsertQueryData('getMyResponse', campaign, data))
        } catch {
          // invalidation below handles failure
        }
      },
      invalidatesTags: ['Feedback'],
    }),
  }),
})

export const {
  useGetCampaignsQuery,
  useGetActiveCampaignQuery,
  useCreateCampaignMutation,
  useActivateCampaignMutation,
  useDeactivateCampaignMutation,
  useDeleteCampaignMutation,
  useGetCampaignResponsesQuery,
  useGetMyResponseQuery,
  useSubmitResponseMutation,
} = feedbackApi