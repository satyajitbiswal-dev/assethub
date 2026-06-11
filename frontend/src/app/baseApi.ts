import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { RootState } from './store'
import { logout, setCredentials } from '@/features/auth/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

// Auto-refresh: if 401, try refresh token once then retry
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions)

    if (result.error && result.error.status === 401) {
      const refreshToken = (api.getState() as RootState).auth.refreshToken
      if (refreshToken) {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/token/refresh/', method: 'POST', body: { refresh: refreshToken } },
          api,
          extraOptions,
        )
        if (refreshResult.data) {
          const data = refreshResult.data as { access: string }
          api.dispatch(setCredentials({ accessToken: data.access }))
          result = await rawBaseQuery(args, api, extraOptions)
        } else {
          api.dispatch(logout())
        }
      } else {
        api.dispatch(logout())
      }
    }
    return result
  }

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Asset', 'Category', 'Booking', 'Notification', 'Analytics', 'User','Feedback','Review','ReviewSummary'],
  endpoints: () => ({}),
})
