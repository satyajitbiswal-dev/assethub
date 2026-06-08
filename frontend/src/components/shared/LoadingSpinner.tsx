export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className="flex justify-center items-center py-12">
      <div className={`${s} border-2 border-gray-200 border-t-primary rounded-full animate-spin`} />
    </div>
  )
}
