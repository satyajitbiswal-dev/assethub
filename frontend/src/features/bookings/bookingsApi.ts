import { baseApi } from '@/app/baseApi'
import { Booking, PaginatedResponse } from '@/types'

interface BookingFilters { status?: string; asset?: string; page?: number }
interface BookingCreate { asset: string; quantity: number; start_date: string; end_date: string; reason?: string }

const bookingListTags = ['Booking', 'Analytics', 'Notification', 'Asset'] as const

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookings: build.query<PaginatedResponse<Booking>, BookingFilters>({
      query: (params = {}) => ({ url: '/bookings/', params }),
      providesTags: (result) =>
        result
          ? [...result.results.map(({ id }) => ({ type: 'Booking' as const, id })), 'Booking']
          : ['Booking'],
    }),
    getBooking: build.query<Booking, string>({
      query: (id) => `/bookings/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),
    createBooking: build.mutation<Booking, BookingCreate>({
      query: (body) => ({ url: '/bookings/', method: 'POST', body }),
      invalidatesTags: [...bookingListTags],
    }),
    cancelBooking: build.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/cancel/`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Booking', id }, ...bookingListTags],
    }),
    approveBooking: build.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/approve/`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Booking', id }, ...bookingListTags],
    }),
    rejectBooking: build.mutation<Booking, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/reject/`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Booking', id }, ...bookingListTags],
    }),
    issueBooking: build.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/issue/`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Booking', id }, ...bookingListTags],
    }),
    returnBooking: build.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/return/`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Booking', id }, ...bookingListTags],
    }),
    sendOverdueReminder: build.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/bookings/${id}/remind-overdue/`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useIssueBookingMutation,
  useReturnBookingMutation,
  useSendOverdueReminderMutation,
} = bookingsApi
