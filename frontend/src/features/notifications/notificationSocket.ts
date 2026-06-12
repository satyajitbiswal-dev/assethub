import toast from 'react-hot-toast'
import { store } from '@/app/store'
import { baseApi } from '@/app/baseApi'
import { Notification, NotificationsResponse } from '@/types'
import { notificationsApi } from './notificationsApi'

interface WsMessage {
  type: string
  notification?: Notification
  notification_id?: string
  unread_count: number
}

function patchNotifications(updater: (draft: NotificationsResponse) => void) {
  const current = notificationsApi.endpoints.getNotifications.select()(store.getState()).data
  const draft: NotificationsResponse = current
    ? { unread_count: current.unread_count, results: current.results.map((n) => ({ ...n })) }
    : { unread_count: 0, results: [] }

  updater(draft)

  store.dispatch(notificationsApi.util.upsertQueryData('getNotifications', undefined, draft))
}

function refreshOperationalData() {
  // Keep Notification cache from websocket patch; refetch operational lists only.
  store.dispatch(baseApi.util.invalidateTags(['Booking', 'Analytics', 'Asset']))
}

function handleMessage(data: WsMessage) {
  switch (data.type) {
    case 'notification.new':
      if (!data.notification) return
      patchNotifications((draft) => {
        const exists = draft.results.some((n) => n.id === data.notification!.id)
        if (!exists) draft.results.unshift(data.notification!)
        draft.unread_count = data.unread_count
      })
      refreshOperationalData()
      toast(data.notification.title, { icon: '🔔' })
      break

    case 'notification.read':
      patchNotifications((draft) => {
        const item = draft.results.find((n) => n.id === data.notification_id)
        if (item) item.is_read = true
        draft.unread_count = data.unread_count
      })
      break

    case 'notifications.read_all':
      patchNotifications((draft) => {
        draft.results.forEach((n) => { n.is_read = true })
        draft.unread_count = 0
      })
      break

    case 'notifications.cleared':
      patchNotifications((draft) => {
        draft.results = []
        draft.unread_count = 0
      })
      break
  }
}

export function connectNotificationSocket(token: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(
    `${protocol}//${window.location.host}/ws/notifications/?token=${encodeURIComponent(token)}`,
  )
  ws.onmessage = (event) => {
    try {
      handleMessage(JSON.parse(event.data))
    } catch {
      // ignore malformed frames so the socket keeps working
    }
  }
  return ws
}
