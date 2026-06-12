import { useEffect, useState, ReactNode } from 'react'

/** Recharts ResponsiveContainer needs a sized parent; defer render until after layout. */
export default function ChartContainer({
  height = 240,
  children,
}: {
  height?: number
  children: ReactNode
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{ width: '100%', height }} className="min-w-0">
      {ready ? children : (
        <div className="h-full flex items-center justify-center text-sm text-gray-400">
          Loading chart…
        </div>
      )}
    </div>
  )
}
