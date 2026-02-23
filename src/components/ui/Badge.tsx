interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'success';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-charcoal-100 text-charcoal-600',
    brand: 'bg-brand-100 text-brand-700',
    success: 'bg-green-100 text-green-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
