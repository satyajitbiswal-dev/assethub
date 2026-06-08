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
