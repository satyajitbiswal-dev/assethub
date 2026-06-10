import toast from 'react-hot-toast'
import { store } from '@/app/store'
import { Notification } from '@/types'
import { notificationsApi } from './notificationsApi'

interface WsMessage {
  type: string
  notification?: Notification
  notification_id?: string
  unread_count: number
}

function handleMessage(data: WsMessage) {
  switch (data.type) {
    case 'notification.new':
      if (!data.notification) return
      store.dispatch(
        notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          const exists = draft.results.some((n) => n.id === data.notification!.id)
          if (!exists) draft.results.unshift(data.notification!)
          draft.unread_count = data.unread_count
        }),
      )
      toast(data.notification.title, { icon: '🔔' })
      break

    case 'notification.read':
      store.dispatch(
        notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          const item = draft.results.find((n) => n.id === data.notification_id)
          if (item) item.is_read = true
          draft.unread_count = data.unread_count
        }),
      )
      break

    case 'notifications.read_all':
      store.dispatch(
        notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          draft.results.forEach((n) => { n.is_read = true })
          draft.unread_count = 0
        }),
      )
      break

    case 'notifications.cleared':
      store.dispatch(
        notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          draft.results = []
          draft.unread_count = 0
        }),
      )
      break
  }
}

export function connectNotificationSocket(token: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(
    `${protocol}//${window.location.host}/ws/notifications/?token=${encodeURIComponent(token)}`,
  )
  ws.onmessage = (event) => handleMessage(JSON.parse(event.data))
  return ws
}
