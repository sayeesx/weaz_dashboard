'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatPercentage } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
  sparkline?: number[];
  className?: string;
  index?: number;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  trend = 'flat',
  icon,
  sparkline,
  className,
  index = 0,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:bg-card/80',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {icon && <div className="text-muted-foreground/50">{icon}</div>}
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
          {change !== undefined && (
            <div
              className={cn(
                'mb-0.5 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                trend === 'up' && 'bg-green-500/10 text-green-400',
                trend === 'down' && 'bg-red-500/10 text-red-400',
                trend === 'flat' && 'bg-gray-500/10 text-gray-400'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {formatPercentage(change)}
            </div>
          )}
        </div>

        {changeLabel && (
          <p className="mt-1 text-[11px] text-muted-foreground">{changeLabel}</p>
        )}

        {/* Mini sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-3 flex h-8 items-end gap-[2px]">
            {sparkline.map((val, i) => {
              const max = Math.max(...sparkline);
              const height = max > 0 ? (val / max) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-white/[0.08] transition-all group-hover:bg-white/[0.12]"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
