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

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = (api.getState() as RootState).auth.refreshToken
    if (!refreshToken) return false

    const refreshResult = await rawBaseQuery(
      { url: '/auth/token/refresh/', method: 'POST', body: { refresh: refreshToken } },
      api,
      extraOptions,
    )

    if (!refreshResult.data) return false

    const data = refreshResult.data as { access: string; refresh?: string }
    api.dispatch(
      setCredentials({
        accessToken: data.access,
        refreshToken: data.refresh,
      }),
    )
    return true
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

// Auto-refresh: if 401, try refresh token once then retry (single in-flight refresh)
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions)

    if (result.error && result.error.status === 401) {
      const refreshed = await tryRefreshToken(api, extraOptions)
      if (refreshed) {
        result = await rawBaseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    }
    return result
  }

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Asset', 'Category', 'Booking', 'Notification', 'Analytics', 'User', 'Feedback', 'Review', 'ReviewSummary'],
  refetchOnMountOrArgChange: 30,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
})
