import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch } from '@/app/hooks'
import { updateUser } from '@/features/auth/authSlice'
import {
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
} from '@/features/auth/authApi'
import toast from 'react-hot-toast'
import { User, Lock, Eye, EyeOff, X, KeyRound, Info } from 'lucide-react'

const TEMP_PW_KEY = 'assethub_used_temp_pw'

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'

const Field = ({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

function PasswordField({
  label,
  error,
  required,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  required?: boolean
}) {
  const [show, setShow] = useState(false)
  // label / error / required are destructured above, so ...inputProps is clean
  // and will NOT forward those props to <input>
  return (
    <Field label={label} error={error} required={required}>
      <div className="relative">
        <input
          {...inputProps}
          type={show ? 'text' : 'password'}
          className={inputCls + ' pr-10'}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  )
}

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  enrollment_no: z.string().regex(/^\d{8}$/, 'Must be exactly 8 digits'),
  phone: z.string().optional(),
  department: z.string().optional(),
})
type ProfileData = z.infer<typeof profileSchema>

const pwSchema = z
  .object({
    old_password: z.string().min(1, 'Old password is required'),
    new_password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
type PwData = z.infer<typeof pwSchema>

function ChangePasswordDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PwData>({ resolver: zodResolver(pwSchema) })

  const onSubmit = async (data: PwData) => {
    try {
      await changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      }).unwrap()
      toast.success('Your password has been updated successfully')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { data?: { old_password?: string[]; new_password?: string[]; detail?: string } })
          ?.data?.old_password?.[0] ??
        (err as { data?: { new_password?: string[]; detail?: string } })?.data?.new_password?.[0] ??
        (err as { data?: { detail?: string } })?.data?.detail ??
        'Failed to update password'
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Enter your current and new password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordField
            label="Old Password"
            required
            placeholder="••••••••"
            error={errors.old_password?.message}
            {...register('old_password')}
          />
          <PasswordField
            label="New Password"
            required
            placeholder="••••••••"
            error={errors.new_password?.message}
            {...register('new_password')}
          />
          <PasswordField
            label="Confirm New Password"
            required
            placeholder="••••••••"
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { data: me, isLoading: meLoading } = useGetMeQuery()
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation()
  const [showPwDialog, setShowPwDialog] = useState(false)

  // Show the soft banner only when the user arrived via a temp password flow.
  // LoginPage sets this flag in localStorage; we clear it once they change their password.
  const [showTempBanner, setShowTempBanner] = useState(
    () => localStorage.getItem(TEMP_PW_KEY) === 'true'
  )

  const dismissBanner = () => {
    localStorage.removeItem(TEMP_PW_KEY)
    setShowTempBanner(false)
  }

  const handlePasswordChanged = () => {
    localStorage.removeItem(TEMP_PW_KEY)
    setShowTempBanner(false)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      enrollment_no: '',
      phone: '',
      department: '',
    },
  })

  useEffect(() => {
    if (!me) return
    reset({
      first_name: me.first_name ?? '',
      last_name: me.last_name ?? '',
      enrollment_no: me.enrollment_no ?? '',
      phone: me.phone ?? '',
      department: me.department ?? '',
    })
  }, [me, reset])

  const onSubmit = async (data: ProfileData) => {
    try {
      const updated = await updateMe(data).unwrap()
      dispatch(updateUser(updated))
      reset({
        first_name: updated.first_name ?? '',
        last_name: updated.last_name ?? '',
        enrollment_no: updated.enrollment_no ?? '',
        phone: updated.phone ?? '',
        department: updated.department ?? '',
      })
      toast.success('Profile updated successfully')
    } catch (err: unknown) {
      const body = (err as { data?: Record<string, string[] | string> })?.data
      if (body?.enrollment_no) {
        const msg = Array.isArray(body.enrollment_no) ? body.enrollment_no[0] : body.enrollment_no
        setError('enrollment_no', { message: msg })
      }
      toast.error(
        (Array.isArray(body?.enrollment_no) ? body.enrollment_no[0] : null) ??
          (typeof body?.detail === 'string' ? body.detail : null) ??
          'Failed to update profile',
      )
    }
  }

  if (meLoading && !me) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {showPwDialog && (
        <ChangePasswordDialog
          onClose={() => setShowPwDialog(false)}
          onSuccess={handlePasswordChanged}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your personal information</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPwDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Change Password
          </button>
        </div>

        {/* Soft banner — only shown after a forgot-password login */}
        {showTempBanner && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span className="flex-1 leading-relaxed">
              You're signed in with a temporary password. You can set a personal one above — or keep
              using it, it works just fine.
            </span>
            <button
              onClick={dismissBanner}
              className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{me?.full_name}</p>
              <p className="text-sm text-gray-500">{me?.email}</p>
              <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary capitalize">
                {me?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
            <Field label="Enrollment Number" error={errors.enrollment_no?.message} required>
              <input
                {...register('enrollment_no')}
                className={inputCls}
                placeholder="24115131"
                maxLength={8}
                inputMode="numeric"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" error={errors.first_name?.message} required>
                <input {...register('first_name')} className={inputCls} placeholder="John" />
              </Field>
              <Field label="Last Name" error={errors.last_name?.message} required>
                <input {...register('last_name')} className={inputCls} placeholder="Doe" />
              </Field>
            </div>

            <Field label="Phone" error={errors.phone?.message}>
              <input
                {...register('phone')}
                className={inputCls}
                placeholder="+91 9876543210"
                type="tel"
              />
            </Field>

            <Field label="Department" error={errors.department?.message}>
              <input
                {...register('department')}
                className={inputCls}
                placeholder="Engineering"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  value={me?.email ?? ''}
                  readOnly
                  className={inputCls + ' bg-gray-50 cursor-not-allowed text-gray-500'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <input
                  value={me?.role ?? ''}
                  readOnly
                  className={inputCls + ' bg-gray-50 cursor-not-allowed text-gray-500 capitalize'}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}