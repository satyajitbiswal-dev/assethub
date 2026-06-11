export interface User {
  id: string; email: string; enrollment_no: string
  first_name: string; last_name: string
  full_name: string; role: 'admin' | 'user'; phone: string
  department: string; is_active: boolean; created_at: string
}
export interface AuthTokens { access: string; refresh: string }
export interface LoginResponse extends AuthTokens { user: User }

export type AssetStatus = 'available' | 'maintenance' | 'retired'
export type AssetCondition = 'good' | 'fair' | 'damaged'

export interface Category {
  id: string; name: string; description: string
  asset_count: number; created_at: string
}
export interface Asset {
  id: string; name: string; category: string; category_name: string
  description: string; total_qty: number; available_qty: number
  status: AssetStatus; condition: AssetCondition; location: string
  serial_number: string; purchase_date: string | null
  maintenance_notes: string; utilisation_rate: number
  created_by: string; created_by_name: string
  created_at: string; updated_at: string
}

export type BookingStatus = 'pending'|'approved'|'rejected'|'issued'|'returned'|'cancelled'
export interface Booking {
  id: string; user: string; user_detail: User; asset: string
  asset_detail: Asset; quantity: number; start_date: string
  end_date: string; status: BookingStatus; reason: string
  rejection_reason: string; is_overdue: boolean
  reviewed_by: string | null; reviewed_by_name: string | null
  reviewed_at: string | null; issued_at: string | null
  returned_at: string | null; created_at: string; updated_at: string
}

export interface AnalyticsSummary {
  total_assets: number; total_qty: number; available_qty: number
  borrowed_qty: number; active_bookings: number; pending_bookings: number
  overdue_bookings: number; utilisation_rate: number; total_categories: number
}
export interface TopAsset { id: string; name: string; category: string; booking_count: number }
export interface CategoryUtilisation {
  category: string; total_qty: number; borrowed_qty: number; utilisation_rate: number
}

export interface Notification {
  id: string; title: string; body: string; is_read: boolean; created_at: string
}
export interface NotificationsResponse { unread_count: number; results: Notification[] }

export interface AuditLog {
  id: string; actor: string; actor_name: string; action: string
  target_type: string; target_id: string
  metadata: Record<string, unknown>; created_at: string
}

export interface PaginatedResponse<T> {
  count: number; next: string | null; previous: string | null; results: T[]
}


export interface Review {
  id: string; booking: string; user: string; user_detail: User
  asset: string; asset_name: string; text: string; created_at: string
}
export interface AssetReviewSummary {
  id: string; name: string; category_name: string; review_count: number
}