import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useGetCampaignsQuery,
  useGetCampaignResponsesQuery,
  useCreateCampaignMutation,
  useActivateCampaignMutation,
  useDeactivateCampaignMutation,
  useDeleteCampaignMutation,
  FeedbackCampaign,
} from '@/features/feedback/feedbackApi'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { MessageSquarePlus, Plus, Play, Square, Trash2, ChevronDown, ChevronUp, X, Users } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── New campaign modal ─────────────────────────────────────────────────────────
const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})
type CampaignForm = z.infer<typeof campaignSchema>

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const [create, { isLoading }] = useCreateCampaignMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
  })

  const inputCls =
    'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

  const onSubmit = async (data: CampaignForm) => {
    try {
      await create({ ...data, is_active: true }).unwrap()
      toast.success('Campaign launched! All users can now see the feedback form.')
      onClose()
    } catch {
      toast.error('Failed to create campaign')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Launch new feedback campaign</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Campaign title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className={inputCls}
              placeholder="e.g. June 2026 Feedback Round"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional — shown to users)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Add context about why you're collecting feedback this round…"
            />
          </div>
          <p className="text-xs text-gray-400">
            Launching this will automatically close any currently active campaign.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Launching…' : 'Launch campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Responses panel for one campaign ──────────────────────────────────────────
function ResponsesPanel({ campaign }: { campaign: FeedbackCampaign }) {
  const { data: responses, isLoading } = useGetCampaignResponsesQuery(campaign.id)

  if (isLoading) return <div className="py-8 flex justify-center"><LoadingSpinner size="sm" /></div>

  if (!responses?.length) {
    return (
      <div className="py-10 text-center">
        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No responses yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      {responses.map((r) => (
        <div key={r.id} className="py-4 px-1">
          <div className="flex items-start justify-between mb-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{r.user_detail?.full_name}</p>
              <p className="text-xs text-gray-400">
                {r.user_detail?.enrollment_no && (
                  <span className="font-mono mr-2">{r.user_detail.enrollment_no}</span>
                )}
                {r.user_detail?.department}
              </p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(r.submitted_at)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Product suggestions
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">
                {r.product_suggestions || <span className="italic text-gray-400">—</span>}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Improvement suggestions
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">
                {r.improvement_suggestions || <span className="italic text-gray-400">—</span>}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Campaign row ───────────────────────────────────────────────────────────────
function CampaignRow({ campaign }: { campaign: FeedbackCampaign }) {
  const [expanded, setExpanded] = useState(false)
  const [activate] = useActivateCampaignMutation()
  const [deactivate] = useDeactivateCampaignMutation()
  const [deleteCampaign] = useDeleteCampaignMutation()

  const handleActivate = async () => {
    try {
      await activate(campaign.id).unwrap()
      toast.success('Campaign activated — users can now respond.')
    } catch { toast.error('Failed to activate') }
  }

  const handleDeactivate = async () => {
    try {
      await deactivate(campaign.id).unwrap()
      toast.success('Campaign closed.')
    } catch { toast.error('Failed to close') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${campaign.title}"? All responses will be lost.`)) return
    try {
      await deleteCampaign(campaign.id).unwrap()
      toast.success('Campaign deleted.')
    } catch { toast.error('Cannot delete — responses may exist.') }
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border transition-all',
      campaign.is_active ? 'border-primary/30' : 'border-gray-100'
    )}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{campaign.title}</p>
            {campaign.is_active ? (
              <span className="badge badge-green">Active</span>
            ) : (
              <span className="badge badge-gray">Closed</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Launched {formatDateTime(campaign.created_at)} · {campaign.response_count} response{campaign.response_count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {campaign.is_active ? (
            <button
              onClick={handleDeactivate}
              title="Close campaign"
              className="p-1.5 text-warning hover:bg-warning-light rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleActivate}
              title="Re-activate campaign"
              className="p-1.5 text-primary hover:bg-primary-light rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Delete campaign"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            title={expanded ? 'Hide responses' : 'View responses'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Description if any */}
      {campaign.description && (
        <p className="px-5 pb-3 text-xs text-gray-500 -mt-1">{campaign.description}</p>
      )}

      {/* Responses panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-2">
          <ResponsesPanel campaign={campaign} />
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminFeedbackPage() {
  const [showModal, setShowModal] = useState(false)
  const { data: campaigns, isLoading } = useGetCampaignsQuery()

  return (
    <div>
      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} />}

      <PageHeader
        title="Feedback Campaigns"
        subtitle="Collect product & improvement suggestions from users"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> New campaign
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !campaigns?.length ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No campaigns yet"
          description="Launch a campaign to start collecting feedback from users"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Launch first campaign
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  )
}