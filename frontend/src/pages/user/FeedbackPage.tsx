import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useGetActiveCampaignQuery,
  useGetMyResponseQuery,
  useSubmitResponseMutation,
} from '@/features/feedback/feedbackApi'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { MessageSquarePlus, CheckCircle, BellOff } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  product_suggestions: z.string().min(1, 'Please share at least one product suggestion'),
  improvement_suggestions: z.string().min(1, 'Please share at least one improvement idea'),
})
type FormData = z.infer<typeof schema>

const textareaCls =
  'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-white'

export default function FeedbackPage() {
  const { data: campaign, isLoading: campaignLoading } = useGetActiveCampaignQuery()

  // Only fetch my response once we know the campaign id
  const {
    data: myResponse,
    isLoading: responseLoading,
  } = useGetMyResponseQuery(campaign?.id ?? '', {
    skip: !campaign?.id,
  })

  const [submit, { isLoading: submitting }] = useSubmitResponseMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!campaign) return
    try {
      await submit({ campaign: campaign.id, ...data }).unwrap()
      toast.success('Feedback submitted — thank you!')
    } catch (err: unknown) {
      const msg =
        (err as { data?: { campaign?: string[]; detail?: string } })?.data?.campaign?.[0] ??
        (err as { data?: { detail?: string } })?.data?.detail ??
        'Failed to submit feedback'
      toast.error(msg)
    }
  }

  if (campaignLoading || responseLoading) return <LoadingSpinner />

  // ── No active campaign ─────────────────────────────────────────────────────
  if (!campaign) {
    return (
      <div>
        <PageHeader
          title="Feedback"
          subtitle="Share your suggestions with the admin team"
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <BellOff className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No active feedback round</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            The admin hasn't opened a feedback campaign yet. Check back later!
          </p>
        </div>
      </div>
    )
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (myResponse) {
    return (
      <div>
        <PageHeader
          title="Feedback"
          subtitle={campaign.title}
        />
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-primary/20 p-6 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Response submitted</p>
                <p className="text-xs text-gray-400">{formatDateTime(myResponse.submitted_at)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Product suggestions
                </p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-4 py-3 leading-relaxed whitespace-pre-wrap">
                  {myResponse.product_suggestions || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Improvement suggestions
                </p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-4 py-3 leading-relaxed whitespace-pre-wrap">
                  {myResponse.improvement_suggestions || '—'}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">
            You can only submit one response per feedback round.
          </p>
        </div>
      </div>
    )
  }

  // ── Feedback form ──────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Feedback"
        subtitle={campaign.title}
      />
      <div className="max-w-2xl mx-auto">
        {campaign.description && (
          <div className="bg-primary-light border border-primary/20 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-primary-dark leading-relaxed">{campaign.description}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-gray-900">Share your feedback</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New product / asset suggestions
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                What new equipment, tools, or assets should we add to the catalog?
              </p>
              <textarea
                {...register('product_suggestions')}
                rows={4}
                placeholder="e.g. High-speed cameras for events, Standing desks for Lab 2, VR headsets…"
                className={textareaCls}
              />
              {errors.product_suggestions && (
                <p className="mt-1 text-xs text-red-500">{errors.product_suggestions.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Improvement suggestions
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                How can we improve existing assets, the booking process, or the platform?
              </p>
              <textarea
                {...register('improvement_suggestions')}
                rows={4}
                placeholder="e.g. Faster approval for lab equipment, better condition tracking, longer booking windows…"
                className={textareaCls}
              />
              {errors.improvement_suggestions && (
                <p className="mt-1 text-xs text-red-500">{errors.improvement_suggestions.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-gray-400 mt-3">
          You can submit one response per campaign. Responses are visible to admins only.
        </p>
      </div>
    </div>
  )
}