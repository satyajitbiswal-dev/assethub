import { useState } from 'react'
import { useGetMeQuery } from '@/features/auth/authApi'
import { baseApi } from '@/app/baseApi'
import { useAppSelector } from '@/app/hooks'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import { Users, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { User, PaginatedResponse } from '@/types'

// Inject the users endpoint directly into baseApi
const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<PaginatedResponse<User>, { search?: string }>({
      query: (params = {}) => ({ url: '/auth/users/', params }),
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
})
const { useGetUsersQuery } = usersApi

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useGetUsersQuery({ search })

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${data?.count ?? 0} registered users`}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-sm pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
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
                {['Name', 'Email', 'Department', 'Role', 'Joined', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.results.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.is_active ? 'bg-primary-light text-primary-dark' : 'bg-gray-100 text-gray-400'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
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
