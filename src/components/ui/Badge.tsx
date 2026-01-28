import { cn, getRoleBadgeColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'role';
  role?: string;
  className?: string;
}

export default function Badge({ children, variant = 'default', role, className }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  
  const colorClass = variant === 'role' && role 
    ? getRoleBadgeColor(role)
    : 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={cn(baseStyles, colorClass, className)}>
      {children}
    </span>
  );
}
