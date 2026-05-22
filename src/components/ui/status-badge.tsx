import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  preparing:        'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ready_for_pickup: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  picked_up:        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  in_transit:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered:        'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled:        'bg-red-500/10 text-red-400 border-red-500/20',
  refunded:         'bg-gray-500/10 text-gray-400 border-gray-500/20',
  online:           'bg-green-500/10 text-green-400 border-green-500/20',
  offline:          'bg-gray-500/10 text-gray-400 border-gray-500/20',
  busy:             'bg-orange-500/10 text-orange-400 border-orange-500/20',
  active:           'bg-green-500/10 text-green-400 border-green-500/20',
  inactive:         'bg-gray-500/10 text-gray-400 border-gray-500/20',
  low:              'bg-blue-500/10 text-blue-400 border-blue-500/20',
  normal:           'bg-gray-500/10 text-gray-400 border-gray-500/20',
  high:             'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent:           'bg-red-500/10 text-red-400 border-red-500/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize',
        style,
        className
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          status === 'delivered' || status === 'online' || status === 'active'
            ? 'animate-pulse-soft bg-green-400'
            : 'bg-current opacity-60'
        )}
      />
      {label}
    </span>
  );
}
