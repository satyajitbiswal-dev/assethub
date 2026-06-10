import { useEffect, useState } from 'react'
import { baseApi } from '@/app/baseApi'
import { useAppSelector } from '@/app/hooks'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Users, Search, Ban, CheckCircle } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { User, PaginatedResponse } from '@/types'
import toast from 'react-hot-toast'

type StatusFilter = 'all' | 'active' | 'blocked'

const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<
      PaginatedResponse<User>,
      { search?: string; status?: StatusFilter }
    >({
      query: ({ search, status }) => ({
        url: '/auth/users/',
        params: {
          ...(search ? { search } : {}),
          ...(status && status !== 'all' ? { status } : {}),
        },
      }),
      providesTags: ['User'],
    }),
    updateUserStatus: build.mutation<
      { success: boolean; user: User },
      { id: string; is_active: boolean }
    >({
      query: ({ id, is_active }) => ({
        url: `/auth/users/${id}/status/`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
})

const { useGetUsersQuery, useUpdateUserStatusMutation } = usersApi

export default function AdminUsersPage() {
  const currentUser = useAppSelector((s) => s.auth.user)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { data, isLoading } = useGetUsersQuery({ search, status: statusFilter })
  const [updateStatus, { isLoading: updating }] = useUpdateUserStatusMutation()

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot change your own account status.')
      return
    }
    try {
      const result = await updateStatus({
        id: user.id,
        is_active: !user.is_active,
      }).unwrap()
      toast.success(result.user.is_active ? 'User unblocked' : 'User blocked')
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to update user status',
      )
    }
  }

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'blocked', label: 'Blocked' },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${data?.count ?? 0} registered users`}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or enrollment…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                statusFilter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.results.length ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Enrollment', 'Email', 'Department', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.results.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{user.enrollment_no || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600',
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.is_active ? 'bg-primary-light text-primary-dark' : 'bg-red-50 text-red-600',
                    )}>
                      {user.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={updating}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                          user.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-primary hover:bg-primary-light',
                        )}
                      >
                        {user.is_active ? (
                          <><Ban className="w-3.5 h-3.5" /> Block</>
                        ) : (
                          <><CheckCircle className="w-3.5 h-3.5" /> Unblock</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
