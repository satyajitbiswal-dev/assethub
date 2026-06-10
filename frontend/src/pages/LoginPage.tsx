import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useLoginMutation, useForgotPasswordMutation } from '@/features/auth/authApi'
import { setAuth } from '@/features/auth/authSlice'
import { useAppDispatch } from '@/app/hooks'
import toast from 'react-hot-toast'
import { Package, X, Mail } from 'lucide-react'

// ─── Login form schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginData = z.infer<typeof loginSchema>

// ─── Forgot password form schema ──────────────────────────────────────────────
const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
})
type ForgotData = z.infer<typeof forgotSchema>

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (data: ForgotData) => {
    try {
      await forgotPassword(data).unwrap()
      localStorage.setItem('assethub_used_temp_pw', 'true')
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              If that email is registered, we've sent a temporary password.
              You can sign in with it right away — no need to change it unless you want to.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          /* ── Email form state ── */
          <>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Forgot your password?</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter your email and we'll send you a temporary password you can use to sign in.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

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
                  {isLoading ? 'Sending…' : 'Send password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [showForgot, setShowForgot] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginData) => {
    try {
      const result = await login(data).unwrap()
      dispatch(setAuth({ user: result.user, access: result.access, refresh: result.refresh }))
      toast.success(`Welcome back, ${result.user.first_name || result.user.email}!`)
      navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Invalid credentials'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in to AssetHub</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organisation's assets</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              {/* Password label row — label on left, forgot link on right */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}