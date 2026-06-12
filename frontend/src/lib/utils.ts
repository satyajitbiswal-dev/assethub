import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string, fmt = 'dd MMM yyyy') {
  try { return format(parseISO(date), fmt) } catch { return date }
}

export function formatDateTime(date: string) {
  return formatDate(date, 'dd MMM yyyy, h:mm a')
}

export const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-warning-light text-warning',
  approved:  'bg-blue-50 text-blue-700',
  issued:    'bg-purple-50 text-purple-700',
  returned:  'bg-primary-light text-primary-dark',
  rejected:  'bg-danger-light text-danger',
  cancelled: 'bg-gray-100 text-gray-600',
  available:  'bg-primary-light text-primary-dark',
  maintenance:'bg-warning-light text-warning',
  retired:    'bg-gray-100 text-gray-500',
  good:       'bg-primary-light text-primary-dark',
  fair:       'bg-warning-light text-warning',
  damaged:    'bg-danger-light text-danger',
}

export function statusBadge(status: string) {
  return cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600')
}

/** Parse DRF / custom API error envelopes into a user-facing string. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const data = (err as { data?: Record<string, unknown> })?.data
  if (!data) return fallback
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.detail === 'string' && data.detail) return data.detail
  const errors = data.errors as Record<string, string[] | string> | undefined
  if (errors) {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && value[0]) return String(value[0])
      if (typeof value === 'string' && value) return value
    }
  }
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value[0]) return String(value[0])
    if (typeof value === 'string' && value && value !== 'false') return value
  }
  return fallback
}
