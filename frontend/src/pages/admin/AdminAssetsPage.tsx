import { useState } from 'react'
import { useGetAssetsQuery, useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation, useGetCategoriesQuery } from '@/features/assets/assetsApi'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Asset } from '@/types'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

function AssetModal({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const [create, { isLoading: creating }] = useCreateAssetMutation()
  const [update, { isLoading: updating }] = useUpdateAssetMutation()
  const { data: cats } = useGetCategoriesQuery()
  const isLoading = creating || updating

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: asset ? {
      name: asset.name, category: asset.category, description: asset.description,
      total_qty: asset.total_qty, status: asset.status, condition: asset.condition,
      location: asset.location, serial_number: asset.serial_number,
    } : { total_qty: 1, status: 'available', condition: 'good' }
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      if (asset) { await update({ id: asset.id, ...data }).unwrap(); toast.success('Asset updated') }
      else { await create(data).unwrap(); toast.success('Asset created') }
      onClose()
    } catch { toast.error('Failed to save asset') }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{asset ? 'Edit Asset' : 'Add New Asset'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
              <input {...register('name', { required: true })} className={inputCls} placeholder="Asset name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select {...register('category', { required: true })} className={inputCls}>
                <option value="">Select…</option>
                {cats?.results.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total quantity *</label>
              <input {...register('total_qty', { required: true, min: 1 })} type="number" min={1} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select {...register('status')} className={inputCls}>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
              <select {...register('condition')} className={inputCls}>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input {...register('location')} className={inputCls} placeholder="e.g. Lab 3, Shelf B" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial number</label>
              <input {...register('serial_number')} className={inputCls} placeholder="SN-..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea {...register('description')} rows={2} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
              {isLoading ? 'Saving…' : (asset ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminAssetsPage() {
  const [search, setSearch] = useState('')
  const [modalAsset, setModalAsset] = useState<Asset | null | undefined>(undefined)
  const { data, isLoading } = useGetAssetsQuery({ search })
  const [deleteAsset] = useDeleteAssetMutation()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try { await deleteAsset(id).unwrap(); toast.success('Asset deleted') }
    catch { toast.error('Cannot delete — asset may have active bookings') }
  }

  return (
    <div>
      <PageHeader
        title="Asset Management"
        subtitle={`${data?.count ?? 0} assets total`}
        action={
          <button onClick={() => setModalAsset(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            <Plus className="w-4 h-4" /> Add asset
          </button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…"
          className="w-full max-w-sm pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name', 'Category', 'Qty', 'Status', 'Condition', 'Location', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.results.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-gray-500">{asset.category_name}</td>
                  <td className="px-4 py-3 text-gray-600">{asset.available_qty}/{asset.total_qty}</td>
                  <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={asset.condition} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{asset.location || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModalAsset(asset)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(asset.id, asset.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalAsset !== undefined && <AssetModal asset={modalAsset ?? undefined} onClose={() => setModalAsset(undefined)} />}
    </div>
  )
}
