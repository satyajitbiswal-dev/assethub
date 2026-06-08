import { useGetNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/features/notifications/notificationsApi'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery()
  const [markRead] = useMarkReadMutation()
  const [markAllRead] = useMarkAllReadMutation()

  return (
    <div>
      <PageHeader title="Notifications"
        action={data?.unread_count ? (
          <button onClick={() => markAllRead()} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        ) : undefined}
      />
      {isLoading ? <LoadingSpinner /> : !data?.results.length ? (
        <EmptyState icon={Bell} title="All caught up!" description="No notifications yet." />
      ) : (
        <div className="space-y-2">
          {data.results.map((n) => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              className={cn('bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-gray-200',
                n.is_read ? 'border-gray-100 opacity-70' : 'border-primary/20')}>
              <div className="flex items-start gap-3">
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0" style={{ marginLeft: n.is_read ? '20px' : undefined }}>
                  <p className={cn('text-sm', n.is_read ? 'text-gray-600' : 'font-medium text-gray-900')}>{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
