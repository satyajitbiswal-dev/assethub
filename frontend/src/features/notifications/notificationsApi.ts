import { baseApi } from '@/app/baseApi'
import { NotificationsResponse } from '@/types'

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<NotificationsResponse, void>({
      query: () => '/notifications/',
      providesTags: ['Notification'],
    }),
    markRead: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}/read/`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllRead: build.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/notifications/read-all/', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const { useGetNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } = notificationsApi
