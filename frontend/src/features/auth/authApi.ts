import { baseApi } from '@/app/baseApi'
import { LoginResponse, User } from '@/types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login/', method: 'POST', body }),
    }),
    register: build.mutation<{ success: boolean; user: User }, {
      email: string; password: string; password2: string
      first_name?: string; last_name?: string; phone?: string; department?: string
    }>({
      query: (body) => ({ url: '/auth/register/', method: 'POST', body }),
    }),
    getMe: build.query<User, void>({
      query: () => '/auth/me/',
      providesTags: ['User'],
    }),
    updateMe: build.mutation<User, Partial<User>>({
      query: (body) => ({ url: '/auth/me/', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changePassword: build.mutation<{ success: boolean }, { old_password: string; new_password: string }>({
      query: (body) => ({ url: '/auth/change-password/', method: 'POST', body }),
    }),
    logout: build.mutation<void, { refresh: string }>({
      query: (body) => ({ url: '/auth/logout/', method: 'POST', body }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi
