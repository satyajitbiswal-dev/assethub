import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useGetAssetQuery } from '@/features/assets/assetsApi'
import { useCreateBookingMutation } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { QrCode, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  quantity:   z.coerce.number().min(1),
  start_date: z.string().min(1, 'Required'),
  end_date:   z.string().min(1, 'Required'),
  reason:     z.string().optional(),
})
type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

function AssetPreview({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const { data: asset, isLoading } = useGetAssetQuery(assetId)
  const [create, { isLoading: booking }] = useCreateBookingMutation()
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await create({ asset: assetId, ...data }).unwrap()
      toast.success('Booking request submitted!')
      onClose()
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? 'Booking failed')
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

      {asset.status === 'available' && asset.available_qty > 0 ? (
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">
          <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Book this asset</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Qty (max {asset.available_qty})</label>
              <input {...register('quantity')} type="number" min={1} max={asset.available_qty} defaultValue={1} className={inputCls} />
              {errors.quantity && <p className="text-xs text-red-500 mt-0.5">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason</label>
              <input {...register('reason')} className={inputCls} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start date</label>
              <input {...register('start_date')} type="date" min={today} className={inputCls} />
              {errors.start_date && <p className="text-xs text-red-500 mt-0.5">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End date</label>
              <input {...register('end_date')} type="date" min={today} className={inputCls} />
              {errors.end_date && <p className="text-xs text-red-500 mt-0.5">{errors.end_date.message}</p>}
            </div>
          </div>
          <button type="submit" disabled={booking}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors">
            {booking ? 'Submitting…' : 'Submit booking request'}
          </button>
        </form>
      ) : (
        <div className="px-5 py-4 text-center text-sm text-gray-400">
          This asset is currently <strong>{asset.status}</strong> and cannot be booked.
        </div>
      )}
    </div>
  )
}

export default function QrScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannedId, setScannedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startScan = async () => {
    setError('')
    setScannedId(null)
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          // Payload format: "asset:<uuid>:<name>"
          const parts = decoded.split(':')
          if (parts[0] === 'asset' && parts[1]) {
            const id = parts[1]
            scanner.stop().catch(() => {})
            setScanning(false)
            setScannedId(id)
          } else {
            setError('QR code is not an AssetHub asset code.')
          }
        },
        () => {},
      )
      setScanning(true)
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  const stopScan = () => {
    scannerRef.current?.stop().catch(() => {})
    setScanning(false)
  }

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}) }, [])

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="QR Scanner" subtitle="Scan an asset QR code to view details and book instantly" />

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div id="qr-reader" className={`overflow-hidden rounded-lg ${scanning ? 'block' : 'hidden'}`} />

        {!scanning && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center">
              <QrCode className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Ready to scan</p>
              <p className="text-xs text-gray-500 mt-1">Point your camera at an asset QR code</p>
            </div>
            <button onClick={startScan}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Start camera
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

      {scannedId && <AssetPreview assetId={scannedId} onClose={() => setScannedId(null)} />}
    </div>
  )
}
