'use client';

import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui';
import { formatCurrency, timeAgo } from '@/lib/utils';

const LIVE_ORDERS = [
  { id: 'WZ-8K4F', customer: 'Dr. Anil Kumar', amount: 3450, status: 'preparing', time: new Date(Date.now() - 180000).toISOString(), items: 4 },
  { id: 'WZ-7J3E', customer: 'Lekshmi S.', amount: 1280, status: 'in_transit', time: new Date(Date.now() - 420000).toISOString(), items: 2 },
  { id: 'WZ-6H2D', customer: 'Rajesh Nair', amount: 5670, status: 'confirmed', time: new Date(Date.now() - 600000).toISOString(), items: 7 },
  { id: 'WZ-5G1C', customer: 'Sreeja M.', amount: 890, status: 'ready_for_pickup', time: new Date(Date.now() - 900000).toISOString(), items: 1 },
  { id: 'WZ-4F0B', customer: 'Priya Joseph', amount: 2340, status: 'picked_up', time: new Date(Date.now() - 1200000).toISOString(), items: 3 },
  { id: 'WZ-3E9A', customer: 'Vinod P.', amount: 4120, status: 'in_transit', time: new Date(Date.now() - 1500000).toISOString(), items: 5 },
  { id: 'WZ-2D8Z', customer: 'Meena Krishnan', amount: 1560, status: 'delivered', time: new Date(Date.now() - 1800000).toISOString(), items: 2 },
  { id: 'WZ-1C7Y', customer: 'Suresh T.', amount: 7890, status: 'pending', time: new Date(Date.now() - 60000).toISOString(), items: 9 },
];

export function LiveOrdersFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border/50 bg-card"
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-white">Live Orders</h3>
          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            LIVE
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{LIVE_ORDERS.length} active</span>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {LIVE_ORDERS.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center justify-between border-b border-border/20 px-4 py-2.5 transition-colors hover:bg-white/[0.02] cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 font-mono text-[12px] font-semibold text-white">{order.id}</span>
              <div className="min-w-0">
                <p className="truncate text-[12px] text-white">{order.customer}</p>
                <p className="text-[10px] text-muted-foreground">{order.items} items • {timeAgo(order.time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={order.status} />
              <span className="text-[12px] font-semibold text-white">{formatCurrency(order.amount)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
