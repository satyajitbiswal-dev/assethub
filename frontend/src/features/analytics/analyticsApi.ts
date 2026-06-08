import { baseApi } from '@/app/baseApi'
import { AnalyticsSummary, TopAsset, CategoryUtilisation, AuditLog, Booking } from '@/types'

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSummary: build.query<AnalyticsSummary, void>({
      query: () => '/analytics/summary/',
      providesTags: ['Analytics'],
    }),
    getTopAssets: build.query<TopAsset[], void>({
      query: () => '/analytics/top-assets/',
      providesTags: ['Analytics'],
    }),
    getOverdueBookings: build.query<Booking[], void>({
      query: () => '/analytics/overdue/',
      providesTags: ['Analytics'],
    }),
    getUtilisation: build.query<CategoryUtilisation[], void>({
      query: () => '/analytics/utilisation/',
      providesTags: ['Analytics'],
    }),
    getRecentActivity: build.query<AuditLog[], void>({
      query: () => '/analytics/recent-activity/',
      providesTags: ['Analytics'],
    }),
  }),
})

export const {
  useGetSummaryQuery,
  useGetTopAssetsQuery,
  useGetOverdueBookingsQuery,
  useGetUtilisationQuery,
  useGetRecentActivityQuery,
} = analyticsApi
