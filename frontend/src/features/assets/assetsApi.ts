import { baseApi } from '@/app/baseApi'
import { Asset, Booking, Category, PaginatedResponse } from '@/types'

interface AssetFilters {
  search?: string; category?: string; status?: string
  condition?: string; available_only?: boolean
  page?: number; ordering?: string
}

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAssets: build.query<PaginatedResponse<Asset>, AssetFilters>({
      query: (params = {}) => ({ url: '/assets/', params }),
      providesTags: (result) =>
        result
          ? [...result.results.map(({ id }) => ({ type: 'Asset' as const, id })), 'Asset']
          : ['Asset'],
    }),
    getAsset: build.query<Asset, string>({
      query: (id) => `/assets/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Asset', id }],
    }),
    createAsset: build.mutation<Asset, Partial<Asset>>({
      query: (body) => ({ url: '/assets/', method: 'POST', body }),
      invalidatesTags: ['Asset', 'Analytics'],
    }),
    updateAsset: build.mutation<Asset, { id: string } & Partial<Asset>>({
      query: ({ id, ...body }) => ({ url: `/assets/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Asset', id }, 'Analytics'],
    }),
    deleteAsset: build.mutation<void, string>({
      query: (id) => ({ url: `/assets/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Asset', 'Analytics'],
    }),
    getCategories: build.query<PaginatedResponse<Category>, void>({
      query: () => '/assets/categories/',
      providesTags: ['Category'],
    }),
    createCategory: build.mutation<Category, { name: string; description?: string }>({
      query: (body) => ({ url: '/assets/categories/', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    getAssetQr: build.query<string, string>({
      query: (id) => ({ url: `/assets/${id}/qr/`, responseHandler: async (r) => URL.createObjectURL(await r.blob()) }),
    }),
    getActiveBooking: build.query<Booking | null, string>({
      query: (assetId) => ({
        url: `/assets/${assetId}/active-booking/`,
        validateStatus: (response) => response.status === 200 || response.status === 404,
      }),
      transformResponse: (res: Booking | { detail: string }) =>
        'id' in res ? res : null,
      providesTags: (_r, _e, id) => [{ type: 'Asset', id }],
    }),
  }),
})

export const {
  useGetAssetsQuery,
  useGetAssetQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetAssetQrQuery,
  useGetActiveBookingQuery,
} = assetsApi
