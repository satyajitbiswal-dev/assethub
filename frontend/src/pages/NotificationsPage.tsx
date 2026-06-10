import { useState } from 'react'
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useClearAllMutation,
} from '@/features/notifications/notificationsApi'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'

function ClearAllDialog({
  count,
  onConfirm,
  onCancel,
  isLoading,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Clear all notifications?</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This will permanently delete {count} notification{count === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Clearing…' : 'Clear all'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery()
  const [markRead] = useMarkReadMutation()
  const [markAllRead] = useMarkAllReadMutation()
  const [clearAll, { isLoading: clearing }] = useClearAllMutation()
  const [showClearDialog, setShowClearDialog] = useState(false)

  const hasNotifications = (data?.results.length ?? 0) > 0
  const totalCount = data?.results.length ?? 0

  const handleClearAll = async () => {
    await clearAll().unwrap()
    setShowClearDialog(false)
  }

  return (
    <div>
      {showClearDialog && (
        <ClearAllDialog
          count={totalCount}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearDialog(false)}
          isLoading={clearing}
        />
      )}

      <PageHeader
        title="Notifications"
        action={hasNotifications ? (
          <div className="flex items-center gap-2">
            {data?.unread_count ? (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            ) : null}
            <button
              onClick={() => setShowClearDialog(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          </div>
        ) : undefined}
      />
      {isLoading ? (
        <LoadingSpinner />
      ) : !hasNotifications ? (
        <EmptyState icon={Bell} title="All caught up!" description="No notifications yet." />
      ) : (
        <div className="space-y-2">
          {data!.results.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={cn(
                'bg-white rounded-xl border p-4 cursor-pointer transition-all hover:border-gray-200',
                n.is_read ? 'border-gray-100 opacity-70' : 'border-primary/20',
              )}
            >
              <div className="flex items-start gap-3">
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                )}
                <div
                  className="flex-1 min-w-0"
                  style={{ marginLeft: n.is_read ? '20px' : undefined }}
                >
                  <p
                    className={cn(
                      'text-sm',
                      n.is_read ? 'text-gray-600' : 'font-medium text-gray-900',
                    )}
                  >
                    {n.title}
                  </p>
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
