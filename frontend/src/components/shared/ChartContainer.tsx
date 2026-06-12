import { useEffect, useState, useRef, ReactNode } from 'react'

/** Recharts ResponsiveContainer needs a sized parent; defer render until layout is ready. */
export default function ChartContainer({
  height = 240,
  children,
}: {
  height?: number
  children: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const markReady = () => {
      const { width, height: h } = el.getBoundingClientRect()
      if (width > 0 && h > 0) setReady(true)
    }

    markReady()
    const raf = requestAnimationFrame(() => requestAnimationFrame(markReady))
    const ro = new ResizeObserver(markReady)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height }} className="min-w-0">
      {ready ? children : (
        <div className="h-full flex items-center justify-center text-sm text-gray-400">
          Loading chart…
        </div>
      )}
    </div>
  )
}
