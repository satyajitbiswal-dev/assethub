import { useState } from 'react'
import { useGetBookingsQuery, useApproveBookingMutation, useRejectBookingMutation, useIssueBookingMutation, useReturnBookingMutation } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { BookOpen, CheckCircle, XCircle, ArrowDownCircle, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const { data, isLoading } = useGetBookingsQuery({ status: statusFilter })
  const [approve] = useApproveBookingMutation()
  const [reject] = useRejectBookingMutation()
  const [issue] = useIssueBookingMutation()
  const [returnBooking] = useReturnBookingMutation()

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg) } catch { toast.error('Action failed') }
  }

  const statuses = ['pending', 'approved', 'issued', 'returned', 'rejected', 'cancelled']

  return (
    <div>
      <PageHeader title="Booking Management" subtitle="Review and manage all asset requests" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : !data?.results.length ? (
        <EmptyState icon={BookOpen} title={`No ${statusFilter} bookings`} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Asset', 'Qty', 'Dates', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.results.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.user_detail?.full_name}</p>
                    <p className="text-xs text-gray-400">{b.user_detail?.department}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.asset_detail?.name}</p>
                    <p className="text-xs text-gray-400">{b.asset_detail?.category_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.quantity}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(b.start_date)}<br />
                    <span className="text-xs text-gray-400">→ {formatDate(b.end_date)}</span>
                    {b.is_overdue && <span className="ml-1 text-red-500 text-xs">⚠ overdue</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {b.status === 'pending' && <>
                        <button onClick={() => act(() => approve(b.id).unwrap(), 'Approved')} title="Approve"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => act(() => reject({ id: b.id }).unwrap(), 'Rejected')} title="Reject"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                      </>}
                      {b.status === 'approved' && (
                        <button onClick={() => act(() => issue(b.id).unwrap(), 'Issued')} title="Issue asset"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><ArrowDownCircle className="w-4 h-4" /></button>
                      )}
                      {b.status === 'issued' && (
                        <button onClick={() => act(() => returnBooking(b.id).unwrap(), 'Returned')} title="Mark returned"
                          className="p-1.5 text-primary hover:bg-primary-light rounded-lg transition-colors"><RotateCcw className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
