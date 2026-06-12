import {
  useGetSummaryQuery,
  useGetTopAssetsQuery,
  useGetUtilisationQuery,
  useGetOverdueBookingsQuery,
  useGetRecentActivityQuery,
} from '@/features/analytics/analyticsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'
import { formatDate, formatDateTime } from '@/lib/utils'
import ChartContainer from '@/components/shared/ChartContainer'
import { AlertTriangle, TrendingUp, Package, BookOpen, Clock, RotateCcw } from 'lucide-react'

const COLORS = ['#1D9E75', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function StatCard({
  label, value, sub, icon: Icon, trend, color = 'primary',
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; trend?: string; color?: string
}) {
  const iconColors: Record<string, string> = {
    primary: 'bg-primary-light text-primary',
    blue:    'bg-blue-50 text-blue-600',
    warning: 'bg-warning-light text-warning',
    danger:  'bg-danger-light text-danger',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
          <Icon size={18} />
        </div>
        {trend && <span className="text-xs text-primary font-medium flex items-center gap-1"><TrendingUp size={12} />{trend}</span>}
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data: summary, isLoading } = useGetSummaryQuery(undefined, { pollingInterval: 30000 })
  const { data: topAssets }  = useGetTopAssetsQuery()
  const { data: utilisation } = useGetUtilisationQuery()
  const { data: overdue }    = useGetOverdueBookingsQuery()
  const { data: activity }   = useGetRecentActivityQuery()

  if (isLoading && !summary) return <LoadingSpinner />

  const pieData = utilisation?.map((c) => ({ name: c.category, value: c.borrowed_qty })).filter(d => d.value > 0)

  const actionColors: Record<string, string> = {
    booking_created:   'bg-blue-100 text-blue-700',
    booking_approved:  'bg-primary-light text-primary-dark',
    booking_rejected:  'bg-danger-light text-danger',
    asset_issued:      'bg-purple-100 text-purple-700',
    asset_returned:    'bg-gray-100 text-gray-600',
    booking_cancelled: 'bg-gray-100 text-gray-500',
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Full operations overview and usage metrics" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total assets"      value={summary?.total_assets ?? 0}     icon={Package}       color="primary" sub={`${summary?.total_categories} categories`} />
        <StatCard label="Utilisation"       value={`${summary?.utilisation_rate ?? 0}%`} icon={TrendingUp} color="blue" sub={`${summary?.borrowed_qty} / ${summary?.total_qty} units out`} />
        <StatCard label="Pending requests"  value={summary?.pending_bookings ?? 0} icon={Clock}         color="warning" />
        <StatCard label="Overdue"           value={summary?.overdue_bookings ?? 0} icon={AlertTriangle} color="danger"  sub="Need immediate attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Utilisation by category — bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Utilisation by category</h2>
          {utilisation?.length ? (
            <ChartContainer height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilisation} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={96} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Utilisation']} />
                  <Bar dataKey="utilisation_rate" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {utilisation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : <p className="text-sm text-gray-400 text-center py-12">No data yet</p>}
        </div>

        {/* Borrowed qty by category — pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Borrowed assets by category</h2>
          {pieData?.length ? (
            <ChartContainer height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : <p className="text-sm text-gray-400 text-center py-12">Nothing borrowed yet</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top borrowed assets */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Most borrowed assets</h2>
          {topAssets?.length ? (
            <div className="space-y-3">
              {topAssets.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (a.booking_count / (topAssets[0]?.booking_count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-primary w-6 text-right">{a.booking_count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">No booking data yet</p>}
        </div>

        {/* Overdue bookings */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Overdue bookings
            {(overdue?.length ?? 0) > 0 && (
              <span className="bg-danger-light text-danger text-xs font-medium px-2 py-0.5 rounded-full">
                {overdue!.length}
              </span>
            )}
          </h2>
          {overdue?.length ? (
            <div className="space-y-3">
              {overdue.map((b) => (
                <div key={b.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{b.asset_detail?.name} ×{b.quantity}</p>
                    <p className="text-xs text-gray-500">{b.user_detail?.full_name} · {b.user_detail?.department}</p>
                    <p className="text-xs text-danger mt-0.5">Due {formatDate(b.end_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center mb-3">
                <RotateCcw className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-gray-500">No overdue bookings</p>
            </div>
          )}
        </div>
      </div>

      {/* Full audit feed */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Activity log</h2>
        <div className="space-y-0">
          {!activity?.length ? (
            <p className="text-sm text-gray-400 py-6 text-center">No activity yet</p>
          ) : null}
          {activity?.map((log, i) => (
            <div key={log.id} className={`flex items-start gap-4 py-3 ${i < activity.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className={`mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${actionColors[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                {log.action_label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{log.actor_name}</span>
                  {log.target_label ? (
                    <>
                      {' · '}
                      <span className="text-gray-500">{log.target_label}</span>
                    </>
                  ) : null}
                </p>
                {log.summary ? (
                  <p className="text-xs text-gray-500 mt-0.5">{log.summary}</p>
                ) : null}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(log.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
