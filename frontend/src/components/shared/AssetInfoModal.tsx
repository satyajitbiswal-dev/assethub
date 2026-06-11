import { useState } from 'react'
import { Asset } from '@/types'
import { X, MapPin, Package, Tag, Wrench, Download, QrCode } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { useGetAssetQrQuery } from '@/features/assets/assetsApi'
import { cn } from '@/lib/utils'

interface Props {
  asset: Asset
  onClose: () => void
  /** If true, the QR code download button is shown */
  showQr?: boolean
}

function QrSection({ assetId, assetName }: { assetId: string; assetName: string }) {
  const [fetch, setFetch] = useState(false)
  const { data: qrUrl, isLoading } = useGetAssetQrQuery(assetId, { skip: !fetch })

  const handleDownload = () => {
    if (qrUrl) {
      const a = document.createElement('a')
      a.href = qrUrl
      a.download = `QR-${assetName.replace(/\s+/g, '_')}.png`
      a.click()
    } else {
      setFetch(true)
    }
  }

  // Auto-download when URL becomes available after first fetch
  if (qrUrl && fetch) {
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `QR-${assetName.replace(/\s+/g, '_')}.png`
    a.click()
    setFetch(false) // reset so we don't loop
  }

  return (
    <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="w-4 h-4 text-gray-500" />
        <p className="text-sm font-medium text-gray-700">QR Code for Equipment</p>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Download and print the QR code to stick on the physical asset for easy scanning.
      </p>
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            Download QR Code
          </>
        )}
      </button>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string | number | null | undefined
}) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  )
}

export default function AssetInfoModal({ asset, onClose, showQr = false }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 truncate">{asset.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{asset.category_name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <StatusBadge status={asset.status} />
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {/* Availability bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Availability</span>
              <span className="text-xs font-medium text-gray-800">
                {asset.available_qty} / {asset.total_qty} units
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  asset.available_qty === 0 ? 'bg-red-400' : asset.utilisation_rate > 70 ? 'bg-amber-400' : 'bg-primary'
                )}
                style={{ width: `${100 - asset.utilisation_rate}%` }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-0">
            <InfoRow icon={Tag} label="Condition" value={asset.condition} />
            <InfoRow icon={MapPin} label="Location" value={asset.location} />
            <InfoRow icon={Package} label="Serial Number" value={asset.serial_number} />
            <InfoRow icon={Wrench} label="Maintenance Notes" value={asset.maintenance_notes} />
          </div>

          {/* Description */}
          {asset.description && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5">
                {asset.description}
              </p>
            </div>
          )}

          {/* Created by & date */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {asset.created_by_name && (
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-400">Added by</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{asset.created_by_name}</p>
              </div>
            )}
            {asset.created_at && (
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-400">Added on</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">
                  {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* QR Code section (admin only) */}
          {showQr && <QrSection assetId={asset.id} assetName={asset.name} />}
        </div>
      </div>
    </div>
  )
}
