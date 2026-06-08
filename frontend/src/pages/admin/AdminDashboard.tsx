import { useGetSummaryQuery, useGetTopAssetsQuery, useGetUtilisationQuery, useGetRecentActivityQuery } from '@/features/analytics/analyticsApi'
import { useGetBookingsQuery } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Package, BookOpen, AlertTriangle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

function KpiCard({ label, value, sub, icon: Icon, color = 'primary' }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color?: 'primary' | 'warning' | 'danger' | 'blue'
}) {
  const colors = {
    primary: 'bg-primary-light text-primary-dark',
    warning: 'bg-warning-light text-warning',
    danger:  'bg-danger-light text-danger',
    blue:    'bg-blue-50 text-blue-700',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4.5 h-4.5" size={18} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetSummaryQuery()
  const { data: topAssets } = useGetTopAssetsQuery()
  const { data: utilisation } = useGetUtilisationQuery()
  const { data: activity } = useGetRecentActivityQuery()
  const { data: pending } = useGetBookingsQuery({ status: 'pending' })

  if (isLoading) return <LoadingSpinner />

  const actionLabels: Record<string, string> = {
    booking_created: 'New booking request',
    booking_approved: 'Booking approved',
    booking_rejected: 'Booking rejected',
    asset_issued: 'Asset issued',
    asset_returned: 'Asset returned',
    booking_cancelled: 'Booking cancelled',
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operations overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total assets" value={summary?.total_assets ?? 0} icon={Package} color="primary" sub={`${summary?.total_categories} categories`} />
        <KpiCard label="Pending requests" value={summary?.pending_bookings ?? 0} icon={Clock} color="warning" sub="Awaiting review" />
        <KpiCard label="Active bookings" value={summary?.active_bookings ?? 0} icon={BookOpen} color="blue" />
        <KpiCard label="Overdue" value={summary?.overdue_bookings ?? 0} icon={AlertTriangle} color="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Utilisation by category</h2>
          {utilisation?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={utilisation} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Utilisation']} />
                <Bar dataKey="utilisation_rate" radius={[0, 4, 4, 0]}>
                  {utilisation.map((_, i) => <Cell key={i} fill="#1D9E75" opacity={0.7 + i * 0.05} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top borrowed assets</h2>
          <div className="space-y-3">
            {topAssets?.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.category}</p>
                </div>
                <span className="text-sm font-medium text-primary">{a.booking_count}</span>
              </div>
            )) ?? <p className="text-sm text-gray-400 text-center py-8">No data yet</p>}
          </div>
        </div>
      </div>

      {(pending?.results.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-warning/30 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Pending approvals <span className="text-warning">({pending!.results.length})</span>
          </h2>
          <div className="space-y-2">
            {pending!.results.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{b.user_detail?.full_name} → {b.asset_detail?.name} ×{b.quantity}</p>
                  <p className="text-xs text-gray-400">{b.start_date} to {b.end_date}</p>
                </div>
                <a href="/admin/bookings" className="text-xs text-primary font-medium hover:underline">Review →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent activity</h2>
        <div className="space-y-3">
          {activity?.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{actionLabels[log.action] ?? log.action}</p>
                <p className="text-xs text-gray-400">{log.actor_name} · {formatDateTime(log.created_at)}</p>
              </div>
            </div>
          )) ?? <p className="text-sm text-gray-400">No activity yet</p>}
        </div>
      </div>
    </div>
  )
}
