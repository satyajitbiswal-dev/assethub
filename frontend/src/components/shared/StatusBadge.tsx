import { statusBadge } from '@/lib/utils'

export default function StatusBadge({ status }: { status: string }) {
  return <span className={statusBadge(status)}>{status}</span>
}
