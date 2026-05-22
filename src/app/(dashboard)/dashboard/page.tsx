'use client';

import { motion } from 'framer-motion';
import {
  ShoppingCart, DollarSign, Users, TrendingUp, Package, Truck,
  Activity, Database, Wifi, Clock, Target, Heart,
} from 'lucide-react';
import { MetricCard } from '@/components/ui';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DashboardCharts } from '@/modules/dashboard/charts';
import { LiveOrdersFeed } from '@/modules/dashboard/live-orders';
import { SystemHealth } from '@/modules/dashboard/system-health';

// Mock data — will be replaced by TanStack Query + Supabase
const METRICS = [
  { label: 'GMV', value: formatCurrency(2847500), change: 12.4, trend: 'up' as const, icon: <DollarSign className="h-4 w-4" />, sparkline: [40, 55, 48, 62, 58, 72, 68, 80, 75, 88, 82, 95] },
  { label: 'Orders', value: formatNumber(1284), change: 8.2, trend: 'up' as const, icon: <ShoppingCart className="h-4 w-4" />, sparkline: [30, 42, 38, 55, 48, 60, 52, 65, 58, 72, 68, 78] },
  { label: 'Revenue', value: formatCurrency(1923000), change: 15.1, trend: 'up' as const, icon: <TrendingUp className="h-4 w-4" />, sparkline: [45, 52, 48, 58, 55, 68, 62, 75, 70, 82, 78, 90] },
  { label: 'Active Users', value: formatNumber(3842), change: -2.1, trend: 'down' as const, icon: <Users className="h-4 w-4" />, sparkline: [60, 58, 55, 52, 50, 48, 52, 55, 50, 48, 45, 42] },
  { label: 'AOV', value: formatCurrency(2217), change: 3.8, trend: 'up' as const, icon: <Target className="h-4 w-4" />, sparkline: [35, 38, 40, 42, 45, 48, 46, 50, 52, 55, 53, 58] },
  { label: 'Fulfillment Rate', value: '96.4%', change: 1.2, trend: 'up' as const, icon: <Package className="h-4 w-4" />, sparkline: [90, 92, 91, 93, 94, 95, 94, 96, 95, 97, 96, 96] },
  { label: 'Conversion', value: '4.8%', change: 0.3, trend: 'up' as const, icon: <Activity className="h-4 w-4" />, sparkline: [3.2, 3.5, 3.8, 4.0, 3.9, 4.2, 4.5, 4.3, 4.6, 4.8, 4.7, 4.8] },
  { label: 'Inventory Health', value: '87%', change: -1.5, trend: 'down' as const, icon: <Heart className="h-4 w-4" />, sparkline: [92, 90, 89, 88, 87, 86, 85, 87, 88, 87, 86, 87] },
  { label: 'Avg Delivery ETA', value: '18 min', change: -8.0, trend: 'up' as const, icon: <Clock className="h-4 w-4" />, sparkline: [25, 24, 22, 21, 20, 19, 18, 19, 18, 17, 18, 18] },
  { label: 'Live Orders', value: '47', change: 12.0, trend: 'up' as const, icon: <Truck className="h-4 w-4" />, sparkline: [20, 25, 30, 35, 38, 42, 40, 45, 43, 48, 46, 47] },
  { label: 'Redis Health', value: '99.9%', change: 0, trend: 'flat' as const, icon: <Database className="h-4 w-4" />, sparkline: [100, 100, 99.9, 100, 100, 99.9, 100, 100, 99.9, 100, 100, 99.9] },
  { label: 'Realtime Users', value: '124', change: 5.6, trend: 'up' as const, icon: <Wifi className="h-4 w-4" />, sparkline: [80, 85, 90, 95, 100, 105, 110, 115, 118, 120, 122, 124] },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Real-time operations overview • Last updated just now
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-border/50 bg-card px-3 py-1.5 text-[12px] text-muted-foreground outline-none">
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
            <option>Last quarter</option>
          </select>
          <div className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-[11px] font-semibold text-green-400">LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {METRICS.map((metric, i) => (
          <MetricCard key={metric.label} {...metric} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <DashboardCharts />

      {/* Bottom Row: Live Feed + System Health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveOrdersFeed />
        </div>
        <SystemHealth />
      </div>
    </div>
  );
}
