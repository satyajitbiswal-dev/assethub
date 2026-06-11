import { useState } from 'react'
import { useGetAssetsQuery, useGetCategoriesQuery } from '@/features/assets/assetsApi'
import { useCreateBookingMutation } from '@/features/bookings/bookingsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import AssetInfoModal from '@/components/shared/AssetInfoModal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Search, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Asset } from '@/types'
import toast from 'react-hot-toast'

const bookingSchema = z.object({
  quantity: z.coerce.number().min(1),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  reason: z.string().optional(),
})
type BookingForm = z.infer<typeof bookingSchema>

function BookingModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [create, { isLoading }] = useCreateBookingMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<BookingForm>({ resolver: zodResolver(bookingSchema) })
  const today = new Date().toISOString().split('T')[0]

  const onSubmit = async (data: BookingForm) => {
    try {
      await create({ asset: asset.id, ...data }).unwrap()
      toast.success('Booking request submitted!')
      onClose()
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? 'Failed to create booking')
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Book Asset</h2>
            <p className="text-sm text-gray-500 mt-0.5">{asset.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity <span className="text-gray-400 font-normal">({asset.available_qty} available)</span>
            </label>
            <input {...register('quantity')} type="number" min={1} max={asset.available_qty} defaultValue={1} className={inputCls} />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
              <input {...register('start_date')} type="date" min={today} className={inputCls} />
              {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End date</label>
              <input {...register('end_date')} type="date" min={today} className={inputCls} />
              {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea {...register('reason')} rows={3} className={inputCls} placeholder="Why do you need this asset?" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors">
              {isLoading ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [infoAsset, setInfoAsset] = useState<Asset | null>(null)

  const { data: assetsData, isLoading } = useGetAssetsQuery({ search, category: categoryFilter, status: statusFilter })
  const { data: categoriesData } = useGetCategoriesQuery()

  return (
    <div>
      <PageHeader title="Asset Catalog" subtitle="Browse and book available assets" />

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-36">
          <option value="">All categories</option>
          {categoriesData?.results.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : !assetsData?.results.length ? (
        <EmptyState icon={Package} title="No assets found" description="Try adjusting your filters" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetsData.results.map((asset) => (
            <div key={asset.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{asset.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{asset.category_name}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <StatusBadge status={asset.status} />
                  {/* Info button */}
                  <button
                    onClick={() => setInfoAsset(asset)}
                    className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Asset details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {asset.location && <p className="text-xs text-gray-400 mb-3">📍 {asset.location}</p>}
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-900">{asset.available_qty}</span> / {asset.total_qty} available
                </div>
                <StatusBadge status={asset.condition} />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${asset.utilisation_rate}%` }} />
              </div>
              <button
                onClick={() => setSelectedAsset(asset)}
                disabled={asset.status !== 'available' || asset.available_qty === 0}
                className={cn(
                  'w-full py-2 rounded-lg text-sm font-medium transition-colors',
                  asset.status === 'available' && asset.available_qty > 0
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {asset.status !== 'available' ? 'Unavailable' : asset.available_qty === 0 ? 'Out of stock' : 'Book now'}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedAsset && <BookingModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
      {infoAsset && <AssetInfoModal asset={infoAsset} onClose={() => setInfoAsset(null)} showQr={false} />}
    </div>
  )
}
