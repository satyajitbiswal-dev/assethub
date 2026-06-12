import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

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

type PasswordFieldProps = {
  label: string
  error?: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, required, className, ...inputProps }, ref) {
    const [show, setShow] = useState(false)
    return (
      <Field label={label} error={error} required={required}>
        <div className="relative">
          <input
            ref={ref}
            {...inputProps}
            type={show ? 'text' : 'password'}
            className={cn(inputCls, 'pr-10', className)}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>
    )
  },
)

export default PasswordField
