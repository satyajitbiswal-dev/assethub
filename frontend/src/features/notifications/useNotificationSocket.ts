import { useEffect, useRef } from 'react'
import { useAppSelector } from '@/app/hooks'
import { connectNotificationSocket } from './notificationSocket'

const RECONNECT_MS = 3000

export function useNotificationSocket() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    let stopped = false

    const connect = () => {
      if (stopped) return
      wsRef.current?.close()
      const ws = connectNotificationSocket(accessToken)
      wsRef.current = ws
      ws.onclose = () => {
        if (!stopped) {
          reconnectRef.current = setTimeout(connect, RECONNECT_MS)
        }
      }
    }

    connect()

    return () => {
      stopped = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [isAuthenticated, accessToken])
}
