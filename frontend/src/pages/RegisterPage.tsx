import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterMutation } from '@/features/auth/authApi'
import toast from 'react-hot-toast'
import { Package } from 'lucide-react'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  password2: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  department: z.string().optional(),
}).refine((d) => d.password === d.password2, { message: 'Passwords do not match', path: ['password2'] })

type FormData = z.infer<typeof schema>

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

const inputCls = "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()
  const { register: reg, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await register(data).unwrap()
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" error={errors.first_name?.message}>
                <input {...reg('first_name')} className={inputCls} placeholder="John" />
              </Field>
              <Field label="Last name" error={errors.last_name?.message}>
                <input {...reg('last_name')} className={inputCls} placeholder="Doe" />
              </Field>
            </div>
            <Field label="Email address" error={errors.email?.message}>
              <input {...reg('email')} type="email" className={inputCls} placeholder="you@example.com" />
            </Field>
            <Field label="Department" error={errors.department?.message}>
              <input {...reg('department')} className={inputCls} placeholder="Engineering" />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <input {...reg('password')} type="password" className={inputCls} placeholder="••••••••" />
            </Field>
            <Field label="Confirm password" error={errors.password2?.message}>
              <input {...reg('password2')} type="password" className={inputCls} placeholder="••••••••" />
            </Field>
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 mt-2">
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
