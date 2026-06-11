import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useGetAssetQuery, useGetActiveBookingQuery } from '@/features/assets/assetsApi'
import { useIssueBookingMutation, useReturnBookingMutation } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { QrCode, X, CheckCircle, ArrowDownCircle, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

function AssetActionPanel({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const { data: asset, isLoading: assetLoading } = useGetAssetQuery(assetId)
  const { data: booking, isLoading: bookingLoading, refetch } = useGetActiveBookingQuery(assetId)
  const [issue, { isLoading: issuing }] = useIssueBookingMutation()
  const [returnBooking, { isLoading: returning }] = useReturnBookingMutation()

  const isLoading = assetLoading || bookingLoading

  const handleIssue = async () => {
    if (!booking) return
    try {
      await issue(booking.id).unwrap()
      toast.success('Asset issued')
      refetch()
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? 'Issue failed')
    }
  }

  const handleReturn = async () => {
    if (!booking) return
    try {
      await returnBooking(booking.id).unwrap()
      toast.success('Asset returned')
      refetch()
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? 'Return failed')
    }
  }

  if (isLoading) return (
    <div className="mt-6 bg-white rounded-xl border border-gray-100 p-8 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  )

  if (!asset) return (
    <div className="mt-6 bg-white rounded-xl border border-red-100 p-6 text-center">
      <p className="text-sm text-red-500">Asset not found. Try scanning again.</p>
    </div>
  )

  return (
    <div className="mt-6 bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden">
      <div className="bg-primary-light px-5 py-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{asset.name}</p>
            <p className="text-xs text-gray-500">{asset.category_name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/60 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-gray-100">
        {[
          { label: 'Available', value: `${asset.available_qty} / ${asset.total_qty}` },
          { label: 'Status',    value: <StatusBadge status={asset.status} /> },
          { label: 'Condition', value: <StatusBadge status={asset.condition} /> },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <div className="text-sm font-medium text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {!booking ? (
        <div className="px-5 py-6 text-center text-sm text-gray-400">
          No pending issue/return action — this asset has no approved or issued booking right now.
        </div>
      ) : (
        <div className="px-5 py-4 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{booking.user_detail?.full_name}</p>
            <p className="text-xs text-gray-500">{booking.user_detail?.department}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(booking.start_date)} → {formatDate(booking.end_date)} · ×{booking.quantity}
            </p>
            <div className="mt-2"><StatusBadge status={booking.status} /></div>
          </div>

          {booking.status === 'approved' && (
            <button onClick={handleIssue} disabled={issuing}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              <ArrowDownCircle className="w-4 h-4" /> {issuing ? 'Issuing…' : 'Issue asset'}
            </button>
          )}

          {booking.status === 'issued' && (
            <button onClick={handleReturn} disabled={returning}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> {returning ? 'Returning…' : 'Mark as returned'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminQrScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [scannedId, setScannedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const stopScanInternal = async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      const state = scanner.getState()
      if (state === 2) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      /* ignore */
    } finally {
      scannerRef.current = null
    }
  }

  const startScan = async () => {
    setError('')
    setScannedId(null)
    setStarting(true)

    await stopScanInternal()

    try {
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) {
        setError('No camera found on this device.')
        setStarting(false)
        return
      }

      const scanner = new Html5Qrcode('admin-qr-reader')
      scannerRef.current = scanner

      const preferred =
        cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[0]

      setScanning(true)
      await scanner.start(
        preferred.id,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          const parts = decoded.split(':')
          if (parts[0] === 'asset' && parts[1]) {
            const id = parts[1]
            stopScanInternal()
            setScanning(false)
            setScannedId(id)
          } else {
            setError('QR code is not an AssetHub asset code.')
          }
        },
        () => {},
      )
    } catch (err) {
      console.error(err)
      setError('Camera access denied or unavailable. Please allow camera permissions and try again.')
      setScanning(false)
      await stopScanInternal()
    } finally {
      setStarting(false)
    }
  }

  const stopScan = async () => {
    await stopScanInternal()
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanInternal()
    }
  }, [])

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="QR Scanner" subtitle="Scan an asset QR code to issue or return it" />

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div
          id="admin-qr-reader"
          className="w-full overflow-hidden rounded-lg bg-gray-900"
          style={{ minHeight: scanning ? 280 : 0, display: scanning ? 'block' : 'none' }}
        />

        {!scanning && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center">
              <QrCode className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Ready to scan</p>
              <p className="text-xs text-gray-500 mt-1">Point camera at an asset QR code to issue or return it</p>
            </div>
            <button onClick={startScan} disabled={starting}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60">
              {starting ? 'Starting camera…' : 'Start camera'}
            </button>
          </div>
        )}

        {scanning && (
          <button onClick={stopScan}
            className="mt-4 w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Stop scanning
          </button>
        )}

        {error && <p className="mt-4 text-sm text-red-500 text-center bg-red-50 rounded-lg px-4 py-3">{error}</p>}
      </div>

      {scannedId && <AssetActionPanel assetId={scannedId} onClose={() => setScannedId(null)} />}
    </div>
  )
}